# SentinelIQ - Claude Code Context

## What This Is
AI-driven cybersecurity platform for real-time insider threat detection.
Domain: **Cybersecurity**. Banks/fintech are the flagship use case (the demo workforce is a bank).
Working prototype deployed on Vercel + HuggingFace Spaces.

## Framing Rules
- The project is a general cybersecurity product. Never name any event, competition, sponsor
  or organiser anywhere in the repo (frontend, backend, README, docs)
- Frame copy around: innovation, a working and scalable prototype, a real problem with practical
  value, technical depth, and user impact
- Demo video: https://youtu.be/ebN6C0Ewx7U
- Use normal hyphen dashes (-) only, never em dashes or en dashes
- No emojis or hype copy in the README or docs

## Live Deployment
- Frontend: https://sentineliq-gold.vercel.app/
- Backend API: https://rak2315-sentineliq-backend.hf.space
- GitHub: https://github.com/TeamSigmoidIdea20/sentineliq.git (public)

> New laptop / new session? Read `HANDOFF.md` first - it maps every file and lists setup + secrets.

## The Core Concept
SentinelIQ monitors privileged employee behaviour (demo: a bank workforce) in real time.
It builds a per-user behavioural baseline and detects deviations using a 3-model ML ensemble.
This is NOT a CSV dashboard. A synthetic event stream runs continuously in the background.
ML models score every event as it arrives. Alerts appear live on the dashboard.

## Stack - Non-Negotiable
- Frontend: Next.js 14 + TypeScript + Tailwind → deploy Vercel
- Backend: FastAPI (Python 3.10) → deploy HuggingFace Spaces (Docker, port 7860)
- ML: scikit-learn + PyTorch + XGBoost + SHAP
- DB: SQLite (WAL mode, aiosqlite + SQLAlchemy async)
- No paid APIs, no Kafka, no Redis, no Docker required locally

## Design Rules - Never Break These
- Background: #0D1117
- Card background: #161B22
- Border: #30363D
- Text primary: #F0F6FC
- Text muted: #8B949E
- Critical/High risk: #DC2626
- Medium risk: #D97706
- Low risk: #16A34A
- Amber: #D97706
- Hover: #1C2128
- Use inline style constants from `lib/tokens.ts` as `C` for ALL brand colors
- NEVER use Tailwind color classes for brand colors (unreliable)
- NO rounded-full except avatars
- NO purple, NO gradients, NO Inter font
- Sharp corners on all cards and buttons
- Border on all cards: 1px solid #30363D
- Font: Geist or system font stack

## ML Models
1. Isolation Forest (scikit-learn) - point anomaly detection, contamination=0.1, n_estimators=100
2. LSTM Autoencoder (PyTorch) - temporal sequence anomaly, seq_len=10, hidden_size=16
3. XGBoost - supervised scorer, n_estimators=60, max_depth=3, subsample=0.8, colsample_bytree=0.6
   - Shallower trees + column subsampling prevents single-feature dominance in SHAP
   - min_child_weight=2, gamma=0.1, reg_alpha=0.1 to resist overfitting on small labeled sets
   - score() probability capped at 0.88 (uncalibrated proba saturates toward 1.0 on imbalanced data)
4. Ensemble: weighted avg (IF: 0.4, LSTM: 0.4, XGB: 0.2) → risk score 0-100
5. SHAP: TreeExplainer on XGBoost → top 5 feature contributions per alert
   - Handles all return shapes: list (legacy), 2D ndarray, 3D ndarray (n_samples, n_features, n_classes)
   - Fallback triggers when ALL zero OR fewer than 3 features contribute meaningfully (non_trivial < 3)
   - Fallback uses actual feature values / per-feature expected scale (not synthetic random values)
   - Fallback scale: [2.0, 1.0, 1.5, 1.0, 1.0, 0.5, 0.5, 0.5] per feature
   - KNOWN ISSUE: Retraining on < 50 labeled samples causes single-feature SHAP dominance.
     Do not retrain until ≥50 analyst labels are collected.

## Synthetic Users
50 bank employees with roles: teller, analyst, manager, admin, treasury_officer
Each has: normal_login_hours, avg_daily_transactions, typical_departments, normal_locations
Fraud patterns - 6 types, cycled evenly in live stream:
- off_hours_login
- bulk_download
- cross_department_access
- privilege_escalation
- velocity_spike
- account_modification

