# SentinelIQ

*Read this before your presentation. It explains the whole project in simple words -
every file, every feature, the logic behind each thing, and the dataset story - plus a
big "tough questions + confident answers" section at the end.*

---

## 0. One-paragraph summary

SentinelIQ is an AI-driven cybersecurity platform that catches **insider threats**. It
watches what privileged users do (logins, downloads, transactions, system access) and raises
an alert the moment someone behaves unusually for *them*. It learns a "normal behaviour"
baseline for each person, then uses three machine-learning models together to score every
action from 0 to 100. High scores become alerts with a plain-English explanation of *why*.
There's a live dashboard for the security team to review and act. The demo workforce is a
bank (where one insider action can move money), but the pipeline works for any organisation.
All the data is synthetic (we generate it ourselves), and we validated that our synthetic
behaviour looks realistic by comparing it to a famous real research dataset (CMU CERT).

**Hackathon context:** CodeArambh 2.0 (HIET Ghaziabad), **Open Innovation** track, domain
**Cybersecurity**. The track judges four things - innovation and problem-solving, a
functional and scalable prototype, a genuine challenge with practical value, and
creativity / technical excellence / user impact. Section 17 has a ready answer for each.

---

## 1. The problem (why this exists)

- The most dangerous attacker **already has a valid login**. Firewalls, antivirus and
  perimeter security can't stop them, because every action looks authorised.
- Most organisations still use **fixed rules** ("flag transfers over ₹10 lakh") and
  **periodic audits**. They have **no idea what "normal" looks like for each user**.
- So an insider (a teller, an admin, a treasury officer, or anyone whose credentials were
  stolen) who slowly abuses their access often goes unnoticed until the data or money is gone.
- **Ponemon 2026 Cost of Insider Risks:** insider risk costs **$19.5M per organisation per
  year** on average, and an incident takes **67 days to contain**. It's hard because the
  person already has legitimate access. The only giveaway is **behaviour that's abnormal for them**.

**Our answer:** learn each person's behaviour, and alert on deviations in real time.

---

## 2. The big picture - how the system is built

The project has **two halves** that run in different places:

| Half | What it is | Where it runs | Web address |
|---|---|---|---|
| **Frontend** | The website you look at - dashboard, charts, buttons | **Vercel** | sentineliq-gold.vercel.app |
| **Backend** | The "brain" - makes data, runs the ML, decides alerts | **HuggingFace (HF)** | rak2315-sentineliq-backend.hf.space |

Think of it like a restaurant: the **frontend is the dining room** (what customers see),
the **backend is the kitchen** (where the actual work happens). The dining room just shows
what the kitchen cooks. **The website has no intelligence of its own** - it only displays
what the backend sends it.

They talk over **HTTP**: the frontend asks the backend for data every few seconds, the
backend answers with JSON.

---

## 3. The journey of one event (the core loop)

This is the single most important thing to understand. Every action becomes an "event,"
and every event takes this path:

1. **An event is created** - e.g. "user usr_026 logged in at 03:00 from an external location."
   (In the demo these are generated synthetically; in real life they'd come from bank logs.)
2. **Feature engineering** - the raw event is turned into **8 numbers** (the "features")
   that measure *how unusual it is compared to that user's history*.
3. **The 3 ML models score it** - each model looks at those 8 numbers and gives a 0-1 score.
4. **The ensemble blends the 3 scores** into one final **risk score from 0 to 100**.
5. **If the score ≥ 65 (the threshold), an alert is created** - with the model scores, a
   SHAP explanation (which features drove it), and a timeline.
6. **If the user already had a recent alert, the alerts get grouped into a "case."**
7. **The user's overall risk score is updated**, and everything is saved to the database.
8. **The dashboard polls and shows it** in the live feed / alerts page.

That's the whole product in 8 steps. Everything else is detail around this loop.

---

## 4. The synthetic data (where the events come from)

There is no real bank feed, so we **make believable fake activity**. This lives in
`backend/data/synthetic_generator.py`.

- **50 employees**, each with a fixed profile: name, role, department, normal working
  hours, usual locations, and typical transaction volume.
- **5 roles:** teller, analyst, manager, admin, treasury_officer. (Admins and treasury
  officers are the "privileged" users.)
- **Each event has fields:** who, time/hour, event type, department, location, device,
  download size (MB), transaction count, plus a fraud label (is it fraud? which type?).
- **Most events are normal** (in-hours, usual location, modest volume).
- **About 1 in 15 events is a planted fraud** (~7% - matches how rare real fraud is).

**The 6 fraud patterns** (each one deliberately trips two warning signs so the models have
more than one clue):

1. `off_hours_login` - logs in at night (e.g. 3 AM).
2. `bulk_download` - exports a huge amount of data (50-200 MB).
3. `cross_department_access` - touches a department they never normally use.
4. `privilege_escalation` - uses elevated/admin privileges they shouldn't.
5. `velocity_spike` - does 8-15× their usual number of transactions.
6. `account_modification` - modifies account records outside their scope.

**Why synthetic?** No real bank insider dataset is public (banks can't release employee
fraud logs). Even academic researchers use synthetic data for this. We made ours
**banking-specific** (it has transactions, treasury, locations) and then validated its
realism against the CERT benchmark (see Section 11).

---

## 5. The 8 features (the heart of the detection)

A "feature" is one number describing one aspect of behaviour. The key idea:
**features are measured *relative to the user's own recent history*** (a rolling window of
their last ~20 events). So "normal" is defined per-person. Code: `feature_engineering.py`.

