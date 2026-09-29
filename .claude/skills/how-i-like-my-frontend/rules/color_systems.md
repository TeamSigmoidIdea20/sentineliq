# Color System Rules

Color in frontend design is a system, not a collection of choices. Every color on the page must have a role. Colors without roles create noise.

---

# The Three-Role System

Every palette needs three roles, not three colors.

Dominant: The color that occupies the most visual real estate. Usually a neutral (dark background, light background) or a brand dark. Sets the overall tone.
Accent: The color that appears on elements that demand attention — CTAs, key highlights, important labels, active states. Should be used sparingly.
Neutral: The color system for text, borders, dividers, and subtle backgrounds. Usually a series of greys.

Rule:
Before choosing any color, assign it a role. If a color does not have a role, it does not belong on the page.

---

# Palette Discipline

Maximum colors for a SaaS landing page: one dominant, one accent, one neutral system (3-4 values).
Maximum for a portfolio or editorial site: one dominant, two accents (used in distinct contexts), one neutral system.

Colors that share similar visual weight compete. When two colors are equally prominent and neither is clearly the accent, the palette has failed.

Rule:
Count the prominent colors from memory after viewing the page for 5 seconds. If you can name more than 3, narrow the palette.

---

# Dark vs Light Systems

Dark:
- Communicates premium, technical, focused, confident
- Works well for developer tools, fintech, analytics, night-mode products
- Requires careful text opacity management — use grey-scale hierarchy, not pure white everywhere
- Background palette: typically 3-4 values from near-black to dark grey for surface variation

Light:
- Communicates openness, clarity, accessibility, friendliness
- Works well for consumer products, onboarding-heavy products, design tools
- Requires careful shadow and border management for depth without darkness
- Background palette: white, off-white, light grey, medium grey for surface variation

Mixed (dark hero, light body):
- Effective for drama at the top, readability in the detail sections
- Requires a transition section that bridges the tones
- Risk: can feel inconsistent if the transition is abrupt

Rule:
Choose one system and commit. The only acceptable exception is a transitional section between dark hero and light content body.

---

# SaaS Color Psychology

Green: Growth, success, financial health. Good for fintech, analytics, productivity.
Blue: Trust, reliability, professionalism. The enterprise default — use it only when trust is the primary differentiator.
Purple/violet: AI-coded, tech-coded, often generic. Use only with a strong reason and a disciplined palette.
Orange/amber: Energy, urgency, creativity. Strong accent color for CTAs if brand supports it.
Red: Warning, urgency, power. Use carefully — often reads as error state.
Neutral/monochrome: Confidence, editorial, premium. Often better than a color choice for SaaS.

Rule:
For a new SaaS product, defaulting to a monochrome dark system with one accent color is almost always better than using purple gradients. Restraint reads as premium.

---

# The Accent Color

The accent is the most important color on the page. It should appear on:
- Primary CTA buttons
- Active states and selection
- Key numerical highlights
- One illustrative element per hero

It should not appear on:
- Section backgrounds
- Body text
- Navigation items (unless active)
- More than 3-4 elements per full page

Rule:
The accent loses meaning when it appears everywhere. If removing the accent color from a section does not reduce emphasis on anything important, it should not have been there.

---

# Text Color Hierarchy on Dark Backgrounds

Do not use a single white for all text. Create a 3-step opacity system.

Primary text: rgba(255,255,255,0.92) — almost white, slightly soft
Secondary text: rgba(255,255,255,0.55) — clearly secondary, supporting role
Tertiary/labels: rgba(255,255,255,0.35) — visually quiet, metadata level

Rule:
Pure white (#FFFFFF) on dark creates visual harshness. Off-white at 90% opacity is almost always better. Create three opacity levels for text hierarchy.

---

# Text Color Hierarchy on Light Backgrounds

Primary text: #0F0F0F or #111827 — near-black, not pure black
Secondary text: #555555 or #6B7280 — clearly secondary
Tertiary/labels: #9CA3AF or #AAAAAA — quiet, metadata level

Rule:
Never use pure black (#000000) on white for body text. The contrast is too harsh. Near-black is more readable and more premium.

---

# Color and Motion

Avoid animating color for decoration. Color transitions should mark state changes.

Acceptable color transitions:
- Hover state color change on interactive elements
- Active/selected state indication
- Loading state indication

Unacceptable:
- Background gradients that continuously shift color
- Ambient color animations that serve no state purpose
- Random color cycling effects

Rule:
Color should communicate state. Animating color without a state change is decoration masquerading as interaction.

---

# Common Color Failures

Random gradient backgrounds: The page has a purple-to-blue gradient because Claude added one. No design decision was made.
Accent color overuse: The brand blue appears on headings, icons, borders, buttons, and backgrounds simultaneously. It no longer signals anything.
Insufficient contrast: Text at 3:1 contrast ratio against background. Fails accessibility and reads as cheap.
Competing accents: Two different accent colors used for equally important elements. The eye does not know which to prioritize.
Dark text on dark background: Low-contrast body text because the designer was focused on the visual and forgot to check text legibility.