## Live Event Loop (backend/main.py)
- 1 live event per 3 seconds (asyncio.sleep 3) - fast stream for a lively demo feed
- Every 15th live event is a forced fraud, cycling through all 6 patterns in order
  (approximately 7% fraud rate, matching training distribution)
- ALERT_THRESHOLD = 65 - single threshold for all events (fraud or normal)
- Historical training data: 2000 events over 48h generated at startup (unchanged)
- HF Spaces sleeps after ~15 min idle and the live event loop STOPS when sleeping.
  MITIGATED: an external uptime pinger (UptimeRobot-style) hits the backend every ~3 min to keep
  the container warm, so the live stream stays running. Restart still wipes the ephemeral DB.

## Simulate Scenarios (POST /api/simulate)
Four named scenarios map to fraud patterns:
- "bulk_exfiltration" → bulk_download pattern
- "privilege_escalation" → privilege_escalation pattern
- "off_hours_treasury" → off_hours_login pattern
- "account_tampering" → account_modification pattern

## Features Engineered Per User (rolling windows)
- login_hour_deviation
- transaction_velocity_ratio
- access_entropy (Shannon entropy of departments)
- download_volume_zscore
- location_mismatch (binary)
- privilege_use_ratio
- device_change_frequency
- off_hours_ratio

## API Endpoints (all implemented)
GET  /health
GET  /ping
GET  /api/stats                        # users, alerts_24h, high_risk, FP rate, events_24h, coordinated patterns
GET  /api/feed                         # last 20 live events, polled every 3s
GET  /api/alerts                       # ?risk_level=&status=&time_range=&page=&page_size=&min_score=
GET  /api/alerts/{id}                  # full SHAP explanation
POST /api/alerts/{id}/resolve
POST /api/alerts/{id}/dismiss
POST /api/alerts/{id}/label            # TP/FP for active learning
POST /api/alerts/{id}/note             # free-text analyst note
GET  /api/alerts/{id}/export           # JSON evidence package download
GET  /api/alerts/{id}/peer-comparison  # user vs same-role peers on 4 metrics
GET  /api/users
GET  /api/users/{id}                   # 30-day risk history + recent alerts
GET  /api/users/{id}/events            # ?before=&limit= - event timeline
POST /api/users/{id}/restrict          # set restricted=1 in DB
POST /api/users/{id}/escalate          # set escalated=1 in DB
GET  /api/cases                        # alerts grouped into kill-chain cases (≥3 alerts, 24h window)
GET  /api/intelligence                 # P/R/F1, model agreement, 7d volume, FP trend, anomaly rate
POST /api/simulate                     # {"scenario": "bulk_exfiltration"|"privilege_escalation"|"off_hours_treasury"|null}
POST /api/retrain                      # retrain XGBoost on labeled alerts; returns P/R/F1 from validation set
GET  /api/debug/shap                   # diagnostic: stored vs recomputed SHAP for latest alert

## Pages (all built)
/ → Landing page (static, professional)
/dashboard → Overview: live feed + 4 stat cards + hero alert banner + coordinated activity banners + recent alerts (risk ≥ 50 only) + simulate dropdown
/dashboard/alerts → Queue rail (320px left) + inline detail panel (right). Resolve/dismiss removes alert from queue. Simulate injects and re-polls.
/dashboard/users → User profiles: search, watchlist, risk history chart, SHAP from latest alert, restrict/escalate actions
/dashboard/cases → Kill Chain Cases: case list (360px) + stitched timeline detail with typed event tags
/dashboard/intelligence → Model Intelligence: 3 model cards, P/R/F1, training log, alert volume chart, anomaly distribution bars, department risk bars, FP trend chart

## Dashboard Layout (app/dashboard/layout.tsx)
Minimal wrapper applied to all dashboard pages - provides:
- ⌘K / Ctrl+K → opens CommandPalette
- G + H/A/C/I/U → navigate to Home/Alerts/Cases/Intelligence/Users (800ms window)
- Polls open alerts every 10s for the palette's alert search
- Dispatches `sentinel:cmdk` custom event (triggered by Sidebar search button)
Does NOT replace the Sidebar - each page still imports Sidebar directly.