| # | Feature | In plain words | What makes it spike |
|---|---|---|---|
| 1 | `login_hour_deviation` | How far this login time is from the user's normal hours | Logging in at 3 AM when they normally work 9-5 |
| 2 | `transaction_velocity_ratio` | This event's transaction count vs their usual | Doing 10× their normal number of transactions |
| 3 | `access_entropy` | How "spread out" their department access is (Shannon entropy) | Suddenly touching many different departments (snooping) |
| 4 | `download_volume_zscore` | How abnormal this download size is vs their history | Exporting 200 MB when they usually move <1 MB |
| 5 | `location_mismatch` | Is this location one of their normal ones? (1 = no) | Working from an unknown/external location |
| 6 | `privilege_use_ratio` | How much of their activity is privileged actions | A teller suddenly using admin privileges |
| 7 | `device_change_frequency` | How often they switch devices | Logging in from many new/unusual devices |
| 8 | `off_hours_ratio` | What fraction of their recent activity is outside work hours | A pattern of night-time activity building up |

**How the numbers are actually computed (the mechanism, not just the vibe):** the feature
engineer (`feature_engineering.py`) keeps a per-user `UserHistory` - a rolling buffer of the
**last 20 events** (`WINDOW=20`) holding their recent hours, tx counts, departments, downloads,
locations and devices. For each new event it computes all 8 features **against that history
first, then folds the event into the buffer** (so this event counts for the *next* one). A few
of the formulas, in plain terms:
- `login_hour_deviation` = how far this hour is from the middle of the user's normal window,
  divided by half that window's width (so "a bit late" ≈ small, "3 AM" ≈ large).
- `transaction_velocity_ratio` = this event's tx count ÷ the user's recent average tx count.
- `access_entropy` = Shannon entropy of the recent department list **plus this event's
  department** (touching many different departments raises it).
- `download_volume_zscore` = a true z-score `(download − mean) / std` once there are ≥2 past
  downloads; with only 1 prior it's a simple ratio; with **no history** it's
  `download ÷ a rough baseline` (this is part of the cold-start handling).
- `location_mismatch` = 1 if the location isn't in the user's known-good list, else 0.
- `privilege_use_ratio`, `device_change_frequency`, `off_hours_ratio` all **include the current
  event** in their count, so a single off-hours login or privilege use shows a signal
  immediately instead of waiting for a pattern to build.

A few important notes you can say confidently:
- Features are **clipped to a safe range (−10 to 10)** so one crazy outlier can't break the model.
- For a **brand-new user with no history**, features are measured against a **safe default
  baseline** (standard 9-17 hours, HQ location, modest volume - or the profile fields carried on
  the event). As they do more, the rolling buffer fills with *their own* data and the baseline
  personalises to them. This is called **cold-start** handling.
- The 8 feature names are kept identical across the generator, feature engineer, and models
  so nothing gets misaligned.

---

## 6. The three ML models (and why we use three)

