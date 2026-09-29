# Motion Examples

---

# GSAP ScrollTrigger

Purpose:
Link animation progress directly to scroll position. Elements animate as the user scrolls, not just when they enter the viewport.

Best For:
- Pinned sections that animate while page scroll is paused
- Horizontal scroll sections
- Elements that reveal progressively as user scrolls
- Parallax effects controlled by scroll

Implementation note:
gsap.registerPlugin(ScrollTrigger) — wrap in a useEffect on component mount.

Risk:
Performance intensive if overused. Limit to 3-5 ScrollTrigger animations per page.

---

# Framer Motion Scroll Reveal

Purpose:
Elements fade and translate up into view as they enter the viewport.

Best For:
- Feature cards appearing on scroll
- Section headings
- List items staggering in

Standard implementation:
- initial: { opacity: 0, y: 24 }
- animate: { opacity: 1, y: 0 }
- transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
- useInView with once: true

Risk:
When every element on the page has a scroll reveal, nothing feels special. Apply to section anchors and primary elements only.

---

# Staggered Children Animation

Purpose:
Multiple sibling elements animate in sequence with a delay between each, creating a wave effect.

Best For:
- Feature card grids
- Navigation items on mobile open
- List reveals
- Testimonial sections

Implementation with Framer Motion:
- Set variants on parent and children
- parent: staggerChildren 0.07-0.12 seconds
- children: individual animation variant
- Use delayChildren on parent for initial pause before first child

Risk:
Too much delay between items (>150ms) makes the stagger feel slow and deliberate rather than flowing.

---

# Magnetic Button Effect

Purpose:
Button subtly attracts the cursor as the cursor approaches, creating a physical pull sensation.

Best For:
- Primary CTAs on landing pages
- Navigation items on creative sites
- Any button meant to feel premium and interactive

Implementation:
- Track mouse position relative to button center
- Translate button (and optionally text separately at different rate) toward cursor
- Use lerp (linear interpolation) for smooth following, not direct position
- Reset on mouse leave with spring animation

Risk:
Only works on desktop. Ensure the interaction degrades gracefully on touch devices. Can feel gimmicky if the pull radius is too large.

---

# Parallax Section Layers

Purpose:
Different elements within a section scroll at different speeds, creating depth.

Best For:
- Hero sections with layered imagery
- Full-bleed backgrounds that move slower than content

Safe implementation:
- Maximum 20% speed difference between layers
- Use CSS transform: translateY (not top/position) for performance
- Test on mobile — parallax often causes jank on mobile and should be disabled

Risk:
Excessive parallax causes motion sickness. The effect should be subtle enough that users notice depth, not motion.

---

# Path Drawing Animation

Purpose:
SVG paths animate as if being drawn in real time.

Best For:
- Line illustrations that reveal progressively
- Diagrams that explain a process by drawing themselves
- Decorative line elements that appear on scroll

Implementation:
- Set stroke-dasharray and stroke-dashoffset to path length
- Animate stroke-dashoffset from full path length to 0
- Trigger with ScrollTrigger or IntersectionObserver

Risk:
Requires SVG paths. Not applicable to all visual elements.

---

# Number Count-Up

Purpose:
Statistics animate from 0 to their target value when they scroll into view.

Best For:
- Statistics sections
- Dashboard-style data presentations
- Any prominent number

Implementation:
- Use requestAnimationFrame with an easing function
- Duration: 1.2-2 seconds depending on number size
- Use IntersectionObserver to trigger only on scroll into view
- Animate once only — do not replay on re-scroll

Risk:
Very fast numbers (100,000+ in 1 second) are not readable during count. Either slow them down or start the count from a closer number.

---

# Looping Background Video (Hero)

Purpose:
Subtle moving background in hero section that adds life without distracting from content.

Best For:
- Dark hero sections with concept-driven imagery
- Products with a strong visual metaphor
- When a still image would feel static

Technical requirements:
- Format: WebM with MP4 fallback
- Duration: 10-20 seconds, seamlessly looped
- File size: under 5-8MB compressed
- Autoplay: muted, playsInline, loop attributes required
- Mobile: load still image only (use matchMedia or Intersection Observer)

Risk:
Video increases page weight. Always measure Core Web Vitals impact. Never autoplay on mobile.