## Components
- CommandPalette.tsx - ⌘K overlay: navigation actions + open alerts (risk ≥ 50), keyboard nav
- Sidebar.tsx - 240px nav rail with search button (⌘K trigger) at top
- AlertPanel.tsx - alert detail panel with SHAP, stitched timeline (typed tags), peer comparison
  - `inline` prop: renders as fill-height div instead of fixed overlay (used on alerts page)
  - Panel width: 520px overlay, or fills container when inline
  - Timeline typed tags: Auth / Data / Export / Anomaly / Perm Δ / Alert (color-coded)
- SHAPChart.tsx - bidirectional waterfall: monospace feature names, bar track, SHAP value column
  - Header: "Feature attribution" + "SHAP · XGBoost · TreeExplainer"
  - Axis labels: "← reduces risk" / "increases risk →"
  - Summary line: top driver, its value, and contribution
- IntelligenceCharts.tsx - recharts: alert volume line, anomaly distribution horizontal bars, dept risk bars, FP trend line
  - NO model agreement donut (removed - was cluttered)
- StatCard.tsx, LiveFeed.tsx, RiskBadge.tsx, UserTable.tsx - unchanged

## Database Models (SQLite WAL)
- UserModel: id, name, role, department, risk_score, last_seen, location, restricted, escalated
- EventModel: id, user_id, user_name, timestamp, event_type, department, location, hour, device, download_mb, tx_count, features_json, fraud_type, is_fraud, description, risk_score
- AlertModel: id, user_id, user_name, timestamp, risk_score, fraud_type, model_scores_json, shap_values_json, status, label, event_id, notes, label_updated_at
- ModelMetricModel: id, created_at, model_name, precision_before, precision_after, recall, f1, labels_used

## Retrain Logic
- Requires ≥10 labeled alerts (TP/FP) to trigger XGBoost retrain
- Computes P/R/F1 on held-out validation set: last 400 events with features_json
- Saves updated model to disk (models/saved/xgboost_model.joblib)
- Writes metrics to model_metrics table
- Frontend streams a terminal-style training log during the operation

## Critical Rules
- Backend starts with pre-trained models - NO cold start on first request
  (checks models/saved/ on startup, trains fresh if not found)
- All dashboard numbers come from real backend calls - nothing hardcoded
- SHAP values must be real output from the actual model
- Live feed must actually update - poll /api/feed every 3s
- Frontend works with loading skeletons if backend is slow
- CORS configured for both localhost and Vercel domain (allow_origin_regex for *.vercel.app)
- Complete files only - no stubs, no TODOs, no placeholder comments
- Use `C` token object from lib/tokens.ts for ALL colors - never raw hex strings in JSX

## File Structure (current)
sentineliq/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                         - landing page
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       ├── layout.tsx                   - ⌘K palette + keyboard shortcuts wrapper
│   │       ├── page.tsx                     - overview with live feed + recent alerts (≥50)
│   │       ├── alerts/page.tsx              - queue rail + inline AlertPanel
│   │       ├── users/page.tsx               - user monitoring
│   │       ├── cases/page.tsx               - kill chain + stitched timeline
│   │       └── intelligence/page.tsx        - model intelligence + training log
│   ├── components/
│   │   ├── CommandPalette.tsx               - ⌘K search/nav overlay
│   │   ├── Sidebar.tsx                      - 240px nav + search trigger button
│   │   ├── StatCard.tsx
│   │   ├── LiveFeed.tsx
│   │   ├── AlertPanel.tsx                   - detail panel, inline mode, stitched timeline
│   │   ├── SHAPChart.tsx                    - bidirectional bars, summary line
│   │   ├── RiskBadge.tsx
│   │   ├── UserTable.tsx
│   │   └── IntelligenceCharts.tsx           - volume, anomaly dist, dept risk, FP trend
│   └── lib/
│       ├── api.ts                           - typed API client
│       └── tokens.ts                        - C color constants + riskColor/riskLevel helpers
└── backend/
    ├── main.py                              - FastAPI app, all endpoints, slow event loop
    ├── database.py                          - SQLAlchemy async models + init_db migrations
    ├── schemas.py                           - Pydantic request/response models
    ├── requirements.txt
    ├── data/
    │   ├── synthetic_generator.py           - 50-user stream, generate_batch/generate_one/generate_forced_fraud
    │   └── feature_engineering.py          - 8 rolling-window features
    └── models/
        ├── isolation_forest.py
        ├── lstm_autoencoder.py
        ├── xgboost_model.py                 - TreeExplainer, SHAP fallback on < 2 non-trivial features
        ├── ensemble.py
        └── saved/                           - joblib + .pt files, created on first run

