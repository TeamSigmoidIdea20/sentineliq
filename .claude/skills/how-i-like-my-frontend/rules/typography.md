# Typography Rules

Typography is the highest-leverage design decision on any frontend. Weight contrast, size ratio, and style variation determine whether a page communicates premium or generic before the user reads a single word.

---

# The Hierarchy Stack

Every page needs at minimum four typographic levels with clear visual differentiation between each.

Display: Oversized text (80-120px) used sparingly for one statement per section. Creates an anchor.
Headline: Primary heading (48-72px, weight 700-900). One per section.
Subheading: Supporting text (18-28px, weight 400-600). Expands the headline idea.
Body: Reading text (15-17px, weight 400). Communicates detail.
Label/Caption: Small utility text (11-13px, weight 500, often uppercase with letter-spacing). Categories, tags, metadata.

Rule:
Each level must be visually distinguishable from across the room. If two levels look similar at arm's length, one of them is wrong.

---

# Weight Contrast

Weight is the most powerful typographic lever. It communicates hierarchy faster than size alone.

Strong contrast:
- 900 weight headline + 400 weight body
- 700 weight heading + 300 weight subtext
- Bold label + regular body in the same size

Weak contrast:
- 600 weight heading + 400 weight body (too similar)
- All text between 400-600 weight
- Medium weight used everywhere as a compromise

Rule:
The contrast between the heaviest and lightest text on the page should be immediately obvious. If you need to look carefully to notice the weight difference, increase it.

---

# Size Ratios

The ratio between heading and body size signals the design's confidence level.

Premium ratios:
- Headline 4x+ body size (64px headline / 16px body)
- Display 6-8x body size (96px / 16px)

Weak ratios:
- Headline 1.5-2x body (24px / 16px — feels like a document, not a product)
- All sizes compressed into a narrow band

Rule:
For hero headlines, start at 56px minimum. If it feels too large, it is probably correct.

---

# Font Pairing

Two typefaces maximum. One for display/headings, one for body and UI. More than two creates inconsistency.

Strong pairings:
- High-contrast serif display + clean geometric sans body (Playfair Display + Inter)
- Humanist sans heading + neutral sans body (Satoshi + Inter)
- Mono display + sans body (for technical products — creates personality)
- Single versatile family with wide weight range (Inter, Satoshi, Geist — use weight as the differentiator)

When to use serif:
- Editorial tone
- Premium/luxury positioning
- Long-form content
- When differentiation from tech defaults is intentional

When to avoid serif:
- Dashboard and utility products
- When speed and clarity are the primary values
- When the design already has strong personality from other sources

Rule:
One font family can carry an entire design if it has sufficient weight range. Adding a second font requires a clear reason, not decoration.

---

# Letter Spacing and Line Height

These are not default values — they are design decisions.

Headings:
- Large display text (60px+): -0.02em to -0.04em letter-spacing (tighter, more intentional)
- Mid-size headings: -0.01em to 0em

Body text:
- Letter-spacing: 0 to 0.01em (never tight on body — it reduces readability)
- Line-height: 1.5-1.7 for body (more space = more readable = more premium feel)

Labels and uppercase text:
- 0.08em to 0.15em letter-spacing when using uppercase labels — this is essential
- Uppercase at normal letter-spacing reads as shouting, not design

Rule:
Large text should always be set tighter than default. Small uppercase text should always be set wider than default. These two adjustments alone elevate most typography.

---

# When to Use Google Fonts

Google Fonts is the right default for web projects due to performance, reliability, and breadth.

Premium-feeling choices available on Google Fonts:
- Inter: The neutral baseline. Excellent weight range.
- Satoshi (via Fontshare or similar): More character than Inter, same versatility.
- DM Sans: Clean, slightly warm sans.
- Playfair Display: Strong editorial serif for display use.
- Fraunces: Optical size variable serif, unusual and premium.
- Space Grotesk: Technical personality, good for SaaS.
- Cabinet Grotesk: Wide range, editorial feel.

Avoid as primary display typefaces:
- Roboto (too neutral, too Android-associated)
- Open Sans (too document-like)
- Montserrat (overused in template culture)
- Raleway (thin weights read as dated)

Rule:
Default to Inter for body and choose one display typeface with personality for headings. This alone puts the design ahead of most AI-generated output.

---

# Type and Color

Type color is a design decision, not a CSS variable to leave at default.

Dark backgrounds:
- Primary text: white at 90-95% opacity (slightly off-white reads softer)
- Secondary text: white at 50-60% opacity
- Tertiary/labels: white at 30-40% opacity
- Never pure #FFFFFF on dark — it creates visual harshness

Light backgrounds:
- Primary text: near-black (#0F0F0F, #111111) not pure black (#000000)
- Secondary text: mid-grey (#555, #666)
- Tertiary: light grey (#999, #AAA)

Rule:
Three levels of text opacity or color on any background. One for primary content, one for supporting content, one for metadata and labels. Using only one text color creates flatness.
