# SentinelIQ — How every file works (code walkthrough)

*This is a deep, file-by-file walkthrough. For each file you get: **what it's for**, the
**main lines of code shown and explained in plain English**, and a **"How it connects"**
note telling you how that file plugs into the rest of the system. Read top to bottom and you
will understand the whole machine.*

**How to read this:** the backend (the brain) comes first because that's where all the logic
is. Then the frontend (the screen). Then the CERT research scripts. At the very end there's a
section that ties every file together into one flow.

A 10-second reminder of the shape of the system:

```
synthetic_generator.py  →  feature_engineering.py  →  isolation_forest.py ┐
   (makes an event)         (event → 8 numbers)        lstm_autoencoder.py ├→ ensemble.py → main.py
                                                        xgboost_model.py   ┘   (blend)      (decide alert,
                                                                                              save to DB)
                                                                                                  │
                                          frontend (lib/api.ts → pages) ←── reads over HTTP ──────┘
```

---

# PART 1 — THE BACKEND (the brain, Python + FastAPI)

---

## `backend/main.py` — the spine

This one file boots everything, runs the live loop, and defines every API endpoint. It's
~2,400 lines, so we'll walk the **key pieces** in the order they matter.

### 1a. The shared "singletons" (top of the file)

```python
generator = SyntheticGenerator()   # produces synthetic events
engineer  = FeatureEngineer()      # turns events into the 8 features
ensemble  = EnsembleModel()        # the 3-model scorer
ALERT_THRESHOLD = 65               # score ≥ 65 becomes an alert
SAVED_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models", "saved")
```

These three objects are created **once** and shared by every request and by the background
loop. Think of them as three permanent staff members: one invents data, one translates it,
one scores it. `ALERT_THRESHOLD = 65` is the single cut-off that decides "is this an alert."

### 1b. `_process_event()` — THE core pipeline (every event goes through here)

This is the most important function in the whole backend. Live events, the Simulate button,
and external/CERT events **all** flow through it.

```python
async def _process_event(ev: dict) -> None:
    feat = engineer.compute_features(ev["user_id"], ev)   # step 1: event → 8 numbers
    scores = ensemble.predict(ev["user_id"], feat)        # step 2: 3 models score it
    risk_score = float(scores["ensemble"]) * 100.0        # step 3: 0–1 blended → 0–100
    if force_alert and risk_score < 75.0:                 # Simulate/forced fraud floor
        risk_score = 75.0
    ...
    alert_id = str(uuid.uuid4()) if risk_score >= ALERT_THRESHOLD else None
```

- It asks `feature_engineering.py` to turn the raw event into the 8 features.
- It asks `ensemble.py` to score those features → a blended 0–1 number, ×100 → 0–100.
- `force_alert` is a flag set by the Simulate button / forced fraud so a demo "fraud" is
  guaranteed to land as an alert (floored to 75).
- If the score clears **65**, it makes a unique `alert_id`; otherwise `None` (just an event).

Then it saves to the database, and **only if there's an alert** it also builds the SHAP
explanation, a timeline, and maybe a case:

```python
        db.add(EventModel(**{k: v for k, v in ev.items() if k in _EVENT_COLS}))
        if alert_id:
            shap_vals = ensemble.explain(feat)            # why did it fire?
            alert = AlertModel(... model_scores_json=json.dumps(scores),
                                   shap_values_json=json.dumps(shap_vals), ...)
            db.add(alert)
            ...
            await _update_or_create_case(ev["user_id"], alert, db)   # group into a case?
        await _refresh_user_risk(ev["user_id"], db)
        await db.commit()
```

**How it connects:** this function is the hub. It calls `feature_engineering.py`,
`ensemble.py` (which calls the 3 model files), `database.py` (to save), and the case/risk
helpers below. Everything upstream (the generator, the API endpoints) ends here; everything
the frontend shows was written by this function.

### 1c. `_event_loop()` — the "live" stream

```python
async def _event_loop() -> None:
    live_count = 0
    while True:
        await asyncio.sleep(3)                 # one event every 3 seconds
        live_count += 1
        if live_count % 15 == 0:               # every 15th event is a forced fraud
            pattern = _LIVE_FRAUD_PATTERNS[((live_count // 15) - 1) % 6]
            ev = generator.generate_forced_fraud(pattern)
            ev["_force_alert"] = True
        else:
            ev = generator.generate_batch(n=1, base_ts=datetime.utcnow())[0]
        await _process_event(ev)
```

A never-ending loop: sleep 3 seconds, make one event, send it through `_process_event`. Every
15th event is forced to be one of the 6 fraud patterns (≈7% fraud rate). This is what makes
the dashboard feel "live."

**How it connects:** it's the heartbeat. It's started by `lifespan` (below) and feeds events
into `_process_event`. The frontend's `LiveFeed.tsx` polling `/api/feed` every 3s shows
exactly what this loop produces.

### 1d. `_startup()` — train or load the models, then seed

```python
if ensemble.saved_files_exist(SAVED_MODEL_DIR):   # fast path: models already on disk
    ensemble.load(SAVED_MODEL_DIR)
    await _rebuild_runtime_state()                # replay last 20 events/user into buffers
    await seed_demo_state()
    return
# cold path: no saved models → make 2000 events over the last 48h and train
training_events = generator.generate_batch(n=2000, base_ts=datetime.utcnow()-timedelta(hours=48))
for ev in training_events:
    feat = engineer.compute_features(ev["user_id"], ev)
    X_all.append(feat); y_all.append(ev["is_fraud"])
    user_events.setdefault(ev["user_id"], []).append(feat)
...
ensemble.fit(X, y, user_events)        # trains all 3 models
ensemble.save(SAVED_MODEL_DIR)         # so next boot uses the fast path
await seed_demo_state()
```

On boot: if trained model files exist, just load them (no waiting). Otherwise generate 2000
events, turn each into features, collect **X** (features), **y** (the `is_fraud` labels), and
**user_events** (per-user sequences for the LSTM), then train and save.

**How it connects:** this is where the 3 model files first get trained, using
`synthetic_generator.py` for data and `feature_engineering.py` for the numbers. It runs once,
at startup, triggered by `lifespan`.

### 1e. `_refresh_user_risk()` — a user's headline number

