# Spacing Prompt

Prompt templates for setting up spacing systems and running spacing passes on existing designs.

---

# Spacing System Setup Prompt

```
Set up the spacing system for this project as CSS custom properties.

BASE UNIT: 4px

SPACING SCALE:
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
--space-32: 128px
--space-40: 160px

SECTION PADDING:
- Hero: [160px] vertical
- Primary sections (features, social proof): [96-120px] vertical
- Secondary sections (logo bar, stats): [64-80px] vertical
- Final CTA: [96-120px] vertical

GRID:
- Max container width: [1280px]
- Column gutters: [32px]
- Page horizontal margin: [24px mobile / 48px tablet / 80px+ desktop]

COMPONENT SPACING:
- Card internal padding: [24-32px]
- Card grid gap: [24-32px]
- Section heading to content gap: [48-64px]
- Headline to subtext gap: [16-24px]
- Subtext to CTA gap: [32-40px]

Apply this system as CSS custom properties. Replace all hardcoded pixel values in the codebase with references to this scale.
```

---

# Spacing Audit Prompt (Attach Screenshot)

```
Audit the spacing in this screenshot.

Evaluate:
1. Section padding: does it feel generous or compressed? Is there breathing room between sections?
2. Internal card/component padding: do cards feel spacious or cramped?
3. Headline-to-content gap: is there enough space between the section heading and its content?
4. Grid gaps: are the gaps between grid items consistent and appropriate?
5. Text column width: is body text constrained to a comfortable line length or does it stretch too wide?
6. Focal element breathing room: does the primary element in each section have open space around it, or is it crowded?

Rate each: pass / needs more space / needs less space.

List the top 3 spacing problems in priority order with specific fixes (e.g., "Increase section padding from 48px to 96px").
```

---

# Spacing Pass Prompt

```
Run a spacing pass on the current design. Do not change any colors, typography, or layout — only adjust spacing values.

Check and fix:
1. Section vertical padding — minimum [80px] for standard sections, [120px] for hero and hero-level sections
2. Card internal padding — minimum [24px] on all sides
3. Grid gaps — consistent [28-32px] between all cards
4. Section heading to content — [48px] minimum gap
5. Max content width — body text columns must not exceed [680px] width
6. Headline to subheading gap — [16-20px]
7. Subheading to CTA — [32-40px]
8. Mobile section padding — minimum [48px] vertical (do not compress to 24px on mobile)

Make all adjustments. Before and after: describe the most significant spacing change made and why it improves the design.
```
