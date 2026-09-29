# Frontend Iteration Templates

Ready-to-use templates for common iteration requests. Copy, fill in the bracketed fields, and send.

---

# Polish Pass Template

```
Run a polish pass on the current state of [page / section].

Priority order:
1. Add hover states to all interactive elements that don't have them:
   - Buttons: 150ms ease-out background shift or scale 1.02
   - Cards (clickable): translateY(-3px) + shadow increase, 200ms
   - Links: color transition 150ms

2. Add scroll reveal to section headings and primary elements:
   - opacity 0→1, translateY 24px→0, 450ms ease-out, once on first enter

3. Smooth any instantaneous state transitions:
   - Tab panels, accordions, dropdowns — minimum 200ms fade

4. Typographic refinements:
   - Tighten letter-spacing on hero headline to -0.02em
   - Confirm body line-height is 1.6+

5. Check mobile:
   - Section padding minimum 48px
   - No horizontal overflow
   - Headline minimum 32px

Confirm each step as complete.
```

---

# Section Refinement Template

```
Refine the [section name] section. Do not touch other sections.

Current problem: [Describe specifically — e.g., "the three feature cards are identical in size and structure, no hierarchy between them"]

Target outcome: [Describe specifically — e.g., "a bento grid where the primary feature card is twice the width of the supporting features"]

References: [Attach screenshot if available]
Borrow specifically: [Name the one element to borrow]

Constraints:
- Keep: [existing copy / existing colors / existing layout in other sections]
- Change: [layout, visual element, component structure]

After implementing:
1. Show what changed
2. Confirm no anti-slop patterns are present in this section
3. Confirm hover states exist on interactive elements
```

---

# Hierarchy Fix Template

```
Fix the visual hierarchy in [section / page]. 

Current state: [Describe the hierarchy problem — e.g., "the headline is 28px and the same weight as the subheading, nothing dominates"]

Target: [Describe the target — e.g., "the headline should be clearly dominant — 64px minimum, weight 800, visibly larger than everything else"]

Specific changes needed:
- Headline: increase to [X]px, weight [X], letter-spacing [-0.02em]
- Subheading: adjust to [X]px, weight [X], opacity [X%]
- Body text: confirm [X]px, weight [X]
- Any other competing element: [describe — reduce its visual weight]

Make only these changes. Do not change colors, layout, or spacing.
```

---

# Anti-Slop Replacement Template

```
The following anti-slop patterns are present in the current design. Replace each one.

Pattern 1: [Name — e.g., "purple gradient background"]
Location: [Where it appears]
Replace with: [e.g., "near-black solid background #0A0A0A"]

Pattern 2: [Name — e.g., "identical three-column feature cards"]
Location: [Where it appears]
Replace with: [e.g., "bento grid with one large card (primary feature) and two smaller supporting cards"]

Pattern 3 (if applicable): [Name]
Location: [Where]
Replace with: [What]

Make only these replacements. Do not add new elements. Do not change unrelated sections.
After replacing, run a quick check: are any other anti-slop patterns still present that were not listed above?
```

---

# Spacing Pass Template

```
Run a spacing pass only on [page / section]. Do not change colors, typography, layout, or components.

Apply these specific spacing values:

Section vertical padding: [80px / 96px / 120px] top and bottom
Card internal padding: [24px / 28px / 32px] all sides
Grid gap between cards: [24px / 28px / 32px]
Section heading to content below: [48px / 56px / 64px]
Headline to subtext: [16px / 20px]
Subtext to CTA: [32px / 40px]
Body text max width: [640px / 680px / 720px]

Mobile section padding: [48px / 56px / 64px] top and bottom

After implementing: identify the section where the spacing improvement is most visible and describe why it helps.
```

---

# Motion Addition Template

```
Add motion to [page / section] following these specifications:

HOVER STATES:
- Buttons: [describe — e.g., background lightens 10%, 150ms ease-out]
- Cards: [describe — e.g., translateY(-3px) + shadow, 200ms ease-out]
- Links: [describe — e.g., color to accent, underline scales in from left, 150ms]

SCROLL REVEALS (add to these elements only):
- [Element 1 — e.g., section heading]: opacity 0→1, translateY 24px→0, 450ms ease-out
- [Element 2 — e.g., feature cards]: same, with 70ms stagger between siblings

STATE TRANSITIONS:
- [Any tab panels / accordions / dropdowns]: add 200ms ease-in-out fade

PREFERS-REDUCED-MOTION:
All animations above must be wrapped in or conditioned on prefers-reduced-motion: reduce.

Do not add any other motion beyond what is specified above.
```
