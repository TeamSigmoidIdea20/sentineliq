---
name: feedback-style
description: Coding and communication preferences learned across sessions
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ed80e215-9e9a-4529-9557-805f1ba4fad4
---

**Use `C` token object from `lib/tokens.ts` for ALL colors — never raw hex strings in JSX.**
**Why:** Design consistency rule. Raw hex bypasses the token system and breaks when tokens change.
**How to apply:** Always import `{ C }` from `@/lib/tokens` and use `C.critical`, `C.border`, etc.

**Complete files only — no stubs, no TODOs, no placeholder comments.**
**Why:** User wants working code, not scaffolding to fill in.
**How to apply:** Every file written must be fully functional end-to-end.

**Keep responses short and direct.**
**Why:** User works fast, doesn't need explanation of obvious things.
**How to apply:** State what you're doing, do it, report result. Skip preamble.

**Git repo is at `sentineliq/` subdirectory, not the workspace root.**
**Why:** The workspace root `D:\REHAAN\1. Ml Projects\22. Idea2.0` is not a git repo. The git repo is inside `sentineliq/`.
**How to apply:** Always `cd sentineliq` before any git commands.

**Backend runs on port 8000 locally, HuggingFace Spaces on port 7860.**
**Why:** HuggingFace requires port 7860 in Docker.
**How to apply:** Local dev uses 8000. Production Dockerfile exposes 7860.