```python
max_recent = await db.scalar(select(func.max(AlertModel.risk_score))
    .where(and_(AlertModel.user_id == user_id, AlertModel.timestamp >= seven_days_ago)))
if max_recent is not None:
    user.risk_score = round(float(max_recent), 2)
else:
    user.risk_score = max(0.0, round(user.risk_score - 5.0, 2))   # decay if quiet
```

A user's risk = their highest alert score in the last 7 days. If they've had no alerts, it
**cools down by 5** each event. So risk rises sharply and falls slowly.

### 1f. `_update_or_create_case()` — the "kill chain"

```python
if existing_case:                         # already an open case in 24h → append
    existing_case.alert_count += 1
    db.add(CaseAlertModel(case_id=existing_case.id, alert_id=alert.id))
    return existing_case.id
prior_alerts = (... alerts for this user in last 24h, excluding this one ...)
if not prior_alerts:
    return None                           # first ever alert → NO case yet
# 2nd alert in 24h → open a new case linking all of them
case_id = f"case-{user_id}-{int(first_seen.timestamp())}"
db.add(CaseModel(id=case_id, name=_case_name(fraud_types), ...))
```

The rule in plain words: **one lone alert is not a case.** A case only opens when the same
user gets a **2nd alert within 24 hours**, and then all their recent alerts get stitched into
one story.

**How it connects:** called from `_process_event` right after an alert is made. It writes to
the `cases` and `case_alerts` tables (`database.py`) that the frontend `cases` page reads.

### 1g. `seed_demo_state()` — deterministic demo data

```python
SEED_VERSION = "v6"
random.seed(42); np.random.seed(42)       # make the demo identical every boot
normal_events = generator.generate_batch(n=300, base_ts=now - timedelta(hours=24))
chains = [ {"user_id": "usr_003", "pattern": "bulk_download", ...}, ... ]   # 3 fraud chains
standalone_risks = [65, 72, 76, 80, 68, 84, ...]                            # 12 standalone alerts
```

Because HuggingFace wipes the database on restart, this re-creates a believable starting
state every boot: ~300 normal events + 3 multi-step fraud chains (which form cases) + 12
standalone alerts. The `random.seed(42)` makes it the same every time. `SEED_VERSION` lets
the code wipe and re-seed if the seed logic changes.

### 1h. `lifespan` + the endpoints

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()                       # create tables (database.py)
    await _startup()                      # train/load models + seed
    task = asyncio.create_task(_event_loop())   # start the heartbeat
    yield
    task.cancel()                         # stop cleanly on shutdown
```

Then ~30 endpoints, each a small function. Examples:

```python
@app.get("/api/feed", response_model=List[FeedEvent])      # last 20 live events
@app.get("/api/alerts", response_model=AlertListResponse)  # filtered + paginated alerts
@app.post("/api/alerts/{alert_id}/resolve")                # analyst marks handled
@app.post("/api/alerts/{alert_id}/label")                  # TP/FP for active learning
@app.post("/api/simulate")                                 # inject one fraud on demand
@app.post("/api/retrain")                                  # retrain XGBoost on labels
@app.post("/api/ingest")                                   # accept an EXTERNAL event (CERT)
```

`/api/simulate` and `/api/ingest` both just build an event dict and call `_process_event` —
the same pipeline as the live loop. `/api/retrain` pulls the analyst's TP/FP labels, refits
XGBoost, checks precision didn't drop, and saves.

**How `main.py` connects to everything:** it imports and drives every other backend file —
`database.py` (storage), `schemas.py` (the JSON shapes it returns), `synthetic_generator.py`
(data), `feature_engineering.py` (features), `ensemble.py`/the 3 models (scoring),
`llm_narrative.py` (optional text). The frontend only ever talks to these endpoints.

---

## `backend/database.py` — the storage layer

Defines every table as a Python class and opens the database connection.

```python
_DB_PATH = Path(__file__).resolve().parent / "sentineliq.db"
DATABASE_URL = f"sqlite+aiosqlite:///{_DB_PATH}"
engine = create_async_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
```

- The whole database is **one file**, `sentineliq.db`, sitting next to this code.
- `aiosqlite` = an async SQLite driver so the app can read/write without blocking.
- `SessionLocal` is the "open a connection" factory used everywhere in `main.py`.

Each table is a class. For example an event:

```python
class EventModel(Base):
    __tablename__ = "events"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime)
    event_type: Mapped[str] = mapped_column(String)
    download_mb: Mapped[float] = mapped_column(Float, default=0.0)
    features_json: Mapped[str] = mapped_column(Text, default="{}")   # the 8 numbers as JSON
    is_fraud: Mapped[int] = mapped_column(Integer, default=0)        # the label
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
```

The full set of tables: `users`, `events`, `alerts`, `audit_logs`, `model_metrics`, `cases`,
`case_alerts`, `timeline_items`, `settings`. Notice **the 8 features are stored as a JSON
string** (`features_json`) on each event — that's how retrain later re-reads them.

`init_db()` creates the tables and runs harmless "migrations":

```python
await conn.execute(text("PRAGMA journal_mode=WAL"))   # readers don't block writers
await conn.run_sync(Base.metadata.create_all)
for stmt in [ "ALTER TABLE alerts ADD COLUMN notes TEXT DEFAULT ''", ... ]:
    try: await conn.execute(text(stmt))
    except Exception: pass   # column already exists → ignore
```

WAL mode lets reads and writes happen at the same time. The `try/except` migrations mean you
can add a column to an old database without crashing — a lightweight stand-in for a real
migration tool.

**How it connects:** every `db.add(...)`, `db.get(...)`, `select(...)` in `main.py` uses
these classes and `SessionLocal`. The data the frontend sees is literally rows from here.

---

## `backend/schemas.py` — the shapes of the JSON

These are **Pydantic** models — they define the exact JSON the API sends and receives, and
FastAPI checks data against them automatically.

```python
class ModelScores(BaseModel):
    isolation_forest: float
    lstm: float
    xgboost: float

class AlertResponse(BaseModel):
    id: str
    risk_score: float
    risk_level: str
    model_scores: ModelScores
    shap_values: List[SHAPValue]
    status: str
    ...
```

So when `main.py` says `response_model=AlertResponse`, FastAPI guarantees the JSON has exactly
these fields and types. There are request shapes too:

```python
class LabelRequest(BaseModel):
    label: str            # the body for POST /api/alerts/{id}/label

