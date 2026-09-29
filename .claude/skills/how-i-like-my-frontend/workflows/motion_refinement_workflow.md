# Motion Refinement Workflow

A structured process for adding, evaluating, and iterating motion on an existing design.

---

# Phase 1: Motion Audit

Step 1 — Inventory what motion already exists.
List every animation: what element, what trigger, what effect, what duration.

Step 2 — Evaluate each motion against the subtlety standard.
Does the user notice it while it is playing? If yes: it is probably too prominent.
Does removing it make the page feel worse? If no: remove it.

Step 3 — Check for purposeless motion.
Anything animating that is not: communicating state, guiding attention, or tied to the product concept is a candidate for removal.

---

# Phase 2: Identify Motion Opportunities

Step 4 — List the elements that should have motion but do not.
Common gaps: hover states on buttons/cards, scroll-triggered section reveals, loading states, state transitions (tabs, modals).

Step 5 — Identify the one signature motion element.
What single animation could become the page's visual signature? Usually tied to the hero or the core product concept.

Step 6 — Prioritize by user impact.
Motion the user will interact with most (hover states, button feedback) matters more than motion they will see once (hero entrance).

---

# Phase 3: Hover State Motion

Step 7 — Implement hover states on all interactive elements.
Buttons: background shift + slight scale (1.02) or no scale + timing 150-200ms.
Cards (clickable): translateY(-3px) + box-shadow increase, 200-250ms.
Links: color transition + underline scale-in, 150-200ms.

Step 8 — Test each hover state for physical feel.
Does it feel like touching something real? If it feels like a CSS toggle (instant, mechanical), slow it down and add easing.

Step 9 — Check timing consistency.
All hover states on the same page should use consistent durations (within a narrow range). Mixed timings (150ms buttons, 400ms cards) feel inconsistent.

---

# Phase 4: Scroll Reveal Motion

Step 10 — Select elements to reveal on scroll.
Choose selectively: section headings, primary feature elements, hero statistics. Not every paragraph.

Step 11 — Implement standard scroll reveal.
Pattern: opacity 0 → 1, translateY 24-30px → 0, duration 400-550ms, ease-out easing, trigger once on first enter.

Step 12 — Add stagger for grouped elements.
When multiple sibling elements reveal (feature cards, list items): stagger 60-80ms delay between each.

Step 13 — Test at different scroll speeds.
Fast scrollers should still see the animation. If the animation starts and ends before the user perceives it, the duration is too short.

---

# Phase 5: State Transition Motion

Step 14 — Identify all content state changes.
Tab panels, modal open/close, accordion expand, dropdown open.

Step 15 — Add transition to every content state change.
No state change should be instantaneous. Minimum: 150ms fade. Better: fade + subtle position shift.

Step 16 — Test each transition.
Does it feel responsive (not laggy)? Does it feel smooth (not snappy-mechanical)? The sweet spot is 200-300ms with ease-in-out.

---

# Phase 6: Signature Motion

Step 17 — Design the hero signature motion.
What is the one motion element that will define this page's character? Reference the visual_storytelling.md and the product concept.

Step 18 — Implement and evaluate.
Does the motion feel connected to the product concept? Is it subtle enough to live with on repeat visits? Does it distract from the primary CTA?

Step 19 — Test the loop (if applicable).
If the hero uses a looping video or animation: confirm the loop point is invisible. A visible loop break destroys the effect.

---

# Phase 7: Reduced Motion Compliance

Step 20 — Add prefers-reduced-motion media query.
All non-essential animations should be disabled for users with motion sensitivity preferences.

CSS: @media (prefers-reduced-motion: reduce) { [animation/transition: none] }
Framer Motion: useReducedMotion() hook to disable variants.

---

# Motion Audit Checklist

- [ ] No animations that play without user triggering or scroll
- [ ] All hover states have transitions (none are instantaneous)
- [ ] Scroll reveals trigger once only, not on reverse scroll
- [ ] All state transitions have motion (tabs, accordions, modals, dropdowns)
- [ ] Stagger applied to grouped sibling elements
- [ ] prefers-reduced-motion implemented
- [ ] No animations faster than 100ms or slower than 800ms without strong justification
- [ ] Hero motion loops invisibly (if applicable)
