# Premium Refinement Workflow

The polishing loop: the iterative process of moving from a working scaffold to a premium output. This is where design actually happens.

---

# The Core Loop

Screenshot → Critique → One Specific Change → Screenshot → Compare → Next Change

Never make more than one significant change per iteration. Multiple changes at once make it impossible to know what worked.

---

# Phase 1: Baseline Assessment

Step 1 — Take a full-page screenshot of the current state.
This is the baseline. Every subsequent iteration compares to this.

Step 2 — Run the 10-question evaluation framework.
From SKILL.md. Answer each question honestly. Mark failures.

Step 3 — Categorize the failures.
Structural (layout, hierarchy): fix first.
Surface (color, spacing, typography): fix second.
Detail (hover states, transitions, micro-copy): fix last.

Step 4 — Rank the top 3 failures by impact.
Only the top 3 matter for the first refinement pass. Everything else waits.

---

# Phase 2: Structural Fixes

Step 5 — Identify the section with the worst hierarchy.
Usually: the hero (if it is centered with no dominant element) or the features section (if it is three identical cards).

Step 6 — Redesign one section at a time.
Do not try to redesign multiple sections simultaneously. Fix the hero completely before touching features.

Step 7 — Compare to reference after each section fix.
Ask: "Now that the hierarchy is fixed, which specific gap remains between this and the reference?"

Step 8 — Continue until all structural issues are resolved.
A page should not move to surface refinement while structural problems remain. Surface polish on a broken structure produces a well-dressed skeleton.

---

# Phase 3: Surface Refinement

Step 9 — Typography pass.
Is the headline weight heavy enough? Is body text size and line-height comfortable? Is there genuine contrast between heading levels? Adjust until yes.

Step 10 — Spacing pass.
Is the section padding generous enough? Are internal element gaps deliberate? Is there breathing room around the primary focal points? Add space until it feels right.

Step 11 — Color pass.
Is the accent used sparingly? Is there a clear dominant/accent/neutral? Is text contrast sufficient at all three hierarchy levels? Adjust until yes.

Step 12 — Anti-slop check.
Are there gradients, glow effects, identical cards, over-centered layouts, or generic imagery? Name each violation and replace.

---

# Phase 4: Section-by-Section Detail

Step 13 — Work through each section sequentially: hero → logo bar → features → how it works → testimonials → pricing → CTA.

Step 14 — For each section, ask:
- What is the single most important thing here?
- Is that thing visually dominant?
- Does this section feel different from the section before it (varied rhythm)?
- Is the CTA (if present) clearly the primary action?

Step 15 — Refine one section to completion before moving to the next.
An 80% complete full page is worse than a 100% complete half page. Depth before breadth.

---

# Phase 5: Polish Pass

Step 16 — Add hover states to everything interactive.
Buttons, cards, links, icons. All five states: hover, active, focus, disabled (if applicable), loading (if applicable).

Step 17 — Add micro-transitions.
State changes smooth. No instantaneous content swaps. Loading states present.

Step 18 — Add scroll reveal animations selectively.
Hero elements, section headings, primary feature cards. Not everything — selective reveal creates emphasis.

Step 19 — Check mobile.
Section padding. Font sizes. Button tap targets (minimum 44px). No horizontal overflow.

Step 20 — Run final_polish_checklist.md.
Every item checked before shipping.

---

# Iteration Cadence

Each iteration cycle: one specific request → one implementation → one screenshot → one comparison → next request.

Target: 10-20 iteration cycles on a quality landing page before shipping.
Do not rush. Each cycle moves the design forward. Stopping at 3-4 cycles produces Level 2-3 output.

---

# The "What Is Missing" Method

After each iteration, instead of asking "what should I change," ask "what does this page have that the reference has that mine still doesn't?"

The reference comparison is always more specific than a general critique. Closing the gap between your page and the reference is the refinement process made concrete.