class IngestEventRequest(BaseModel):
    user_id: str
    event_type: str
    hour: int
    download_mb: float = 0.0
    ...
```

**How it connects:** `main.py` imports these and tags each endpoint with one. The frontend's
TypeScript interfaces in `lib/api.ts` are the **mirror image** of these — they must match, or
the website would mis-read the data.

---

## `backend/data/synthetic_generator.py` — the fake-data factory

There's no real bank feed, so this fabricates believable activity for 50 fixed employees.

```python
_EMPLOYEE_SPECS = [
  ("usr_001","James Sterling","teller","retail_banking",8,17,50,[...depts],[...locs]),
  ...
]   # (id, name, role, dept, login_start, login_end, avg_tx, typical_depts, normal_locs)
```

Each employee has fixed normal hours, departments, locations and transaction volume. A
**normal** event stays inside that profile:

```python
def _normal_event(self, spec, ts):
    hour = random.randint(ls, le - 1)                       # inside their work window
    location = "external" if random.random() < 0.05 else random.choice(norm_locs)  # 5% noise
    download_mb = random.gauss(3, 1) if event_type=="report_download" else random.gauss(0.5,0.2)
    return { "user_id": uid, "hour": hour, "tx_count": ..., "is_fraud": 0, ... }
```

The 5% "external" noise is deliberate — it stops location from being a perfect fraud giveaway
during training. A **fraud** event starts from a normal one and distorts it, each pattern
tripping **two** signals:

```python
def _fraud_event(self, spec, ts, pattern):
    ev = self._normal_event(spec, ts)
    if pattern == "bulk_download":
        ev["event_type"] = "data_export"
        ev["download_mb"] = random.uniform(50, 200)   # huge volume (signal 1)
        ev["location"]    = "external"                # wrong place  (signal 2)
    elif pattern == "off_hours_login":
        ev["hour"] = random.choice([0,1,2,3,4,5,22,23])   # night (signal 1)
        ev["location"] = "external"                       # wrong place (signal 2)
    ...
    ev["device"] = random.choice(["mobile_vpn","tablet_remote"])  # odd device (extra signal)
    ev["fraud_type"] = pattern; ev["is_fraud"] = 1
    return ev
```

`generate_batch(n)` makes many events and forces every 15th to be fraud;
`generate_forced_fraud(pattern)` deterministically makes one fraud of a chosen kind (used by
Simulate and the live loop).

**How it connects:** `main.py` calls it at startup (2000 training events), in the seed, in the
live loop, and on Simulate. Its output is a plain dict that goes straight into
`feature_engineering.py`. The `is_fraud` flag it stamps becomes XGBoost's training label.

---

## `backend/data/feature_engineering.py` — event → 8 numbers

Turns one raw event into the 8 behavioural numbers, **measured against that user's own recent
history** (last 20 events).

```python
WINDOW = 20
@dataclass
class UserHistory:
    hours: deque = field(default_factory=lambda: deque(maxlen=WINDOW))
    tx_counts: deque = ...
    normal_hours: tuple = (9, 17)         # cold-start default
    normal_locations: list = ...
    avg_tx: float = 10.0
```

Each user gets a rolling buffer. New users start with safe defaults (9–17, HQ, modest volume)
— that's the **cold-start** handling. The features are computed, then the event is folded into
history:

```python
def compute_features(self, user_id, event):
    h = self._get_history(user_id, event)
    # 1. how far is this hour from the middle of their normal window?
    normal_mid = (h.normal_hours[0] + h.normal_hours[1]) / 2
    hour_dev = abs(hour - normal_mid) / max(1.0, (h.normal_hours[1]-h.normal_hours[0]) / 2)
    # 2. this event's tx vs their recent average
    tx_ratio = tx / max(1.0, avg_tx_window)
    # 3. entropy of departments INCLUDING this one (snooping spreads it out)
    entropy = self._entropy(list(h.departments) + [dept])
    # 4. download z-score (or ratio if little history)
    dl_z = (download - dl_mean) / dl_std   # when ≥2 past downloads
    # 5. location not in their known list → 1
    loc_mismatch = 0.0 if location in h.normal_locations else 1.0
    ...
    features = np.array([hour_dev, tx_ratio, entropy, dl_z, loc_mismatch,
                         priv_ratio, device_freq, off_ratio], dtype=np.float32)
    return np.clip(features, -10, 10)      # one outlier can't blow up the model
```

Three of the features (`privilege_use_ratio`, `device_change_frequency`, `off_hours_ratio`)
**include the current event** in their count, so a single off-hours login fires a signal
immediately instead of waiting for a pattern. The final `np.clip(..., -10, 10)` keeps every
number in a safe range.

**How it connects:** `main.py` calls `compute_features` for **every** event before scoring.
Its 8-number output is exactly what the 3 models eat, and it's saved as `features_json` so
retrain can reuse it. The feature order here must match `FEATURE_NAMES` in the model files.

---

## `backend/models/isolation_forest.py` — Model 1 (point anomalies)

Catches single weird events, unsupervised.

```python
class IsolationForestModel:
    def __init__(self):
        self._model = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
        self._scaler = StandardScaler()

    def fit(self, X):
        X_scaled = self._scaler.fit_transform(X)   # mean 0, std 1 per feature
        self._model.fit(X_scaled)

    def score(self, features):
        if not self.is_fitted: return 0.5
        raw = self._model.decision_function(self._scaler.transform(features.reshape(1,-1)))[0]
        score = 1.0 - (raw + 0.5)                  # flip: anomalous → high
        return float(np.clip(score, 0.0, 1.0))
```

- It builds **100 random trees**. An outlier gets "fenced off" in very few random cuts, so it
  has a shallow average depth → flagged. Normal points sit in the crowd → deep → safe.
- `decision_function` returns positive for normal, negative for odd. The line
  `1.0 - (raw + 0.5)` flips that so **anomalous = a high 0–1 score**.
- Before training (or on error) it returns a neutral `0.5`.

**How it connects:** owned by `ensemble.py`, trained in `_startup` on the feature matrix X,
and its score is 40% of the blend.

---

## `backend/models/lstm_autoencoder.py` — Model 2 (behaviour over time)

Catches when the *recent pattern* of someone's activity stops looking like them. It reads a
**sequence of the last 10 events**, not one event.

```python
SEQ_LEN = 10; N_FEATURES = 8; HIDDEN_SIZE = 16

