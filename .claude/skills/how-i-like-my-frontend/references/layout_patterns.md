# Layout Patterns

---

# Left-Heavy Two-Column

Purpose:
Text on the left (60-65% width), visual on the right (35-40% width). Creates natural reading flow and strong visual tension.

Best For:
- Hero sections
- Feature highlight sections
- Product introductions

Strengths:
Breaks center-axis monotony. Gives imagery a defined zone. Feels editorial.

Risk:
Stacking multiple consecutive left-heavy sections without variation becomes repetitive.

---

# Full-Bleed Hero

Purpose:
Background image or video fills the entire viewport. Text and CTA overlaid on top.

Best For:
- Concept-driven products with strong visual assets
- Dark, premium aesthetics
- High-emotional-impact first impressions

Implementation:
- Overlay with gradient (bottom 40% of image to background color) for text legibility
- Text positioned left-aligned with ample top margin from navigation
- Never center text on full-bleed unless the image is extremely simple

Risk:
Requires a genuinely strong visual asset. Generic stock photography on a full-bleed hero looks worse than no image at all.

---

# Bento Grid

Purpose:
Varied-size card grid where cards occupy different proportions of the grid. Named for Japanese bento box compartments.

Best For:
- Feature showcases
- Product dashboard or UI previews
- Capability overviews

Strengths:
Creates visual hierarchy within a section. Some cards can be large and featured, others small and supporting.

Implementation:
- Use CSS Grid with named areas or span values
- Typically 2-3 rows with 3-4 columns
- One or two cards span 2 columns or rows as anchors
- Cards should have different content depths, not just different sizes

Risk:
Requires genuine content diversity to work. A bento grid of identically structured cards (just different sizes) does not achieve the effect.

---

# Alternating Feature Rows

Purpose:
Alternating left-right layout across multiple feature sections. Text left + visual right, then text right + visual left.

Best For:
- Detailed feature walkthroughs
- Step-by-step explanations
- Multi-feature product breakdowns

Strengths:
Creates rhythm. Eye travels across the page instead of straight down. Each feature gets equal visual weight.

Risk:
Requires distinct visuals for each feature. If multiple rows use similar imagery, the alternation creates confusion rather than rhythm.

---

# Full-Width Section with Constrained Content

Purpose:
Section background extends edge to edge. Content is constrained to 80-100% of max container width with generous horizontal padding.

Best For:
- Testimonial sections
- Stat showcases
- CTA sections

Strengths:
Creates visual separation between sections without borders or dividers. The background change signals a new section.

Risk:
Overused when every section uses a different background. Alternate between 2-3 backgrounds maximum.

---

# Oversized Single Feature

Purpose:
One large feature or capability presented with near-full-viewport scale. Text at headline scale. Visual fills most of the section.

Best For:
- Leading with the strongest product capability
- Sections immediately after the hero
- Creating visual drama at a specific point in the page

Strengths:
Extremely memorable. Creates the page's visual peak after the hero.

Risk:
Cannot be repeated. Works once per page maximum.

---

# Asymmetric Grid

Purpose:
Intentionally unbalanced column widths or element positioning. Neither column is standard width.

Best For:
- Portfolio and editorial products
- Creative agencies
- Differentiation from default layouts

Example: 70/30 split with text in the narrow column and UI in the wide column.

Risk:
Requires strong design instinct. Wrong asymmetry creates imbalance without tension — only imbalance.

---

# Card-Free Feature List

Purpose:
Features presented as a plain numbered or bulleted list with large type and no card containers.

Best For:
- Concise feature lists
- Products with many features
- When card grid would feel overdesigned

Strengths:
Radically differentiates from typical SaaS layouts. Communicates confidence — "our features speak without decoration."

Risk:
Requires strong copy. Weak feature descriptions exposed without card decoration reveal themselves immediately.
