from __future__ import annotations

import os
import numpy as np
from models.isolation_forest import IsolationForestModel
from models.lstm_autoencoder import LSTMAutoencoderModel
from models.xgboost_model import XGBoostModel

IF_WEIGHT = 0.3
LSTM_WEIGHT = 0.4
XGB_WEIGHT = 0.3


class EnsembleModel:
    def __init__(self):
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
        self.if_model.fit(X)
        self.xgb_model.fit(X, y)
        self.lstm_model.fit(user_events)
        self.is_fitted = True

    def predict(self, user_id: str, features: np.ndarray) -> dict:
        if_score = self.if_model.score(features)
        lstm_score = self.lstm_model.score(user_id, features)
        xgb_score = self.xgb_model.score(features)
        ensemble = IF_WEIGHT * if_score + LSTM_WEIGHT * lstm_score + XGB_WEIGHT * xgb_score
        return {
            "isolation_forest": round(if_score, 4),
            "lstm": round(lstm_score, 4),
            "xgboost": round(xgb_score, 4),
            "ensemble": round(float(np.clip(ensemble, 0.0, 1.0)), 4),
        }

    def explain(self, features: np.ndarray) -> list[dict]:
        return self.xgb_model.explain(features)

    def save(self, directory: str) -> None:
        os.makedirs(directory, exist_ok=True)
        self.if_model.save(os.path.join(directory, "isolation_forest.joblib"))
        self.lstm_model.save(os.path.join(directory, "lstm_autoencoder.pt"))
        self.xgb_model.save(os.path.join(directory, "xgboost_model.joblib"))

    def load(self, directory: str) -> None:
        self.if_model.load(os.path.join(directory, "isolation_forest.joblib"))
        self.lstm_model.load(os.path.join(directory, "lstm_autoencoder.pt"))
        self.xgb_model.load(os.path.join(directory, "xgboost_model.joblib"))
        self.is_fitted = True

    @staticmethod
    def saved_files_exist(directory: str) -> bool:
        return all(
            os.path.exists(os.path.join(directory, name))
            for name in ("isolation_forest.joblib", "lstm_autoencoder.pt", "xgboost_model.joblib")
        )