class _LSTMAENet(nn.Module):
    def __init__(self):
        self.encoder = nn.LSTM(N_FEATURES, HIDDEN_SIZE, batch_first=True)   # 8 → 16
        self.decoder = nn.LSTM(HIDDEN_SIZE, N_FEATURES, batch_first=True)   # 16 → 8
    def forward(self, x):
        _, (h, _) = self.encoder(x)                 # read 10 events → one 16-number "gist"
        repeated = h.squeeze(0).unsqueeze(1).expand(-1, SEQ_LEN, -1)        # repeat gist x10
        out, _ = self.decoder(repeated)             # rebuild the 10-event sequence
        return out
```

An **autoencoder** squeezes input into a small summary then rebuilds it. If it rebuilds well,
the input looked familiar. The "LSTM" part means it understands order over time. Training:

```python
for _ in range(8):                                  # 8 quick passes
    out = net(X_tensor); loss = criterion(out, X_tensor)   # MSE rebuild error
    loss.backward(); optimizer.step()
errors = ((recons - X_tensor) ** 2).mean(dim=(1,2)).numpy()
self._threshold = float(np.percentile(errors, 90))  # "this much error is still normal"
```

Scoring divides the new error by that learned threshold:

```python
error = float(((out - x) ** 2).mean().item())
normalized = error / (self._threshold + 1e-8)
return float(np.clip(normalized, 0.0, 1.0))         # error at the bar → ~1.0
```

It keeps a rolling per-user buffer (`deque(maxlen=10)`) so it always has the user's latest 10
events. If PyTorch isn't installed, every method safely returns `0.5`.

**How it connects:** owned by `ensemble.py`, trained on the **per-user sequences** from
`_startup`, and is the other 40% of the blend. On a cached boot, `_rebuild_runtime_state` in
`main.py` replays events through `update_seq` to warm these buffers.

---

## `backend/models/xgboost_model.py` — Model 3 (supervised) + SHAP

The only model told which past events were fraud. Two jobs: score, and explain.

```python
self._model = xgb.XGBClassifier(
    n_estimators=60, max_depth=3, learning_rate=0.1, scale_pos_weight=2,
    subsample=0.8, colsample_bytree=0.6, min_child_weight=2, gamma=0.1,
    reg_alpha=0.1, reg_lambda=1.0, ...)
self._model.fit(X, y)                          # y = the is_fraud labels
self._explainer = shap.TreeExplainer(self._model)
```

- **Gradient boosting** = build 60 small trees one after another, each fixing the previous
  trees' mistakes; add them up for a confidence. The knobs (`subsample`, `colsample_bytree`,
  the regularisers) are tuned for a small, imbalanced set so no single feature dominates.

Scoring caps the probability:

```python
def score(self, features):
    return min(float(self._model.predict_proba(x)[0][1]), 0.88)   # cap at 0.88
```

The cap exists because XGBoost's raw probabilities saturate toward 1.0 on imbalanced data and
would drown out the other two models.

Explaining (SHAP), with a safety net:

```python
sv = self._explainer.shap_values(x, check_additivity=False)
... # normalise SHAP's various output shapes to one row of 8 numbers
non_trivial = int(np.sum(np.abs(shap_row) > 1e-3))
if np.all(np.abs(shap_row) < 1e-9) or non_trivial < 3:    # degenerate?
    return _fallback_shap(features)                        # use real values instead of nothing
contributions.sort(key=lambda c: abs(c["contribution"]), reverse=True)
return contributions[:5]                                   # top 5 drivers
```

If SHAP returns junk (e.g. fewer than 3 features actually contribute), the fallback computes
each feature's contribution from its **actual value ÷ that feature's expected size**
(`_FEATURE_SCALE = [2.0, 1.0, 1.5, 1.0, 1.0, 0.5, 0.5, 0.5]`) — never random numbers.

**How it connects:** owned by `ensemble.py`, 20% of the blend, and the source of every alert's
SHAP chart. `/api/retrain` calls `.fit` again on analyst labels.

---

## `backend/models/ensemble.py` — the blender

Holds all three models and combines them.

```python
IF_WEIGHT = 0.4; LSTM_WEIGHT = 0.4; XGB_WEIGHT = 0.2

def fit(self, X, y, user_events):
    self.if_model.fit(X)                 # unsupervised
    self.xgb_model.fit(X, y)             # supervised (labels)
    self.lstm_model.fit(user_events)     # unsupervised, sequences

def predict(self, user_id, features):
    if_score   = self.if_model.score(features)
    lstm_score = self.lstm_model.score(user_id, features)
    xgb_score  = self.xgb_model.score(features)
    ensemble = IF_WEIGHT*if_score + LSTM_WEIGHT*lstm_score + XGB_WEIGHT*xgb_score
    if np.isnan(ensemble): ensemble = 0.5
    return { "isolation_forest": ..., "lstm": ..., "xgboost": ...,
             "ensemble": round(float(np.clip(ensemble, 0.0, 1.0)), 4) }
```

One weighted sum, clamped to [0,1]. If any model returns NaN it falls back to 0.5 so a single
broken model can't produce nonsense. `explain()` just forwards to XGBoost. `save`/`load`
write/read the three files in `models/saved/`.

**How it connects:** the single thing `main.py` calls for scoring (`ensemble.predict`) and
explaining (`ensemble.explain`). It hides the 3 models behind one clean door.

---

## `backend/llm_narrative.py` — optional plain-English summary

```python
def generate_alert_narrative(alert, shap_values, user):
    api_key = os.environ.get("GROK_API_KEY")
    if not api_key: return None                       # feature OFF with no key
    client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")   # Grok is OpenAI-compatible
    prompt = ( "You are a bank fraud analyst. Write 3-4 sentences ..."
               f"Ensemble risk score: {round(alert.risk_score)}/100 ..."
               f"Top behavioural signals (SHAP):\n{feature_lines}" )
    response = client.chat.completions.create(model="grok-3-mini", ..., temperature=0.25)
    return response.choices[0].message.content.strip()
