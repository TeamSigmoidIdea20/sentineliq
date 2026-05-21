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

from database import AlertModel, EventModel, ModelMetricModel, UserModel, get_db, init_db, SessionLocal
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
_feed_buffer: list[dict] = []
_MAX_FEED = 20
MODEL_VERSION = "v1.0.0"
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models", "saved")
_startup_mode = "fresh"

# Columns accepted by EventModel (guards against stray keys from generator)
_EVENT_COLS = {
    "id", "user_id", "user_name", "timestamp", "event_type", "department",
    "location", "hour", "device", "download_mb", "tx_count", "features_json",
    "fraud_type", "is_fraud", "description", "risk_score",
}


def _risk_level(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 60:
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


def _case_name(fraud_types: set[str]) -> str:
    if {"bulk_download", "cross_department_access"}.issubset(fraud_types):
        return "Data Exfiltration Attempt"
    if {"privilege_escalation", "off_hours_login"}.issubset(fraud_types):
        return "Privilege Abuse Sequence"
    if len(fraud_types) >= 3:
        return "Coordinated Insider Threat"
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


async def _seed_demo_labels() -> None:
    """Seed labeled alerts + retrain XGBoost so the intelligence page always shows real metrics.

    Runs after every cold start. Skips if ≥10 labels already exist (local dev with
    a persisted DB). On HuggingFace the DB is always fresh, so this always runs.
    """
    async with SessionLocal() as db:
        existing = await db.scalar(
            select(func.count()).select_from(AlertModel).where(AlertModel.label.in_(["TP", "FP"]))
        ) or 0
        if existing >= 10:
            logger.info("Demo seed skipped — %d labels already in DB", existing)
            return

        fraud_rows = (await db.execute(
            select(EventModel)
            .where(and_(EventModel.is_fraud == 1, EventModel.features_json != '{}'))
            .limit(10)
        )).scalars().all()

        clean_rows = (await db.execute(
            select(EventModel)
            .where(and_(EventModel.is_fraud == 0, EventModel.features_json != '{}'))
            .limit(5)
        )).scalars().all()

        seed_rows = fraud_rows + clean_rows
        if len(seed_rows) < 5:
            logger.warning("Demo seed skipped — not enough events with features yet")
            return

        seed: list[tuple[np.ndarray, int]] = []
        for row in seed_rows:
            try:
                feat = np.array(json.loads(row.features_json), dtype=np.float32)
                if len(feat) != 8:
                    continue
            except Exception:
                continue

            scores = ensemble.predict(row.user_id, feat)
            risk_score = scores["ensemble"] * 100.0
            shap_vals = ensemble.explain(feat)
            label = "TP" if row.is_fraud == 1 else "FP"

            db.add(AlertModel(
                id=str(uuid.uuid4()),
                user_id=row.user_id,
                user_name=row.user_name,
                timestamp=row.timestamp,
                risk_score=round(risk_score, 2),
                fraud_type=row.fraud_type or "anomalous_behavior",
                model_scores_json=json.dumps(scores),
                shap_values_json=json.dumps(shap_vals),
                status="resolved",
                label=label,
                event_id=row.id,
                notes="",
            ))
            seed.append((feat, 1 if label == "TP" else 0))

        await db.commit()

    if len(seed) < 5:
        return

    X_seed = np.array([x for x, _ in seed], dtype=np.float32)
    y_seed = np.array([y for _, y in seed], dtype=np.int32)

    ensemble.xgb_model.fit(X_seed, y_seed)
    ensemble.save(SAVED_MODEL_DIR)

    val_scores = ensemble.xgb_model.score_batch(X_seed)
    prec = _precision_from_scores(val_scores, list(y_seed))
    rec = _recall_from_scores(val_scores, list(y_seed))
    f1 = round((2 * prec * rec) / max(0.001, prec + rec), 3)

    async with SessionLocal() as db:
        db.add(ModelMetricModel(
            id=str(uuid.uuid4()),
            model_name="XGBoost v1.0.0",
            precision_before=round(prec, 3),
            precision_after=round(prec, 3),
            recall=round(rec, 3),
            f1=f1,
            labels_used=len(seed),
        ))
        await db.commit()

    logger.info("Demo seed complete: %d labels, XGBoost retrained (P=%.3f R=%.3f F1=%.3f)",
                len(seed), prec, rec, f1)


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
            logger.info("Models loaded from disk")
            await _seed_demo_labels()
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
            db.add(EventModel(**{k: v for k, v in ev.items() if k in _EVENT_COLS}))

        await db.commit()

    X = np.array(X_all, dtype=np.float32)
    y = np.array(y_all, dtype=np.int32)

    logger.info("Training ensemble models…")
    ensemble.fit(X, y, user_events)
    _startup_mode = "fresh"
    logger.info("Models trained fresh — saving to disk")

    await _seed_demo_labels()
    ensemble.save(SAVED_MODEL_DIR)
    _initialized = True
    logger.info("Startup complete. Starting event loop.")


async def _process_event(ev: dict) -> None:
    global _events_processed
    _events_processed += 1

    force_alert = ev.pop("_force_alert", False)

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

    alert_id = str(uuid.uuid4()) if risk_score >= 60 else None

    feed_entry = {
        "id": ev["id"],
        "user_id": ev["user_id"],
        "user_name": ev["user_name"],
        "timestamp": ev["timestamp"].isoformat(),
        "event_type": ev["event_type"],
        "risk_level": _risk_level(risk_score) if risk_score >= 40 else None,
        "risk_score": round(risk_score, 1),
        "description": ev["description"],
        "is_anomalous": ev["is_fraud"] == 1 or risk_score >= 60,
        "alert_id": alert_id,
    }
    _feed_buffer.insert(0, feed_entry)
    if len(_feed_buffer) > _MAX_FEED:
        _feed_buffer.pop()

    async with SessionLocal() as db:
        db.add(EventModel(**{k: v for k, v in ev.items() if k in _EVENT_COLS}))

        user = await db.get(UserModel, ev["user_id"])
        if user:
            user.risk_score = round(risk_score, 2)
            user.last_seen = ev["timestamp"]

        if alert_id:
            shap_vals = ensemble.explain(feat)
            alert = AlertModel(
                id=alert_id,
                user_id=ev["user_id"],
                user_name=ev["user_name"],
                timestamp=ev["timestamp"],
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

        await db.commit()


async def _event_loop() -> None:
    while True:
        await asyncio.sleep(5)
        try:
            batch = generator.generate_batch(n=random.randint(1, 3), base_ts=datetime.utcnow())
            for ev in batch:
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
    today_start = datetime.combine(date.today(), time.min)
    yesterday_start = today_start - timedelta(days=1)

    users_monitored = await db.scalar(select(func.count()).select_from(UserModel)) or 0
    alerts_today = await db.scalar(
        select(func.count()).select_from(AlertModel).where(AlertModel.timestamp >= today_start)
    ) or 0
    alerts_yesterday = await db.scalar(
        select(func.count()).select_from(AlertModel).where(
            and_(AlertModel.timestamp >= yesterday_start, AlertModel.timestamp < today_start)
        )
    ) or 0
    high_risk_count = await db.scalar(
        select(func.count()).select_from(AlertModel).where(
            and_(AlertModel.risk_score >= 80, AlertModel.status == "open")
        )
    ) or 0
    high_risk_yesterday = await db.scalar(
        select(func.count()).select_from(AlertModel).where(
            and_(
                AlertModel.risk_score >= 80,
                AlertModel.timestamp >= yesterday_start,
                AlertModel.timestamp < today_start,
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
        select(func.count()).select_from(EventModel).where(EventModel.timestamp >= today_start)
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
# Live feed
# ---------------------------------------------------------------------------

@app.get("/api/feed", response_model=List[FeedEvent])
async def get_feed():
    return [FeedEvent(**e) for e in _feed_buffer[:_MAX_FEED]]


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

@app.get("/api/alerts", response_model=AlertListResponse)
async def get_alerts(
    risk_level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    time_range: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if risk_level and risk_level != "all":
        if risk_level == "critical":
            filters.append(AlertModel.risk_score >= 80)
        elif risk_level == "high":
            filters.append(and_(AlertModel.risk_score >= 60, AlertModel.risk_score < 80))
        elif risk_level == "medium":
            filters.append(and_(AlertModel.risk_score >= 40, AlertModel.risk_score < 60))
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
    await db.commit()
    return {"status": "resolved"}


@app.post("/api/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(AlertModel, alert_id)
    if not row:
        raise HTTPException(404, "Alert not found")
    row.status = "dismissed"
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
    await db.commit()
    return {"status": "labeled", "label": body.label}


@app.post("/api/alerts/{alert_id}/note")
async def note_alert(alert_id: str, body: NoteRequest, db: AsyncSession = Depends(get_db)):
    row = await db.get(AlertModel, alert_id)
    if not row:
        raise HTTPException(404, "Alert not found")
    row.notes = body.text
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
    await db.commit()
    return {"status": "restricted", "user_id": user_id}


@app.post("/api/users/{user_id}/escalate")
async def escalate_user(user_id: str, db: AsyncSession = Depends(get_db)):
    row = await db.get(UserModel, user_id)
    if not row:
        raise HTTPException(404, "User not found")
    row.escalated = 1
    await db.commit()
    return {"status": "escalated", "user_id": user_id}


@app.get("/api/cases", response_model=List[CaseResponse])
async def get_cases(db: AsyncSession = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=7)
    alerts = (
        await db.execute(
            select(AlertModel)
            .where(AlertModel.timestamp >= since)
            .order_by(AlertModel.user_id, AlertModel.timestamp)
            .limit(2000)
        )
    ).scalars().all()

    grouped: list[list[AlertModel]] = []
    by_user: dict[str, list[AlertModel]] = {}
    for alert in alerts:
        by_user.setdefault(alert.user_id, []).append(alert)

    for rows in by_user.values():
        current: list[AlertModel] = []
        window_start: Optional[datetime] = None
        for alert in rows:
            if not current:
                current = [alert]
                window_start = alert.timestamp
                continue
            if window_start and alert.timestamp <= window_start + timedelta(hours=24):
                current.append(alert)
            else:
                if len(current) >= 3:
                    grouped.append(current)
                current = [alert]
                window_start = alert.timestamp
        if len(current) >= 3:
            grouped.append(current)

    cases: list[CaseResponse] = []
    for rows in grouped:
        fraud_types = {r.fraud_type for r in rows if r.fraud_type}
        max_risk = max(r.risk_score for r in rows)
        severity = "critical" if max_risk >= 80 else "high" if max_risk >= 60 else "medium"
        start_time = min(r.timestamp for r in rows)
        end_time = max(r.timestamp for r in rows)
        users = sorted({r.user_id for r in rows})
        names = sorted({r.user_name for r in rows})
        status = "open" if any(r.status == "open" for r in rows) else "resolved"
        case_id = f"case-{rows[0].user_id}-{int(start_time.timestamp())}"
        cases.append(
            CaseResponse(
                id=case_id,
                name=_case_name(fraud_types),
                severity=severity,
                users_involved=users,
                user_names=names,
                start_time=start_time,
                end_time=end_time,
                linked_alerts_count=len(rows),
                status=status,
                alerts=[_alert_from_row(r) for r in rows],
            )
        )

    _sev = {"critical": 0, "high": 1, "medium": 2}
    cases.sort(key=lambda c: (_sev.get(c.severity, 3), -c.start_time.timestamp()))
    return cases[:10]


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

    event_ids = [r.event_id for r in alert_rows if r.event_id]
    event_rows = []
    if event_ids:
        event_rows = (
            await db.execute(select(EventModel).where(EventModel.id.in_(event_ids)))
        ).scalars().all()
    event_by_id = {e.id: e for e in event_rows}

    tp = sum(1 for a in alert_rows if event_by_id.get(a.event_id) and event_by_id[a.event_id].is_fraud == 1)
    fp = max(0, len(alert_rows) - tp)
    total_fraud_events = await db.scalar(
        select(func.count()).select_from(EventModel).where(
            and_(EventModel.timestamp >= seven_days_ago, EventModel.is_fraud == 1)
        )
    ) or 0

    precision = round(tp / max(1, tp + fp), 3)
    recall = round(tp / max(1, total_fraud_events), 3)
    f1 = round((2 * precision * recall) / max(0.001, precision + recall), 3)

    detect_deltas = []
    for alert in alert_rows:
        ev = event_by_id.get(alert.event_id)
        if ev:
            detect_deltas.append(max(0.0, (alert.timestamp - ev.timestamp).total_seconds()))
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

    type_counts: dict[str, int] = {}
    agreement_count = 0
    for alert in alert_rows:
        type_counts[alert.fraud_type or "anomalous_behavior"] = type_counts.get(alert.fraud_type or "anomalous_behavior", 0) + 1
        scores = json.loads(alert.model_scores_json or "{}")
        flags = [
            float(scores.get("isolation_forest", 0.0)) >= 0.5,
            float(scores.get("lstm", 0.0)) >= 0.5,
            float(scores.get("xgboost", 0.0)) >= 0.5,
        ]
        if all(flags) or not any(flags):
            agreement_count += 1

    breakdown = [
        BreakdownItem(fraud_type=ft, count=count)
        for ft, count in sorted(type_counts.items(), key=lambda item: item[1], reverse=True)
    ]
    agreement_rate = round((agreement_count / max(1, len(alert_rows))) * 100, 1)

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
    fraud_alerts_24h = await db.scalar(
        select(func.count()).select_from(AlertModel).where(
            and_(
                AlertModel.timestamp >= twenty_four_hours_ago,
                AlertModel.fraud_type.notin_(["", "anomalous_behavior"]),
            )
        )
    ) or 0
    anomaly_rate = round((fraud_alerts_24h / max(1, alerts_24h)) * 100, 1)

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
    precision_before = _precision_from_scores(ensemble.xgb_model.score_batch(X_arr), list(y_arr))

    ensemble.xgb_model.fit(X_arr, y_arr)
    ensemble.save(SAVED_MODEL_DIR)

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
