# Frontend Audit Prompt

A comprehensive audit prompt that reviews a design against all major frontend quality dimensions. Attach screenshots of the full page before sending.

---

# Full Audit Prompt

```
Run a comprehensive frontend design audit on the attached screenshots. Evaluate every dimension below. For each, give: current state, rating (pass / needs work / fail), and specific fix if failing.

SECTION 1: Anti-Slop Check
Confirm whether any of these patterns are present. For each present: name it and describe exactly where it appears.
- Purple/violet gradient backgrounds
- Glow or neon halo effects on cards or elements
- Excessive glassmorphism (more than one element)
- Identical three-column icon/title/text card grids
- Over-centered layout (every section centered on vertical axis)
- Generic stock photography or generic AI imagery
- Purposeless animations (particles, floating shapes, spinning elements)
- Scattered palette (more than 3 prominent colors)
- Flat typography (all text at similar visual weight)

SECTION 2: Visual Hierarchy
- Does each section have exactly one dominant focal point?
- Does the eye path flow naturally from headline to supporting content to CTA?
- Is there sufficient size contrast between headline and body text (minimum 3x in hero)?

SECTION 3: Typography Quality
- Is the headline weight 700+ in hero sections?
- Is there genuine style or weight variation between heading levels?
- Is body line-height comfortable (1.5-1.7)?
- Are text color levels tiered (primary, secondary, tertiary)?

SECTION 4: Spacing Discipline
- Is section vertical padding generous (80px+ for standard sections)?
- Is internal card padding sufficient (24px+)?
- Is there breathing room around primary focal elements?
- Are grid gaps consistent?

SECTION 5: Color System
- How many prominent colors? (3 maximum recommended)
- Is the accent used sparingly (3-5 uses maximum across full page)?
- Is text contrast sufficient for readability?

SECTION 6: Interactive States
- Are hover states visible on all interactive elements?
- Are focus states styled (not default browser rings)?
- Do state transitions appear to be animated (not instant)?

SECTION 7: Emotional Consistency
- What is the dominant emotional tone of the design?
- Does that tone remain consistent from top to bottom?
- Does any section conflict with the dominant tone?

SECTION 8: Mobile Assessment (if mobile screenshots provided)
- Is padding preserved on mobile (48px+ vertical)?
- Are font sizes legible (32px+ hero headline, 15px+ body)?
- Are tap targets sufficient (44px+)?

OUTPUT FORMAT:
1. Overall rating: [Pass / Needs Work / Fail]
2. Critical issues (must fix before shipping): [list]
3. Significant issues (fix in next iteration): [list]  
4. Polish opportunities (nice to have): [list]
5. What is working well: [list]
```

---

# Quick Audit Prompt

```
Quick audit of this design. Give me:
- 3 things that are working
- 3 critical problems (in priority order)
- Any anti-slop patterns present
- One sentence: what level is this design (Level 1-6 from the 7-levels framework)?

Be direct and specific.
```