```

It builds a prompt grounded in the alert's real numbers and asks Grok for a short explanation.
With **no API key it returns `None`** and the UI just shows the raw scores/SHAP. Any error is
swallowed so it can never break alert creation.

**How it connects:** `main.py` calls it the first time an alert detail is fetched
(`GET /api/alerts/{id}`) and caches the result in the `ai_narrative` column. `AlertPanel.tsx`
shows it if present.

---

## `backend/scripts/seed_demo.py` — local dev helper

A **standalone** script (run by hand: `python -m scripts.seed_demo`). It grabs some real
fraud + clean events, turns them into labelled TP/FP alerts, and retrains XGBoost so the
Intelligence page shows non-zero precision/recall locally.

```python
if not EnsembleModel.saved_files_exist(SAVED_MODEL_DIR): return   # needs trained models first
fraud_rows = (... is_fraud == 1 ...).limit(10)
clean_rows = (... is_fraud == 0 ...).limit(5)
...
ens.xgb_model.fit(X[:split], y[:split]); ens.save(SAVED_MODEL_DIR)
```

**How it connects:** uses the same `ensemble.py`, `feature_engineering.py`, and `database.py`
as the app, but is **not** part of normal startup — it's a convenience for local demos.

---

## Small backend files

- **`backend/data/__init__.py`** and **`backend/models/__init__.py`** — empty marker files
  that make those folders importable as `data.*` / `models.*`. They do nothing else but are
  required for the imports in `main.py` and `ensemble.py` to work.
- **`backend/requirements.txt`** — the exact library versions (FastAPI, SQLAlchemy,
  scikit-learn, torch, xgboost, shap, …). Used by `pip install` locally and inside the
  Dockerfile. If a version here is wrong, the models won't load.
- **`backend/Dockerfile`** — the build recipe HuggingFace uses:
  ```dockerfile
  FROM python:3.10-slim
  RUN pip install --no-cache-dir -r requirements.txt
  EXPOSE 7860
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
  ```
  Runs `main.py` on port 7860 — the entry point in production.
- **`backend/.env.example`** — a template of environment variables (`DATABASE_URL`,
  `CORS_ORIGINS`). You copy it to a real `.env`. Not loaded automatically.
- **`backend/README.md`** — the HuggingFace Space "card" (YAML header: emoji, `sdk: docker`).
  Tells HuggingFace how to display and build the Space.
- **`backend/data/cert_profile.json`** — 24 real login-hour weights from CERT. Only read if
  the optional CERT-calibration env var is set (otherwise ignored). Produced by the CERT
  script below.

---

# PART 2 — THE FRONTEND (the screen, Next.js + TypeScript)

The golden rule: **the frontend has no brain.** Every number it shows came from a backend
endpoint, fetched through one file.

---

## `frontend/lib/api.ts` — the single phone line to the backend

Every call to the backend goes through here. It defines the TypeScript types (mirrors of
`schemas.py`) and one helper per endpoint.

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: {...}, ...options })
  if (!res.ok) throw new Error(`API ${path} failed ${res.status}`)
  return res.json()
}

export const api = {
  feed:    () => fetchApi<FeedEvent[]>('/api/feed'),
  stats:   () => fetchApi<Stats>('/api/stats'),
  alerts:  (params?) => fetchApi<AlertListResponse>(`/api/alerts?${q}`),
  alert:   (id) => fetchApi<Alert>(`/api/alerts/${id}`),
  simulate:(scenario?) => fetchApi('/api/simulate', { method:'POST', body: JSON.stringify({scenario}) }),
  resolveAlert: (id) => fetchApi(`/api/alerts/${id}/resolve`, { method:'POST' }),
  retrain: () => fetchApi('/api/retrain', { method:'POST' }),
  ...
}
```

- `API_BASE` is the backend address. On Vercel it's set to the HuggingFace URL; locally it's
  `localhost:8000`. **This one variable is the whole frontend↔backend link.**
- It also has time helpers, e.g. `normaliseIso` adds a `Z` so naive-UTC dates from the backend
  don't render as "in the future" in your timezone.

**How it connects:** every page/component imports `api` and calls these. Nothing else in the
frontend ever calls `fetch` directly — this is the only door to the backend.

---

## `frontend/lib/tokens.ts` — the brand colours

```ts
export const C = { bg:'#0D1117', card:'#161B22', border:'#30363D',
                   textPrimary:'#F0F6FC', critical:'#DC2626', medium:'#D97706', low:'#16A34A', ... }
export function riskColor(score) { if (score>=65) return C.critical; if (score>=40) return C.medium; return C.low }
export function riskLevel(score) { if (score>=80) return 'critical'; if (score>=65) return 'high'; ... }
```

Every component imports `C` and uses `C.critical` etc. instead of raw hex, so colours stay
consistent. `riskColor`/`riskLevel` turn a 0–100 number into a colour/label.

**How it connects:** imported by basically every `.tsx` file. It's the visual single-source-of-truth.

---

## `frontend/app/layout.tsx` + `globals.css` — the shell

```tsx
export const metadata = { title: 'SentinelIQ — Insider Fraud Detection', icons:{icon:'/logo.png'} }
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>
}
```

`layout.tsx` wraps **every** page, sets the title/favicon, and loads `globals.css`.
`globals.css` sets the dark background, scrollbars, and all the animations (the sliding-in
alert rows, the pulsing "live" dot, the responsive mobile rules).

**How it connects:** the outermost wrapper. Every page renders inside it.

---

## `frontend/app/page.tsx` — the landing page (URL `/`)

```tsx
export default function LandingPage() {
  return ( ... <Link href="/dashboard">Launch dashboard</Link> ... )
}
```

A static marketing/intro page. No data fetching — just text, the hero image, and links into
`/dashboard`.

**How it connects:** the public front door; sends people to the dashboard.

---

## `frontend/app/dashboard/layout.tsx` — the dashboard wrapper

Wraps every `/dashboard/*` page and adds global behaviour:

```tsx
useEffect(() => {                          // health banner
  const check = () => api.health().then(r => setBackendStatus(...)).catch(() => setBackendStatus('offline'))
  check(); const id = setInterval(check, 30000); return () => clearInterval(id)
}, [])
useEffect(() => {                          // open alerts for the ⌘K palette
  const load = () => api.alerts({ status:'open', page_size:50 }).then(r => setAlerts(r.alerts))
  load(); const id = setInterval(load, 10000); return () => clearInterval(id)
}, [])
... // ⌘K opens CommandPalette; "G then H/A/C/I/U" jumps between pages
```

