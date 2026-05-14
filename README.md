<p align="center">
  <img src="sentineliq/frontend/public/logo.png" width="80">
</p>

<h1 align="center">SentinelIQ</h1>
<p align="center">AI-Powered Insider Fraud Detection for Banking</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10-3776AB?style=flat-square&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white">
  <img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white">
  <img src="https://img.shields.io/badge/XGBoost-2.0-FF6600?style=flat-square">
  <img src="https://img.shields.io/badge/SHAP-Explainable_AI-DC2626?style=flat-square">
</p>

---

SentinelIQ monitors 50 bank employees in real time, builds a per-user behavioural baseline, and scores every incoming event through a 3-model ML ensemble. When behaviour deviates, analysts see the alert, the SHAP explanation, and the full evidence package — in under 30 seconds.

Built for the **iDEA 2.0 Hackathon — Union Bank of India** by **Team SIGMOID**.

---

## Live Demo

| | URL |
|---|---|
| Frontend | [sentineliq.vercel.app](https://sentineliq.vercel.app) |
| Backend API | [rak2315-sentineliq-backend.hf.space](https://rak2315-sentineliq-backend.hf.space) |

---

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend**
- Next.js 14 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion
- Recharts
- Lucide icons

</td>
<td valign="top" width="50%">

**Backend**
- FastAPI + Python 3.10
- scikit-learn (Isolation Forest)
- PyTorch (LSTM Autoencoder)
- XGBoost + SHAP
- SQLite (WAL mode)

</td>
</tr>
</table>

---

## Architecture

```
┌──────────────────────────────────────────┐
│           Next.js Frontend               │
│  Landing · Dashboard · Alerts · Cases    │
│  Polls /api/feed every 3s for live events│
└──────────────────┬───────────────────────┘
                   │ REST / HTTP
┌──────────────────▼───────────────────────┐
│           FastAPI Backend                │
│                                          │
│  Synthetic    Feature       Ensemble     │
│  Generator ──▶ Engineer ──▶ Scorer       │
│  (50 users)   (8 vectors)  IF+LSTM+XGB   │
│                                │         │
│          SQLite (WAL mode)     │         │
│          users · events ◀──────┘         │
│          alerts · metrics                │
└──────────────────────────────────────────┘

ML Ensemble
  Isolation Forest  (contamination=0.1)    → point anomaly
  LSTM Autoencoder  (PyTorch, seq=20)      → temporal drift
  XGBoost           (supervised)           → pattern score
  Weighted avg      (0.3 / 0.4 / 0.3)     → risk score 0–100
  SHAP TreeExplainer                       → top-5 feature contributions
```

---

## Setup

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
First run trains all three models and saves them to `models/saved/`. Subsequent starts load from disk in under 2 seconds.

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Team

**Team SIGMOID** — iDEA 2.0, Union Bank of India, 2026
