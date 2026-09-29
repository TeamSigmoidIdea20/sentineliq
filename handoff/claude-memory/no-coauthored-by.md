---
name: no-coauthored-by
description: Never add Co-Authored-By Claude (or any Claude attribution) to git commits/PRs
metadata: 
  node_type: memory
  type: feedback
  originSessionId: fc5f6b60-cf0d-482c-b190-65e6a8ddf2d4
---

Never include a `Co-Authored-By: Claude ...` trailer (or any Claude/Anthropic attribution) in git commit messages or PR descriptions, ever.

**Why:** The user does not want commits to show they were made with Claude. The user-level setting `includeCoAuthoredBy: false` + `attribution.commit/pr: ""` is already set, but those only stop the AUTO-added trailer — they do NOT stop me from manually typing the line into a commit message. The trailer kept appearing because I was hand-writing it.

**How to apply:** When writing any commit message or PR body, do NOT add a Co-Authored-By line or any "made with Claude" text. Plain message only.
