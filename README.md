# SentinelIQ — Real-Time Insider Fraud Detection

SentinelIQ is a real-time behavioural risk engine for internal and privileged banking users. It correlates user activity across core banking, treasury, loan systems, and customer databases, detects early fraud signals with a 3-model ensemble, explains every alert with SHAP, and gives investigators a case-ready workflow before customer or institutional loss occurs.

Built for the **iDEA 2.0 Hackathon — Union Bank of India** by **Team SIGMOID**.

---

## Setup

### Backend (FastAPI + Python 3.10)

```bash
cd sentineliq/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On first start, the backend generates 2000 synthetic training events and trains all three ML models, then saves them to `models/saved/`. Subsequent starts load from disk in under 2 seconds.

### Frontend (Next.js 14)

```bash
cd sentineliq/frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                │
│  Landing → Dashboard → Alerts → Cases → Intelligence → Users│
│  Live feed polls /api/feed every 3s                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │  Synthetic   │   │   Feature    │   │    Ensemble     │ │
│  │  Generator   │──▶│  Engineer    │──▶│    Scorer       │ │
│  │  (50 users)  │   │  (8 vectors) │   │  IF+LSTM+XGB    │ │
│  └──────────────┘   └──────────────┘   └────────┬────────┘ │
│                                                  │          │
│  ┌───────────────────────────────────────────────▼────────┐ │
│  │              SQLite (WAL mode)                         │ │
│  │   users · events · alerts · model_metrics              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

ML Pipeline
  Isolation Forest  (contamination=0.1)   → point anomaly score
  LSTM Autoencoder  (PyTorch, seq_len=20) → temporal drift score
  XGBoost           (supervised)          → pattern score
  Ensemble          (IF×0.3 + LSTM×0.4 + XGB×0.3) → risk 0–100
  SHAP TreeExplainer → top-5 feature contributions per alert
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Model status, startup mode, version |
| GET | /api/stats | Dashboard KPIs + coordinated patterns |
| GET | /api/feed | Last 20 live events (poll every 3s) |
| GET | /api/alerts | Filterable alert list (risk/status/time/page) |
| GET | /api/alerts/{id} | Full alert with SHAP values |
| POST | /api/alerts/{id}/resolve | Mark resolved |
| POST | /api/alerts/{id}/dismiss | Dismiss alert |
| POST | /api/alerts/{id}/label | Label TP or FP |
| POST | /api/alerts/{id}/note | Save case note |
| GET | /api/alerts/{id}/export | Evidence package JSON |
| GET | /api/alerts/{id}/peer-comparison | User vs role-peer metrics |
| GET | /api/users | All monitored users with risk trend |
| GET | /api/users/{id} | User profile + 30-day risk history |
| GET | /api/users/{id}/events | Event timeline before a timestamp |
| GET | /api/cases | Kill chain case clusters (24h windows) |
| GET | /api/intelligence | Precision/recall/F1, volume, breakdown |
| POST | /api/simulate | Inject one synthetic event |
| POST | /api/retrain | Fine-tune XGBoost on analyst labels |

---

## 90-Second Demo Flow

```
1.  Landing page — read headline (10s)
2.  Click "View Live Demo" — dashboard loads (5s)
3.  Watch live feed — point out real-time updates (15s)
4.  Click a HIGH risk alert — SHAP panel opens (10s)
5.  Point out peer comparison and timeline (15s)
6.  Click Simulate Attack — new alert fires live (15s)
7.  Navigate to Cases page — show kill chain (10s)
8.  Navigate to Intelligence page — show metrics (10s)
9.  Close on governance strip (10s)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, framer-motion, lucide-react, recharts |
| Backend | FastAPI, Python 3.10, SQLAlchemy (async), aiosqlite |
| ML | scikit-learn, PyTorch, XGBoost, SHAP |
| Database | SQLite (WAL mode) |
| Hosting | Vercel (frontend) · Render (backend) |

---

## Fraud Patterns Detected

| Pattern | Trigger |
|---------|---------|
| off_hours_login | Login between 01:00–04:00 or 22:00–23:00 |
| bulk_download | Data export >800 MB |
| cross_department_access | Access to department outside user's normal scope |
| privilege_escalation | Elevated privilege use atypical for role |
| velocity_spike | Transaction count 4–8× baseline |

## Behavioural Features (per user, rolling window)

`login_hour_deviation` · `transaction_velocity_ratio` · `access_entropy` · `download_volume_zscore` · `location_mismatch` · `privilege_use_ratio` · `device_change_frequency` · `off_hours_ratio`

---

**Team SIGMOID** — iDEA 2.0, Union Bank of India, 2025