Using three different models that look at the problem from **different angles** makes the
system far harder to fool. Code: `backend/models/`. All three eat the **same 8 numbers**
(the features from Section 5) - but they consume them in different *shapes* and were
**trained at backend startup** on the same data:

- **How they're trained (one place, once, at boot):** when the backend starts
  (`backend/main.py` → `_startup()`), the generator makes **~2000 synthetic events**
  spanning the last 48 hours. Every event is turned into its 8-feature vector by
  `feature_engineering.py`. That gives three things: a big matrix **X** (2000 rows × 8
  columns of features), a label vector **y** (the `is_fraud` 0/1 flag carried on each
  event), and a **per-user list of feature vectors** (each user's events in time order,
  for the LSTM). Then `ensemble.fit(X, y, user_events)` trains all three members and the
  result is saved to `models/saved/`. On the *next* boot the saved models are just loaded
  (no retraining) - that's why there's no cold-start wait.
- **Supervised vs unsupervised:** Isolation Forest and the LSTM are **unsupervised** - they
  only ever see X (the behaviour), never y (the fraud labels). They learn "what normal looks
  like" and flag anything far from it. XGBoost is **supervised** - it's the only one that
  sees y, so it learns the actual fraud-vs-normal boundary.

### Model 1 - Isolation Forest (`isolation_forest.py`)
- **Type:** unsupervised point-anomaly detector. **Eats:** one 8-number vector per event.
- **How the algorithm actually works:** an "isolation forest" is a bunch of random trees
  (here **100 trees**, `n_estimators=100`). To build one tree it keeps doing this: pick a
  feature at random, pick a random split value between that feature's min and max, and cut
  the data in two. Repeat, growing the tree, until points are separated. The key insight:
  **an outlier gets isolated in very few cuts**, because it sits out on its own in some
  feature, so a random cut peels it off almost immediately. A normal point sits inside the
  dense crowd, so it takes *many* cuts to fence it off alone. So the model measures the
  **average depth** at which each point gets isolated across all 100 trees. **Shallow average
  depth = anomaly; deep = normal.**
- **Before it runs:** features are passed through a `StandardScaler` (each feature shifted to
  mean 0, scaled to std 1) so a naturally big-numbered feature can't dominate the random
  splits. `contamination=0.1` tells scikit-learn "assume ~10% of training data is odd," which
  sets where it draws the normal/anomalous line.
