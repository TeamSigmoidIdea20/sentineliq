# Hero Design Workflow

The hero section gets the most design attention on the page. It is the first impression, the emotional setter, and the primary conversion driver. This workflow treats it as its own design project.

---

# Phase 1: Hero Direction

Step 1 — Define the hero's single job.
What should a user understand, feel, or decide within 5 seconds of seeing this hero? One answer only.

Step 2 — Write the hero tagline.
This is the single most important copy on the page. Requirements:
- Specific to this product (not generic)
- Communicates the core value or emotional aspiration
- Works without the subheading (the subheading adds, not completes)
- Passes the competitor swap test: if it works on a competitor's site unchanged, it is wrong

Step 3 — Define the visual concept.
What visual element anchors the hero? Options:
- Product UI screenshot or mockup in context
- Concept imagery tied to the product metaphor
- Looping concept video (10-20 seconds, subtle motion)
- Pure typographic treatment (no imagery)
- Abstract visual tied to the product concept (data visualization, geometric representation)

Never: generic gradient + centered text + random particle field.

---

# Phase 2: Layout Decision

Step 4 — Choose the layout approach.

Left-weighted two-column: Text left (55-65%), visual right (35-45%). Creates natural reading flow and visual tension.
Full-bleed background: Concept image or video fills viewport. Text overlaid with gradient for legibility.
Centered typographic: Very large headline centered. No competing visual. Requires exceptional type choices.
Split with vertical division: Strong vertical line divides text from visual. Creates editorial tension.

Step 5 — Decide text alignment within the layout.
Left-weighted: Left-align text.
Full-bleed: Left-align text, never center-align on full-bleed.
Centered: Center-align acceptable only if the headline is the only element.

Rule: Over-centered layouts are the most common hero failure. Default to left-weighted.

---

# Phase 3: Visual Asset Creation

If using imagery:

Step 6 — Define the image brief.
One sentence: what does the image depict? What does it communicate about the product? What emotional tone does it establish?
Bad brief: "A hero image for a tech product"
Good brief: "An abstract representation of pattern recognition in noise — dark background, scanning beam across distributed data points, precise and intelligent"

Step 7 — Source or generate the image.
Generate with MidJourney, Ideogram, or similar using the brief. Take 4+ variations and select the strongest.
Criteria for selection: most concept-specific, most unique, best at communicating product metaphor without words.

Step 8 — Consider converting to subtle looping video.
If the still image works, a subtle motion version makes it stronger. Use VO3, Runway, or similar.
Target: 10-15 seconds, seamless loop, motion subtle enough that users think it is a still on first glance.

Step 9 — Plan the mobile fallback.
Mobile: always use the still image (never autoplay video on mobile).
Ensure the still frame works as a standalone image — the video is an enhancement, not a requirement.

---

# Phase 4: Hero Build

Step 10 — Provide to Claude:
- The layout decision
- The tagline and subheading
- The visual asset (image/video) or description if to be generated
- One or two reference screenshots of hero sections with similar direction
- The emotional tone target

Prompt: "Build the hero section for [product]. Layout: [left-weighted two-column]. Tagline: '[tagline]'. Subheading: '[subheading]'. Visual: [attached image/description]. Emotional direction: [precise and dark]. Reference screenshots attached — I want [specific element from references]."

Step 11 — Evaluate the scaffold against the hero criteria:
- Is the headline visually dominant (largest element)?
- Is there clear hierarchy (headline → sub → CTA)?
- Does the visual element complement rather than compete with the text?
- Is the layout avoiding the centered-everything trap?
- Does the hero communicate the product concept, not just generic tech?

---

# Phase 5: Hero Refinement

Step 12 — Fix hierarchy first.
If the headline is not the most visually dominant element: increase size, increase weight, or reduce competing elements.

Step 13 — Refine typography.
Headline: does it have genuine visual weight? Check size (56px minimum), weight (700+), and letter-spacing (slightly tighter than default for large type).

Step 14 — Check the CTA.
Is it clearly the primary action? Does it have sufficient visual contrast from the background? Is it large enough to feel clickable (minimum 48px height)?

Step 15 — Add motion.
If using a concept video: confirm it loops seamlessly and loads as a still on mobile.
Scroll reveal for hero elements: headline fades in first, subtext 100ms later, CTA 200ms later.

Step 16 — Mobile check.
Is the headline legible (minimum 36-40px on mobile)? Does the layout stack cleanly (visual below text on mobile)? Is the CTA accessible?

---

# Hero Anti-Patterns Checklist

- [ ] Centered layout with gradient background and no visual element
- [ ] Two equally weighted CTAs
- [ ] Generic stock imagery or generic AI imagery
- [ ] Tagline that could apply to three competitors
- [ ] Headline smaller than 48px on desktop
- [ ] No hierarchy between headline, subheading, and body text
- [ ] Particle field or floating shape background
- [ ] Navigation competing visually with the headline
