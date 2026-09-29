# Frontend Review Checklist

40-point pre-ship checklist. Every item must be checked before a page ships. This is the final gate.

---

# Hierarchy (8 points)

- [ ] 1. Hero has one visually dominant element — the eye knows where to go immediately
- [ ] 2. Every section has exactly one focal point
- [ ] 3. Headline-to-body type ratio is minimum 3x in hero, 2x in other sections
- [ ] 4. CTA is the most visually distinct action element in every section where it appears
- [ ] 5. No section has three or more elements of equal visual weight competing
- [ ] 6. Visual energy varies across sections (hero is highest, features are calmer, CTA returns to energy)
- [ ] 7. Scan path is traceable from hero headline through every section to final CTA
- [ ] 8. Final CTA section has intentional design energy — not an afterthought

---

# Typography (6 points)

- [ ] 9. Hero headline is 56px minimum, weight 700 minimum
- [ ] 10. Text uses three opacity or color levels (primary, secondary, tertiary)
- [ ] 11. No pure white (#FFFFFF) on dark or pure black (#000000) on light
- [ ] 12. Large display text has slightly tightened letter-spacing (-0.01 to -0.03em)
- [ ] 13. Uppercase labels have letter-spacing 0.06em+ applied
- [ ] 14. Body line-height is 1.5 minimum

---

# Spacing (4 points)

- [ ] 15. Section vertical padding is 80px minimum (120px+ for hero)
- [ ] 16. Card internal padding is 24px minimum
- [ ] 17. Body text columns are constrained (max ~680px width)
- [ ] 18. No section feels cramped — every primary element has breathing room

---

# Anti-Slop Cleared (8 points)

- [ ] 19. No purple/violet gradient backgrounds
- [ ] 20. No glow or neon halo effects (or one maximum, intentionally placed)
- [ ] 21. No more than one glassmorphism element on the full page
- [ ] 22. No three identical-structure feature cards in a row
- [ ] 23. At least some sections use asymmetric or non-centered layout
- [ ] 24. Hero is not: centered text + gradient + particle field
- [ ] 25. No purposeless animations (particles, floating shapes, random spinning)
- [ ] 26. Color palette has 3 prominent colors maximum

---

# Interaction States (6 points)

- [ ] 27. All buttons: hover state present with transition (150-200ms)
- [ ] 28. All buttons: active/pressed state present (scale 0.97 or background darken)
- [ ] 29. All clickable cards: hover elevation present
- [ ] 30. All text links: hover state present
- [ ] 31. All form inputs: custom focus ring styled
- [ ] 32. Loading state exists for all async operations

---

# Mobile (4 points)

- [ ] 33. Section padding on mobile 48px+ vertical (not collapsed to default)
- [ ] 34. No horizontal overflow on any viewport width
- [ ] 35. Hero headline 32px minimum on mobile
- [ ] 36. CTA tap targets 44px minimum height

---

# Content and Assets (4 points)

- [ ] 37. No generic stock imagery (all images are concept-specific)
- [ ] 38. No placeholder text or lorem ipsum anywhere on the page
- [ ] 39. All statistics are specific (not rounded: "12,473 users" not "12,000+")
- [ ] 40. Hero tagline passes the competitor-swap test (could not appear on a competitor's site)

---

# Shipping Standard

All 40 checked: ship.
38-39 checked: ship with documented exceptions.
35-37 checked: one more iteration before shipping.
Below 35: significant work remains.
