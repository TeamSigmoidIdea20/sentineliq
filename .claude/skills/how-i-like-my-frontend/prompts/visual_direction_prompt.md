# Visual Direction Prompt

Set a clear visual direction before any build begins. Use this to give Claude a complete design brief rather than letting it make default choices.

---

# Full Visual Direction Prompt

```
Before building anything, I want to set the visual direction for this project. Use this as your design brief for everything you build.

PRODUCT: [What the product does in one sentence]

EMOTIONAL DIRECTION: [Choose one: precise and intelligent / bold and confident / warm and approachable / playful and energetic / premium and exclusive]

TARGET FEELING: [How should the user feel when they land on this page? One sentence.]

VISUAL STYLE: [Choose: dark luxury / light minimal / dark technical / editorial typographic / warm editorial / bento/structured]

COLOR SYSTEM:
- Dominant: [e.g., near-black #0A0A0A / white #FFFFFF / specific brand color]
- Accent: [e.g., electric blue #3B82F6 / amber #F59E0B / single specific color]
- Neutral: [e.g., grey scale from #111 to #888 for text hierarchy]
- Rule: Use accent on [CTAs only / CTAs and key highlights / ...]

TYPOGRAPHY:
- Display/Headline typeface: [e.g., Inter 800 / Fraunces / Cabinet Grotesk]
- Body typeface: [e.g., Inter 400 / Satoshi]
- Headline size range: [e.g., 64-96px for hero, 36-48px for section headings]

LAYOUT APPROACH:
- Default section layout: [e.g., left-weighted two-column / centered / alternating]
- Grid: [e.g., 12-column, 32px gutters, max-width 1280px]
- Section padding: [e.g., 120px vertical for hero, 80px for standard sections]

MOTION DIRECTION:
- Motion pace: [fast and snappy / medium / slow and deliberate]
- Hover states: [subtle / medium / expressive]
- Scroll reveals: [yes / no / selective]
- Signature motion: [describe the one hero motion element, or "none"]

ANTI-PATTERNS TO AVOID FOR THIS PROJECT:
[List any specific patterns to avoid beyond the standard anti-slop rules]

REFERENCES:
[List 2-3 sites whose design direction is closest to the target]
Borrow from [Site A]: [specific element]
Borrow from [Site B]: [specific element]

Do not start building until you confirm you have understood this brief. Ask any clarifying questions first.
```

---

# Minimal Direction Prompt (Faster Start)

```
Design brief for this project:

Product: [one sentence]
Tone: [one word: precise / bold / warm / playful / premium]
Style: [dark / light / minimal / editorial]
Accent color: [hex or description]
References: [site 1], [site 2]
Avoid: [specific anti-patterns for this project]

Work from this brief for all design decisions. Default to restraint when uncertain.
```
