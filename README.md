# SentinelIQ - AI Insider Threat Detection

**CodeArambh 2.0 | Open Innovation Track | Cybersecurity**
**Team SIGMOID**

---

## Problem

The most dangerous attacker already has a valid login. Insiders (employees, admins, contractors, or anyone whose credentials have been stolen) bypass firewalls, antivirus, and perimeter defences because every action they take looks authorised.

The cost is huge and rising. The Ponemon Institute's 2026 Cost of Insider Risks report puts the average annual insider risk cost at **$19.5M per organisation**, and incidents take **67 days on average to contain**. Most organisations still rely on static rules and periodic audits. These have no idea what "normal" looks like for each individual user, so an admin escalating their own privileges at 3 AM, or an analyst quietly exporting 50x their usual data volume, goes unnoticed until the damage is done.

Financial institutions feel this most, because one privileged action can move money or leak thousands of customer records.

## Solution

SentinelIQ is an AI-driven cybersecurity platform that builds a dynamic behavioural baseline for every monitored user and raises an alert the moment behaviour deviates. It works in real time, not after a quarterly audit.

- **3-model ML ensemble**: Isolation Forest (40%) + LSTM Autoencoder (40%) + XGBoost (20%)
- **8 rolling-window behavioural features** per user per event
- **SHAP explainability**: every alert shows exactly which features drove the score
- **Kill-chain case detection**: 2+ alerts from the same user within 24h are grouped into one attack case
- **Active learning loop**: analyst TP/FP labels trigger XGBoost retraining on demand
- **Plain-English explanations** for non-technical investigators
- **External SIEM ingestion** via `POST /api/ingest`, plus a webhook on risk ≥ 80

The demo runs on a simulated bank workforce (tellers, analysts, managers, admins, treasury officers), because that is where insider abuse is most costly. The detection pipeline itself works for any organisation: it scores behaviour, not job titles.

## Why It Fits Open Innovation

| Objective | How SentinelIQ delivers |
|---|---|
| Innovation and problem-solving | Per-user behavioural baselines and a 3-model ensemble instead of static rules. Unsupervised models catch attacks nobody has written a rule for yet. |
| Functional, scalable prototype | Fully deployed and live: event stream → feature engineering → ML scoring → alerts → cases, all running continuously. Built on an event-driven design that swaps SQLite for PostgreSQL and a message queue at scale. |
| Genuine challenge, practical value | Insider threats are one of the costliest and hardest-to-detect attack classes in cybersecurity. SentinelIQ plugs into existing logs through `/api/ingest`. |
| Creativity, technical excellence, user impact | SHAP explanations and plain-English narratives let analysts move from alert to decision in under 30 seconds. We validated against the CMU CERT r4.2 insider-threat benchmark and caught a real CERT insider live. |

## Live Deployment

- **Frontend:** https://sentineliq-gold.vercel.app/
- **Backend API:** https://rak2315-sentineliq-backend.hf.space
- **Demo Video:** https://youtu.be/ebN6C0Ewx7U

> **Note:** The backend is hosted on the HuggingFace Spaces free tier, which sleeps after 15 min of inactivity. Visit `/health` and wait for `{"status":"ok"}` before demoing (cold start is about 30-60s).

## How to Run Locally

**1. Clone the repo**
```bash
git lfs install
git clone https://github.com/TeamSigmoidIdea20/sentineliq.git
cd sentineliq
```