## Known Remaining Issues
- AlertTable.tsx removed (was unused - queue rail replaced it).
- Activity heatmap on users page: not yet implemented (future session).
- Decision timer / MITRE ATT&CK chips on alert detail: not yet implemented (future session).
- SHAP shows only 1 non-zero feature bar when XGBoost was retrained on too few samples (< 50).
  The fallback runs but feature vectors themselves are near-zero if user has no rolling-window history.
  Root fix: accumulate more events before retraining.

## HuggingFace Deployment Reality - Why Things Break

Yes, most runtime issues are caused by HF Spaces' limitations, not the code itself.

### Structural problems with HF Spaces

**1. Ephemeral SQLite (most impactful)**
The container filesystem is wiped on every restart. This means:
- All live events, analyst actions (labels/notes/resolve), and retrains are LOST on restart
- Seed runs fresh on each boot (SEED_VERSION check handles this correctly)
- The "live" monitoring experience resets to zero every time HF scales the container down
- Saved ML models (`models/saved/`) are also wiped - backend retrains from scratch on restart

**2. Sleep mode kills the live stream**
HF Spaces sleeps after ~15 min of no HTTP traffic. When sleeping:
- `_event_loop()` is not running - no new events being generated
- The feed shows stale data from before sleep
- First request wakes it up (30-60s cold start)
- For a live fraud monitoring demo this is fatal - the "real-time" nature disappears

**3. Binary file restriction (new)**
HF now blocks git pushes containing PNG/binary files (their xet storage requirement).
The full repo includes `frontend/public/hero-bg.png` and `ops-room.png` → push rejected.
Must use subtree push:
```bash
git push hf "$(git subtree split --prefix backend main)":main --force
```

**4. Git divergence**
The HF Space web UI lets you push directly via browser, diverging from GitHub.
Always use `--force` when pushing the backend subtree.

**5. Timezone/clock drift**
Old HF containers used `datetime.now()` (local time). HF servers run in various AWS regions
(some UTC+8 or UTC+10). This caused all seed timestamps to appear 8-10 hours in the FUTURE
from the browser's perspective. Always use `datetime.utcnow()` everywhere in backend.