It polls `/health` every **30s** (to show the "BACKEND OFFLINE / INITIALIZING" banner) and
open alerts every **10s** (to feed the command palette), and wires up the keyboard shortcuts.

**How it connects:** provides the ⌘K `CommandPalette` and the status banner to all dashboard
pages. Each page still imports its own `Sidebar`.

---

## `frontend/app/dashboard/page.tsx` — the Overview (URL `/dashboard`)

```tsx
const fetchStats  = useCallback(async () => setStats(await api.stats()), [])
const fetchAlerts = useCallback(async () => {
  const res = await api.alerts({ page:1, status:'open', min_score:65 })
  // detect brand-new alerts and pop a notification
  const fresh = res.alerts.filter(a => !prevAlertIds.current.has(a.id))
  if (fresh.length > 0) setNewAlertNotif(fresh.sort((a,b)=>b.risk_score-a.risk_score)[0])
  setAlerts(res.alerts)
}, [])

useEffect(() => {
  fetchStats(); fetchAlerts(); fetchUsers()
  const interval = setInterval(() => { fetchStats(); fetchAlerts() }, 3000)   // every 3s
  return () => clearInterval(interval)
}, [...])
```

Polls `/api/stats` + `/api/alerts` **every 3 seconds**, shows 4 `StatCard`s, the `LiveFeed`,
recent high-risk alerts, and the Simulate dropdown. When a new alert appears it flashes a
notification.

**How it connects:** the home screen. Uses `StatCard`, `LiveFeed`, `UserTable`, `AlertPanel`,
all fed via `api.ts`.

---

## `frontend/components/LiveFeed.tsx` — the live event stream

```tsx
const poll = async () => {
  const data = await api.feed()
  const incoming = new Set(data.filter(e => !prevIds.current.has(e.id)).map(e => e.id))
  prevIds.current = new Set(data.map(e => e.id))
  setEvents(data); setNewIds(incoming)
  setTimeout(() => setNewIds(new Set()), 800)   // "new" highlight fades after 0.8s
}
poll(); const interval = setInterval(poll, 3000)   // every 3 seconds
```

Calls `/api/feed` every **3 seconds**, diffs against the previous list to find new rows, and
animates them in. Each row shows the description, user, risk, and an "ALERT ↗" tag if the
event triggered an alert (clicking it opens the alert).

**How it connects:** the visual proof the backend's `_event_loop` is alive. Its 3s rhythm
matches the loop's 3s rhythm.

---

## `frontend/components/StatCard.tsx` & `RiskBadge.tsx` — tiny display blocks

```tsx
// StatCard: one big number tile
<p>{label}</p><p style={{ color: accentColor }}>{value}</p>
{change !== undefined && <span style={{ color: change>0 ? C.critical : C.low }}>{change>0?`+${change}`:change}</span>}

// RiskBadge: a coloured pill, colour from the level
const color = COLORS[level]   // critical/high → red, medium → amber, low → green
<span style={{ border:`1px solid ${color}`, color }}>{LABELS[level]}{score && Math.round(score)}</span>
```

Pure presentation, no data fetching. `StatCard` shows a labelled number + a change arrow;
`RiskBadge` shows a colour-coded risk pill.

**How it connects:** fed props by the pages. `RiskBadge` uses `tokens.ts` colours so risk
colour is consistent everywhere.

---

## `frontend/components/UserTable.tsx` — the user list

```tsx
const level = riskLevel(user.risk_score)
<div style={{ background: riskColor(user.risk_score) }}>{initials}</div>   // coloured avatar
<span style={{ color: riskColor(user.risk_score) }}>{Math.round(user.risk_score)}</span>
<TrendArrow trend={user.risk_trend} />            // ↑ red / ↓ green / → grey
<RiskBadge level={level} size="sm" />
```

A table of users with a coloured avatar, risk score, a trend arrow, a `RiskBadge`, and a tiny
seeded sparkline. Clicking a row opens that user's profile.

**How it connects:** used on the Overview and Users pages with data from `api.users()`.

---

## `frontend/components/Sidebar.tsx` — the nav rail

```tsx
const NAV = [ {href:'/dashboard', label:'Overview'}, {href:'/dashboard/alerts', label:'Alerts'}, ... ]
<button onClick={() => window.dispatchEvent(new Event('sentinel:cmdk'))}>Search… ⌘K</button>
{NAV.map(({href,label}) => <Link href={href} aria-current={active?'page':undefined}>...)}
```

The 240px left rail. The search button fires a `sentinel:cmdk` event that the dashboard layout
listens for to open the command palette. Active link is highlighted via `usePathname()`.

**How it connects:** imported by every dashboard page. Its search button talks to
`dashboard/layout.tsx` via a custom browser event.

---

## `frontend/components/CommandPalette.tsx` — the ⌘K overlay

```tsx
const actions = [ {label:'Go to Alerts', hint:'G A', run:()=>router.push('/dashboard/alerts')}, ... ]
const alertItems = alerts.filter(a => a.status==='open' && (lq ? matches(a) : a.risk_score>=70))
const userItems  = lq ? users.filter(u => matches(u)) : []
const onKey = e => { if (e.key==='ArrowDown') setSel(s=>s+1); if (e.key==='Enter') items[sel].run() }
```

A search box over navigation + open alerts + users, with arrow-key navigation. The `alerts`
and `users` arrays are passed in from `dashboard/layout.tsx` (which polls them).

**How it connects:** opened by the layout (⌘K or the sidebar button); navigates via Next's
router. It doesn't fetch — it's given already-fetched data.

---

## `frontend/app/dashboard/alerts/page.tsx` — the alert queue (URL `/dashboard/alerts`)

```tsx
const fetchAlerts = useCallback(async () => {
  const res = await api.alerts({ risk_level, status, time_range, page, page_size:40, min_score })
  setAlerts(res.alerts); setTotal(res.total)
}, [riskLevel, status, timeRange, page, minScore])

const handleResolved = (id, newStatus) => { setAlerts(prev => prev.filter(a => a.id!==id)); fetchAlerts() }
const handleSimulate = async (label, scenario) => { await api.simulate(scenario); ...; fetchAlerts() }
const handleRetrain  = async () => setRetrainMsg((await api.retrain()).message)
```

