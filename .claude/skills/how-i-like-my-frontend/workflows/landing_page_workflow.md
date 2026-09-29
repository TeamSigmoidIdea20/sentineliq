# Landing Page Workflow

Full sequence for building a new landing page from scratch. Do not skip phases.

---

# Phase 1: Direction (Before Writing a Line of Code)

Step 1 — Define emotional direction.
Answer: How should the user feel when they land on this page? (Choose one: precise/intelligent, bold/confident, warm/approachable, playful/energetic, premium/exclusive)

Step 2 — Define visual style.
Choose the design language: dark luxury, light minimal, editorial typographic, bento/structured, or warm editorial. Reference visual_styles.md.

Step 3 — Identify the product concept.
What is the visual metaphor or core concept that captures what this product does? This drives imagery and hero visual.

Step 4 — Write the hero tagline first.
The tagline anchors all visual decisions. It must be specific to the product, not a generic benefit. If the tagline could apply to three other products, rewrite it.

Output from Phase 1: One sentence on emotional direction. One sentence on visual style. One sentence on product concept. The hero tagline.

---

# Phase 2: Reference Gathering

Step 5 — Find 3-5 reference screenshots.
Sources: Awwwards, Godly.website, Pinterest (search "[product category] landing page dark/light"), Dribbble, Land-book.
Target: sites in a similar industry or with the desired emotional tone.

Step 6 — Screenshot specific sections, not just full pages.
Take separate screenshots of: a hero section you like, a feature section you like, a typography treatment you like.

Step 7 — Identify what specifically to borrow.
For each reference, write one sentence: "From this site I want: [specific element — the left-weighted two-column hero, the oversized number treatment, the card elevation on hover]."

Do not proceed to build without at least 3 references.

---

# Phase 3: Scaffold

Step 8 — Provide the reference screenshots and direction to Claude.
Prompt format: "Build a landing page for [product]. Emotional direction: [direction]. Visual style: [style]. References attached — I want to borrow [specific things]. Tagline: [tagline]."

Step 9 — Define the sections list before building.
Tell Claude explicitly: hero, logo bar, features, how it works, testimonials, pricing (if applicable), final CTA. Do not let Claude choose the sections.

Step 10 — Get a first scaffold.
This is a working starting point, not a finished design. Do not critique individual details at this stage — evaluate overall structure and hierarchy only.

---

# Phase 4: Critique

Step 11 — Run the 10-question Frontend Evaluation Framework.
From SKILL.md: Is there a focal point? Is typography contrasted? Is spacing rhythmic? Is emotional tone consistent? Are anti-slop patterns present?

Step 12 — Identify the category of problem.
Structural problems (hierarchy, layout): need redesign of the section.
Surface problems (color, spacing, type): need refinement.
Detail problems (hover, transitions, micro-details): need polish pass.

Step 13 — Prioritize top 3 problems.
Do not try to fix everything at once. Fix the most structurally important problem first, then the next, then the next.

---

# Phase 5: Refinement Loop

Step 14 — Make one targeted change at a time.
Each iteration: one specific request, one specific change, screenshot to compare.

Step 15 — Screenshot and compare to reference.
After each significant change, compare side by side with the reference. Identify the specific remaining gap.

Step 16 — Work section by section.
Do not try to refine the whole page simultaneously. Get the hero right, then move to the next section.

Step 17 — Add micro-details last.
Hover states, transitions, counter animations, and scroll reveals are the last layer — after structure, hierarchy, and surface treatment are correct.

---

# Phase 6: Polish Pass

Step 18 — Check every interactive element for all states.
Every button: hover, active, focus, disabled (if applicable).
Every link: hover state.
Every card (if clickable): hover elevation.

Step 19 — Check mobile.
Section padding on mobile (minimum 48px vertical). Font sizes readable. No overflow. CTAs accessible.

Step 20 — Run the final_polish_checklist.md.
Complete before shipping.

---

# Common Failure Modes

Skipping Phase 1: Building without a direction produces Level 1-2 output. Always define direction first.
Skipping references: Telling Claude what you want instead of showing produces worse output. Always provide references.
Trying to perfect everything at once: One change at a time. One section at a time. Patience compounds.
Accepting the scaffold as final: The scaffold is the skeleton. The design happens in Phases 4-5.
