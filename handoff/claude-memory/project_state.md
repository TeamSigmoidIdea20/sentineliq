---
name: project-state
description: "SentinelIQ - cybersecurity insider threat detection POC; build status and what's left"
metadata:
  type: project
---

SentinelIQ is a working, deployed insider threat detection POC, framed as a general cybersecurity product (banks/fintech as the flagship use case). All code is built and deployed.

**Live URLs:**
- Frontend: https://sentineliq-gold.vercel.app/
- Backend: https://rak2315-sentineliq-backend.hf.space
- GitHub: https://github.com/TeamSigmoidIdea20/sentineliq.git (remote `origin`; remote `hf` = https://huggingface.co/spaces/rak2315/sentineliq-backend)

**What's fully built:** 5 dashboard pages, 3-model ML ensemble (IF + LSTM + XGBoost), SHAP explanations, active learning retrain loop, simulate dropdown, kill-chain cases, model intelligence page with training log, user monitoring with restrict/escalate, peer comparison, evidence export, coordinated activity banners, dual-timestamp backend, LLM narrative via Grok (grok-3-mini, GROK_API_KEY HF secret), deterministic seed_demo_state().

**Why:** The repo is public and reused across events, so it must stay event-neutral.
**How to apply:** Never name any event, competition, sponsor or organiser anywhere in the repo. Frame copy around cybersecurity, innovation, a working scalable prototype, practical value and user impact. Use normal dashes, never em or en dashes.