A filterable, paginated grid of alerts (risk level / status / time range / min-score slider).
Clicking a row opens the `AlertPanel`. The toolbar has Simulate (injects a fraud and re-polls),
Retrain, and refresh.

**How it connects:** the main investigation screen. Reads `api.alerts`, mutates via
`api.simulate`/`api.retrain`, and hands a selected id to `AlertPanel`.

---

## `frontend/components/AlertPanel.tsx` — the alert detail modal

The richest component. When given an `alertId` it loads everything about that alert:

```tsx
useEffect(() => { api.alert(alertId).then(setAlert) }, [alertId])
useEffect(() => {
  api.alertTimeline(alert.id).then(setTimeline)
  api.auditLog({ alert_id: alert.id }).then(setAuditLog)
  api.peerComparison(alert.id).then(setPeerData)
}, [alert?.id])
```

Then it renders a two-column modal: model score cards, the `SHAPChart`, peer comparison, a
recommended action, notes, the investigation timeline, and analyst-action buttons:

```tsx
const handleResolve = async () => { await api.resolveAlert(alert.id); onResolved?.(alert.id,'resolved') }
const handleLabel   = async (label) => { await api.labelAlert(alert.id, label); ... }   // TP/FP
const handleExport  = async () => { const data = await api.exportAlert(alert.id); /* download JSON */ }
```

If the backend produced an `ai_narrative` it shows it; otherwise it builds a plain-English
explanation in the browser from the fraud type + top SHAP features (`generatePlainExplanation`).

**How it connects:** the hub of the alert experience — pulls from 4 endpoints, embeds
`SHAPChart` and `RiskBadge`, and calls back to the parent page when an alert is resolved so the
list updates.

---

## `frontend/components/SHAPChart.tsx` — the "why" bar chart

```tsx
const absMax = values.reduce((m,v) => Math.max(m, Math.abs(v.contribution)), 1e-9)
values.map(sv => {
  const isPositive = sv.direction === 'positive'        // red = pushed risk up, green = down
  const barPct = (Math.abs(sv.contribution) / absMax) * 46
  return <bar left or right of a centre axis, width barPct, value `+0.842` />
})
```

Draws each feature as a bar growing left (reduces risk, green) or right (increases risk, red)
from a centre line, sized relative to the biggest contributor, with a summary line naming the
top driver.

**How it connects:** fed `alert.shap_values` by `AlertPanel`. Those values are exactly what
`xgboost_model.py`'s `explain()` produced on the backend.

---

## `frontend/app/dashboard/users/page.tsx` — user monitoring (URL `/dashboard/users`)

```tsx
const fetchUsers = async () => setUsers(await api.users())
... setInterval(fetchUsers, 15000)                    // every 15s
// profile drawer:
api.user(userId).then(setDetail)                      // 30-day risk history + recent alerts
api.userEvents(userId, new Date().toISOString(), 200) // event timeline
const handleRestrict = async () => { await api.restrictUser(userId); ... }
const handleEscalate = async () => { await api.escalateUser(userId); ... }
```

Lists users (polled every **15s**), supports search + a watchlist (stored in `localStorage`),
and opens a profile with risk history and restrict/escalate actions.

**How it connects:** uses `UserTable`, `api.users/user/userEvents`, and the restrict/escalate
endpoints that set flags in the `users` table.

---

## `frontend/app/dashboard/cases/page.tsx` — kill-chain cases (URL `/dashboard/cases`)

```tsx
api.cases().then(setCases)                                   // list of grouped-alert cases
api.caseTimeline(caseId).then(setTimeline)                  // stitched incident timeline
const handleResolve = async () => await api.resolveCase(selectedCaseId)
const handleDismiss = async () => await api.dismissCase(selectedCaseId)
```

Shows the cases that `_update_or_create_case` built on the backend (case list on the left, a
stitched timeline on the right), with resolve/dismiss.

**How it connects:** the visual end of the case logic in `main.py` — reads the `cases` /
`timeline_items` tables via `api.cases`/`api.caseTimeline`.

---

## `frontend/app/dashboard/intelligence/page.tsx` + `IntelligenceCharts.tsx`

```tsx
const [intel, stats, modelInfo, webhook] = await Promise.all([
  api.intelligence(), api.stats(), api.modelInfo(), api.getWebhook(),
])
const retrainPromise = api.retrain()                    // with a fake "training log" stream
await api.setWebhook(webhookInput.trim())               // save alert webhook URL
```

The page fetches model metrics and renders the 3 model cards (P/R/F1), a retrain button with a
terminal-style log, and the webhook setting. `IntelligenceCharts.tsx` draws the charts with
the `recharts` library:

```tsx
<LineChart data={data.alert_volume_last_7_days}><Line dataKey="count" stroke={C.critical} /></LineChart>
// + horizontal bars for anomaly distribution and department risk, + an FP-trend line
```

**How it connects:** reads `api.intelligence` / `api.modelInfo`, mutates via `api.retrain` /
`api.setWebhook`. The numbers come from `get_intelligence` in `main.py`.

---

## Frontend config files (what they do, briefly)

- **`package.json`** — the library shopping list (React, Next, recharts, framer-motion,
  lucide-react) and the `dev`/`build`/`start` scripts. Used by `npm`.
- **`package-lock.json`** — exact locked versions so installs are reproducible. Auto-managed.
- **`next.config.js`** — Next settings; turns on strict mode and adds `X-Frame-Options: DENY`.
- **`tsconfig.json`** — TypeScript settings, including the `@/...` import shortcut used everywhere.
- **`tailwind.config.ts`** + **`postcss.config.js`** — plumbing so Tailwind CSS works (mostly
  the project uses inline `C` colours, but base CSS resets run through here).
- **`.env.example`** / **`.env.local.example`** — templates for `NEXT_PUBLIC_API_URL` (prod HF
  URL / local `localhost:8000`). You copy one to `.env.local`.
- **`next-env.d.ts`** — auto-generated TypeScript helper. "Do not edit."
- **`public/logo.png`, `hero-bg.png`, `ops-room.png`** — static images (favicon, landing hero,
  landing decoration). These PNGs are why the backend is pushed to HuggingFace as a *subtree*
  (HF blocks pushes containing binary images).

---

# PART 3 — THE CERT RESEARCH SCRIPTS (`scripts/cert/`)

