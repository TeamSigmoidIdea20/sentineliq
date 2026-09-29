# Hero Generation Prompt

Prompt templates specifically for building or redesigning hero sections.

---

# Full Hero Generation Prompt

```
Build the hero section for [product name].

PRODUCT: [What the product does in one sentence]
CONCEPT/METAPHOR: [The visual idea that captures the product — e.g., "intelligence radar", "creative flow", "pattern in noise"]

TAGLINE: "[The headline text]"
SUBHEADING: "[The supporting text below the headline]"
PRIMARY CTA: "[Button text]" → links to [#section or URL]
SECONDARY CTA (optional): "[Secondary text]" → [link]

LAYOUT: [Choose: left-weighted two-column / full-bleed with overlay / centered typographic]

VISUAL ELEMENT: 
[Attach image] OR [Describe: "Generate a dark abstract image representing [concept]"]
[If video: "Convert to subtle looping video after image is approved"]

TYPOGRAPHY:
- Headline: [typeface], [weight], [size on desktop]
- Sub: [typeface], [weight], [size]

COLORS:
- Background: [color]
- Headline: [color]
- Sub: [color at opacity X]
- CTA button: [accent color]

MOTION:
- Hero entrance: stagger headline (0ms), sub (100ms), CTA (200ms) — all fade up from 20px
- Visual: [subtle entrance / already visible / video loop]

ANTI-SLOP REQUIREMENTS:
- Do NOT use a gradient as the primary background
- Do NOT center everything if a left-weighted layout is specified above
- Do NOT use particle fields or floating shape decorations
- The visual must be concept-specific to the product

After building, explain:
1. What layout decision was made and why
2. How the visual element connects to the product concept
3. What the hover state is on the primary CTA
```

---

# Hero Iteration Prompt (After First Build)

```
The hero scaffold is built. Now iterate on these specific problems:

Problem 1: [Specific issue — e.g., "The headline is too small and doesn't dominate the section"]
Fix: [What specifically to change — e.g., "Increase to 80px, weight 900, adjust line height to 1.1"]

Problem 2: [Specific issue]
Fix: [What specifically to change]

Problem 3 (if applicable): [Specific issue]
Fix: [What specifically to change]

After implementing, confirm each change and show the before/after difference for each.
Do not change anything else — only what is listed above.
```

---

# Tagline Generation Prompt

```
I need a hero tagline for [product name].

Product: [What it does factually]
Target user: [Who uses it]
Primary benefit: [The most important thing it does for them]
Emotional tone: [How they should feel — confident / informed / in control / ahead / etc]
Style: [Direct / evocative / commanding / subtle]

Generate 5 tagline options. For each:
- The tagline text (2-6 words preferred)
- Why it works for this product
- A competitor swap test: would it work on a competitor's site? (Must be NO)

Avoid:
- Generic benefit statements ("Supercharge your workflow")
- Category descriptions ("The platform for modern teams")
- Filler words and jargon
```
