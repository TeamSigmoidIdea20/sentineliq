# Anti-Slop Rules

These are the hallmarks of AI-generated frontend design. Each pattern signals that no design decision was made — only defaults were accepted. When they appear, name them and replace them.

---

# Purple and Violet Gradients

Why It Fails:
Claude and most AI tools default to purple/violet because it reads as "tech" without thought. When every AI project uses it, it communicates zero intentionality.

Replace With:
- Monochromatic dark systems (charcoal to off-black)
- Disciplined 2-color palettes — one dominant, one accent
- Desaturated neutrals with a single high-contrast accent
- Warm neutrals for brands that want approachability over tech coldness

Rule:
If a gradient is used, it must have a named reason. Never use it as a background default.

---

# Glow and Neon Halos

Why It Fails:
Glow on cards, buttons, and borders creates visual noise. The eye does not know where to go. It signals "I added effects" not "I made decisions."

Replace With:
- Genuine shadow systems with direction and softness
- Selective border highlights on one element maximum
- Gradient borders only on the primary CTA, not on everything
- Depth through z-axis layering, not emission effects

Rule:
Glow is a seasoning, not a meal. One glowing element per page, maximum.

---

# Excessive Glassmorphism

Why It Fails:
When every card, panel, and modal is frosted glass, the effect loses meaning entirely. It becomes visual wallpaper. Nothing is elevated.

Replace With:
- Solid backgrounds with deliberate opacity control on overlapping elements
- Glassmorphism reserved for one accent surface — floating card, modal, tooltip
- Matte dark cards with subtle border definition instead

Rule:
If more than one element per section uses glassmorphism, it is too much.

---

# Identical Three-Column Card Grids

Why It Fails:
Icon + Title + Two-sentence description, repeated three times in a row. Every SaaS landing page from 2018 onwards uses this exact pattern. Visitors skip it without reading.

Replace With:
- Asymmetric feature layout — large feature left, two small features right
- Numbered list with oversized type as the visual element
- Alternating left/right feature rows with imagery or UI mockups
- Single large feature with smaller callout details
- Bento grid with varied card sizing

Rule:
If the three cards are interchangeable in size and visual weight, redesign the section.

---

# Over-Rounded Corners Everywhere

Why It Fails:
Border-radius set identically on every element — cards, buttons, images, containers — creates a toy aesthetic. It signals that no hierarchy of feel was designed.

Replace With:
- Radius discipline: more on interactive elements (buttons: 6-8px), less on structural containers (cards: 3-4px, page sections: 0)
- Sharp edges for large structural sections
- Mixed radius — small elements soft, large elements sharp

Rule:
Radius should vary by element type and size. Uniform radius on everything is not a design choice.

---

# Over-Centered Layouts

Why It Fails:
Every section has centered heading, centered subtext, centered CTA. The eye travels straight down the middle. No tension, no movement, no visual interest. Monotonous from top to bottom.

Replace With:
- Left-aligned text with negative space on the right holding imagery or UI
- Two-column sections with intentional imbalance
- Full-bleed elements that break the center axis
- Staggered section alignment that alternates between left and right emphasis

Rule:
Not every section should center. Centering is a choice, not a default. Alternate it deliberately.

---

# Weak Hero Sections

Why It Fails:
Centered headline, centered subtext, one button, generic gradient or particle background. This is Level 1 output. It communicates nothing specific about the product.

Replace With:
- Left-weighted layout with a strong visual occupying the right half
- A visual element tied directly to the product concept
- Typographic hierarchy where the headline alone carries visual weight before the eye reaches anything else
- Subtle motion — looping concept video, not flashy particle field
- A tagline that names something specific, not a generic benefit

Rule:
The hero gets the most design attention on the page, not the least.

---

# Purposeless Animations

Why It Fails:
Floating shapes, spinning logos, particle fields, random entrance animations that carry no semantic meaning. They trigger "this is trying too hard." When design is thin, effects get added to compensate.

Replace With:
- Scroll-triggered reveals that guide attention progressively to content
- Hover states that feel like physical responses to touch
- One signature motion element tied to the product concept
- Transitions between states (loading, hover, active) that feel considered

Rule:
If removing an animation makes the page better or neutral, remove it.

---

# Scattered Color Palettes

Why It Fails:
Five or more prominent colors on a single page — teal CTAs, purple cards, blue text, orange accents, green badges. Each element competes for attention. No palette decision was made.

Replace With:
- One dominant color for backgrounds and structural elements
- One accent color for CTAs, key highlights, and emphasis
- One neutral system for text, borders, and subtle backgrounds
- Color used for meaning, not decoration

Rule:
If you can name more than 3 colors from memory after viewing the page, there are too many.

---

# Cluttered Sections

Why It Fails:
Default padding, elements packed together, no breathing room, no clear scan path. Premium is spacious. Clutter reads as cheap regardless of other design quality.

Replace With:
- Double the padding instinct suggests
- Fewer elements per section, higher impact per element
- Whitespace treated as an active design element that directs attention

Rule:
When in doubt, add space. Space is free and almost always the right choice.

---

# Generic Stock Imagery

Why It Fails:
Smiling people on laptops, abstract tech spheres, generic data visualization backgrounds. These images say nothing about the product and could appear on any competitor's site.

Replace With:
- Product screenshots or UI mockups in context
- AI-generated imagery tied to a specific product concept or visual metaphor
- Subtle looping video (15 seconds, concept-driven, subtle motion)
- Typographic heroes that need no imagery
- Illustrations built for the brand, not licensed from a library

Rule:
If the image could appear on three different competitors' sites without looking wrong, it is wrong for this site.

---

# Flat Typography

Why It Fails:
All text at similar visual weight. Headlines at 24px, subheadings at 18px, body at 16px. No weight contrast. No style variation. Everything reads at the same visual volume. The eye has nowhere to land.

Replace With:
- Headline: 56-96px, weight 700-900
- Subheading: 18-24px, weight 400-500
- Body: 15-17px, weight 400
- At least one display element — oversized number, pull quote, large label — to create visual hierarchy beyond the paragraph stack

Rule:
The type hierarchy should be readable from across the room. If it requires effort to identify the headline, the hierarchy is flat.
