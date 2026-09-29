# Motion Rules

Motion in frontend design should be felt, not watched. The best animations are the ones users do not consciously notice but would miss if they were removed.

---

# The Core Principle

Subtle is better. Purposeful is mandatory. Any animation that draws attention to itself rather than to content has failed its job.

The test: if a user pauses to watch an animation, it is too much.
The goal: motion that makes interactions feel alive without becoming a spectacle.

---

# Motion Hierarchy

Not all motion is equal. Use motion selectively based on semantic importance.

Micro-motion (highest frequency, lowest intensity):
- Hover state transitions (200-300ms)
- Button press feedback
- Focus ring appearance
- Toggle and checkbox state changes

Interaction motion (moderate frequency, moderate intensity):
- Dropdown open/close (200-250ms)
- Modal entrance/exit (250-350ms)
- Tab switching
- Accordion expand/collapse

Entrance motion (low frequency, moderate intensity):
- Page section scroll-reveal (400-600ms)
- Hero element entrance on load
- Feature card appearances as user scrolls

Signature motion (very low frequency, higher impact):
- One hero animation tied to product concept
- A unique transition effect that defines the brand
- Background looping motion in hero

Rule:
Every level of motion should be less prominent than the level above it. If micro-motion is as visible as signature motion, the system is broken.

---

# Timing and Easing

Timing:
- Micro-interactions: 150-250ms (fast, snappy)
- UI transitions: 200-350ms (responsive)
- Section entrances: 400-700ms (deliberate)
- Complex animations: 600-1200ms maximum (anything longer requires strong justification)

Easing:
- Never use linear for UI — it feels mechanical
- ease-out for elements entering the screen (decelerates into place, feels settled)
- ease-in for elements leaving the screen (accelerates away, feels intentional)
- ease-in-out for elements that transform in place
- spring physics for interactive elements (drag, pull, press) — creates physical feel

Rule:
Linear motion reads as AI-generated or developer-coded. Eased motion reads as designed. Always use easing.

---

# Scroll-Triggered Entrances

Scroll-triggered animations should reveal content progressively, not perform.

Good scroll animation:
- Element fades up 20-30px from its final position into place (opacity 0 to 1, translateY 24px to 0)
- Duration 400-600ms with ease-out
- Stagger between sibling elements: 60-100ms delay per element

Bad scroll animation:
- Elements flying in from 200px away
- Rotating, spinning, or bouncing entrances
- Every element on the page animated independently and chaotically
- Animation that plays even when the user has not scrolled to it yet

Rule:
Scroll animations should feel like content appearing naturally as it becomes visible, not like a slideshow.

---

# Hover States

Hover states are the most important micro-interaction. They communicate that an element is interactive and responsive.

Buttons:
- Background color shift or brightness increase
- Subtle scale (1.02-1.04 maximum) if the button is small
- Duration: 150-200ms

Cards:
- Slight elevation increase (box-shadow increase or translateY -2 to -4px)
- Border color shift
- Never scale cards — it creates layout shift

Links:
- Color transition on the text or underline
- Never underline-jump (the page should not shift when an underline appears)

Icons:
- Color shift, scale up to 1.1 maximum
- Rotation only if it carries semantic meaning (arrow pointing in a direction)

Rule:
Every interactive element must have a hover state. An element with no hover feedback reads as broken or undesigned.

---

# The 15-Second Looping Video Hero

When using video in a hero section:

Duration: 10-20 seconds, seamlessly looping
Motion intensity: Subtle. The video should read as slightly animated imagery, not a film.
Subject: Tied directly to the product concept or visual metaphor
Audio: Always muted autoplay
Performance: Load still image first, replace with video after load on desktop. Never autoplay video on mobile.
Fallback: The still frame must look as good as any screenshot — the video is an enhancement, not a requirement.

Good video motion: slow drift, subtle atmospheric movement, gentle particle systems tied to concept
Bad video motion: fast cuts, obvious animation, literal product demos, random visual effects

Rule:
If removing the video and showing the still image makes the hero look better or equivalent, the video is not doing its job.

---

# GSAP and CSS Animation Decision

CSS animation: appropriate for simple state changes (hover, focus, toggle), scroll reveals, simple entrance effects.
GSAP: appropriate for timeline-based sequences, scroll-linked animations (ScrollTrigger), complex staggered entrances, physics-based motion.

Do not use GSAP for simple hover states — CSS handles these better and with less overhead.
Do not use CSS for complex sequenced animations — the timeline becomes unmaintainable.

Rule:
Default to CSS animations. Reach for GSAP only when CSS cannot achieve the effect without complexity.

---

# Motion Anti-Patterns

Particle fields: Abstract floating circles, dots, and lines. They read as "the designer did not know what to put in the background."
Continuous rotation: Spinning logos, rings, or abstract shapes. Induces visual fatigue.
Bounce and overshoot on everything: Physics easing on non-interactive elements feels random.
Entrance animations on every element: When everything animates, nothing feels special.
Motion without reduced-motion support: Always include prefers-reduced-motion: reduce media query to disable animations for users who need it.

Rule:
If more than 30% of the elements on a page have entrance animations, it is too many. Animate selectively to make the animated elements feel special.
