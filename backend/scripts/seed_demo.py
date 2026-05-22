"""
Standalone script to seed labeled demo alerts for local development.

Usage (from backend/):
    python -m scripts.seed_demo

Requires the models to already be trained (i.e. the backend has run at least once
so models/saved/ exists). Creates synthetic TP/FP labeled alerts so the Intelligence
page shows non-zero P/R/F1 metrics immediately.

NOT called by the production startup path.
"""
from __future__ import annotations

import asyncio
import json
import sys
import uuid
from datetime import datetime
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

DATABASE_URL = "sqlite+aiosqlite:///./sentineliq.db"
engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

from database import AlertModel, EventModel, ModelMetricModel
from models.ensemble import EnsembleModel
from data.feature_engineering import FeatureEngineer

SAVED_MODEL_DIR = str(Path(__file__).resolve().parent.parent / "models" / "saved")


def _precision_from_scores(scores: list[float], labels: list[int]) -> float:
    thresh = 0.5
    tp = sum(1 for s, l in zip(scores, labels) if s >= thresh and l == 1)
    fp = sum(1 for s, l in zip(scores, labels) if s >= thresh and l == 0)
    return round(tp / max(1, tp + fp), 3)


def _recall_from_scores(scores: list[float], labels: list[int]) -> float:
    thresh = 0.5
    tp = sum(1 for s, l in zip(scores, labels) if s >= thresh and l == 1)
    fn = sum(1 for s, l in zip(scores, labels) if s < thresh and l == 1)
    return round(tp / max(1, tp + fn), 3)


async def main() -> None:
    ens = EnsembleModel()
    if not EnsembleModel.saved_files_exist(SAVED_MODEL_DIR):
        print("No saved models found. Run the backend first to train models.")
        return
    ens.load(SAVED_MODEL_DIR)
    engineer = FeatureEngineer()

    async with SessionLocal() as db:
        existing = await db.scalar(
            select(func.count()).select_from(AlertModel).where(AlertModel.label.in_(["TP", "FP"]))
        ) or 0
        if existing >= 10:
            print(f"Skipped — {existing} labels already in DB")
            return

        from sqlalchemy import and_
        fraud_rows = (await db.execute(
            select(EventModel).where(and_(EventModel.is_fraud == 1, EventModel.features_json != '{}')).limit(10)
        )).scalars().all()
        clean_rows = (await db.execute(
            select(EventModel).where(and_(EventModel.is_fraud == 0, EventModel.features_json != '{}')).limit(5)
        )).scalars().all()

        seed_rows = fraud_rows + clean_rows
        if len(seed_rows) < 5:
            print("Not enough events with features — run the backend first.")
            return

        seed: list[tuple[np.ndarray, int]] = []
        for row in seed_rows:
            try:
                feat = np.array(json.loads(row.features_json), dtype=np.float32)
                if len(feat) != 8:
                    continue
            except Exception:
                continue
            scores = ens.predict(row.user_id, feat)
            risk_score = scores["ensemble"] * 100.0
            shap_vals = ens.explain(feat)
            label = "TP" if row.is_fraud == 1 else "FP"
            db.add(AlertModel(
                id=str(uuid.uuid4()),
                user_id=row.user_id,
                user_name=row.user_name,
                timestamp=row.timestamp,
                created_at=datetime.utcnow(),
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
        print("Too few valid features to retrain.")
        return

    X = np.array([x for x, _ in seed], dtype=np.float32)
    y = np.array([y for _, y in seed], dtype=np.int32)
    split = max(1, int(len(seed) * 0.8))
    ens.xgb_model.fit(X[:split], y[:split])
    ens.save(SAVED_MODEL_DIR)

    X_val, y_val = X[split:], y[split:]
    if len(X_val) > 0:
        scores_v = ens.xgb_model.score_batch(list(X_val))
        prec = _precision_from_scores(scores_v, list(y_val))
        rec = _recall_from_scores(scores_v, list(y_val))
    else:
        scores_v = ens.xgb_model.score_batch(list(X))
        prec = _precision_from_scores(scores_v, list(y))
        rec = _recall_from_scores(scores_v, list(y))
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

    print(f"Seed complete: {len(seed)} labels, P={prec:.3f} R={rec:.3f} F1={f1:.3f}")


if __name__ == "__main__":
    asyncio.run(main())
