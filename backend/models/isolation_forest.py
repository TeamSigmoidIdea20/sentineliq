import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


class IsolationForestModel:
    def __init__(self):
        self._model = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
        self._scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, X: np.ndarray) -> None:
        X_scaled = self._scaler.fit_transform(X)
        self._model.fit(X_scaled)
        self.is_fitted = True

    def score(self, features: np.ndarray) -> float:
        """Returns anomaly score in [0, 1]. Higher = more anomalous."""
        if not self.is_fitted:
            return 0.5
        x = features.reshape(1, -1)
        x_scaled = self._scaler.transform(x)
        # decision_function returns negative anomaly scores; lower = more anomalous
        raw = self._model.decision_function(x_scaled)[0]
        # Convert to [0, 1]: raw is roughly in [-0.5, 0.5]
        score = 1.0 - (raw + 0.5)
        return float(np.clip(score, 0.0, 1.0))

    def save(self, path: str) -> None:
        joblib.dump(
            {"model": self._model, "scaler": self._scaler, "is_fitted": self.is_fitted},
            path,
        )

    def load(self, path: str) -> None:
        payload = joblib.load(path)
        self._model = payload["model"]
        self._scaler = payload["scaler"]
        self.is_fitted = bool(payload.get("is_fitted", True))
