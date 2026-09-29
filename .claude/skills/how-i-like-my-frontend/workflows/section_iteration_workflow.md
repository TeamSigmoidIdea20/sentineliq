# Section Iteration Workflow

A tight loop for iterating on a single section until it is genuinely complete. Use this when a section is working but not yet premium.

---

# The Section Iteration Loop

Isolate → Evaluate → Target One Problem → Implement → Compare → Next Problem → Repeat

Never change more than one significant thing per iteration within a section.

---

# Phase 1: Isolate

Step 1 — Screenshot the section in isolation.
Crop to show only this section. This removes distraction from other sections.

Step 2 — Find the best reference for this type of section.
Use section_patterns.md to identify what a premium version of this section type looks like. Find one specific reference.

Step 3 — Screenshot the reference at the same section crop.
Now you have a comparison: your current state vs. the reference.

---

# Phase 2: Evaluate

Step 4 — Answer these questions for the section:
- What is the focal point of this section? Is it clear?
- Is the typographic hierarchy contrasted enough?
- Does the layout avoid centering everything?
- Is the spacing generous and rhythmic?
- Is there an anti-slop pattern present?
- What specifically does the reference have that this section does not?

Step 5 — Name the top 3 problems in priority order.
Priority 1 is always structural (hierarchy, layout). Priority 2 is surface (color, type, spacing). Priority 3 is detail (hover, transitions).

---

# Phase 3: One Problem at a Time

Step 6 — Fix priority 1 problem.
Ask Claude for this specific change only. "In the features section, I need to fix the hierarchy — the three cards are equal weight and nothing dominates. Change to a bento layout where the first card is double width."

Step 7 — Screenshot after the change.
Compare to the reference. Did the problem improve? By how much?

Step 8 — If yes: move to priority 2.
If no: try a different approach to the same problem. Do not move to priority 2 with priority 1 unsolved.

---

# Phase 4: Surface Refinement

Step 9 — Typography pass for this section.
Is the section heading large enough (36px minimum for a section heading)? Is the weight sufficient? Is the body text size comfortable?

Step 10 — Spacing pass for this section.
Is the section padding generous (80px+ vertical)? Is internal card padding sufficient (24px+)? Is there breathing room around the focal element?

Step 11 — Color pass for this section.
Does the accent appear where it should (on the key action or the key emphasis)? Is it used sparingly (once or twice in this section maximum)?

---

# Phase 5: Detail Polish

Step 12 — Hover states.
If any element in this section is interactive: does it have a hover state? Card hover, link hover, button hover.

Step 13 — Scroll reveal.
Does the section heading and primary element have a scroll reveal? Is it subtle (20-30px translateY, opacity 0-1)?

Step 14 — Final section comparison.
Screenshot the section. Compare to the reference. List remaining gaps. Accept or continue.

---

# Acceptance Criteria for a Section

A section is complete when:
- There is one clear focal point
- Typography hierarchy is contrasted (at least 2x size/weight between headline and body)
- Spacing is generous and rhythmic
- No anti-slop patterns are present
- Interactive elements have hover states
- The section feels structurally different from adjacent sections (varied rhythm)
- Comparing to the reference: the gap is small and explainable

A section is not complete when:
- The focal point is ambiguous
- Typography is flat
- Three identical cards exist with no hierarchy between them
- Anti-slop patterns remain
- Interactive elements have no hover states
