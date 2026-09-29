# Spacing Rules

Spacing is the most underused design tool in AI-generated frontends. Premium design almost always has more space than feels comfortable to the designer. Spacing communicates quality before any visual element does.

---

# The Core Principle

Space is not empty. Space is a design decision that gives elements room to speak and guides the eye between them.

When a section feels generic: add space.
When a section feels cluttered: add space.
When a section feels cheap: add space.

The answer is almost always more space.

---

# Section Rhythm

Sections need breathing room between them. The space between sections is as important as the space within them.

Minimum section vertical padding: 80px top and bottom.
Premium section padding: 120-160px top and bottom for hero and focal sections.
Tight sections (pricing tables, feature lists): 60-80px.

Rule:
If sections look like they are stacked directly on top of each other with no visual rest between them, double the padding.

---

# Internal Section Spacing

Within a section, elements need hierarchy through proximity.

Headline to subtext: 16-24px gap
Subtext to CTA: 32-40px gap
Section heading to content below: 40-64px gap
Between list items: 12-16px
Between card elements inside a card: 16-24px
Between cards in a grid: 24-32px

Rule:
Grouped elements should be closer together. Separate logical groups with larger gaps. Proximity communicates relationship.

---

# Container Width and Line Length

Maximum container width: 1200-1280px for most landing pages.
Optimal body text line length: 60-75 characters (roughly 600-680px at 16px).

Text wider than 80 characters per line reduces readability.
Text narrower than 45 characters per line creates fragmented reading.

For hero headlines:
- Wide layouts: constrain headline to 60-70% of container width
- Full-width headlines only work when they are 2-3 words maximum

Rule:
Constrain text width even if the container is wide. Unconstrained text columns are a readability and aesthetic failure.

---

# The Density Spectrum

Not all design should be airy. But the default should lean open.

Airy (premium, editorial): Large section padding, generous gaps, few elements per section, clear negative space.
Balanced (product, SaaS): Standard section padding, moderate internal spacing, clear hierarchy.
Dense (dashboard, data): Compact padding, table-like layouts, information density justified by use case.

Rule:
Landing pages almost always belong at airy or balanced. Density is for utility interfaces, not marketing.

---

# Grid Discipline

12-column grids or 8-column grids with consistent gutter and margin.
Never resize columns ad-hoc per section.
Never change the grid within a page without a clear structural reason.

Column gaps: 24-32px
Page margins: 24px mobile, 48px tablet, 80-120px desktop (or more for very wide screens)

Rule:
Inconsistent gutters and margins are immediately visible to trained eyes. Lock the grid. Do not deviate without reason.

---

# Mobile Spacing

Mobile sections need reduced but still generous spacing.

Section padding: 48-64px vertical on mobile
Internal gaps: reduce by approximately 30% from desktop values
Container: 16-24px horizontal margin

Rule:
Never compress mobile padding to default browser values. Mobile landing pages need intentional spacing just as much as desktop. Compressing everything to fit is not responsive design — it is lazy scaling.

---

# Spacing as Emphasis

Negative space around an element increases its perceived importance.

A headline surrounded by space feels more important than the same headline with elements close to it.
A CTA button with generous padding and surrounding whitespace converts better than a cramped button.
An isolated visual element with open space around it commands attention.

Rule:
If something is important, give it room to breathe. If something is not worth featuring, remove it rather than cramping it.

---

# Common Spacing Mistakes

Too little padding on cards: Cards with 16px internal padding look like compressed data tables, not product features. Use 24-32px minimum.
Section dividers instead of spacing: Horizontal rules between every section are a crutch for insufficient spacing. If sections need a line to separate them, the spacing is wrong.
Equal vertical spacing everywhere: Not all vertical gaps should be the same. Use spacing to communicate grouping and hierarchy.
Default button padding: Browser default and CSS reset button sizes are too small. Buttons should feel generous — at minimum 12px vertical padding, 24px horizontal.
