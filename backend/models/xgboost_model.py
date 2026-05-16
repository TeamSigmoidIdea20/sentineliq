from __future__ import annotations

import logging
import numpy as np
import joblib

logger = logging.getLogger(__name__)

try:
    import xgboost as xgb
    import shap
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

FEATURE_NAMES = [
    "login_hour_deviation",
    "transaction_velocity_ratio",
    "access_entropy",
    "download_volume_zscore",
    "location_mismatch",
    "privilege_use_ratio",
    "device_change_frequency",
    "off_hours_ratio",
]

# Expected magnitude for each feature when "normal" — used to scale fallback contributions
_FEATURE_SCALE = [2.0, 1.0, 1.5, 1.0, 1.0, 0.5, 0.5, 0.5]


class XGBoostModel:
    def __init__(self):
        self._model = None
        self._explainer = None
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        if not XGB_AVAILABLE:
            self.is_fitted = True
            return

        pos = int(y.sum())
        neg = int(len(y) - pos)
        scale = neg / max(1, pos)

        self._model = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.1,
            scale_pos_weight=scale,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            verbosity=0,
        )
        self._model.fit(X, y)
        self._explainer = shap.TreeExplainer(self._model)
        self.is_fitted = True

    def score(self, features: np.ndarray) -> float:
        if not self.is_fitted or self._model is None:
            return 0.5
        x = features.reshape(1, -1)
        return float(self._model.predict_proba(x)[0][1])

    def score_batch(self, X: np.ndarray) -> list[float]:
        if not self.is_fitted or self._model is None:
            return [0.5] * len(X)
        return self._model.predict_proba(X)[:, 1].tolist()

    def explain(self, features: np.ndarray) -> list[dict]:
        if not self.is_fitted or self._explainer is None:
            logger.debug("[SHAP] Model not fitted — using fallback")
            return _fallback_shap(features)

        x = features.reshape(1, -1)
        try:
            sv = self._explainer.shap_values(x, check_additivity=False)

            # Normalise all possible return shapes from different SHAP/XGB versions:
            # - list([cls0_arr, cls1_arr]) where each is (1, n_features)  → take cls1
            # - ndarray (1, n_features)                                    → use directly
            # - ndarray (1, n_features, n_classes)                        → take [:,:,1]
            if isinstance(sv, list):
                # Legacy SHAP format: list of per-class arrays
                arr = np.array(sv[1] if len(sv) > 1 else sv[0])
            else:
                arr = np.array(sv)

            if arr.ndim == 3:
                # (n_samples, n_features, n_classes) — take positive class
                arr = arr[:, :, 1]

            shap_row = arr[0]  # shape (n_features,)

            logger.debug("[SHAP] raw shap_row: %s", shap_row.tolist())

            # If everything is genuinely zero (degenerate model), use fallback
            if np.all(np.abs(shap_row) < 1e-9):
                logger.warning("[SHAP] All SHAP values are zero — using fallback")
                return _fallback_shap(features)

            contributions = []
            for name, val, feat_val in zip(FEATURE_NAMES, shap_row, features):
                contributions.append({
                    "feature": name,
                    "value": round(float(feat_val), 4),
                    "contribution": round(float(val), 4),
                    "direction": "positive" if val >= 0 else "negative",
                })

            contributions.sort(key=lambda c: abs(c["contribution"]), reverse=True)
            return contributions[:5]

        except Exception as exc:
            logger.warning("[SHAP] explain() exception: %s — using fallback", exc)
            return _fallback_shap(features)

    def save(self, path: str) -> None:
        joblib.dump({"model": self._model, "is_fitted": self.is_fitted}, path)

    def load(self, path: str) -> None:
        payload = joblib.load(path)
        self._model = payload["model"]
        self.is_fitted = bool(payload.get("is_fitted", self._model is not None))
        if XGB_AVAILABLE and self._model is not None:
            self._explainer = shap.TreeExplainer(self._model)


def _fallback_shap(features: np.ndarray) -> list[dict]:
    """Fallback when TreeExplainer is unavailable or produces zeros.
    Scales contributions by per-feature expected magnitude so values are meaningful.
    """
    out = []
    for name, val, scale in zip(FEATURE_NAMES, features, _FEATURE_SCALE):
        # Contribution = how many σ-equivalents away from 0 this feature is
        contrib = float(val) / max(1e-6, scale)
        out.append({
            "feature": name,
            "value": round(float(val), 4),
            "contribution": round(contrib, 4),
            "direction": "positive" if contrib >= 0 else "negative",
        })
    out.sort(key=lambda c: abs(c["contribution"]), reverse=True)
    return out[:5]
