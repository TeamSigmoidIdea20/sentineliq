from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, date, time
from typing import List, Optional

import numpy as np
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import AlertModel, AuditLogModel, CaseAlertModel, CaseModel, EventModel, ModelMetricModel, UserModel, get_db, init_db, SessionLocal
from data.feature_engineering import FeatureEngineer
from data.synthetic_generator import SyntheticGenerator
from models.ensemble import EnsembleModel
from schemas import (
    AlertListResponse,
    AlertResponse,
    CaseResponse,
    CoordinatedPattern,
    FeedEvent,
    HealthResponse,
    IntelligenceResponse,
    DailyCount,
    DeptRiskItem,
    LabelRequest,
    ModelScores,
    NoteRequest,
    PeerComparisonMetric,
    PeerComparisonResponse,
    RetrainResponse,
    BreakdownItem,
    FPTrendPoint,
    RiskPoint,
    SHAPValue,
    SimulateRequest,
    StatsResponse,
    TimelineItem,
    UserDetailResponse,
    UserEventResponse,
    UserResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

generator = SyntheticGenerator()
engineer = FeatureEngineer()
ensemble = EnsembleModel()
_events_processed = 0
_initialized = False
_MAX_FEED = 20
MODEL_VERSION = "v1.0.0"
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models", "saved")
_startup_mode = "fresh"
ALERT_THRESHOLD = 65  # single score threshold — no ground-truth split
MANIFEST_PATH = os.path.join(SAVED_MODEL_DIR, "manifest.json")


def _write_manifest(total_events: int = 0) -> None:
    import models.lstm_autoencoder as _lstm_mod
    xgb_n_est = 150
    if ensemble.xgb_model._model is not None:
        xgb_n_est = int(ensemble.xgb_model._model.n_estimators)
    manifest = {
        "version": MODEL_VERSION,
        "trained_at": datetime.utcnow().isoformat(),
        "training_events": total_events,
        "isolation_forest": {"n_estimators": 100, "contamination": 0.1},
        "lstm": {"seq_len": _lstm_mod.SEQ_LEN, "hidden_size": _lstm_mod.HIDDEN_SIZE},
        "xgboost": {"n_estimators": xgb_n_est, "max_depth": 3},
        "ensemble_weights": {"isolation_forest": 0.3, "lstm": 0.4, "xgboost": 0.3},
    }
    os.makedirs(SAVED_MODEL_DIR, exist_ok=True)
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)


# Columns accepted by EventModel (guards against stray keys from generator)
_EVENT_COLS = {
    "id", "user_id", "user_name", "timestamp", "event_type", "department",
    "location", "hour", "device", "download_mb", "tx_count", "features_json",
    "fraud_type", "is_fraud", "description", "risk_score", "event_source",
}


