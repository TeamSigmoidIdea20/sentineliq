# Ensemble — combines all 3 models into a single risk score.
# Each model looks at the event from a different angle (point anomaly, temporal
# pattern, supervised fraud signal). We take a weighted average of their 0-1
# scores so no single model can dominate, then expose that as the final risk.
from __future__ import annotations

import os
import numpy as np
from models.isolation_forest import IsolationForestModel
from models.lstm_autoencoder import LSTMAutoencoderModel
from models.xgboost_model import XGBoostModel

# Blend weights — must sum to 1.0. IF and LSTM (unsupervised anomaly detectors)
# carry most of the weight; XGBoost (supervised) is weighted lower because it
# depends on having enough labelled data to be reliable.
IF_WEIGHT = 0.4
LSTM_WEIGHT = 0.4
XGB_WEIGHT = 0.2


class EnsembleModel:
    def __init__(self):
        # Hold one instance of each member model.
        self.if_model = IsolationForestModel()
        self.lstm_model = LSTMAutoencoderModel()
        self.xgb_model = XGBoostModel()
        self.is_fitted = False

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        user_events: dict[str, list[np.ndarray]],
    ) -> None:
        # Train all three members. X/y are the flat feature matrix + labels;
        # user_events is the per-user event history the LSTM needs for sequences.
        self.if_model.fit(X)
        self.xgb_model.fit(X, y)
        self.lstm_model.fit(user_events)
        self.is_fitted = True

    def predict(self, user_id: str, features: np.ndarray) -> dict:
        # Score the event with each model, then blend with the fixed weights.
        if_score = self.if_model.score(features)
        lstm_score = self.lstm_model.score(user_id, features)
        xgb_score = self.xgb_model.score(features)
        ensemble = IF_WEIGHT * if_score + LSTM_WEIGHT * lstm_score + XGB_WEIGHT * xgb_score
        # If any model returned NaN and poisoned the average, fall back to neutral.
        if np.isnan(ensemble):
            ensemble = 0.5
        # Return every individual score plus the blended one (nan→0.5 guarded,
        # ensemble clipped to [0,1]) so the UI can show the per-model breakdown.
        return {
            "isolation_forest": round(float(np.nan_to_num(if_score, nan=0.5)), 4),
            "lstm": round(float(np.nan_to_num(lstm_score, nan=0.5)), 4),
            "xgboost": round(float(np.nan_to_num(xgb_score, nan=0.5)), 4),
            "ensemble": round(float(np.clip(ensemble, 0.0, 1.0)), 4),
        }

    def explain(self, features: np.ndarray) -> list[dict]:
        # SHAP explanations come only from XGBoost (the supervised model).
        return self.xgb_model.explain(features)

    def save(self, directory: str) -> None:
        # Save each member to its own file inside the given directory.
        os.makedirs(directory, exist_ok=True)
        self.if_model.save(os.path.join(directory, "isolation_forest.joblib"))
        self.lstm_model.save(os.path.join(directory, "lstm_autoencoder.pt"))
        self.xgb_model.save(os.path.join(directory, "xgboost_model.joblib"))

    def load(self, directory: str) -> None:
        # Reload every member from disk (used on startup to skip cold training).
        self.if_model.load(os.path.join(directory, "isolation_forest.joblib"))
        self.lstm_model.load(os.path.join(directory, "lstm_autoencoder.pt"))
        self.xgb_model.load(os.path.join(directory, "xgboost_model.joblib"))
        self.is_fitted = True

    @staticmethod
    def saved_files_exist(directory: str) -> bool:
        # True only if all three model files are present → safe to load() instead of retrain.
        return all(
            os.path.exists(os.path.join(directory, name))
            for name in ("isolation_forest.joblib", "lstm_autoencoder.pt", "xgboost_model.joblib")
        )