**2. Backend (Python 3.10)**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows  (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```
The first run automatically generates 2000 synthetic events and trains all three models, then saves them to `models/saved/`. The backend is ready at `http://localhost:8000`.

**3. Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```
Open `http://localhost:3000`.

## Project Structure

```
sentineliq/
├── backend/
│   ├── main.py                        - FastAPI app, all endpoints, live event loop
│   ├── database.py                    - SQLite setup (WAL mode, aiosqlite)
│   ├── schemas.py                     - Pydantic request/response models
│   ├── llm_narrative.py               - plain-English alert narratives
│   ├── requirements.txt
│   ├── data/
│   │   ├── synthetic_generator.py     - 50-user event stream, 6 attack patterns
│   │   └── feature_engineering.py     - 8 rolling-window feature vectors
│   └── models/
│       ├── isolation_forest.py        - point anomaly (scikit-learn)
│       ├── lstm_autoencoder.py        - temporal drift (PyTorch)
│       ├── xgboost_model.py           - supervised scorer + SHAP TreeExplainer
│       └── ensemble.py                - weighted scorer (0.4 / 0.4 / 0.2)
├── scripts/
│   └── cert/                          - CMU CERT r4.2 benchmark validation + insider replay
└── frontend/
    ├── app/
    │   ├── page.tsx                   - landing page
    │   └── dashboard/                 - overview, alerts, cases, intelligence, users
    ├── components/                    - AlertPanel, SHAPChart, IntelligenceCharts, etc.
    └── lib/
        ├── api.ts                     - typed API client
        └── tokens.ts                  - design token constants (C object)
```

## Synthetic Data

All data is 100% synthetic. No real organisation's data was used at any stage.

`backend/data/synthetic_generator.py` simulates 50 employees across 5 roles (teller, analyst, manager, admin, treasury_officer), each with realistic per-role activity patterns:

- Login timestamps matched to each role's normal working hours
- Transaction counts and download volumes drawn from per-user Gaussian distributions
- Normal department access patterns and typical locations per employee
- 6 insider attack patterns injected at a ~7% rate: `off_hours_login` · `bulk_download` · `cross_department_access` · `privilege_escalation` · `velocity_spike` · `account_modification`

## Benchmark Validation (CMU CERT r4.2)

No real-world insider-threat dataset from a financial institution is public, so we validated our synthetic
behavioural distributions against **CMU CERT r4.2**. This is the standard insider-threat benchmark
used across academic UEBA research (220k+ logon events analysed).

- **Validated:** both SentinelIQ and CERT are strongly business-hours-dominant with rare
  off-hours (night) activity, which confirms our off-hours signal is well-founded.
- **Honest finding:** CERT keeps a small (~4.5%) background of benign night activity, while our default
  synthetic baseline is ~0% (idealised). We added an **optional CERT calibration** that
  samples login hours from CERT's real distribution to close this gap (off by default).
- **Live demo on benchmark data:** `scripts/cert/cert_to_ingest.py` replays a documented CERT
  malicious insider (off-hours logon → USB connect → data upload) through `POST /api/ingest`,
  showing the pipeline flag a real-world attack pattern.

The tooling lives in [`scripts/cert/`](scripts/cert/). Running it regenerates the comparison charts
into `scripts/cert/out/`. The CERT data itself is not committed (multi-GB); see that folder's
README to reproduce.

## Model Performance (Synthetic Test Set)

| Model | Precision | Recall | F1 |
|---|---|---|---|
| Isolation Forest | 0.81 | 0.76 | 0.78 |
| LSTM Autoencoder | 0.84 | 0.79 | 0.81 |
| XGBoost | 0.88 | 0.83 | 0.85 |
| **Ensemble (0.4/0.4/0.2)** | **0.91** | **0.86** | **0.88** |

These results are on synthetic data. Production use would require retraining on real labelled activity logs.

## Known Limitations

- Trained on synthetic data only. Production deployment requires real labelled activity logs.
- SQLite is sufficient for a POC; production would need PostgreSQL for write throughput at scale.
- The backend runs on HuggingFace Spaces, which has ephemeral storage (SQLite is wiped on container restart) and a 15-min sleep mode.
- The live feed uses 3-second HTTP polling. Production would use WebSockets or a message broker.
- SHAP attribution covers XGBoost only. Isolation Forest and LSTM produce scalar scores without a per-feature breakdown.
- There is no user authentication on the dashboard, so it isn't ready for production deployment.
- The LSTM Autoencoder is trained once at startup. Production would need periodic retraining as behaviour patterns evolve.

**Contact:** rehtrooper@gmail.com
