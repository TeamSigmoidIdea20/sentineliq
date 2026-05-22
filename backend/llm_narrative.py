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
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")
        top_features = sorted(shap_values, key=lambda x: abs(x.get("contribution", 0)), reverse=True)[:3]
        feature_text = ", ".join([
            f"{f['feature']} ({'+' if f.get('contribution', 0) > 0 else ''}{f.get('contribution', 0):.2f})"
            for f in top_features
        ])
        prompt = (
            f"You are a bank fraud analyst assistant. Write 2-3 sentences explaining why this alert fired. "
            f"Be specific, use the numbers, avoid jargon. Do not start with I or This alert.\n\n"
            f"User: {user.name}, Role: {user.role}, Department: {user.department}\n"
            f"Fraud type: {alert.fraud_type}\n"
            f"Risk score: {alert.risk_score}/100\n"
            f"Top contributing behaviours: {feature_text}"
        )
        response = client.chat.completions.create(
            model="grok-3-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return None
