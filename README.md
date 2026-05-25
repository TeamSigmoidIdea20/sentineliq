# SentinelIQ — Insider Fraud Detection System

**iDEA 2.0 | Union Bank of India | PS1: AI-Driven Early Warning System for Internal & Privileged User Fraud**
**Team SIGMOID | JSS University, Noida**

---

## Problem

Insider fraud accounts for 15–20% of total bank fraud value in Indian PSBs. Current systems rely on fixed rules and periodic audits — they have no concept of what normal looks like for each individual employee. A treasury officer accessing systems outside their department, or a teller processing 10x their usual transactions, goes completely undetected until the damage is done.

## Solution

SentinelIQ builds a dynamic per-user behavioural baseline for every monitored bank employee and raises alerts the moment behaviour deviates — in real time, not after a quarterly audit.

- **3-model ML ensemble**: Isolation Forest (40%) + LSTM Autoencoder (40%) + XGBoost (20%)
- **8 rolling-window behavioural features** per user per event
- **SHAP explainability**: every alert shows exactly which features drove the score
- **Kill-chain case detection**: 2+ alerts from the same user within 24h auto-grouped into an attack case
- **Active learning loop**: analyst TP/FP labels trigger XGBoost retraining on demand
- **Plain-English explanations** for non-technical investigators
- **External SIEM ingestion** via POST /api/ingest + webhook on risk ≥ 80

## Live Deployment

- **Frontend:** https://sentineliq-gold.vercel.app/
- **Backend API:** https://rak2315-sentineliq-backend.hf.space
- **Demo Video:** *(link to be added)*

> **Note:** Backend is hosted on HuggingFace Spaces free tier — it sleeps after 15 min of inactivity. Visit `/health` and wait for `{"status":"ok"}` before demoing (cold start ~30–60s).

## How to Run Locally

**1. Clone the repo**
```bash
git clone https://github.com/RAK2315/sentineliq
```

**2. Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
First run auto-generates 2000 synthetic events and trains all three models. Saved to `models/saved/`. Backend ready at `http://localhost:8000`.

**3. Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local
npm run dev
```
Open `http://localhost:3000`.

## Project Structure

```
sentineliq/
├── backend/
│   ├── main.py                        — FastAPI app, all 18 endpoints, event loop
│   ├── database.py                    — SQLite setup (WAL mode, aiosqlite)
│   ├── schemas.py                     — Pydantic request/response models
│   ├── requirements.txt
│   ├── data/
│   │   ├── synthetic_generator.py     — 50-user event stream, 6 fraud patterns
│   │   └── feature_engineering.py    — 8 rolling-window feature vectors
│   └── models/
│       ├── isolation_forest.py        — point anomaly (scikit-learn)
│       ├── lstm_autoencoder.py        — temporal drift (PyTorch)
│       ├── xgboost_model.py           — supervised scorer + SHAP TreeExplainer
│       └── ensemble.py                — weighted scorer (0.4 / 0.4 / 0.2)
└── frontend/
    ├── app/
    │   ├── page.tsx                   — landing page
    │   └── dashboard/                 — overview, alerts, cases, intelligence, users
    ├── components/                    — AlertPanel, SHAPChart, IntelligenceCharts, etc.
    └── lib/
        ├── api.ts                     — typed API client
        └── tokens.ts                  — design token constants (C object)
```

## Synthetic Data

All data is 100% synthetic — no real bank data was used at any stage.

`backend/data/synthetic_generator.py` simulates 50 bank employees across 5 roles (teller, analyst, manager, admin, treasury_officer) with realistic per-role activity patterns:

- Login timestamps matched to each role's normal working hours
- Transaction counts and download volumes drawn from per-user Gaussian distributions
- Normal department access patterns and typical locations per employee
- 6 fraud patterns injected at ~7% rate: `off_hours_login` · `bulk_download` · `cross_department_access` · `privilege_escalation` · `velocity_spike` · `account_modification`

## Model Performance (Synthetic Test Set)

| Model | Precision | Recall | F1 |
|---|---|---|---|
| Isolation Forest | 0.81 | 0.76 | 0.78 |
| LSTM Autoencoder | 0.84 | 0.79 | 0.81 |
| XGBoost | 0.88 | 0.83 | 0.85 |
| **Ensemble (0.4/0.4/0.2)** | **0.91** | **0.86** | **0.88** |

Performance is on synthetic data. Production use would require retraining on labelled real transaction logs.

## Known Limitations

- Trained on synthetic data only — production deployment requires real labelled bank transaction data
- SQLite is sufficient for POC; production would need PostgreSQL for write throughput at scale
- Backend on HuggingFace Spaces: ephemeral storage (SQLite wiped on container restart), 15-min sleep mode
- Live feed uses 3-second HTTP polling — production would use WebSockets or a message broker
- SHAP attribution covers XGBoost only; Isolation Forest and LSTM produce scalar scores without per-feature breakdown
- No user authentication on the dashboard — not appropriate for production deployment
- LSTM Autoencoder trained once at startup; production would need periodic retraining as behaviour patterns evolve

## Team — Team SIGMOID

| Name | Contribution |
|---|---|
| Rehaan Ahmad Khan | ML models, anomaly detection, ensemble, SHAP |
| Shantanu Singh | Backend API, deployment, infrastructure |
| Vishnu Tripathi | Data engineering, synthetic data pipeline |
| Krishna Agarwaal | Frontend dashboard, UI components |

**Contact:** rehtrooper@gmail.com
