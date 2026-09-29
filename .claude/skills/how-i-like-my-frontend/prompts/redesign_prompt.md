# Redesign Prompt

For kickstarting a redesign of an existing page. Attach screenshots of the current state and reference screenshots before sending.

---

# Full Redesign Kickoff Prompt

```
I want to redesign [page/section name]. I have attached:
1. Screenshots of the current design (labeled CURRENT)
2. Reference screenshots of the direction I want to go (labeled REFERENCE)

WHAT TO KEEP:
[List specifically what should not change: existing brand colors, existing copy, specific sections that are working]

WHAT TO CHANGE:
[List the primary problems with the current design that motivated the redesign]

NEW DIRECTION:
- Emotional tone: [target tone]
- Visual style: [dark luxury / light minimal / etc]
- Specific elements I want from the references: [be specific — "the left-weighted hero layout from Reference 1", "the oversized statistic numbers from Reference 2"]

CONSTRAINTS:
- Tech stack: [Next.js / plain HTML / React]
- Sections to redesign: [list them in order]
- Sections NOT to touch: [list]

Before redesigning, confirm:
1. What are the 3 biggest design problems you see in the current design?
2. What specifically from the references will you adapt (not copy)?
3. What design decisions will you make differently from the current version?

Then produce the redesign starting with the [hero / highest priority section].
```

---

# Quick Section Redesign Prompt

```
Redesign only the [section name] section. 

Current problem: [describe what's wrong]
Target: [describe what it should look like/feel like]
Reference: [attached screenshot labeled REFERENCE]
Borrow specifically: [what from the reference]
Keep: [what must not change]

Produce the redesigned section and explain the key design decisions you made.
```

---

# Hero Redesign Prompt

```
Redesign the hero section. Attached: current state (CURRENT) and direction references (REFERENCE 1, REFERENCE 2).

Hero requirements:
- Tagline: "[tagline]"
- Subheading: "[subheading]"
- Primary CTA: "[CTA text]"
- Visual element: [attached image / generate from description: "___"]
- Layout: [left-weighted two-column / full-bleed / centered typographic]

Anti-slop rules for this hero:
- No centered layout (unless explicitly requested above)
- No gradient background without a strong reason
- No particle fields or floating shapes
- The visual element must be specific to this product concept

From Reference 1 I want: [specific element]
From Reference 2 I want: [specific element]

Produce the hero and explain: (1) the layout choice, (2) the type hierarchy decisions, (3) how the visual element connects to the product concept.
```
