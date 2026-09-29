# Typography Prompt

Prompt templates for setting up typography systems and refining type on existing designs.

---

# Typography System Setup Prompt

```
Set up the complete typography system for this project.

TYPEFACE DECISIONS:
- Display/Headline: [typeface name] — [where to load from: Google Fonts / Fontshare / local]
- Body/UI: [typeface name] — [source]
- Mono (if applicable): [typeface name] — [source]

TYPE SCALE:
- Display (hero anchors): [80-120]px, weight [800-900], letter-spacing [-0.03em]
- H1: [56-72]px, weight [700-800], letter-spacing [-0.02em]  
- H2: [36-48]px, weight [600-700], letter-spacing [-0.01em]
- H3: [24-32]px, weight [600]
- Body large: [18-20]px, weight [400], line-height [1.6]
- Body: [15-17]px, weight [400], line-height [1.65]
- Small/caption: [13-14]px, weight [400]
- Label/tag: [11-13]px, weight [500-600], letter-spacing [0.08em], UPPERCASE

TEXT COLORS (dark background):
- Primary: rgba(255, 255, 255, 0.92)
- Secondary: rgba(255, 255, 255, 0.55)
- Tertiary: rgba(255, 255, 255, 0.35)

TEXT COLORS (light background):
- Primary: #0F0F0F
- Secondary: #555555
- Tertiary: #999999

Implement as CSS custom properties and Tailwind config (if applicable). Apply the scale to all existing text elements.
```

---

# Typography Critique Prompt (Attach Screenshot)

```
Critique only the typography in this screenshot.

Evaluate:
1. Size hierarchy: is the headline significantly larger than the body? What is the approximate size ratio?
2. Weight contrast: does the headline weight clearly dominate? Is weight used as a hierarchy lever alongside size?
3. Line length: is body text constrained to a comfortable reading width? Too wide?
4. Line height: does body text feel cramped or comfortable?
5. Letter spacing: are large headlines set slightly tight (-0.01 to -0.03em)? Are uppercase labels set wide?
6. Text color levels: are there distinct levels of text prominence (primary, secondary, tertiary)?
7. Typeface choice: does the typeface match the emotional direction of the design?
8. Overall: does the typography communicate hierarchy clearly, or is it flat?

List specific fixes for each problem found. Be direct.
```

---

# Typography Refinement Prompt

```
Run a typography pass on the current design. Make these specific refinements:

1. Hero headline:
- Size: confirm [Xpx] desktop
- Weight: confirm [700-900]
- Letter-spacing: set to -0.02em (slightly tighter than default)
- Line-height: set to 1.1-1.15 for display headlines

2. Section headings:
- Size: [36-48px]
- Weight: [600-700]
- Letter-spacing: -0.01em

3. Body text:
- Size: [16px]
- Line-height: [1.65]
- Color: [secondary text color — not primary weight]

4. Labels and small caps:
- All uppercase labels: add letter-spacing: 0.08em minimum
- Confirm they are using the tertiary text color

5. Text contrast:
- Confirm no pure white (#FFFFFF) on dark backgrounds — use rgba(255,255,255,0.92)
- Confirm no pure black (#000000) on white — use #0F0F0F or equivalent

Make all changes and confirm completion.
```
