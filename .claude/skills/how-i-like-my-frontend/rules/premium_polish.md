# Premium Polish Rules

Premium design is not one big thing — it is the accumulation of dozens of small things that most users will not consciously notice but would feel missing if they were removed. Character comes from craft.

---

# The Core Principle

Nobody will tell you they noticed the 200ms scroll progress bar. They will tell you the site felt expensive. They will tell you it felt like someone cared. That feeling comes from the details.

The polish pass is not optional. First output is always a scaffold. The polish pass is where design becomes premium.

---

# Hover States

Every interactive element must have a hover state. This includes:
- Buttons — background shift, brightness change, or subtle scale
- Cards — elevation increase, border highlight, or translateY -2px to -4px
- Navigation links — color transition, underline appearance
- Icons — color or scale transition
- Images — brightness or scale (very subtle — 1.02 maximum)
- Text links — color and underline transitions

Duration: 150-250ms with ease-out.

Rule:
An element with no hover state reads as undesigned or broken. Audit every interactive element before shipping.

---

# Focus States

Often completely ignored in AI-generated output. Focus states are required for accessibility and communicate design care.

Default browser focus rings: replace with custom styled rings that match the design system.
Custom focus ring style: 2px solid accent color with 2-3px offset from the element boundary.
Never remove focus states entirely — this breaks keyboard navigation.

Rule:
Tab through the page before shipping. If focus states look broken, generic, or absent, fix them.

---

# Loading States

Empty states and loading states are design opportunities that are almost always neglected.

Skeleton screens: Prefer over spinners for content-heavy areas. Match the skeleton shape to the actual content layout.
Button loading state: When a form submits, the button should show a loading indicator — spinner, text change, or icon swap — not just go inert.
Progressive loading: Images should load with a blur-up or fade-in rather than snapping in abruptly.
Empty states: When a list or table is empty, the empty state should be designed — illustration, clear message, and a next action.

Rule:
Every async operation in the UI has three states: loading, success, and error. Design all three.

---

# Scroll Progress Indicators

A scroll progress bar at the top of long pages signals to the user how far they have come. Subtle, but communicates craft.

Implementation: 2-4px bar at the very top of the viewport, fixed position, accent color, width driven by scroll percentage.
Duration: No animation delay. Updates with scroll in real time.

Rule:
Use on pages longer than 3 scroll heights. Skip on short pages — it has nothing to communicate.

---

# Counter and Number Animations

When displaying statistics or numbers on a landing page, animate them counting up when they scroll into view.

Good: 0 → 12,000 users counting up over 1.5 seconds with ease-out
Good: Statistic animates only once, on first scroll into view
Bad: Number counting loops on repeat
Bad: Number animates too fast to read at any point

Rule:
Animated numbers should complete their count before the user has time to read the final value — but not so fast they cannot follow. Target 1-2 seconds for most numbers.

---

# Micro-Transitions Between States

When content changes state, the transition should be smooth.

Tab switching: Fade out old content (150ms), fade in new content (150ms). Not an instant swap.
Accordion open/close: Animate height with overflow hidden. 250-350ms ease-in-out.
Modal appear/disappear: Fade in with slight scale (0.95 to 1.0). Never hard-cut.
Dropdown: Fade in with slight translateY. 150-200ms.

Rule:
No state change should be instantaneous unless the design system explicitly requires it. Every change in content deserves a transition.

---

# Image Loading Polish

Images that snap into place from white break immersion.

Techniques:
- blur-up: Load a tiny blurred version first, replace with full resolution on load
- fade-in: Images fade from opacity 0 to 1 on load (300-400ms)
- placeholder color: Background color while image loads that matches the dominant color of the image

Rule:
Images should never snap in abruptly. Choose one technique and apply it consistently.

---

# Cursor Customization

Custom cursors are a signature element that immediately signals design investment.

Minimal cursor upgrade: change cursor to none, replace with a 10-12px dot that follows with slight spring lag
Content area cursor: different cursor style for interactive zones vs reading zones
Magnetic effect: interactive elements that attract the cursor slightly on hover (GSAP required)

When not to use: high-performance applications where cursor lag creates friction. Consumer apps where cursor custom behavior may confuse.

Rule:
Custom cursors work best on portfolio, creative, and marketing sites. Avoid on utility products where predictability matters more than personality.

---

# Selection and Highlight Styling

The ::selection CSS pseudo-element styles text that users highlight.

Set a custom selection color that matches the accent color palette.
Example: background accent color at 30% opacity with readable foreground.

Most sites ignore this. Sites that style it feel more designed.

Rule:
Add ::selection styling to the global stylesheet. Takes 3 lines of CSS and immediately signals attention to detail.

---

# Scroll Behavior

Default scroll behavior is instant. Smooth scroll to anchor links feels premium.

HTML: Add scroll-behavior: smooth to the root element for native smooth scrolling.
Or use JS for more control over easing and duration.

Scroll to top button: appears after user has scrolled 3+ heights, fades in, disappears near top.

Rule:
Anchor navigation should always scroll smoothly. Hard-jumping to page sections feels like a broken link.

---

# Typography Refinements

Small typographic details that separate polished from default:

- Hyphenation on long words in narrow text columns
- Avoiding widows (single words on the last line of a paragraph)
- Non-breaking spaces between numbers and units (100 users, not 100\nusers)
- Proper quotation marks ("like this") not inch marks ("like this")
- Em dashes (—) not double hyphens (--)
- Balanced line lengths on headlines (if a headline wraps, make both lines similar length)

Rule:
Run typographic cleanup on hero and feature headlines specifically. These are the most read text on the page.
