# Anti-Slop Prompt

Use these prompts to actively enforce anti-slop rules during a build or to audit and replace existing slop patterns.

---

# Pre-Build Anti-Slop Rules Prompt

```
Before you generate any frontend code for this project, I need to set strict anti-slop rules. These are non-negotiable.

BANNED PATTERNS — do not use any of these:

1. Purple or violet gradient backgrounds. If you need a gradient, it must be in the brand color palette and used with intentionality, not as a default background.

2. Glow or neon halo effects on cards, borders, or elements. No drop shadows colored with high-saturation accent colors. No glowing rings around cards.

3. Glassmorphism on more than one element. If glass is used, it appears on one accent element only — not on every card, panel, and modal.

4. Three-column identical feature card grids (icon + title + 2 sentences, three times in a row). If you need to show features, propose an alternative layout: bento grid, alternating rows, numbered list, or single large feature.

5. Over-rounded corners everywhere. Do not set border-radius: 12px on all elements universally. Radius should vary by element type.

6. Over-centered layouts. Not every section should be centered on the vertical axis. Use asymmetry, left-weighted layouts, and varied structure across sections.

7. Weak hero sections. The hero must not be: centered text + generic gradient + particle field. The hero needs a strong visual element, a dominant headline, and a specific layout decision.

8. Purposeless animations. No particle fields, floating shapes, spinning elements, or decorative animations that carry no semantic meaning.

9. Generic stock imagery or generic AI imagery. Any image must be concept-specific to this product.

10. Flat typography. Headlines must have significantly more visual weight than body text. Minimum 3x size ratio in hero sections.

If you are about to use any of these patterns, stop, name the pattern you were about to use, and propose a premium alternative instead.

Confirm you understand these rules before proceeding.
```

---

# Slop Detection Prompt (Attach Screenshot)

```
Look at this screenshot and identify every anti-slop pattern present.

For each pattern found:
- Name the pattern exactly (using the anti-slop taxonomy)
- Describe where it appears on the page
- Rate its severity (minor / significant / critical)
- Propose a specific replacement

Anti-slop patterns to look for:
- Purple/violet gradient backgrounds
- Glow or neon halo effects
- Excessive glassmorphism
- Identical three-column feature card grids
- Over-rounded corners on all elements
- Over-centered layouts (every section centered)
- Generic or weak hero section
- Purposeless decorative animations
- Generic stock imagery
- Flat typography
- Scattered color palette (4+ prominent colors)
- Cluttered sections with default padding

After listing all patterns found, tell me: is this Level 1-2 output (anti-slop patterns still present) or Level 3+ (mostly clear)?
```

---

# Mid-Build Anti-Slop Check

```
Before we continue: I want you to audit what has been built so far for anti-slop patterns.

Check specifically:
1. Background colors and gradients — any purple or generic gradients?
2. Card and panel treatments — any excessive glassmorphism or glow?
3. Layout — is every section centered? Is there any asymmetry?
4. Feature sections — are there three identical-structure cards?
5. Typography — is the headline significantly heavier and larger than the body?
6. Animations — any decorative, purposeless animations?

For each violation found: name it and fix it before we continue building.
```
