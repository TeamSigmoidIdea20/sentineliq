---
name: known-bugs
description: Outstanding bugs and audit findings not yet fixed as of last session
metadata: 
  node_type: memory
  type: project
  originSessionId: ed80e215-9e9a-4529-9557-805f1ba4fad4
---

**SHAP values on deployed backend may still show zeros.**
The local backend returns correct non-zero SHAP values. The deployed HuggingFace backend may not have picked up the latest fixes yet (schemas.py duplicate `direction` field fix, xgboost_model.py multi-shape SHAP handling). If zeros appear in production, force a redeploy.

**Audit findings (low priority, not fixed):**
- Simulate → refresh timing gap: event processes in ~5s but toast refreshes at 3s, so new alert may not appear immediately.
- StatStrip "Open Alerts" on alerts page counts only threshold-filtered current-page alerts, not all open alerts globally.
- "True Positive Rate" label in StatStrip is actually specificity (1 - FPR), not true TPR. Minor mislabel.
- Escalate Case reference number (ESC-xxxx) is frontend-generated and not persisted - different number each panel open.
- Intelligence page anomaly rate: slight semantic mismatch between stats.alerts_today/events_today vs intelligence.anomaly_rate calculation.