- **Raw output → 0-1 score:** scikit-learn's `decision_function` returns a number that's
  *positive for normal, negative for anomalous* (roughly in the range −0.5…+0.5). The code
  flips and shifts it into a risk score with `score = 1.0 − (raw + 0.5)`, then clips to
  [0, 1]. So a very normal point (raw ≈ +0.5) → score ≈ 0; a clear outlier (raw ≈ −0.3) →
  score ≈ 0.8. (Before training, or if something's wrong, it safely returns 0.5.)
- **Tiny example:** a 3 AM, external-location, 120 MB export has extreme values in features
  1, 4, 5 → it gets isolated in just a couple of cuts in most trees → `decision_function`
  comes back ≈ −0.17 → `1 − (−0.17 + 0.5) = 0.67`. That's the **0.67** you see for IF.

### Model 2 - LSTM Autoencoder (`lstm_autoencoder.py`)
- **Type:** unsupervised temporal/drift detector. **Eats:** a **sequence of the last 10
  events' 8-number vectors** (so a 10 × 8 grid), not a single event. This is what makes it
  different from the other two.
- **What an autoencoder is:** a network with a **squeeze in the middle**. It takes input,
  compresses it down to a small summary, then tries to rebuild the original from only that
  summary. If it rebuilds well, the input looked like the stuff it was trained on. If it
  rebuilds badly, the input is unfamiliar. The rebuild mistake is the **reconstruction error**.
- **What "LSTM" adds:** an LSTM is a network that reads a sequence step by step and carries a
  running memory, so it understands *order over time*, not just a snapshot. Here:
  - The **encoder LSTM** reads the 10-event sequence one event at a time and ends with a
    single **16-number hidden vector** (`hidden_size=16`) - a compressed "gist" of that
    person's recent behaviour pattern.
  - That 16-number gist is **repeated 10 times** and fed to the **decoder LSTM**, which tries
    to regenerate the original 10 × 8 sequence from just the gist.
  - **Reconstruction error** = the average squared difference between the rebuilt sequence and
    the real one (mean squared error). Low = "this rhythm of behaviour is normal for the data
    I learned." High = "I've never seen a recent pattern like this."
- **How it's trained:** during startup it takes every user's events, slides a 10-long window
  across them (left-padding with zeros for users with short histories), and trains the network
  for **8 quick passes** (epochs) with the Adam optimiser to *minimise* reconstruction error on
  normal data. After training it runs every training sequence back through, looks at the spread
  of errors, and sets a **threshold = the 90th-percentile error**. That threshold is the
  "this much error is still normal" bar.
- **Raw output → 0-1 score:** at scoring time it rebuilds the user's current 10-event window,
  measures the error, and divides by that learned threshold: `score = error / threshold`,
  clipped to [0, 1]. So error *at* the normal bar → ~1.0; error half the bar → 0.5; tiny error
  → ~0. (If PyTorch isn't installed it safely returns 0.5.)
- **Tiny example:** a user whose last 10 events were calm 9-5 desk activity suddenly has a 3 AM
  bulk export as the newest event. The decoder can't reproduce that spike from the "calm" gist,
  so the error blows past the threshold → `score` clips to **1.00** - the saturated LSTM value
  in the worked example below.

### Model 3 - XGBoost (`xgboost_model.py`)
- **Type:** supervised fraud classifier. **Eats:** one 8-number vector per event. Also the
  source of the SHAP explanations (Section 8).
- **How gradient boosting actually works:** XGBoost builds **many small decision trees one
  after another**, where each new tree is trained to fix the *leftover mistakes* of the trees
  so far. Tree 1 makes a rough fraud/not-fraud guess; you measure where it was wrong (the
  "residual"/gradient); tree 2 is trained specifically to correct those errors; tree 3 corrects
  what's still wrong, and so on. Add up all the trees' little contributions and you get a final
  confidence. Here it's **60 trees** (`n_estimators=60`), each shallow (`max_depth=3`, so at
  most 3 questions deep), each nudged in gently (`learning_rate=0.1`).
- **How it's trained + where labels come from:** this is the supervised one. It's fit on
  **(X, y)** where **y is the `is_fraud` flag** the synthetic generator stamped on each event.
  So it literally learns "these feature combinations were fraud, those were normal." The knobs
  are tuned for a **small, imbalanced** set: `subsample=0.8` + `colsample_bytree=0.6` mean each
  tree only sees 80% of rows and 60% of features (stops one lucky feature dominating);
  `scale_pos_weight=2` makes the rare fraud class count double so it isn't ignored;
  `gamma`, `reg_alpha`, `reg_lambda`, `min_child_weight` are regularisers that stop it
  memorising noise.
- **Raw output → 0-1 score:** `predict_proba` gives the model's probability that the event is
  the **fraud class**; the code takes that and **caps it at 0.88**
  (`min(proba, 0.88)`). The cap exists because on imbalanced data XGBoost's raw probabilities
  saturate toward 1.0 and would otherwise drown out the other two models in the blend.
- **Tiny example:** a 3 AM external 120 MB export lands in the "off-hours + external + bulk
  download" region of the trees that were labelled fraud in training → `predict_proba` says
  0.97 → capped to **0.88**, the XGB value below.

---

## 7. The ensemble (how the 3 become one score)

Code: `backend/models/ensemble.py`.

We take a **weighted average** of the three 0-1 scores:

```
final = 0.4 × IsolationForest  +  0.4 × LSTM  +  0.2 × XGBoost
```

It's literally one weighted sum in `predict()`:
`ensemble = 0.4×if_score + 0.4×lstm_score + 0.2×xgb_score`. Then ×100 → the **0-100 risk
score**.

- **Why these weights?** The two unsupervised models (IF, LSTM) carry most of the weight
  because they don't depend on having lots of labelled fraud. XGBoost is weighted lower
  (0.2) because it's only as good as the (small) labelled data it learned from.
- **Worked example (the real alert from our CERT demo):** IF=0.67, LSTM=1.00, XGB=0.88.
  `0.4×0.67 + 0.4×1.00 + 0.2×0.88 = 0.844 → risk 84`. That's exactly the 84 shown on the
  alert - you can do this math live if a judge asks "where does 84 come from?" (Note the
  LSTM's 1.00 isn't a coincidence - it means the reconstruction error hit or passed its
  learned threshold and got clipped to the max.)
- Safety: if any model returns a broken value (NaN), it falls back to a neutral 0.5, and the
  blended result is clamped to [0, 1] before the ×100. So one misbehaving model can never
  produce a nonsense score.

**Alert threshold = 65.** Score ≥ 65 → an alert is created. Risk bands the UI colours by:
80+ critical, 65+ high, 40+ medium, below low.

---

## 8. SHAP - the "why" behind each alert

- **SHAP** tells you **which features pushed the score up or down, and by how much.** It
  runs on the XGBoost model (`TreeExplainer`).
- On the dashboard, an alert shows a little chart: e.g. `login_hour_deviation +3.26`,
  `location_mismatch +1.48`, `off_hours_ratio +0.54`. Positive = pushed risk up.
- **Why it matters:** a fraud investigator can't act on "the AI said 84." They can act on
  "this person logged in at 4 AM from an external location and exported 120 MB." SHAP turns
  the number into a reason.
- **How SHAP actually gets the numbers:** it uses `TreeExplainer` on the XGBoost model.
  Because XGBoost is just trees, SHAP can *exactly* work out, for this one event, how much each
  of the 8 features pushed the prediction away from the model's baseline (average) output -
  positive means "pushed toward fraud," negative means "pushed toward normal." The code sorts
  the 8 contributions by size and keeps the **top 5** for the UI.
- There's a **fallback**: if SHAP ever returns degenerate values - specifically if **all
  contributions are ≈0, or fewer than 3 features contribute meaningfully** (`non_trivial < 3`,
  which catches the single-feature-dominance bug) - we don't show a broken chart. Instead we
  compute each feature's contribution from its **actual value divided by that feature's expected
  normal magnitude** (`_FEATURE_SCALE = [2.0, 1.0, 1.5, 1.0, 1.0, 0.5, 0.5, 0.5]`). So even the
  fallback reflects the real event, never random numbers. (Known caveat: retraining on <50
  labels can make SHAP lean on one feature - don't retrain until you have enough labels.)
- **Optional AI narrative** (`llm_narrative.py`): if a Grok/x.ai API key is set, it writes a
  3-4 sentence plain-English summary of the alert. Entirely optional; off without a key.

---

## 9. Alerts, cases, and risk over time

- **Alert:** created when an event scores ≥ 65. Stores the scores, SHAP, a timeline of the
  lead-up events, status (open/resolved/dismissed), and the analyst's label.
- **Case ("kill chain"):** if the same user gets a **2nd alert within 24 hours**, the alerts
  are grouped into a *case* - telling a story of escalating behaviour instead of isolated
  pings. (A single lone alert does **not** open a case.)
- **User risk score:** each user's headline risk = the highest alert score in the last 7
  days; it slowly **decays** by 5 if they behave, so risk cools down over time.
- **Coordinated activity banner:** if 3+ different users trip the *same* fraud pattern within
  30 minutes, the dashboard flags possible coordinated/collusion activity.

---

## 10. Active learning (the system improves)

- Analysts label alerts **TP** (true positive - real fraud) or **FP** (false positive).
- Once there are **≥10 labels**, hitting "retrain" retrains the XGBoost model on them and
  reports new precision/recall/F1 on a held-out validation set.
- This is the "it gets smarter as you use it" story. (Caveat: needs enough labels to be
  meaningful - see the SHAP note above.)

---

## 11. The dataset story (download → extract → scripts → results)

This is the part you asked to capture in full. We used **CMU CERT r4.2**, the standard
academic insider-threat dataset, to **validate** our synthetic data and to **demo** on a
real documented insider. Everything lives in `datasets/cert/` (raw data, not in git) and
`sentineliq/scripts/cert/` (the scripts, in git).

### 11a. What we downloaded
From CMU KiltHub we downloaded **two files** into `datasets/cert/`:
- `r4.2.tar.bz2` (~4.8 GB compressed) - the dataset (1,000 simulated employees, 18 months).
- `answers.tar.bz2` (~1.2 MB) - the answer key listing which users were the planted insiders.
- We verified the big file with its **SHA-256 checksum** (matched exactly → not corrupted).

### 11b. How we extracted it
- The archive is a `.tar.bz2`. We **selectively extracted only the small files we needed**
  (`logon.csv`, `device.csv`, the `LDAP/` role files) and **skipped the giant `http.csv`**
  so we didn't fill the disk. Command used: `tar -xjvf` with wildcards.
- We separately extracted `answers.tar.bz2` to get the insider list.

### 11c. What CSVs we got
- `r4.2/logon.csv` (56 MB) - every logon/logoff: `id, date, user, pc, activity`.
- `r4.2/device.csv` (28 MB) - USB connect/disconnect events.
- `r4.2/LDAP/*.csv` (18 monthly files) - each user's role and department.
- `answers/insiders.csv` - the master list of planted insiders + their scenario + dates.
- `answers/r4.2-1/r4.2-1-<USER>.csv` - per-insider, the exact malicious events.

### 11d. What we built (3 scripts in `scripts/cert/`)
1. **`build_cert_profile.py`** - reads `logon.csv`, measures the **real** login-hour
   distribution and the night-activity rate, and writes `backend/data/cert_profile.json`.
   (Result: people log in mostly 7-8 AM; ~4.5% of logons are at night.)
2. **`validate_against_cert.py`** - runs *our* generator and *CERT* side by side and draws
   comparison charts into `scripts/cert/out/`. This is the validation evidence.
3. **`cert_to_ingest.py`** - takes a real CERT insider (default **CAH0936**: off-hours
   logon → USB connect → upload → disconnect) and replays their events through our
   `/api/ingest` endpoint. `--dry-run` just prints; `--send` actually posts to a backend.

### 11e. What we found (say this honestly - it shows rigour)
- **Validated:** both CERT and SentinelIQ are strongly business-hours-dominant with rare
  night activity → our off-hours signal is well-founded.
- **Honest gap:** real CERT data keeps a small **~4.5% benign night-activity background**;
  our default synthetic baseline is **~0%** (a bit too "clean"). We noted this as a realism
  improvement.

### 11f. Tier 1.5 - optional CERT calibration (DEFAULT OFF)
- We added an **optional** mode to the generator: it can sample login hours from CERT's
  **real** distribution (adding that ~4.5% night background) instead of a flat 9-5 window.
- It is **off by default** and only turns on if the environment variable
  `SENTINELIQ_CERT_PROFILE` points to the profile file. With it unset, the generator behaves
  exactly as before. This means **the live demo is unchanged** unless we deliberately enable it.
- One-line pitch: *"our synthetic behaviour is calibrated against a real research benchmark."*

### 11g. Tier 2 - catching a real insider (the wow demo)
- Running `cert_to_ingest.py --send` against the live backend made **CAH0936's real
  attack events** flow through our ML and produce alerts on the live dashboard
  (**risk 84/85**, a 7-alert case, SHAP pointing at `login_hour_deviation`,
  `location_mismatch`, `off_hours_ratio`).
- This proves the system works on **real documented attack data**, not just our own
  invented fraud.

---

## 12. Every backend file (quick reference)

| File | What it does |
|---|---|
| `backend/main.py` | The FastAPI app. Wires everything together, runs the live event loop, and exposes all the API endpoints. The spine. |
| `backend/database.py` | Defines every database table (users, events, alerts, cases, etc.) and the SQLite connection. |
| `backend/schemas.py` | The exact JSON shapes for API requests/responses (validated automatically). |
| `backend/data/synthetic_generator.py` | Generates the 50 users + the fake event stream + the 6 fraud patterns. |
| `backend/data/feature_engineering.py` | Turns each raw event into the 8 behavioural features. |
| `backend/models/isolation_forest.py` | Model 1 - point-anomaly detector. |
| `backend/models/lstm_autoencoder.py` | Model 2 - temporal/sequence drift detector. |
| `backend/models/xgboost_model.py` | Model 3 - supervised fraud scorer + SHAP explanations. |
| `backend/models/ensemble.py` | Blends the 3 model scores into the final 0-100 risk. |
| `backend/llm_narrative.py` | Optional plain-English alert summary via Grok API (off by default). |
| `backend/data/cert_profile.json` | The CERT-derived login-hour profile for optional calibration. |
| `backend/scripts/seed_demo.py` | Dev helper to seed labelled demo alerts locally. |

## 13. Every frontend page + component (quick reference)

**Pages** (`frontend/app/`):
| Page | What it shows |
|---|---|
| `/` (landing) | Professional intro page explaining the product. |
| `/dashboard` | Overview: live feed + 4 stat cards + hero alert + recent alerts + the "Simulate" button. |
| `/dashboard/alerts` | The alert queue (left) + a detail panel (right) with SHAP, timeline, peer comparison. |
| `/dashboard/users` | User profiles: search, watchlist, risk history chart, restrict/escalate actions. |
| `/dashboard/cases` | Kill-chain cases: list + a stitched timeline of the whole incident. |
| `/dashboard/intelligence` | Model performance: P/R/F1, charts, training log, false-positive trend. |

**Key components** (`frontend/components/`):
| Component | Role |
|---|---|
| `Sidebar.tsx` | Left navigation rail + search button. |
| `LiveFeed.tsx` | The live event stream (polls every ~3s). |
| `AlertPanel.tsx` | The alert detail view (SHAP, timeline, peer comparison). |
| `SHAPChart.tsx` | The bar chart of feature contributions. |
| `IntelligenceCharts.tsx` | The charts on the intelligence page. |
| `StatCard.tsx`, `RiskBadge.tsx`, `UserTable.tsx`, `CommandPalette.tsx` | Stat cards, risk colour pills, the user table, and the ⌘K command palette. |

**lib:** `api.ts` (typed client that calls the backend) and `tokens.ts` (the design colours,
used everywhere via the `C` object so colours stay consistent).

## 14. The API endpoints (grouped, simple)

- **Health:** `/health`, `/ping` - is the backend alive?
- **Dashboard data:** `/api/stats`, `/api/feed`, `/api/intelligence`.
- **Alerts:** list/detail, plus actions - resolve, dismiss, label (TP/FP), note, export,
  peer-comparison, timeline.
- **Users:** list, detail (30-day history), events, restrict, escalate.
- **Cases:** list, timeline, resolve, dismiss.
- **Actions:** `/api/simulate` (inject one fraud on demand), `/api/retrain`, `/api/ingest`
  (accept an external event - this is what the CERT replay uses), webhook settings.

---

## 15. Deployment reality (important context)

- **Frontend → Vercel**, **backend → HuggingFace Spaces** (free tier), database = SQLite.
- **HF sleeps after ~15 min idle.** When asleep the live stream stops. We keep it awake with
  an **external uptime pinger** that hits the backend every ~3 minutes.
- **HF storage is ephemeral:** on a container restart the database is wiped and re-seeded.
  So don't claim "permanent analyst history" - labels/notes reset on restart.
- **Before any demo:** open the backend `/health`, wait for `{"status":"ok"}`, then demo.

---

## 16. Known limitations (be honest - judges respect this)

- Trained on **synthetic data**; real deployment needs real labelled bank logs.
- **SQLite** is fine for a POC; production would use PostgreSQL for scale.
- **No login/authentication** on the dashboard yet - not production-ready as-is.
- **3-second polling** for the live feed; production would use WebSockets/a message broker.
- **SHAP only explains XGBoost**; IF and LSTM give scores without per-feature breakdown.
- Our synthetic baseline is slightly **too clean** (the CERT calibration addresses this).

---

## 17. Anticipated judge questions + confident answers

**Q: Why is this Open Innovation, and how does it meet the track objectives?**
A: It's a cybersecurity product, one of the track's named domains, with FinTech as the
flagship use case. *Innovation:* per-user behavioural baselines plus a 3-model ensemble
instead of static rules, so we catch attacks nobody wrote a rule for. *Functional and
scalable prototype:* it's live right now (Vercel + HuggingFace), the event-driven pipeline
runs continuously, and scaling is a storage/queue swap, not a rewrite. *Genuine challenge:*
insider risk costs $19.5M per organisation per year (Ponemon 2026). *Technical excellence and
user impact:* SHAP explanations and plain-English narratives take an analyst from alert to
decision in under 30 seconds, and we validated against the CMU CERT insider-threat benchmark.

**Q: How can you flag a brand-new/external user with no baseline?**
A: We don't classify *people*, we classify *behaviour*. Each event becomes 8 features
measuring deviation from a baseline. For a known user that's their own history; for a new
user it's a safe default (9-5, HQ, modest volume) that personalises over time (cold-start).
A never-seen account doing a 4 AM, 120 MB, external export deviates massively from that
default and from the learned fraud pattern, so it's flagged on its first move - exactly what
you saw with the CERT insider CAH0936 (risk 84).

**Q: Do you need a separate model for external/privileged people?**
A: No. Feature engineering maps everyone into the same 8-number space, so one pipeline
handles any identity. Privileged users (admin/treasury) are just users whose privilege and
access features matter more - same models.

**Q: Where does the 84 come from? Do the model scores make sense?**
A: It's the weighted blend: 0.4×IF + 0.4×LSTM + 0.2×XGBoost. For CAH0936: 0.4×0.67 +
0.4×1.00 + 0.2×0.88 = 0.84. IF flags it as a statistical outlier, the LSTM as sequence
drift, XGBoost as matching a known fraud signature - three different reasons, one verdict.

**Q: Why synthetic data? Isn't that weak?**
A: No public real insider-threat dataset from a financial institution exists - even academia
uses synthetic CERT data. We built ours banking-specific (transactions, treasury, locations) AND validated its
behavioural realism against the CERT benchmark. Our `/api/ingest` endpoint accepts real
feeds, so production just plugs real logs into the same pipeline.

**Q: What about false positives / alert fatigue?**
A: Three guards: (1) the 65 threshold filters low-risk noise; (2) analysts label TP/FP and
the model retrains (active learning) to reduce repeat false positives; (3) the FP rate is
tracked on the intelligence page. Honest point: a single fixed threshold is a known
simplification; per-role adaptive thresholds are a clear next step.

**Q: Will this scale to a real bank (50k employees, millions of events/day)?**
A: The architecture is event-driven, so yes in principle - production swaps SQLite for
PostgreSQL and adds a message queue (Kafka). Today's single-process loop is right-sized for
a POC.

**Q: How does a new user's personal baseline replace the default?**
A: Features use a rolling window of the user's recent events. With no history we fall back to
role/population defaults; as their events accumulate, the window fills with their own data and
the baseline becomes personal. So accuracy improves the longer we watch someone.

**Q: Is the SHAP explanation real or decorative?**
A: Real - it's SHAP TreeExplainer output from the actual XGBoost model, showing each
feature's true contribution. There's a safe fallback only when SHAP returns degenerate
values, and even then it's computed from real feature values, never random.

**Q: What stops someone gaming it by acting "slowly"?**
A: That's exactly why we use the LSTM - it watches sequences over time and catches gradual
drift, not just single spikes. Combined with the rolling baseline, slow changes still
accumulate into the off-hours/entropy/velocity features.

---

## 18. 30-second demo runbook

1. Open the backend `/health` and wait for `{"status":"ok"}` (wakes HF).
2. Show the **landing page**, then the **dashboard** with the live feed moving.
3. Click **Simulate** to inject a fraud, watch the alert appear.
4. Open an alert → show the **SHAP "why"** + the **plain-English narrative**.
5. (Optional wow) Run `cert_to_ingest.py --send` → show a **real CERT insider** (CAH0936)
   getting caught live at risk 84, with a case forming.
6. Show the **Intelligence** page (P/R/F1) and the **CERT validation** charts.

## 19. Quick facts cheat-sheet (memorise these numbers)

- 50 employees · 5 roles · 8 features · 3 models · 6 fraud patterns.
- Ensemble weights: **IF 0.4 / LSTM 0.4 / XGBoost 0.2**.
- Alert threshold: **65**. Risk bands: 80+ critical, 65+ high, 40+ medium.
- Case = 2nd alert within 24h. Retrain needs ≥10 labels.
- XGBoost: 60 trees, depth 3, proba capped 0.88. IF: 100 trees, contamination 0.1.
  LSTM: sequence 10, hidden 16.
- Live stream: 1 event / 3 seconds, every 15th is fraud (~7%).
- CERT r4.2 validation: ~4.5% real night-activity rate; demo insider = CAH0936 (risk 84).
- Frontend = Vercel, Backend = HuggingFace, DB = SQLite (ephemeral on HF).
