# Good UI Patterns

Named good patterns with analysis of why they work. These are reusable solutions to common design problems.

---

# Left-Weighted Hero with Negative Space

What It Is:
Text and CTA occupy the left 55-65% of the hero. The right 35-45% holds a visual element or deliberate negative space.

Why It Works:
Breaks the over-centered default. Creates visual tension and asymmetric balance. The eye reads text first (left-to-right scan) then moves to the visual as confirmation or amplification. Feels editorial and confident.

When to Use:
Almost always. The exception is when a typographic hero (no imagery) makes more sense for the brand.

---

# Opacity-Based Text Hierarchy

What It Is:
Three text colors on dark backgrounds achieved through opacity rather than different colors: primary 92%, secondary 55%, tertiary 35%.

Why It Works:
Creates clear visual hierarchy without introducing additional colors. The relationship between text levels is mathematically consistent. Premium brands (Linear, Vercel) use this system.

When to Use:
Any dark background design. More effective than using multiple grey hues because the hierarchy is perceptually even.

---

# Bento Grid Feature Section

What It Is:
Feature cards in a varied-size grid — some cards occupy single grid cells, others span two columns or rows.

Why It Works:
Creates visual hierarchy within the feature section itself. The larger card carries the most important feature. Users scan from large to small, discovering features in order of importance.

When to Use:
When the product has 5-9 features that need different visual weights. Not for 3 equal features.

---

# Oversized Statistic Display

What It Is:
Statistics displayed at 60-80px with the number in heavy weight and the label in small type below or beside.

Why It Works:
Numbers at display scale communicate impact before they are read. The visual weight of a large number communicates significance. Pairs naturally with count-up animations.

When to Use:
Any social proof or impact section with specific, credible numbers.

---

# Alternating Feature Rows

What It Is:
Feature sections with text left + visual right, then text right + visual left, alternating.

Why It Works:
Creates page rhythm and movement. The eye travels across the page instead of straight down. Each feature gets structural parity while the alternating position creates visual variety.

When to Use:
When a product has 3-6 important features that each deserve a full section, not a card. Requires distinct visuals per feature.

---

# Card Elevation on Hover

What It Is:
Clickable cards translate up 3-4px and increase box-shadow on hover, creating a lifting effect.

Why It Works:
Confirms interactivity through physical metaphor. The card behaves like something that can be picked up. The shadow increase creates realistic depth.

How to Implement:
transform: translateY(-4px) + box-shadow increase, 200ms ease-out.
Never scale cards — scale creates layout shift.

---

# Gradient Border on Featured Element

What It Is:
A single key card or element has a 1px border with a gradient color rather than a solid border.

Why It Works:
Creates visual elevation above surrounding elements with a subtle, premium effect. More refined than a background color change. Works especially well for the "recommended" pricing tier or a featured testimonial.

Implementation:
background: linear-gradient(#000, #000) padding-box, linear-gradient(to right, color1, color2) border-box; border: 1px solid transparent;

---

# Animated Underline on Links

What It Is:
On hover, a link's underline scales in from the left (transform: scaleX(0 to 1), transform-origin: left). On un-hover, scales out to the right.

Why It Works:
Feels physically directional and intentional. Significantly more premium than an instant underline appear/disappear. Becomes a signature micro-interaction.

When to Use:
Navigation links, feature section links, text links in body copy.

---

# Section Rhythm Through Structural Variation

What It Is:
Each section uses a different structural pattern — hero is full-bleed, features are bento grid, testimonials are single large quote, stats are horizontal row, CTA is centered.

Why It Works:
Prevents monotony. Confirms to users that each section is distinct and warrants attention. A page where every section looks like a template card feels machine-made.

Rule:
No two consecutive sections should use the same structural pattern.

---

# Grain Texture Overlay

What It Is:
A subtle noise or grain texture applied over surfaces (backgrounds, cards, images) at 2-4% opacity.

Why It Works:
Adds tactile depth to flat digital surfaces. Breaks the hyper-digital smoothness that makes AI-generated designs feel artificial. Extremely subtle — most users won't consciously notice it.

Implementation:
SVG noise filter, CSS noise image, or a repeating PNG texture at low opacity. Apply to background pseudo-elements to avoid affecting child elements.
