from __future__ import annotations

import os
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from database import AlertModel, UserModel


def generate_alert_narrative(alert: "AlertModel", shap_values: list, user: "UserModel") -> Optional[str]:
    api_key = os.environ.get("GROK_API_KEY")
    if not api_key:
        return None
    try:
        import json
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")

        top_features = sorted(shap_values, key=lambda x: abs(x.get("contribution", 0)), reverse=True)[:4]
        feature_lines = "\n".join([
            f"  - {f['feature'].replace('_', ' ')}: value={f.get('value', 0):.2f}, SHAP={'+' if f.get('contribution', 0) > 0 else ''}{f.get('contribution', 0):.3f} ({'increases' if f.get('contribution', 0) > 0 else 'reduces'} risk)"
            for f in top_features
        ])

        try:
            scores = json.loads(alert.model_scores_json or "{}")
        except Exception:
            scores = {}
        if_pct = round(scores.get("isolation_forest", 0) * 100)
        lstm_pct = round(scores.get("lstm", 0) * 100)
        xgb_pct = round(scores.get("xgboost", 0) * 100)

        prompt = (
            f"You are a bank fraud analyst. Write 3-4 sentences in plain English explaining why this insider fraud alert fired. "
            f"Describe what the employee specifically did, why each ML model flagged it, and what the key numbers mean. "
            f"Be concrete — reference the actual feature values and scores. Do not start with 'I' or 'This alert'.\n\n"
            f"Employee: {user.name} | Role: {user.role} | Department: {user.department}\n"
            f"Alert type: {alert.fraud_type.replace('_', ' ')}\n"
            f"Ensemble risk score: {round(alert.risk_score)}/100\n\n"
            f"Model scores:\n"
            f"  - Isolation Forest: {if_pct}% anomaly probability (detects statistical outliers)\n"
            f"  - LSTM Autoencoder: {lstm_pct}% reconstruction error (detects behavioural drift over time)\n"
            f"  - XGBoost: {xgb_pct}% fraud confidence (supervised classifier trained on labeled patterns)\n\n"
            f"Top behavioural signals (SHAP feature attribution):\n{feature_lines}"
        )
        response = client.chat.completions.create(
            model="grok-3-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=220,
            temperature=0.25,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return None
