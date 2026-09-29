# HANDOFF - Continuing SentinelIQ on a New Laptop

Read this first (human or Claude Code). `CLAUDE.md` has the full technical context;
this file explains **what's where**, **what was moved into the repo**, and **what to do
immediately after cloning**.

---

## 1. Background: the old laptop layout

On the old laptop the git repo (`sentineliq/`) sat inside a bigger workspace folder:

```
<workspace root>\                         <- NOT a git repo (new laptop: D:\Projects\18. sentinel ai\)
├── CLAUDE.md, DESIGN.md, PRODUCT.md      <- were outside git
├── .claude/ (skills + local settings)    <- was outside git
├── .impeccable/design.json               <- was outside git
├── docs/ (D1, D3 docx, explainers)       <- was outside git
├── submission PDF                        <- was outside git
├── datasets/cert/  (4.6 GB CERT r4.2)    <- too big, NOT in git
└── sentineliq/                           <- the git repo
```

Everything except `datasets/` has now been copied **into** the repo, so a plain clone
gives you all of it.

---

## 2. What's where (inside the repo)

| Path | What it is |
|------|------------|
| `CLAUDE.md` | Main Claude Code context: stack, design rules, ML models, endpoints, pages, deploy quirks. Auto-loaded by Claude Code. |
| `HANDOFF.md` | This file. |
| `DESIGN.md` | Design system / visual language doc (used by the `impeccable` skill). |
| `PRODUCT.md` | Product brief: users, purpose, tone (used by the `impeccable` skill). |
| `.impeccable/design.json` | Impeccable skill's design-token state. |
| `.claude/skills/` | Project skills: `impeccable`, `how-i-like-my-frontend`, `gamification`, `retention-architecture`, `solo-startup-execution`. Claude Code picks these up automatically when run from the repo root. |
| `handoff/claude-memory/` | Copy of Claude Code's auto-memory from the old laptop (user prefs, project state, known bugs, planned Alert Panel redesign). See step 4 below. |
| `docs/D1_Problem_Solution_Brief.docx` | Problem + solution brief (archive). |
| `docs/D3_Technical_Architecture.docx` | Technical architecture doc (archive). |
| `docs/Pexp.md` | Plain-English walkthrough of the whole project + tough Q&A (presentation prep). |
| `docs/explanation_working.md` | Detailed file-by-file code explanation. |
| `docs/*.pdf` | Earlier submission PDF (archive, not maintained). |
| `README.md` | Public GitHub README, framed for CodeArambh 2.0 (Open Innovation, cybersecurity). |
| `backend/` | FastAPI + ML (deployed to HuggingFace Spaces via subtree push). |
| `backend/main.py` | App, all endpoints, live event loop, seeding, simulate, retrain. |
| `backend/database.py` / `schemas.py` | SQLAlchemy async models + Pydantic schemas. |
| `backend/data/` | Synthetic generator, feature engineering, `cert_profile.json`. |
| `backend/models/` | Isolation Forest, LSTM AE, XGBoost (+SHAP), ensemble. `saved/` is gitignored - models retrain on first boot. |
| `backend/scripts/seed_demo.py` | Demo seeding helper. |
| `frontend/` | Next.js 14 app (deployed to Vercel from GitHub). |
| `frontend/lib/tokens.ts` | `C` colour tokens - use for ALL colours. |
| `frontend/lib/api.ts` | Typed API client. |
| `scripts/cert/` | CERT benchmark tooling (needs the dataset - see below). |
| `start_backend.ps1` / `start_frontend.ps1` | One-shot local run scripts (Windows). |

**Not in git (recreate locally):** `datasets/cert/`, `backend/venv/`, `frontend/node_modules/`,
`.env` / `.env.local` files, `backend/sentineliq.db`, `backend/models/saved/*`.

---

## 3. Do this IMMEDIATELY on the new laptop

### 3.1 Clone + remotes
```bash
git clone https://github.com/TeamSigmoidIdea20/sentineliq.git
cd sentineliq
git remote add hf https://huggingface.co/spaces/rak2315/sentineliq-backend
```
Make sure `git lfs install` is run (PNG/JPG files are tracked by LFS, see `.gitattributes`).

### 3.2 Private / secret stuff - none of this is in git, set it up yourself
The GitHub repo is **PUBLIC**. Never commit any of these:

| Secret / private item | Where it lives | What to do |
|---|---|---|
| GitHub login | git credential manager | Sign in on first push (browser prompt or PAT). |
| HuggingFace write token | git credential for `huggingface.co` | Create at huggingface.co → Settings → Access Tokens (write). Use as password on first `git push hf`. |
| `GROK_API_KEY` | HuggingFace Space → Settings → Secrets | Already set on the Space; nothing to do unless rotating. For local LLM narratives, put it in `backend/.env` (gitignored). |
| `backend/.env` | local only | `cp backend/.env.example backend/.env` |
| `frontend/.env.local` | local only | `cp frontend/.env.local.example frontend/.env.local` (points at `http://localhost:8000`) |
| Vercel env `NEXT_PUBLIC_API_URL` | Vercel dashboard | Already set; nothing to do. |
| Claude Code memory | `~/.claude/projects/<path>/memory/` | See 3.4 - it's machine-local, not synced. |

If this repo should not expose the docs/submission PDF publicly, switch the GitHub repo to
**Private** (Settings → General → Danger Zone). Vercel keeps deploying from private repos.

### 3.3 Run it locally
```bash
# Backend (Python 3.10)
cd backend
python -m venv venv && venv\Scripts\activate      # Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                                         # http://localhost:3000
```
First backend boot trains models (no `models/saved/` yet) - takes a bit.

### 3.4 Restore Claude Code memory
Claude Code stores memory per absolute project path under
`~/.claude/projects/<path-with-dashes>/memory/`. Open Claude Code once in the repo folder so
that directory gets created, then copy `handoff/claude-memory/*.md` into it. Or just tell
Claude Code: *"copy handoff/claude-memory into your memory directory."*

Key points from that memory (in case you skip it):
- Keep responses short and direct; complete files only, no stubs/TODOs.
- **Never** add `Co-Authored-By: Claude` or any Claude attribution to commits/PRs.
- Always use `C` from `lib/tokens.ts` for colours.
- Alert Panel → centered two-column overlay redesign is PLANNED, implement only when asked.

### 3.5 Optional: CERT dataset
Only needed for `scripts/cert/*`. Download CMU CERT Insider Threat r4.2 (KiltHub / CMU SEI)
and place it at `<folder above repo>/datasets/cert/`, or set `CERT_DATA_DIR` to its path.
The app itself does NOT need it (`backend/data/cert_profile.json` is already committed).

---

## 4. Deploying

```bash
git push origin main                                                   # GitHub -> Vercel auto-deploys
git push hf "$(git subtree split --prefix backend main)":main --force  # backend -> HF Spaces
```
HF rejects binary files, hence the subtree push of `backend/` only.

---

## 5. What's left (CodeArambh 2.0, Open Innovation track)

- PPT on the official CodeArambh template - not created (due 10 October 2026).
- Known low-priority bugs: `handoff/claude-memory/known_bugs.md`.
- Future features: activity heatmap, decision timer, MITRE ATT&CK chips (see `CLAUDE.md`).
