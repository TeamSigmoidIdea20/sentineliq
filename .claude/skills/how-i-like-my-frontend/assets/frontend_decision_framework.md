# Frontend Decision Framework

Decision trees for common frontend design choices. Use when uncertain about a direction.

---

# Dark System vs Light System

Should this design use a dark or light background system?

Start: What is the primary product category?

Developer tool or technical SaaS → dark (strongly preferred)
Analytics or data product → dark (preferred)
Security or fintech → dark (preferred)
Consumer product (general audience) → light (preferred)
Education or wellness → light (preferred)
Creative tool → both viable (dark for premium/serious, light for accessible/playful)

Refine: What emotional direction is target?

Precise/intelligent → dark (even stronger preference)
Premium/exclusive → dark (even stronger preference)
Warm/approachable → light (even stronger preference)
Bold/confident → either (execution matters more than base)

Rule: When uncertain, choose dark. A strong dark design is harder to execute but harder to make generic. Light systems have more competition and require stronger differentiation.

---

# When to Use Motion

Should this element or interaction have an animation?

Ask: Does removing this animation make the design better, worse, or neutral?

Better → do not add it (it was creating noise)
Neutral → do not add it (it adds overhead without value)
Worse → add it (it is contributing to the design)

Ask: Does this animation serve a purpose?

State change communication → yes, animate
Attention guidance → yes, animate selectively
Confirmation of interaction → yes, animate (hover, pressed states)
Background decoration → no, do not animate
Demonstrating capability → yes, if the motion is concept-specific

Rule: Default to no animation. Add animation only when its absence makes the design worse.

---

# When to Add Imagery vs Rely on Typography

Should the hero use imagery or be purely typographic?

Use imagery when:
- The product has a clear visual metaphor that a concept image can communicate
- Product UI screenshots can be shown without looking generic
- A looping concept video is feasible (right product, right budget)

Use typography alone when:
- The product concept is abstract and imagery would be generic
- The headline is strong enough to carry the hero without visual support
- A typographic hero would differentiate from the image-heavy competition in this category
- The design has genuine type confidence (excellent typeface choices, strong scale)

Rule: A weak typographic hero is worse than a good imagery hero. Only choose typography-only if the type choices are exceptional.

---

# How Many Colors

How many prominent colors should this design use?

Start with one: the background (dominant).
Add one: the accent (for all CTAs and key emphasis).
Add one: a neutral system (grey scale for text and borders).

That is three. This is always sufficient.

Should I add a fourth? Ask:
- Does the fourth color serve a unique purpose that cannot be served by adjusting opacity of the existing three?
- Is the fourth color clearly in a different role from the accent?

If yes to both: potentially add it.
If no to either: do not add it.

Rule: Every color added after the first three must justify its existence against the cost of palette complexity.

---

# Which Layout for This Section

What layout should this section use?

Hero: Left-weighted two-column unless typographic hero or full-bleed video is chosen. Never default-center.

Feature showcase with 4-8 features: Bento grid with varied sizing.

Feature showcase with 2-3 major features: Alternating feature rows.

Testimonials:
- 2-4 testimonials: 2-column or 3-column grid.
- 1 strong testimonial: Single large featured quote, full width.
- Many testimonials: Scrolling ticker or carousel.

Statistics: Horizontal row, 3-5 stats, oversized numbers.

Pricing: Centered, 2-4 tiers, one recommended tier visually elevated.

Final CTA: Centered, elevated energy, echoes the hero headline.

Rule: If in doubt, check section_patterns.md for the pattern for this section type.

---

# When to Use a Component Library vs Build

Should I source this component or build it?

Source from a library when:
- The component has complex interaction patterns (drag-and-drop, rich text editor, date picker)
- The component is technically complex (color picker, virtualized list)
- The component is not a visual signature element of the design
- Time is the primary constraint

Build from scratch when:
- The component is the hero's primary visual element
- The component is the most-seen component on the page (primary CTA button)
- The component needs to carry the design system's identity
- The component is simple enough that building is not significantly slower than adapting

Rule: Source for behavior. Build for identity.

---

# When to Stop Iterating

Is this design ready to ship?

Run the final_polish_checklist.md. If 38 of 40 items are checked: ship.

Ask: Does another iteration pass make this better?
If yes, and you know specifically what to change: do one more pass.
If yes, but you cannot articulate specifically what to change: ship and iterate based on real feedback.
If no: ship.

Rule: A shipped design that gets real feedback is always more valuable than a perfect design that never ships. The goal is iteration velocity, not perfection. Ship the best version you can defend today.
