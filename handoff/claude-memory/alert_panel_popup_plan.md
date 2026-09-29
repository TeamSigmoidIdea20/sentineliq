---
name: alert-panel-popup-plan
description: Planned redesign of AlertPanel from right-side drawer to centered two-column incident brief overlay
metadata: 
  node_type: memory
  type: project
  originSessionId: dd0b706b-60b6-4f35-93d8-7216e17c57ef
---

# Alert Panel → Centered Incident Brief (PLANNED, NOT YET IMPLEMENTED)

**Why:** User asked to upgrade the 600px right-side drawer to a better popup UI.

## Design

- **Outer shell:** ~900px wide, ~85vh max-height, centered on screen, `rgba(0,0,0,0.65)` backdrop
- **Top border:** 2px in severity color (red/amber/green) across full width
- **Animation:** scale 97% → 100% + fade in. Escape key closes.
- **Two columns:**
  - LEFT (55%): large risk score + badge, user/role/dept/time, fraud type tag, ML Detection chips (IF/LSTM/XGB), SHAP chart (wider = better), In Plain Terms narrative, Peer Comparison bars
  - RIGHT (45%): Investigation Timeline (own column, more space), pinned Action Footer (Resolve, Dismiss, Label TP/FP, Note, Export)

## Files to change

| File | Change |
|------|--------|
| `components/AlertPanel.tsx` | Full restructure: centered overlay, two-column layout, threat border, pinned action footer, Escape key handler |
| `app/dashboard/alerts/page.tsx` | Remove `inline` prop, remove right-side panel div, use same overlay |
| Everything else | No change - same alertId/onClose/onResolved props API |

## What stays the same

All data: SHAP, ML scores, narrative, timeline, peer comparison, notes, export.

**Why:** User said "keep the plan in memory, I will tell when to implement."
