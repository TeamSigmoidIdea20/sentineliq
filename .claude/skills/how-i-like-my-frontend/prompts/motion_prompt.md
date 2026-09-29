# Motion Prompt

Prompt templates for adding, refining, and auditing motion on a frontend project.

---

# Motion Direction Prompt (Pre-Build)

```
Before implementing any motion, I want to set the motion direction for this project.

MOTION PACE: [fast and snappy / balanced / slow and deliberate]

HOVER STATES:
- Buttons: background shift + [optional: scale 1.02], timing [150ms] ease-out
- Cards (clickable): translateY(-[3-4]px) + box-shadow increase, timing [200ms] ease-out
- Links: color shift + underline scale-in from left, timing [150ms]
- Icons: [color shift / scale 1.1], timing [150ms]

SCROLL REVEALS:
- Elements: opacity 0 → 1, translateY [24px] → 0
- Duration: [450ms]
- Easing: [cubic-bezier(0.16, 1, 0.3, 1)] (fast-out ease)
- Trigger: once on first entry into viewport
- Apply to: [section headings, primary feature elements — not every paragraph]
- Stagger for siblings: [70ms] between each

SIGNATURE MOTION: [Describe the one hero animation OR "none"]
- Element: [what moves]
- Motion type: [looping video / CSS animation / GSAP ScrollTrigger]
- Concept connection: [how this motion relates to the product concept]

REDUCED MOTION:
All non-essential animations must be wrapped in or conditioned on prefers-reduced-motion: reduce.

Follow this spec for all motion implementation. Confirm before starting.
```

---

# Scroll Animation Prompt

```
Add scroll-triggered entrance animations to the following elements:

[List elements: "section headings", "feature cards", "statistics"]

Animation spec:
- Initial state: opacity 0, transform translateY 24px
- Final state: opacity 1, transform translateY 0
- Duration: 450ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Trigger: when element enters viewport (IntersectionObserver or Framer Motion useInView)
- Trigger once: true (does not replay on re-scroll)

For grouped siblings (cards, list items):
- Stagger: 70ms delay between each child
- Maximum stagger total: do not exceed 350ms total wait for last child

Use [Framer Motion / GSAP ScrollTrigger / CSS + IntersectionObserver].

After implementing: confirm prefers-reduced-motion disables these animations.
```

---

# Hover State Batch Prompt

```
Add hover states to all interactive elements on this page that are currently missing them.

For each element type, apply:

BUTTONS (primary):
background: [color] → [slightly lighter/brighter version]
transition: background 150ms ease-out

BUTTONS (secondary/ghost):
border-color: [subtle] → [accent color]
color: [subtle] → [accent color]  
transition: 150ms ease-out

CARDS (clickable):
transform: translateY 0 → translateY -3px
box-shadow: [current] → [slightly stronger]
transition: transform 200ms ease-out, box-shadow 200ms ease-out

NAVIGATION LINKS:
color: [current] → [accent or white at higher opacity]
transition: color 150ms ease-out

TEXT LINKS:
color: [current] → [accent]
underline: appears on hover (use text-decoration or pseudo-element)
transition: 150ms

Confirm when complete and list every element that now has a hover state.
```

---

# GSAP ScrollTrigger Prompt

```
Implement a GSAP ScrollTrigger animation for the following:

ELEMENT: [describe the element — e.g., "the features section where three cards appear"]
EFFECT: [describe the desired effect — e.g., "cards stagger in from below as user scrolls into the section, with the section pinned while cards animate in"]

Technical requirements:
- Use gsap.registerPlugin(ScrollTrigger)
- Initialize in useEffect (if React) or DOMContentLoaded (if vanilla)
- Cleanup on component unmount (React): return () => { ScrollTrigger.getAll().forEach(t => t.kill()) }
- Responsive: confirm the animation works correctly on mobile

Produce the implementation and explain:
1. What trigger: scrub value means in this context
2. How the animation starts and ends
3. How to adjust the timing if the animation feels too fast/slow
```