def _risk_level(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _alert_from_row(row: AlertModel) -> AlertResponse:
    ms = json.loads(row.model_scores_json or "{}")
    sv = json.loads(row.shap_values_json or "[]")
    return AlertResponse(
        id=row.id,
        user_id=row.user_id,
        user_name=row.user_name,
        timestamp=row.timestamp,
        risk_score=row.risk_score,
        risk_level=_risk_level(row.risk_score),
        fraud_type=row.fraud_type,
        model_scores=ModelScores(
            isolation_forest=ms.get("isolation_forest", 0.5),
            lstm=ms.get("lstm", 0.5),
            xgboost=ms.get("xgboost", 0.5),
        ),
        shap_values=[SHAPValue(**s) for s in sv],
        status=row.status,
        label=row.label or None,
        notes=row.notes or None,
    )


def _case_name(fraud_types: set[str], user_count: int = 1) -> str:
    if {"bulk_download", "cross_department_access"}.issubset(fraud_types):
        return "Data Exfiltration Attempt"
    if {"privilege_escalation", "off_hours_login"}.issubset(fraud_types):
        return "Privilege Abuse Sequence"
    if len(fraud_types) >= 3:
        return "Coordinated Insider Threat" if user_count > 1 else "Multi-Pattern Insider Threat"
    return "Escalating Insider Risk"


def _precision_from_scores(scores: list[float], labels: list[int]) -> float:
    predicted_positive = [idx for idx, score in enumerate(scores) if score >= 0.5]
    if not predicted_positive:
        return 0.0
    tp = sum(1 for idx in predicted_positive if labels[idx] == 1)
    return round(tp / max(1, len(predicted_positive)), 3)


def _recall_from_scores(scores: list[float], labels: list[int]) -> float:
    actual_positive = [idx for idx, label in enumerate(labels) if label == 1]
    if not actual_positive:
        return 0.0
    tp = sum(1 for idx in actual_positive if scores[idx] >= 0.5)
    return round(tp / len(actual_positive), 3)



async def _startup() -> None:
    global _initialized, _startup_mode
    logger.info("Initializing SentinelIQ — generating training data…")

    async with SessionLocal() as db:
        user_count = await db.scalar(select(func.count()).select_from(UserModel))
        if not user_count:
            for u in generator.users:
                db.add(UserModel(**u))
            await db.commit()

        if ensemble.saved_files_exist(SAVED_MODEL_DIR):
            ensemble.load(SAVED_MODEL_DIR)
            _startup_mode = "cached"
            _initialized = True
            logger.info("Models loaded from disk — rebuilding runtime state")
            await _rebuild_runtime_state()
            return

        training_events = generator.generate_batch(
            n=2000,
            base_ts=datetime.utcnow() - timedelta(hours=48),
        )

        X_all: list[np.ndarray] = []
        y_all: list[int] = []
        user_events: dict[str, list[np.ndarray]] = {}

        for ev in training_events:
            feat = engineer.compute_features(ev["user_id"], ev)
            X_all.append(feat)
            y_all.append(ev["is_fraud"])
            user_events.setdefault(ev["user_id"], []).append(feat)
            ev["features_json"] = json.dumps(feat.tolist())
            ev["event_source"] = "training"
            db.add(EventModel(**{k: v for k, v in ev.items() if k in _EVENT_COLS}))

        await db.commit()

    X = np.array(X_all, dtype=np.float32)
    y = np.array(y_all, dtype=np.int32)

    logger.info("Training ensemble models…")
    ensemble.fit(X, y, user_events)
    _startup_mode = "fresh"
    logger.info("Models trained fresh — saving to disk")
    ensemble.save(SAVED_MODEL_DIR)
    _write_manifest(total_events=len(X_all))
    _initialized = True
    logger.info("Startup complete. Starting event loop.")


async def _process_event(ev: dict) -> None:
    global _events_processed
    _events_processed += 1

    force_alert = ev.pop("_force_alert", False)
    ev["event_source"] = ev.pop("_source", "live")

    try:
        feat = engineer.compute_features(ev["user_id"], ev)
        scores = ensemble.predict(ev["user_id"], feat)
        ensemble_raw = scores["ensemble"]
        risk_score = float(ensemble_raw) * 100.0
        if force_alert and risk_score < 75.0:
            risk_score = 75.0
        ev["risk_score"] = risk_score
    except Exception as exc:
        logger.error("_process_event feature/score error for %s: %s", ev.get("user_id"), exc, exc_info=True)
        return
    ev["features_json"] = json.dumps(feat.tolist())

    alert_id = str(uuid.uuid4()) if risk_score >= ALERT_THRESHOLD else None

    async with SessionLocal() as db:
        db.add(EventModel(**{k: v for k, v in ev.items() if k in _EVENT_COLS}))

        user = await db.get(UserModel, ev["user_id"])
        if user:
            user.last_seen = ev["timestamp"]

        if alert_id:
            shap_vals = ensemble.explain(feat)
            alert = AlertModel(
                id=alert_id,
                user_id=ev["user_id"],
                user_name=ev["user_name"],
                timestamp=ev["timestamp"],
                created_at=datetime.utcnow(),
                risk_score=round(risk_score, 2),
                fraud_type=ev.get("fraud_type") or "anomalous_behavior",
                model_scores_json=json.dumps(scores),
                shap_values_json=json.dumps(shap_vals),
                status="open",
                label="",
                event_id=ev["id"],
                notes="",
            )
            db.add(alert)
            await db.flush()  # make alert visible to subsequent queries
            await _rebuild_cases_for_user(ev["user_id"], db)

        await _refresh_user_risk(ev["user_id"], db)
        await db.commit()


async def _refresh_user_risk(user_id: str, db: AsyncSession) -> None:
    """Recalculate user.risk_score as the max alert score in the last 7 days.
    Decays by 5 if no recent alerts exist (natural cool-down over time).
    """
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    max_recent = await db.scalar(
        select(func.max(AlertModel.risk_score))
        .where(and_(AlertModel.user_id == user_id, AlertModel.timestamp >= seven_days_ago))
    )
    user = await db.get(UserModel, user_id)
    if user is None:
        return
    if max_recent is not None:
        user.risk_score = round(float(max_recent), 2)
    else:
        user.risk_score = max(0.0, round(user.risk_score - 5.0, 2))


async def _rebuild_runtime_state() -> None:
    """On cached startup, replay the last 20 events per user to restore
    FeatureEngineer rolling windows and LSTM sequence buffers."""
    from models.lstm_autoencoder import SEQ_LEN
    async with SessionLocal() as db:
        user_ids = (await db.execute(select(UserModel.id))).scalars().all()
        for user_id in user_ids:
            event_rows = (
                await db.execute(
                    select(EventModel)
                    .where(and_(
                        EventModel.user_id == user_id,
                        EventModel.features_json != "{}",
                    ))
                    .order_by(desc(EventModel.timestamp))
                    .limit(SEQ_LEN)
                )
            ).scalars().all()
            for ev_row in reversed(event_rows):
                try:
                    ev_dict = {
                        "user_id": ev_row.user_id,
                        "hour": ev_row.hour,
                        "tx_count": ev_row.tx_count,
                        "department": ev_row.department,
                        "download_mb": ev_row.download_mb,
                        "location": ev_row.location,
                        "device": ev_row.device,
                        "event_type": ev_row.event_type,
                    }
                    feat = engineer.compute_features(user_id, ev_dict)
                    ensemble.lstm_model.update_seq(user_id, feat)
                except Exception:
                    continue
    logger.info("Runtime state rebuilt for %d users", len(user_ids))


async def _rebuild_cases_for_user(user_id: str, db: AsyncSession) -> None:
    """Upsert case records for alert chains belonging to user_id."""
    since = datetime.utcnow() - timedelta(days=7)
    alert_rows = (
        await db.execute(
            select(AlertModel)
            .where(and_(AlertModel.user_id == user_id, AlertModel.timestamp >= since))
            .order_by(AlertModel.timestamp)
        )
    ).scalars().all()

    chains: list[list[AlertModel]] = []
    current: list[AlertModel] = []
    for alert in alert_rows:
        if not current:
            current = [alert]
            continue
        if alert.timestamp <= current[-1].timestamp + timedelta(hours=24):
            current.append(alert)
        else:
            if len(current) >= 3:
                chains.append(current)
            current = [alert]
    if len(current) >= 3:
        chains.append(current)

    for rows in chains:
        fraud_types = {r.fraud_type for r in rows if r.fraud_type}
        max_risk = max(r.risk_score for r in rows)
        severity = "critical" if max_risk >= 80 else "high" if max_risk >= 65 else "medium"
        start_time = min(r.timestamp for r in rows)
        end_time = max(r.timestamp for r in rows)
        users = sorted({r.user_id for r in rows})
        names = sorted({r.user_name for r in rows})
        status = "open" if any(r.status == "open" for r in rows) else "resolved"
        case_id = f"case-{rows[0].user_id}-{int(start_time.timestamp())}"

        existing = await db.get(CaseModel, case_id)
        if existing:
            existing.name = _case_name(fraud_types, len(users))
            existing.severity = severity
            existing.status = status
            existing.end_time = end_time
            existing.user_ids_json = json.dumps(users)
            existing.user_names_json = json.dumps(names)
            existing.alert_count = len(rows)
            existing.updated_at = datetime.utcnow()
        else:
            db.add(CaseModel(
                id=case_id,
                name=_case_name(fraud_types, len(users)),
                severity=severity,
                status=status,
                start_time=start_time,
                end_time=end_time,
                user_ids_json=json.dumps(users),
                user_names_json=json.dumps(names),
                alert_count=len(rows),
                updated_at=datetime.utcnow(),
            ))

        existing_links: set[str] = set(
            (await db.execute(
                select(CaseAlertModel.alert_id).where(CaseAlertModel.case_id == case_id)
            )).scalars().all()
        )
        for r in rows:
            if r.id not in existing_links:
                db.add(CaseAlertModel(
                    id=str(uuid.uuid4()),
                    case_id=case_id,
                    alert_id=r.id,
                ))


_LIVE_FRAUD_PATTERNS = ["off_hours_login", "bulk_download", "cross_department_access", "privilege_escalation", "velocity_spike"]

async def _event_loop() -> None:
    live_count = 0
    while True:
        await asyncio.sleep(180)  # 1 live event per 3 minutes
        try:
            live_count += 1
            # Every 15th live event is an explicit fraud (~7% rate, matches training distribution)
            if live_count % 15 == 0:
                pattern = _LIVE_FRAUD_PATTERNS[((live_count // 15) - 1) % len(_LIVE_FRAUD_PATTERNS)]
                ev = generator.generate_forced_fraud(pattern)
                ev["_force_alert"] = True
            else:
                ev = generator.generate_batch(n=1, base_ts=datetime.utcnow())[0]
            await _process_event(ev)
        except Exception as exc:
            logger.error("Event loop error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _startup()
    task = asyncio.create_task(_event_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan, title="SentinelIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping():
    return {"status": "alive"}


@app.get("/api/model-info")
def get_model_info():
    import models.lstm_autoencoder as _lstm_mod

    xgb_n_est, xgb_max_depth, xgb_lr = 150, 3, 0.1
    if ensemble.xgb_model._model is not None:
        xgb_n_est = int(ensemble.xgb_model._model.n_estimators)
        xgb_max_depth = int(ensemble.xgb_model._model.max_depth)
        xgb_lr = float(ensemble.xgb_model._model.learning_rate)

    if_contamination = 0.1
    if_n_est = 100
    if hasattr(ensemble.if_model, "_model") and ensemble.if_model._model is not None:
        if_contamination = float(ensemble.if_model._model.contamination)
        if_n_est = int(ensemble.if_model._model.n_estimators)

    return {
        "isolation_forest": {
            "weight": 0.3,
            "n_estimators": if_n_est,
            "contamination": if_contamination,
            "fitted": ensemble.if_model.is_fitted,
        },
        "lstm": {
            "weight": 0.4,
            "seq_len": _lstm_mod.SEQ_LEN,
            "hidden_size": _lstm_mod.HIDDEN_SIZE,
            "n_features": _lstm_mod.N_FEATURES,
            "fitted": ensemble.lstm_model.is_fitted,
        },
        "xgboost": {
            "weight": 0.3,
            "n_estimators": xgb_n_est,
            "max_depth": xgb_max_depth,
            "learning_rate": xgb_lr,
            "fitted": ensemble.xgb_model.is_fitted,
        },
    }


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        models_loaded=ensemble.is_fitted,
        db_connected=True,
        events_processed=_events_processed,
        model_version=MODEL_VERSION,
        startup_mode=_startup_mode,
    )


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    window_24h = now - timedelta(hours=24)
    window_48h = now - timedelta(hours=48)

    users_monitored = await db.scalar(select(func.count()).select_from(UserModel)) or 0
    alerts_today = await db.scalar(
        select(func.count()).select_from(AlertModel).where(AlertModel.timestamp >= window_24h)
    ) or 0
    alerts_yesterday = await db.scalar(
        select(func.count()).select_from(AlertModel).where(
            and_(AlertModel.timestamp >= window_48h, AlertModel.timestamp < window_24h)
        )
    ) or 0
    high_risk_count = await db.scalar(
        select(func.count()).select_from(AlertModel).where(
            and_(AlertModel.risk_score >= 65, AlertModel.status == "open")
        )
    ) or 0
    high_risk_yesterday = await db.scalar(
        select(func.count()).select_from(AlertModel).where(
            and_(
                AlertModel.risk_score >= 65,
                AlertModel.timestamp >= window_48h,
                AlertModel.timestamp < window_24h,
            )
        )
    ) or 0

    fp = await db.scalar(
        select(func.count()).select_from(AlertModel).where(AlertModel.label == "FP")
    ) or 0
    tp = await db.scalar(
        select(func.count()).select_from(AlertModel).where(AlertModel.label == "TP")
    ) or 0
    fpr = round((fp / max(1, fp + tp)) * 100, 1)
    labels_collected = fp + tp

    last_metric_row = (
        await db.execute(
            select(ModelMetricModel).order_by(desc(ModelMetricModel.created_at)).limit(1)
        )
    ).scalars().first()
    if last_metric_row:
        hours_since = (datetime.utcnow() - last_metric_row.created_at).total_seconds() / 3600
        if hours_since < 1:
            next_retrain_in = "< 1h ago"
        elif hours_since < 24:
            next_retrain_in = f"{int(hours_since)}h ago"
        else:
            next_retrain_in = f"{int(hours_since // 24)}d ago"
    else:
        next_retrain_in = "Never"

    # Coordinated activity: same fraud_type triggered by 3+ distinct users in last 30 min
    thirty_min_ago = datetime.utcnow() - timedelta(minutes=30)
    recent_fraud = (
        await db.execute(
            select(AlertModel.fraud_type, AlertModel.user_id)
            .where(
                and_(
                    AlertModel.timestamp >= thirty_min_ago,
                    AlertModel.fraud_type != "",
                    AlertModel.fraud_type != "anomalous_behavior",
                )
            )
        )
    ).all()

    pattern_users: dict[str, set] = {}
    for fraud_type, user_id in recent_fraud:
        pattern_users.setdefault(fraud_type, set()).add(user_id)

    coordinated = [
        CoordinatedPattern(pattern=pt, users=len(uids), window="last 30m")
        for pt, uids in pattern_users.items()
        if len(uids) >= 3
    ]

    events_today = await db.scalar(
        select(func.count()).select_from(EventModel).where(EventModel.timestamp >= window_24h)
    ) or 0

    return StatsResponse(
        users_monitored=users_monitored,
        alerts_today=alerts_today,
        high_risk_count=high_risk_count,
        false_positive_rate=fpr,
        alerts_change=alerts_today - alerts_yesterday,
        high_risk_change=high_risk_count - high_risk_yesterday,
        labels_collected=labels_collected,
        next_retrain_in=next_retrain_in,
        coordinated_patterns=coordinated,
        events_today=events_today,
    )


# ---------------------------------------------------------------------------
# Live feed — DB-backed, excludes training data, joins alert_id from alerts table
# ---------------------------------------------------------------------------

@app.get("/api/feed", response_model=List[FeedEvent])
async def get_feed(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(EventModel)
            .where(EventModel.event_source.in_(["live", "simulation"]))
            .order_by(desc(EventModel.timestamp))
            .limit(_MAX_FEED)
        )
    ).scalars().all()

    # Resolve alert_id for each event in one query
    event_ids = [r.id for r in rows]
    alert_map: dict[str, str] = {}
    if event_ids:
        alert_rows = (
            await db.execute(
                select(AlertModel.event_id, AlertModel.id)
                .where(AlertModel.event_id.in_(event_ids))
            )
        ).all()
        alert_map = {eid: aid for eid, aid in alert_rows}

    return [
        FeedEvent(
            id=r.id,
            user_id=r.user_id,
            user_name=r.user_name,
            timestamp=r.timestamp,
            event_type=r.event_type,
            risk_level=_risk_level(r.risk_score) if r.risk_score >= 40 else None,
            risk_score=round(r.risk_score, 1),
            description=r.description,
            is_anomalous=r.is_fraud == 1 or r.risk_score >= 65,
            alert_id=alert_map.get(r.id),
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

@app.get("/api/alerts", response_model=AlertListResponse)
async def get_alerts(
    risk_level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    time_range: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None, ge=0, le=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if min_score is not None:
        filters.append(AlertModel.risk_score >= min_score)
    if risk_level and risk_level != "all":
        if risk_level == "critical":
            filters.append(AlertModel.risk_score >= 80)
        elif risk_level == "high":
            filters.append(and_(AlertModel.risk_score >= 65, AlertModel.risk_score < 80))
        elif risk_level == "medium":
            filters.append(and_(AlertModel.risk_score >= 40, AlertModel.risk_score < 65))
        elif risk_level == "low":
            filters.append(AlertModel.risk_score < 40)

    if status and status != "all":
        filters.append(AlertModel.status == status)

    if time_range:
        now = datetime.utcnow()
        if time_range == "1h":
            filters.append(AlertModel.timestamp >= now - timedelta(hours=1))
        elif time_range == "24h":
            filters.append(AlertModel.timestamp >= now - timedelta(hours=24))
        elif time_range == "7d":
            filters.append(AlertModel.timestamp >= now - timedelta(days=7))
        elif time_range == "30d":
            filters.append(AlertModel.timestamp >= now - timedelta(days=30))

    where = and_(*filters) if filters else True
    total = await db.scalar(select(func.count()).select_from(AlertModel).where(where)) or 0
    rows = (
        await db.execute(
            select(AlertModel)
            .where(where)
            .order_by(desc(AlertModel.timestamp))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()

    return AlertListResponse(
        alerts=[_alert_from_row(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@app.get("/api/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(AlertModel, alert_id)
    if not row:
        raise HTTPException(404, "Alert not found")
    return _alert_from_row(row)


@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(AlertModel, alert_id)
    if not row:
        raise HTTPException(404, "Alert not found")
    row.status = "resolved"
    db.add(AuditLogModel(id=str(uuid.uuid4()), action_type="resolve", entity_type="alert",
                         entity_id=alert_id, user_id=row.user_id, alert_id=alert_id,
                         message=f"Alert resolved by investigator"))
    await db.commit()
    return {"status": "resolved"}


@app.post("/api/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(AlertModel, alert_id)
    if not row:
        raise HTTPException(404, "Alert not found")
    row.status = "dismissed"
    db.add(AuditLogModel(id=str(uuid.uuid4()), action_type="dismiss", entity_type="alert",
                         entity_id=alert_id, user_id=row.user_id, alert_id=alert_id,
                         message=f"Alert dismissed by investigator"))
    await db.commit()
    return {"status": "dismissed"}


@app.post("/api/alerts/{alert_id}/label")
async def label_alert(alert_id: str, body: LabelRequest, db: AsyncSession = Depends(get_db)):
    if body.label not in ("TP", "FP"):
        raise HTTPException(400, "label must be TP or FP")
    row = await db.get(AlertModel, alert_id)
    if not row:
        raise HTTPException(404, "Alert not found")
    row.label = body.label
    row.label_updated_at = datetime.utcnow()
    db.add(AuditLogModel(id=str(uuid.uuid4()), action_type="label", entity_type="alert",
                         entity_id=alert_id, user_id=row.user_id, alert_id=alert_id,
                         message=f"Labeled as {body.label} by investigator"))
    await db.commit()
    return {"status": "labeled", "label": body.label}


@app.post("/api/alerts/{alert_id}/note")
async def note_alert(alert_id: str, body: NoteRequest, db: AsyncSession = Depends(get_db)):
    row = await db.get(AlertModel, alert_id)
    if not row:
        raise HTTPException(404, "Alert not found")
    row.notes = body.text
    db.add(AuditLogModel(id=str(uuid.uuid4()), action_type="note", entity_type="alert",
                         entity_id=alert_id, user_id=row.user_id, alert_id=alert_id,
                         message=f"Note added: {body.text[:120]}"))
    await db.commit()
    return {"status": "ok"}


@app.get("/api/alerts/{alert_id}/export")
async def export_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(AlertModel, alert_id)
    if not row:
        raise HTTPException(404, "Alert not found")

    ms = json.loads(row.model_scores_json or "{}")
    sv = json.loads(row.shap_values_json or "[]")

    features: list = []
    if row.event_id:
        ev_row = await db.get(EventModel, row.event_id)
        if ev_row:
            try:
                features = json.loads(ev_row.features_json or "[]")
            except Exception:
                features = []

    return {
        "export_version": "1.0",
        "generated_at": datetime.utcnow().isoformat(),
        "alert": {
            "id": row.id,
            "user_id": row.user_id,
            "user_name": row.user_name,
            "timestamp": row.timestamp.isoformat(),
            "risk_score": row.risk_score,
            "fraud_type": row.fraud_type,
            "status": row.status,
            "label": row.label or None,
            "notes": row.notes or "",
        },
        "model_scores": ms,
        "shap_values": sv,
        "raw_features": {
            "vector": features,
            "feature_names": [
                "login_hour_deviation", "transaction_velocity_ratio", "access_entropy",
                "download_volume_zscore", "location_mismatch", "privilege_use_ratio",
                "device_change_frequency", "off_hours_ratio",
            ],
        },
        "analyst_actions": {
            "label": row.label or None,
            "status": row.status,
            "notes": row.notes or "",
        },
    }


@app.get("/api/alerts/{alert_id}/peer-comparison", response_model=PeerComparisonResponse)
async def peer_comparison(alert_id: str, db: AsyncSession = Depends(get_db)):
    alert = await db.get(AlertModel, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    user = await db.get(UserModel, alert.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    window_start = alert.timestamp - timedelta(hours=24)
    role_users = (
        await db.execute(select(UserModel.id).where(UserModel.role == user.role))
    ).scalars().all()

    rows = (
        await db.execute(
            select(EventModel)
            .where(
                and_(
                    EventModel.user_id.in_(role_users),
                    EventModel.timestamp >= window_start,
                    EventModel.timestamp <= alert.timestamp,
                )
            )
            .limit(1000)
        )
    ).scalars().all()

    def aggregate(uid: str) -> dict:
        evs = [r for r in rows if r.user_id == uid]
        if not evs:
            return {
                "download": 0.0,
                "departments": 0.0,
                "off_hours": 0.0,
                "velocity": 0.0,
            }
        off_hours = sum(1 for r in evs if r.hour < 8 or r.hour > 20)
        return {
            "download": float(sum(r.download_mb or 0.0 for r in evs)),
            "departments": float(len(set(r.department for r in evs if r.department))),
            "off_hours": (off_hours / max(1, len(evs))) * 100.0,
            "velocity": float(sum(r.tx_count or 0 for r in evs) / max(1, len(evs))),
        }

    user_values = aggregate(alert.user_id)
    peer_ids = [uid for uid in role_users if uid != alert.user_id]
    peer_values = [aggregate(uid) for uid in peer_ids]

    def peer_avg(key: str) -> float:
        vals = [p[key] for p in peer_values if p[key] > 0]
        return float(sum(vals) / max(1, len(vals))) if vals else 0.0

    metric_map = [
        ("Download Volume", "download"),
        ("Department Access count", "departments"),
        ("Off-Hours Activity %", "off_hours"),
        ("Transaction Velocity", "velocity"),
    ]
    metrics = []
    for label, key in metric_map:
        avg = peer_avg(key)
        val = user_values[key]
        multiplier = val / max(0.01, avg)
        metrics.append(
            PeerComparisonMetric(
                metric=label,
                user_value=round(val, 2),
                peer_average=round(avg, 2),
                multiplier=round(multiplier, 2),
            )
        )

    return PeerComparisonResponse(
        alert_id=alert.id,
        user_id=alert.user_id,
        role=user.role,
        metrics=metrics,
    )


@app.get("/api/alerts/{alert_id}/timeline", response_model=List[TimelineItem])
async def get_alert_timeline(alert_id: str, db: AsyncSession = Depends(get_db)):
    alert = await db.get(AlertModel, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")

    items: list[TimelineItem] = []

    # 1. Preceding events (up to 8, before alert timestamp)
    window_start = alert.timestamp - timedelta(hours=4)
    event_rows = (
        await db.execute(
            select(EventModel)
            .where(and_(
                EventModel.user_id == alert.user_id,
                EventModel.timestamp >= window_start,
                EventModel.timestamp <= alert.timestamp,
            ))
            .order_by(EventModel.timestamp)
            .limit(10)
        )
    ).scalars().all()

    # Baseline: events more than 30min before alert
    cutoff = alert.timestamp - timedelta(minutes=30)
    for ev in event_rows:
        kind = "baseline" if ev.timestamp < cutoff else "suspicious"
        items.append(TimelineItem(
            id=ev.id,
            timestamp=ev.timestamp,
            kind=kind,
            title=ev.event_type.replace("_", " ").title(),
            explanation=ev.description,
            risk_delta=f"+{int(ev.risk_score)}" if ev.risk_score >= 40 else None,
            source="event",
        ))

    # 2. Alert trigger itself
    items.append(TimelineItem(
        id=alert.id,
        timestamp=alert.timestamp,
        kind="trigger",
        title=f"Alert triggered — {alert.fraud_type.replace('_', ' ').title()}",
        explanation=f"Ensemble risk score: {int(alert.risk_score)}. Threshold: {ALERT_THRESHOLD}.",
        risk_delta=f"+{int(alert.risk_score)}",
        source="alert",
    ))

    # 3. Audit log entries after alert
    audit_rows = (
        await db.execute(
            select(AuditLogModel)
            .where(AuditLogModel.alert_id == alert_id)
            .order_by(AuditLogModel.created_at)
        )
    ).scalars().all()
    for entry in audit_rows:
        items.append(TimelineItem(
            id=entry.id,
            timestamp=entry.created_at,
            kind="analyst_action",
            title=entry.action_type.replace("_", " ").title(),
            explanation=entry.message,
            source="audit_log",
        ))

    return sorted(items, key=lambda x: x.timestamp)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@app.get("/api/users", response_model=List[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(select(UserModel).order_by(desc(UserModel.risk_score)))
    ).scalars().all()

    # Risk trend: compare last-7d avg vs prior-7d avg per user
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    fourteen_days_ago = now - timedelta(days=14)

    recent_res = await db.execute(
        select(AlertModel.user_id, func.avg(AlertModel.risk_score))
        .where(AlertModel.timestamp >= seven_days_ago)
        .group_by(AlertModel.user_id)
    )
    recent_avg: dict[str, float] = {uid: avg for uid, avg in recent_res.all()}

    prev_res = await db.execute(
        select(AlertModel.user_id, func.avg(AlertModel.risk_score))
        .where(
            and_(
                AlertModel.timestamp >= fourteen_days_ago,
                AlertModel.timestamp < seven_days_ago,
            )
        )
        .group_by(AlertModel.user_id)
    )
    prev_avg: dict[str, float] = {uid: avg for uid, avg in prev_res.all()}

    def _trend(uid: str) -> str:
        r = recent_avg.get(uid)
        p = prev_avg.get(uid)
        if r is None or p is None:
            return "stable"
        diff = r - p
        if diff > 5:
            return "up"
        if diff < -5:
            return "down"
        return "stable"

    return [
        UserResponse(
            id=r.id, name=r.name, role=r.role, department=r.department,
            risk_score=r.risk_score, last_seen=r.last_seen, location=r.location,
            risk_trend=_trend(r.id),
            restricted=bool(getattr(r, 'restricted', 0)),
            escalated=bool(getattr(r, 'escalated', 0)),
        )
        for r in rows
    ]


@app.post("/api/users/{user_id}/restrict")
async def restrict_user(user_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(UserModel, user_id)
    if not row:
        raise HTTPException(404, "User not found")
    row.restricted = 1
    db.add(AuditLogModel(id=str(uuid.uuid4()), action_type="restrict", entity_type="user",
                         entity_id=user_id, user_id=user_id,
                         message=f"Access restricted for {row.name}"))
    await db.commit()
    return {"status": "restricted", "user_id": user_id}


@app.post("/api/users/{user_id}/escalate")
async def escalate_user(user_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(UserModel, user_id)
    if not row:
        raise HTTPException(404, "User not found")
    row.escalated = 1
    db.add(AuditLogModel(id=str(uuid.uuid4()), action_type="escalate", entity_type="user",
                         entity_id=user_id, user_id=user_id,
                         message=f"Case escalated for {row.name}"))
    await db.commit()
    return {"status": "escalated", "user_id": user_id}


@app.get("/api/cases", response_model=List[CaseResponse])
async def get_cases(db: AsyncSession = Depends(get_db)):
    case_rows = (
        await db.execute(
            select(CaseModel).order_by(CaseModel.updated_at.desc()).limit(20)
        )
    ).scalars().all()

    cases: list[CaseResponse] = []
    for row in case_rows:
        alert_ids = (
            await db.execute(
                select(CaseAlertModel.alert_id).where(CaseAlertModel.case_id == row.id)
            )
        ).scalars().all()
        if not alert_ids:
            continue
        alert_rows = (
            await db.execute(
                select(AlertModel).where(AlertModel.id.in_(alert_ids))
                .order_by(AlertModel.timestamp)
            )
        ).scalars().all()
        if not alert_rows:
            continue
        cases.append(CaseResponse(
            id=row.id,
            name=row.name,
            severity=row.severity,
            users_involved=json.loads(row.user_ids_json),
            user_names=json.loads(row.user_names_json),
            start_time=row.start_time,
            end_time=row.end_time,
            linked_alerts_count=row.alert_count,
            status=row.status,
            alerts=[_alert_from_row(r) for r in alert_rows],
        ))

    _sev = {"critical": 0, "high": 1, "medium": 2}
    cases.sort(key=lambda c: (_sev.get(c.severity, 3), -c.start_time.timestamp()))
    return cases[:10]


@app.get("/api/cases/{case_id}/timeline", response_model=List[TimelineItem])
async def get_case_timeline(case_id: str, db: AsyncSession = Depends(get_db)):
    case_row = await db.get(CaseModel, case_id)
    if not case_row:
        raise HTTPException(404, "Case not found")

    alert_ids = (
        await db.execute(
            select(CaseAlertModel.alert_id).where(CaseAlertModel.case_id == case_id)
        )
    ).scalars().all()
    target_chain = (
        await db.execute(
            select(AlertModel).where(AlertModel.id.in_(alert_ids))
            .order_by(AlertModel.timestamp)
        )
    ).scalars().all()

    if not target_chain:
        return []

    items: list[TimelineItem] = []
    chain_start = min(a.timestamp for a in target_chain)
    chain_end = max(a.timestamp for a in target_chain)
    chain_user_ids = list({a.user_id for a in target_chain})

    # Real events from DB in the case window
    event_rows = (
        await db.execute(
            select(EventModel)
            .where(and_(
                EventModel.user_id.in_(chain_user_ids),
                EventModel.timestamp >= chain_start - timedelta(minutes=30),
                EventModel.timestamp <= chain_end + timedelta(minutes=30),
            ))
            .order_by(EventModel.timestamp)
            .limit(50)
        )
    ).scalars().all()

    alert_timestamps = {a.timestamp for a in target_chain}
    for ev in event_rows:
        is_alert_event = any(abs((ev.timestamp - at).total_seconds()) < 5 for at in alert_timestamps)
        kind = "trigger" if is_alert_event else ("suspicious" if ev.is_fraud else "baseline")
        items.append(TimelineItem(
            id=ev.id,
            timestamp=ev.timestamp,
            kind=kind,
            title=ev.event_type.replace("_", " ").title(),
            explanation=ev.description,
            risk_delta=f"+{int(ev.risk_score)}" if ev.risk_score >= 40 else None,
            source="event",
        ))

    # Audit log entries for all alerts in the chain
    chain_alert_ids = [a.id for a in target_chain]
    audit_rows = (
        await db.execute(
            select(AuditLogModel)
            .where(AuditLogModel.alert_id.in_(chain_alert_ids))
            .order_by(AuditLogModel.created_at)
        )
    ).scalars().all()
    for entry in audit_rows:
        items.append(TimelineItem(
            id=entry.id,
            timestamp=entry.created_at,
            kind="analyst_action",
            title=entry.action_type.replace("_", " ").title(),
            explanation=entry.message,
            source="audit_log",
        ))

    return sorted(items, key=lambda x: x.timestamp)


@app.get("/api/users/{user_id}", response_model=UserDetailResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(UserModel, user_id)
    if not row:
        raise HTTPException(404, "User not found")

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    alert_rows = (
        await db.execute(
            select(AlertModel)
            .where(and_(AlertModel.user_id == user_id, AlertModel.timestamp >= thirty_days_ago))
            .order_by(desc(AlertModel.timestamp))
            .limit(10)
        )
    ).scalars().all()

    # Single query: avg risk score per calendar day (replaces 30 sequential queries)
    daily_res = await db.execute(
        select(
            func.strftime('%Y-%m-%d', AlertModel.timestamp).label('day'),
            func.avg(AlertModel.risk_score).label('avg_score'),
        )
        .where(and_(AlertModel.user_id == user_id, AlertModel.timestamp >= thirty_days_ago))
        .group_by(func.strftime('%Y-%m-%d', AlertModel.timestamp))
    )
    daily_map: dict[str, float] = {r.day: r.avg_score for r in daily_res.all()}

    risk_history = [
        RiskPoint(
            date=(date.today() - timedelta(days=29 - i)).isoformat(),
            score=round(daily_map.get((date.today() - timedelta(days=29 - i)).isoformat(), 0.0), 1),
        )
        for i in range(30)
    ]

    # Trend: last-7d avg vs prior-7d avg (2 queries, same logic as get_users)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
    recent_avg = await db.scalar(
        select(func.avg(AlertModel.risk_score))
        .where(and_(AlertModel.user_id == user_id, AlertModel.timestamp >= seven_days_ago))
    )
    prev_avg = await db.scalar(
        select(func.avg(AlertModel.risk_score))
        .where(and_(
            AlertModel.user_id == user_id,
            AlertModel.timestamp >= fourteen_days_ago,
            AlertModel.timestamp < seven_days_ago,
        ))
    )
    if recent_avg is not None and prev_avg is not None:
        diff = recent_avg - prev_avg
        risk_trend = "up" if diff > 5 else "down" if diff < -5 else "stable"
    else:
        risk_trend = "stable"

    return UserDetailResponse(
        id=row.id, name=row.name, role=row.role, department=row.department,
        risk_score=row.risk_score, last_seen=row.last_seen, location=row.location,
        risk_trend=risk_trend,
        restricted=bool(getattr(row, 'restricted', 0)),
        escalated=bool(getattr(row, 'escalated', 0)),
        risk_history=risk_history,
        recent_alerts=[_alert_from_row(a) for a in alert_rows],
    )


@app.get("/api/users/{user_id}/events", response_model=List[UserEventResponse])
async def get_user_events(
    user_id: str,
    before: datetime = Query(...),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(EventModel)
            .where(and_(EventModel.user_id == user_id, EventModel.timestamp <= before))
            .order_by(desc(EventModel.timestamp))
            .limit(limit)
        )
    ).scalars().all()

    return [
        UserEventResponse(
            id=r.id,
            user_id=r.user_id,
            user_name=r.user_name,
            timestamp=r.timestamp,
            event_type=r.event_type,
            department=r.department,
            location=r.location,
            description=r.description,
            risk_score=r.risk_score,
            fraud_type=r.fraud_type or None,
        )
        for r in reversed(rows)
    ]


@app.get("/api/audit-log")
async def get_audit_log(
    user_id: Optional[str] = Query(None),
    alert_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if user_id:
        filters.append(AuditLogModel.user_id == user_id)
    if alert_id:
        filters.append(AuditLogModel.alert_id == alert_id)
    where = and_(*filters) if filters else True
    rows = (
        await db.execute(
            select(AuditLogModel).where(where).order_by(desc(AuditLogModel.created_at)).limit(limit)
        )
    ).scalars().all()
    return [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "action_type": r.action_type,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "user_id": r.user_id,
            "alert_id": r.alert_id,
            "message": r.message,
        }
        for r in rows
    ]


@app.get("/api/intelligence", response_model=IntelligenceResponse)
async def get_intelligence(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)

    alert_rows = (
        await db.execute(
            select(AlertModel)
            .where(AlertModel.timestamp >= seven_days_ago)
            .order_by(AlertModel.timestamp)
        )
    ).scalars().all()

    # P/R/F1 computed from analyst labels only — never from generator is_fraud ground truth
    labeled_alerts = [a for a in alert_rows if a.label in ("TP", "FP")]
    label_tp = sum(1 for a in labeled_alerts if a.label == "TP")
    label_fp = sum(1 for a in labeled_alerts if a.label == "FP")

    if len(labeled_alerts) < 10:
        # Not enough human-reviewed alerts to produce meaningful metrics
        precision = 0.0
        recall = 0.0
        f1 = 0.0
    else:
        precision = round(label_tp / max(1, label_tp + label_fp), 3)
        # Recall proxy: fraction of reviewed alerts confirmed as real threats
        recall = round(label_tp / max(1, len(labeled_alerts)), 3)
        f1 = round((2 * precision * recall) / max(0.001, precision + recall), 3)

    # Fix 5: MTTD = created_at (processing time) - timestamp (event time)
    detect_deltas = []
    for alert in alert_rows:
        if alert.created_at and alert.timestamp:
            delta = (alert.created_at - alert.timestamp).total_seconds()
            if delta >= 0:
                detect_deltas.append(delta)
    mean_detect = round(sum(detect_deltas) / max(1, len(detect_deltas)), 1)

    daily_counts: list[DailyCount] = []
    fp_trend: list[FPTrendPoint] = []
    for i in range(7):
        day = date.today() - timedelta(days=6 - i)
        day_start = datetime.combine(day, time.min)
        day_end = datetime.combine(day, time.max)
        day_alerts = [a for a in alert_rows if day_start <= a.timestamp <= day_end]
        daily_counts.append(DailyCount(date=day.isoformat(), count=len(day_alerts)))
        day_labeled = [a for a in day_alerts if a.label in ("TP", "FP")]
        day_fp = sum(1 for a in day_labeled if a.label == "FP")
        fp_trend.append(FPTrendPoint(date=day.isoformat(), rate=round((day_fp / max(1, len(day_labeled))) * 100, 1)))

    # Fix 2: agreement = all 3 models agree HIGH; denominator = at least 1 flagged
    type_counts: dict[str, int] = {}
    agreement_count = 0
    flagged_count = 0
    for alert in alert_rows:
        type_counts[alert.fraud_type or "anomalous_behavior"] = type_counts.get(alert.fraud_type or "anomalous_behavior", 0) + 1
        scores = json.loads(alert.model_scores_json or "{}")
        flags = [
            float(scores.get("isolation_forest", 0.0)) >= 0.5,
            float(scores.get("lstm", 0.0)) >= 0.5,
            float(scores.get("xgboost", 0.0)) >= 0.5,
        ]
        if any(flags):
            flagged_count += 1
            if all(flags):
                agreement_count += 1

    breakdown = [
        BreakdownItem(fraud_type=ft, count=count)
        for ft, count in sorted(type_counts.items(), key=lambda item: item[1], reverse=True)
    ]
    agreement_rate = round((agreement_count / max(1, flagged_count)) * 100, 1)

    labeled_count = await db.scalar(
        select(func.count()).select_from(AlertModel).where(AlertModel.label.in_(["TP", "FP"]))
    ) or 0

    last_metric = (
        await db.execute(
            select(ModelMetricModel).order_by(desc(ModelMetricModel.created_at)).limit(1)
        )
    ).scalars().first()
    last_retrain_ts = last_metric.created_at.isoformat() if last_metric else None

    total_events = await db.scalar(select(func.count()).select_from(EventModel)) or 0
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    alerts_24h = await db.scalar(
        select(func.count()).select_from(AlertModel).where(
            AlertModel.timestamp >= twenty_four_hours_ago
        )
    ) or 0
    # Fix 6: anomaly rate = alerts fired / total events processed in last 24h
    events_24h = await db.scalar(
        select(func.count()).select_from(EventModel).where(EventModel.timestamp >= twenty_four_hours_ago)
    ) or 0
    anomaly_rate = round((alerts_24h / max(1, events_24h)) * 100, 1)

    dept_rows = (
        await db.execute(
            select(
                UserModel.department,
                func.avg(AlertModel.risk_score).label("avg_risk"),
                func.count(AlertModel.id).label("alert_count"),
            )
            .join(UserModel, AlertModel.user_id == UserModel.id)
            .where(AlertModel.timestamp >= seven_days_ago)
            .group_by(UserModel.department)
            .order_by(desc("avg_risk"))
            .limit(8)
        )
    ).all()
    dept_risk = [
        DeptRiskItem(department=r.department, avg_risk=round(float(r.avg_risk), 1), alert_count=r.alert_count)
        for r in dept_rows
    ]

    return IntelligenceResponse(
        precision=precision,
        recall=recall,
        f1=f1,
        mean_time_to_detect=mean_detect,
        alert_volume_last_7_days=daily_counts,
        anomaly_type_breakdown=breakdown,
        model_agreement_rate=agreement_rate,
        false_positive_rate_trend=fp_trend,
        labeled_count=labeled_count,
        last_retrain_ts=last_retrain_ts,
        training_events=total_events,
        anomaly_rate=anomaly_rate,
        department_risk_breakdown=dept_risk,
    )


# ---------------------------------------------------------------------------
# Simulate / retrain
# ---------------------------------------------------------------------------

_SCENARIO_PATTERNS: dict = {
    "bulk_exfiltration": "bulk_download",
    "privilege_escalation": "privilege_escalation",
    "off_hours_treasury": "off_hours_login",
}

@app.post("/api/simulate")
async def simulate(body: SimulateRequest = None):
    if body is None:
        body = SimulateRequest()
    pattern = _SCENARIO_PATTERNS.get(body.scenario or "") if body.scenario else None
    ev = generator.generate_forced_fraud(pattern) if pattern else generator.generate_one()
    ev["_force_alert"] = True
    ev["_source"] = "simulation"
    await _process_event(ev)  # await so alert is in DB before response returns
    return {"status": "ok", "event_id": ev["id"], "scenario": body.scenario}


@app.post("/api/retrain", response_model=RetrainResponse)
async def retrain(db: AsyncSession = Depends(get_db)):
    labeled_rows = (
        await db.execute(
            select(AlertModel).where(AlertModel.label.in_(["TP", "FP"]))
        )
    ).scalars().all()

    if len(labeled_rows) < 10:
        return RetrainResponse(status="skipped", message=f"Need ≥10 labeled alerts, have {len(labeled_rows)}")

    event_rows = (
        await db.execute(
            select(EventModel).where(
                EventModel.id.in_([r.event_id for r in labeled_rows if r.event_id])
            )
        )
    ).scalars().all()

    X, y = [], []
    for ev_row in event_rows:
        try:
            feat = np.array(json.loads(ev_row.features_json), dtype=np.float32)
            label_row = next((r for r in labeled_rows if r.event_id == ev_row.id), None)
            if label_row:
                X.append(feat)
                y.append(1 if label_row.label == "TP" else 0)
        except Exception:
            continue

    if len(X) < 5:
        return RetrainResponse(status="skipped", message="Not enough usable feature vectors", labels_used=len(X))

    X_arr = np.array(X)
    y_arr = np.array(y)

    tp_count = int(y_arr.sum())
    fp_count = int(len(y_arr) - tp_count)
    if tp_count == 0 or fp_count == 0:
        return RetrainResponse(
            status="skipped",
            message=f"Need both TP and FP labels (have {tp_count} TP, {fp_count} FP)",
            labels_used=len(X),
        )

    precision_before = _precision_from_scores(ensemble.xgb_model.score_batch(X_arr), list(y_arr))

    ensemble.xgb_model.fit(X_arr, y_arr)

    # Compute metrics on held-out validation set: last 400 events with feature vectors
    val_event_rows = (
        await db.execute(
            select(EventModel)
            .where(EventModel.features_json != "{}")
            .order_by(desc(EventModel.timestamp))
            .limit(400)
        )
    ).scalars().all()

    val_X: list[np.ndarray] = []
    val_y: list[int] = []
    for ev_row in val_event_rows:
        try:
            feat = np.array(json.loads(ev_row.features_json), dtype=np.float32)
            if len(feat) == 8:
                val_X.append(feat)
                val_y.append(ev_row.is_fraud)
        except Exception:
            continue

    if val_X:
        val_scores = ensemble.xgb_model.score_batch(np.array(val_X))
        precision_after = _precision_from_scores(val_scores, val_y)
        recall_after = _recall_from_scores(val_scores, val_y)
    else:
        after_scores = ensemble.xgb_model.score_batch(X_arr)
        precision_after = _precision_from_scores(after_scores, list(y_arr))
        recall_after = _recall_from_scores(after_scores, list(y_arr))

    f1_after = round((2 * precision_after * recall_after) / max(0.001, precision_after + recall_after), 3)

    # Rollback if new model is significantly worse than baseline
    if precision_after < precision_before - 0.1:
        ensemble.load(SAVED_MODEL_DIR)
        return RetrainResponse(
            status="skipped",
            message=f"Retrain rejected — precision dropped {precision_before:.3f}→{precision_after:.3f} (>0.1). Old model restored.",
            precision_before=precision_before,
            precision_after=round(precision_after, 3),
            recall_after=recall_after,
            f1_after=f1_after,
            labels_used=len(X),
        )

    ensemble.save(SAVED_MODEL_DIR)
    _write_manifest()

    db.add(ModelMetricModel(
        id=str(uuid.uuid4()),
        model_name="XGBoost v1.0.0",
        precision_before=precision_before,
        precision_after=round(precision_after, 3),
        recall=recall_after,
        f1=f1_after,
        labels_used=len(X),
    ))
    await db.commit()
    return RetrainResponse(
        status="ok",
        message=f"XGBoost retrained on {len(X)} labels. Validation — Precision: {precision_after:.3f} | Recall: {recall_after:.3f} | F1: {f1_after:.3f}",
        precision_before=precision_before,
        precision_after=round(precision_after, 3),
        recall_after=recall_after,
        f1_after=f1_after,
        labels_used=len(X),
    )


# ---------------------------------------------------------------------------
# Debug
# ---------------------------------------------------------------------------

@app.get("/api/debug/shap")
async def debug_shap(db: AsyncSession = Depends(get_db)):
    row = (
        await db.execute(
            select(AlertModel)
            .where(AlertModel.shap_values_json != "[]")
            .order_by(desc(AlertModel.timestamp))
            .limit(1)
        )
    ).scalars().first()

    if not row:
        return {"error": "no alerts with SHAP data found"}

    stored = json.loads(row.shap_values_json or "[]")
    recomputed = None
    ev_row = None

    if row.event_id:
        ev_row = await db.get(EventModel, row.event_id)

    if ev_row:
        try:
            feat = np.array(json.loads(ev_row.features_json), dtype=np.float32)
            recomputed = ensemble.xgb_model.explain(feat)
        except Exception as exc:
            recomputed = {"error": str(exc)}

    return {
        "alert_id": row.id,
        "stored_shap_values": stored,
        "recomputed_shap_values": recomputed,
        "xgb_is_fitted": ensemble.xgb_model.is_fitted,
        "xgb_model_none": ensemble.xgb_model._model is None,
        "explainer_none": ensemble.xgb_model._explainer is None,
    }
