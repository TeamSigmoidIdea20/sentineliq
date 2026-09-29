# Premium Microinteractions

Specific micro-detail examples with implementation notes. These are the small details that compound into a premium feeling.

---

# Magnetic Button

What It Does:
The button subtly moves toward the cursor as the cursor approaches within a defined radius. The text inside the button can move at a different rate than the button border, creating a layered effect.

Why It Feels Premium:
Physical magnetism is a real sensation. The interaction creates a pull that makes clicking feel inevitable rather than volitional.

Implementation sketch:
Track mousemove position relative to button center.
Calculate delta x and delta y within magnetic radius.
Apply translateX and translateY to button at a fraction of delta (e.g., 0.3x).
Apply a different fraction to the inner text (0.5x) for the layered effect.
Lerp (linear interpolation) toward cursor for smooth following.
Animate back to origin on mouseLeave with spring physics.

---

# Animated Underline (Link Hover)

What It Does:
On hover, a thin underline scales in from the left edge of the text. On un-hover, it scales out toward the right.

Why It Feels Premium:
Feels directional and physically motivated. Much more intentional than a static underline appearing/disappearing.

CSS implementation:
::after pseudo-element with width 100%, height 1px, background accent color.
transform: scaleX(0), transform-origin: left on default state.
transform: scaleX(1) on hover.
Reverse: transform-origin: right on mouse-leave.
Transition: transform 200ms ease-in-out.

---

# Button Press Response

What It Does:
On click (mousedown/active state), the button scales down to 0.96-0.97 and slightly darkens the background. On release (mouseup), it springs back.

Why It Feels Premium:
Simulates the physics of pressing a physical button. Confirms the click registered before any async operation begins.

CSS: scale(0.97) on :active state, duration 80ms, no easing (snappy by default).

---

# Card Float on Hover

What It Does:
Clickable cards rise 3-4px and increase their drop shadow when hovered.

Why It Feels Premium:
The card appears to lift off the surface, confirming it is a pressable, interactive object. The shadow change reinforces the elevation change physically.

CSS: transform: translateY(-4px) and box-shadow increase on hover, 200ms ease-out.
Never use scale — it creates layout shift.

---

# Count-Up Statistics

What It Does:
Numbers counting from 0 to their target value when scrolled into view, with ease-out timing so the number slows as it approaches the final value.

Why It Feels Premium:
The counting movement draws the eye to the statistic at the moment it becomes visible. The ease-out mimics real physical deceleration.

Implementation: requestAnimationFrame loop, IntersectionObserver trigger, linear interpolation with ease-out function, runs once.

---

# Loading State with Skeleton

What It Does:
Instead of a spinner on an entire content area, individual content elements show as grey placeholder shapes that match the dimensions of the incoming content.

Why It Feels Premium:
Communicates what the content structure will look like before it loads. More informative than a spinner. Reduces perceived loading time.

CSS: Animated shimmer gradient (left-to-right) on grey background-color that matches approximate content height.

---

# Custom Text Selection Color

What It Does:
When the user highlights text on the page, the selection background is the brand accent color at 25-30% opacity rather than the default browser blue.

Why It Feels Premium:
Most users will select text at some point. The custom selection color is a detail they will not expect but will notice. It communicates "someone thought about this."

CSS: ::selection { background-color: rgba([accent-color], 0.25); color: [readable foreground]; }

---

# Smooth Scroll Progress Bar

What It Does:
A 3px bar fixed at the very top of the viewport, in the accent color, whose width corresponds to the user's scroll progress through the page.

Why It Feels Premium:
Communicates page length and reading progress. Visually confirms the user's position on long pages.

Implementation: Fixed position, top: 0, height: 3px, width driven by window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100%.

---

# Focus Ring Design

What It Does:
Custom-styled focus rings that match the design system instead of the default browser outline.

Why It Feels Premium:
Default browser focus rings are visually jarring — they use generic colors and widths that conflict with every design system. Custom focus rings signal accessibility-consciousness and attention to detail.

CSS: outline: 2px solid [accent-color]; outline-offset: 3px; on :focus-visible. Remove on :focus (not :focus-visible) to avoid showing rings on mouse click.

---

# Image Fade-In on Load

What It Does:
Images transition from transparent to fully opaque as they load, rather than appearing abruptly.

Why It Feels Premium:
Eliminates the jarring experience of images snapping into place. The fade makes the page feel like it loads gracefully rather than assembling itself piece by piece.

Implementation: images start at opacity: 0, add a CSS class with opacity: 1 and transition: opacity 300ms ease-out when the load event fires. Or use loading="lazy" combined with an IntersectionObserver.