These are **separate** from the running app. They use the real CMU CERT r4.2 dataset to prove
our synthetic data is realistic and to demo on a real attacker.

## `build_cert_profile.py`

```python
def count_logon_hours(path, limit):     # read logon.csv, count logons per hour 0..23
    if "logon" not in row[act_col].lower(): continue        # only logons
    hour = datetime.strptime(raw, "%m/%d/%Y %H:%M:%S").hour
    hour_counts[hour] += 1
weights = [count/total for count in hour_counts]            # normalise to sum 1.0
json.dump({"hour_weights": weights, "night_rate": ...}, open(PROFILE_OUT,"w"))
```

Reads the real logon times and writes `backend/data/cert_profile.json` (24 hour-weights +
night rate). Read-only on the CSV; run by hand.

**How it connects:** produces the file the generator can OPTIONALLY use to add realistic night
activity. Off by default.

## `validate_against_cert.py`

```python
cert_hours, cert_per_user = cert_login_hours(LOGON_CSV, 400_000)     # real data
syn_hours, syn_per_user   = synthetic_login_hours()                  # our generator's data
plt.bar(... cert_h ...); plt.bar(... syn_h ...)                      # overlay charts
(OUT/"validation_summary.txt").write_text(summary)
```

Generates events from **our own** `SyntheticGenerator`, compares the login-hour distribution
to CERT's, and saves charts + a summary into `out/`. The honest finding (in
`out/validation_summary.txt`): both are business-hours-dominant, but CERT keeps ~4.5% night
background while ours is ~0% (a bit too clean).

**How it connects:** imports the real backend generator to validate the real distribution. The
PNGs/txt in `out/` are the evidence used in the deck.

## `cert_to_ingest.py`

```python
TARGET_USER = "CAH0936"                  # a known CERT malicious insider
payload = { "user_id": user_id, "event_type": "data_export", "location":"external",
            "hour": hour, "download_mb": 120.0, "system":"CERT-r4.2" }   # map CERT row → our event
if send: post_payload(url, payload)      # POST to /api/ingest; default is --dry-run (prints only)
```

Takes a real attacker's recorded events (off-hours logon → USB connect → upload) and replays
them through `POST /api/ingest`, so the real attack flows through our ML and lights up the
dashboard. `--dry-run` (default) makes no network calls; `--send` actually posts.

**How it connects:** feeds real data into the same `_process_event` pipeline as everything
else, via the `/api/ingest` endpoint — proving the system works on real attack data.

## Other CERT files

- **`scripts/cert/README.md`** — how to place the CERT data and the `CERT_DATA_DIR` variable.
- **`out/login_hour_distribution.png`, `out/off_hours_ratio.png`, `out/validation_summary.txt`**
  — the generated comparison evidence.

---

# PART 4 — DATA + ROOT FILES (briefly)

- **`datasets/cert/r4.2/logon.csv`, `device.csv`, `LDAP/*.csv`** — the real CERT activity +
  role data the scripts read. **Not in git** (multi-GB).
- **`datasets/cert/answers/…`** — the answer keys: which users were insiders and their exact
  events (e.g. `r4.2-1/r4.2-1-CAH0936.csv`).
- **`sentineliq/README.md`** — the GitHub front page (problem, solution, run steps, live links).
- **`sentineliq/start_backend.ps1` / `start_frontend.ps1`** — local one-command start scripts.
- **`sentineliq/.gitignore`** — keeps the DB, trained models, `node_modules`, `.env` out of git.
- **`sentineliq/.gitattributes`** — stores images via Git LFS.
- **Root `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `Pexp.md`, this file** — documentation.
- **Root `.env`, `skills-lock.json`, `.claude/`, `.impeccable/`, `docs/*.docx`,
  `Sigmoid_Idea2.0_submission.pdf`** — notes, assistant config, and the deliverable documents.
  None of these run as part of the app.

---

# PART 5 — HOW IT ALL CONNECTS AS ONE SYSTEM

Now the whole machine in one story. Follow a single event:

1. **Heartbeat.** `main.py`'s `_event_loop` wakes every 3 seconds and asks
   `synthetic_generator.py` for one event (every 15th is a forced fraud).
2. **Translate.** `main.py` passes it to `feature_engineering.py` → the **8 numbers**, measured
   against that user's last-20-events history.
3. **Score.** `main.py` calls `ensemble.py`'s `predict`, which asks the three model files —
   `isolation_forest.py` (rare?), `lstm_autoencoder.py` (off-pattern?), `xgboost_model.py`
   (fraud-like?) — and blends them `0.4/0.4/0.2` into a 0–100 score.
4. **Decide.** Back in `_process_event`, if score ≥ 65 it makes an alert, asks
   `xgboost_model.py` for the SHAP "why," builds a timeline, and (on a 2nd alert in 24h) opens
   a case.
5. **Store.** It writes the event/alert/case into `sentineliq.db` using the table classes in
   `database.py`.
6. **Serve.** The endpoints in `main.py` expose this data, shaped by `schemas.py`.
7. **Show.** The website's `lib/api.ts` fetches those endpoints (LiveFeed every 3s, Overview
   every 3s, Users every 15s, etc.), and the pages/components paint it using `tokens.ts`
   colours. `AlertPanel.tsx` + `SHAPChart.tsx` show the "why."
8. **Feedback loop.** An analyst clicks resolve/label (TP/FP) in `AlertPanel` → `api.ts` →
   `main.py` writes the label → `/api/retrain` refits `xgboost_model.py` on those labels →
   the model gets a little smarter.

And the deployment that hosts all this:

- **GitHub** is the source of truth. **Vercel** auto-redeploys the **frontend** when
  `frontend/` changes. The **backend** is pushed as a Git subtree to **HuggingFace**, which
  rebuilds the Docker container (`Dockerfile`) and runs `main.py` on port 7860.
- HuggingFace **sleeps after ~15 min** and **wipes storage on restart**, so an uptime pinger
  keeps it awake and `seed_demo_state()` rebuilds a believable starting state every boot.

**One sentence:** `synthetic_generator.py` invents an event → `feature_engineering.py` turns
it into 8 numbers → the three models in `models/` score it → `ensemble.py` blends them →
`main.py` decides if it's an alert and saves it to `sentineliq.db` → the Vercel website polls
`main.py`'s endpoints through `lib/api.ts` and paints it on your screen.
