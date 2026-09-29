# Premium Polish Prompt

Use after the design structure and surface are complete. This pass adds the micro-details that create the "someone cared" feeling.

---

# Full Polish Pass Prompt

```
The structure and surface of this design are complete. Now I want a premium polish pass.

Work through each of the following in order:

1. HOVER STATES
Audit every interactive element and confirm it has a proper hover state:
- Primary buttons: background shift, timing 150-200ms ease-out
- Secondary buttons: border or background shift
- Cards (if clickable): translateY(-3px) and box-shadow increase, 200-250ms
- Navigation links: color transition + underline
- Text links: color transition, 150ms
- Icons: color or scale transition
- Any missing hover states: add them

2. ACTIVE/PRESSED STATES
Buttons should show a visual press state (scale 0.96-0.98 or background darken) on click. Add this if missing.

3. FOCUS STATES
Audit all focusable elements. Replace generic browser focus rings with a custom styled ring: 2px solid accent color, 2-3px offset. Ensure it is visible on both dark and light backgrounds.

4. SCROLL REVEALS
Add subtle scroll-triggered entrance animations to:
- Section headings (opacity 0→1, translateY 24px→0, 450ms ease-out)
- Primary focal elements in each section (same, triggered 100ms after heading)
- Card groups (stagger 70ms between siblings)
Do NOT add scroll reveals to every element — only anchors and primary elements.

5. COUNTER ANIMATIONS
If there are statistics or numbers on the page: add count-up animation triggered on scroll into view. Duration: 1.5-2 seconds, ease-out, triggers once.

6. TEXT SELECTION STYLING
Add ::selection CSS: background color as accent at 25-30% opacity, foreground color readable.

7. SCROLL PROGRESS BAR
If the page is more than 3 scroll heights: add a 3px fixed bar at the top, accent color, driven by scroll percentage.

8. SMOOTH SCROLL
Ensure anchor links scroll smoothly (scroll-behavior: smooth on html, or JS equivalent).

9. IMAGE LOADING
All images should fade in on load (opacity 0 to 1, 300-400ms). No snapping.

10. TYPOGRAPHY REFINEMENTS
- Check hero headline for optimal line breaks (balance the line lengths if it wraps)
- Confirm no single words on the last line of important paragraphs
- Ensure letter-spacing is tightened on large headlines (-0.01 to -0.03em)

After completing all 10 items, tell me: what additional premium details could be added given the remaining implementation budget?
```

---

# Quick Polish Prompt

```
Polish pass on the current state. Add in this order:
1. Hover states on everything interactive that is missing them
2. Scroll reveal on section headings and primary elements (subtle: opacity + translateY 24px, 450ms)
3. Counter animations on any statistics
4. Image fade-in on load
5. Custom text selection color (accent at 25% opacity)

Execute and confirm what was added.
```
