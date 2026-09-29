---
name: project-state
description: SentinelIQ iDEA 2.0 POC — current build status and remaining deliverables
metadata: 
  node_type: memory
  type: project
  originSessionId: ed80e215-9e9a-4529-9557-805f1ba4fad4
---

SentinelIQ is a working insider fraud detection POC for iDEA 2.0 Round 2. All code is built and deployed.

**Live URLs:**
- Frontend: https://sentineliq-gold.vercel.app/
- Backend: https://rak2315-sentineliq-backend.hf.space
- GitHub: https://github.com/RAK2315/sentineliq.git

**What's fully built:** 5 dashboard pages, 3-model ML ensemble (IF + LSTM + XGBoost), SHAP explanations, active learning retrain loop, simulate dropdown (3 fraud scenarios), kill-chain cases, model intelligence page with training log, user monitoring with restrict/escalate, peer comparison, evidence export, coordinated activity banners. Full backend redesign completed 2026-05-22: dual-timestamp architecture (occurred_at/ingested_at), LLM narrative via Grok API (grok-3-mini, requires GROK_API_KEY HuggingFace secret), deterministic seed_demo_state() with idempotency guard, TimelineItemModel table, 8 performance indexes, min_score slider on alerts page, AI Analysis card in AlertPanel.

**Deliverables status:**
- D1 Problem Brief: docs/D1_Problem_Solution_Brief.docx ✓
- D2 Live demo: deployed ✓, video: NOT RECORDED YET
- D3 Technical Architecture: docs/D3_Technical_Architecture.docx ✓
- D4 GitHub README: sentineliq/README.md ✓ (YouTube URL placeholder needs filling)
- D5 Pitch deck: NOT CREATED YET (slide deck + video both required)

**Why:** iDEA 2.0 Phase 2 submission requires all 5 deliverables. Videos and pitch deck are the remaining blockers.
**How to apply:** When working on new features, note that the POC is already feature-complete. Priority is submission prep (D2 video, D5 deck + video).
