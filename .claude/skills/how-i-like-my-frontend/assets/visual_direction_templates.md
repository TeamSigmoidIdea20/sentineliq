# Visual Direction Templates

Fill-in templates for communicating complete visual direction to Claude before any build begins. Choose the template that matches the project type.

---

# Template A: Dark Premium SaaS

```
VISUAL DIRECTION — Dark Premium SaaS

Product: [One sentence description]
Target user: [Who uses this]

Emotional direction: Precise and intelligent. The user should feel that this product is more capable than anything they have used before.

Background system: Near-black (#0A0A0A or #0D0D0D). Three surface levels: base, slightly elevated card (+4% brightness), and modal (+8% brightness). No gradients on backgrounds.

Typography:
- Display: [Inter / Geist / Space Grotesk] at 80-96px, weight 900, letter-spacing -0.03em
- Headline: same family at 48-64px, weight 800
- Body: same family at 16px, weight 400, line-height 1.65
- Text colors: rgba(255,255,255,0.92) primary, rgba(255,255,255,0.55) secondary, rgba(255,255,255,0.35) tertiary

Accent: [One specific color — e.g., #6366F1 indigo or #22D3EE cyan] — used ONLY on primary CTAs, active states, and 1-2 key highlights per page.

Layout:
- Hero: left-weighted two-column
- Features: bento grid or alternating rows
- No over-centered sections

Motion:
- Hover: 200ms ease-out
- Scroll reveal: opacity + translateY 24px, 450ms, ease-out, once
- Nothing decorative

Anti-slop rules in force: no gradients, no glow, no glassmorphism beyond one element, no identical cards.
```

---

# Template B: Light Minimal SaaS

```
VISUAL DIRECTION — Light Minimal SaaS

Product: [One sentence]
Target user: [Who]

Emotional direction: Warm and approachable. This product should feel like something a human built for humans.

Background system: White (#FFFFFF) primary surface. Light grey (#F5F5F5 or similar) for alternate section backgrounds. Subtle borders at #E5E7EB for component definition.

Typography:
- Headline: [DM Sans / Satoshi / Inter] at 48-72px, weight 700-800
- Body: same family at 16px, weight 400, line-height 1.65
- Text colors: #0F0F0F primary, #555555 secondary, #999999 tertiary

Accent: [One color — e.g., #2563EB blue or #16A34A green] — CTAs and highlights only.

Layout:
- Hero: centered headline with product screenshot below, OR left-weighted with product on right
- Features: alternating rows or bento
- Testimonials: 2-column grid or single featured quote

Motion:
- Hover: 150ms ease-out, subtle
- Scroll reveal: 400ms, subtle
- Nothing overwrought

Anti-slop: no over-centering (every section), no identical three-card features, no stock photography.
```

---

# Template C: Bold / Editorial

```
VISUAL DIRECTION — Bold Editorial

Product: [One sentence]
Target: [Who]

Emotional direction: Bold and confident. The design makes a visual statement before the user reads anything.

System: Predominantly dark or predominantly light (choose). The type IS the visual.

Typography:
- Display: [Cabinet Grotesk / Fraunces / big geometric sans] at 96-120px, weight 900
- The size alone is the hero element
- Body: contrasting, legible, smaller family at 16-18px
- Type hierarchy ratio: 6-8x between display and body

Layout:
- Hero: centered OR dramatically left-offset — not standard
- Sections: varied, unpredictable, editorial
- At least one section that breaks the grid

Motion:
- Slow and deliberate OR snappy and confident — choose one
- No in-between

Color: Minimal. One strong accent. Or monochrome entirely.

Anti-slop: this system succeeds through typographic confidence and fails through visual decoration. No gradients. No glow. Let the type work.
```

---

# Template D: Technical / Developer Tool

```
VISUAL DIRECTION — Developer Tool

Product: [One sentence]
Target: Developers / technical users

Emotional direction: Technical without being cold. Direct, capable, honest.

Background: Dark (#0A0A0A). Optional: subtle grid pattern at 3% opacity.

Typography:
- Headline: [Space Grotesk / Geist / Inter] at 56-72px, weight 700
- Body: same at 16px, weight 400
- Mono accent: [Space Mono / Geist Mono] for code elements, CLI snippets, technical labels

Visual system:
- Code syntax highlighting is a primary visual element
- Terminal or CLI aesthetic for product demonstrations
- Product UI shown in realistic context (actual usage, not staged)

Color: Dark base. One accent only. Green (#22C55E) if success states need to be visible. Otherwise accent can be subtle blue or cyan.

Layout:
- Features: code snippet left, explanation right (or reversed)
- Hero: headline left, code demo right

Anti-slop: no decorative gradients, no glassmorphism on feature cards, code elements should look like real code — not pretty fake code.
```