### What this means for the demo
- Always demo with a freshly-restarted backend (not one that's been idle)
- Don't claim persistent analyst state - labels/notes reset on restart
- The "live feed" only shows events from the current container session
- SEED_VERSION = "v3" ensures the seed state is at least deterministic per boot

### Better deployment alternatives (later)
- **Railway** or **Render** - persistent disk volumes, no binary restrictions, proper always-on free tier
- **Fly.io** - persistent volumes, faster cold start, SQLite survives reboots
- **Supabase** - replace SQLite with Postgres for real persistence (would need SQLAlchemy URL change)
For the POC, HF is acceptable as long as the demo is done with an active backend.

## Synthetic Data Pipeline - Known Issues and Design

### Seed function (`seed_demo_state`)
Runs once per backend boot (version-gated by `SEED_VERSION = "v3"`).
```
300 normal background events (random.seed(42) for determinism)
+ 3 fraud chains (3 events each, offsets: [360,120,20], [420,180,45], [480,240,30] min)
+ 12 standalone alerts (spread over last 20h)
= ~315 events, ~18 alerts, ~3 cases
```
Version gate: if old seed exists without v3 marker → `_clear_seed_data()` wipes everything and reseeds.

### Rolling-window feature engineering
**Root cause of near-zero SHAP**: all 8 features are rolling-window computations over the user's
recent event history. If a user has very few prior events (or the rolling window is empty), most
features default to 0. A new or low-activity user's feature vector = `[0, 0, 0, 0, 0, 0, 0, 0]`.
The 300 normal background events help but only for users who appear in that batch.

### Simulator (`POST /api/simulate`)
Injects a SINGLE forced-fraud event (`_force_alert=True`) above ALERT_THRESHOLD, which guarantees:
- Exactly 1 alert created for the chosen pattern
- A case is linked only if that user already had a prior alert within 24h
  (`_update_or_create_case` needs a 2nd alert to open a case) - simulate alone does NOT guarantee a new case
The response includes `alert_id`, `case_id` (may be null), and `risk_score` for immediate UI linkage.

### Case creation logic
`_update_or_create_case(user_id, alert, db)` replaces the old kill-chain batch approach:
- On 1st alert: no case (not enough evidence)
- On 2nd+ alert within 24h: create/append to open case
- Uses `occurred_at` (event time) not `ingested_at` (processing time) for case timestamps

## CERT Benchmark Validation & Optional Calibration

Validated synthetic behaviour against the **CMU CERT r4.2** insider-threat benchmark
(the standard academic dataset; no real banking-insider dataset is public). The raw CERT
data is NOT in git (multi-GB) - it lives under `<project_root>/datasets/cert/` (sibling of
`sentineliq/`). Tooling is committed under `sentineliq/scripts/cert/` and finds the data via
the `CERT_DATA_DIR` env var (default `<project>/datasets/cert`).

- `scripts/cert/build_cert_profile.py` → reads CERT `logon.csv`, writes `backend/data/cert_profile.json`
  (24 real login-hour weights + night_rate ~0.0448).
- `scripts/cert/validate_against_cert.py` → compares synthetic vs CERT distributions, writes charts to `scripts/cert/out/`.
- `scripts/cert/cert_to_ingest.py` → replays a real CERT malicious insider (default `CAH0936`)
  through `POST /api/ingest`; `--dry-run` is default (no network), `--send --url ...` posts.

Finding: both are business-hours-dominant with rare night activity (validates off-hours signal);
CERT keeps ~4.5% benign night background, our default baseline ~0% (idealised).

**Tier 1.5 - optional CERT calibration (DEFAULT OFF).** `data/synthetic_generator.py` gained
`_load_cert_profile()` + a guarded block in `_normal_event`. It is gated on the env var
`SENTINELIQ_CERT_PROFILE` (path to a profile JSON). UNSET (default) → generator behaves
byte-for-byte as before. SET (e.g. to bundled `backend/data/cert_profile.json`) → login hours
are sampled from CERT's real distribution, adding ~4.5% realistic night activity. To enable on
HF, set `SENTINELIQ_CERT_PROFILE=data/cert_profile.json` in the Space env (then restart).

NOTE: these changes are BACKEND/tooling only - they do NOT affect the Vercel frontend. Pushing
them will not visibly change the Vercel site.

## Git Push Strategy

Two separate remotes with different content:

```bash
# Push frontend + backend to GitHub (source of truth)
git push origin main

# Push ONLY backend/ to HuggingFace (binary-file restriction workaround)
git push hf "$(git subtree split --prefix backend main)":main --force
```

The `--force` is always required for HF because:
- HF web UI pushes cause divergence
- Subtree commits don't match full-repo commits linearly

Vercel deploys automatically from GitHub on every push to `main` (watches `frontend/` changes).
HF rebuilds automatically when the `hf` remote receives a push.

## Potential Future Enhancements
- Activity heatmap: 24h × 7d grid in user profile (from real /api/users/{id}/events data)
- Decision timer: live elapsed counter since alert creation in AlertPanel
- MITRE ATT&CK chips: map fraud_type → technique (T1078, T1530, etc.) in AlertPanel
- App shell upgrade: topbar with live UTC clock + threat level chip + statusbar (28px)
- Risk gauge SVG arc: replace score bar in user profile header

## Project Status
- Live demo: sentineliq-gold.vercel.app ✓
- Demo video: https://youtu.be/ebN6C0Ewx7U ✓
- GitHub README: README.md ✓

## Demo Checklist (before presenting)
1. Wake the backend: visit https://rak2315-sentineliq-backend.hf.space/health
   Wait for `{"status":"ok"}` response (up to 60s on cold start)
2. Verify seed data loaded: `/api/cases` should return ≥3 cases
3. Run a simulate from the dashboard to show the live injection flow
4. Keep the tab open during the demo - closing it lets HF sleep again
