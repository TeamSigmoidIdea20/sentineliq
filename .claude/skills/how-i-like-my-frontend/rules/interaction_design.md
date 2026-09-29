# Interaction Design Rules

Interaction design is how the page responds to the user. Every response is a micro-moment of communication. Good interactions feel physical and alive. Bad interactions feel broken or absent.

---

# The Core Principle

Users interact with UI through a physical intuition built up over years of touchscreens, mice, and keyboards. Good interaction design confirms that intuition — buttons feel pressable, cards feel liftable, toggles feel switchable. Bad interaction design violates it.

The goal: every interactive element should feel like it has mass, resistance, and response.

---

# The Interaction Checklist

Before shipping, every interactive element must have:

1. A hover state (desktop) — signals interactivity
2. An active/pressed state — confirms the click registered
3. A focus state — required for keyboard navigation
4. A disabled state (if applicable) — clearly communicates unavailability
5. A loading state (if the action has latency) — prevents double-clicks and communicates process

Any element missing one of these five states is incomplete.

---

# Button Interaction Design

Hover:
- Background lightens or shifts hue by 10-15%
- Or: border appears and background becomes transparent (outline variant on hover)
- Duration: 150-200ms ease-out

Active/pressed:
- Scale down to 0.96-0.98 — simulates physical press
- Background darkens slightly
- Duration: 80-100ms — snappy, physical

Loading:
- Replace label with spinner or animated dots
- Disable pointer events during loading
- Restore label on completion or error

Success:
- Brief color flash or checkmark icon swap
- Return to default after 1.5-2 seconds

Rule:
The active state is often missing in AI output. It is the most physically important state — it confirms the action. Always include it.

---

# Card Interaction Design

Clickable cards:
- Hover: translateY(-2px to -4px) and box-shadow increase — simulates lifting
- Or: border color transitions from subtle to visible
- Duration: 200-250ms ease-out

Non-clickable informational cards:
- No hover state unless it contextually makes sense
- Adding hover states to non-interactive cards confuses users

Card with inner actions (buttons, links):
- The card hover state should not conflict with the inner element hover states
- Typically: card gets a subtle border on hover, inner elements get their own distinct hover treatment

Rule:
Never scale cards on hover — it creates layout shift and feels unstable. Use elevation (shadow + translateY) instead.

---

# Link Interaction Design

Text links:
- Hover: color transition (150ms) and underline appears or becomes solid
- Never remove the underline entirely on body text links — it is a critical accessibility signal
- Navigation links: color transition only, no underline (context makes them clearly navigational)

Animated underlines (premium detail):
- On hover, an underline scales in from left (scaleX 0 to 1, transform-origin left) in 200ms
- On un-hover, scales out to right (transform-origin right)
- This feels designed and physical

Rule:
Text links in body copy must always have an underline. Navigation and UI links may use color alone if the context is unambiguous.

---

# Form Interaction Design

Input focus:
- Border color shifts to accent color on focus
- Subtle box-shadow or glow (1 pixel, not 8) on focus
- Label floats upward (floating label pattern) or darkens for clarity

Input validation:
- Error state: red border, red helper text below, icon indicating error
- Success state: green border or checkmark icon
- Real-time validation only after the field has been touched (blur event), not during typing

Submit button:
- Disabled until minimum form validity is met
- Shows loading state on submission
- Error and success states visible and clear

Rule:
Form states are non-negotiable for trust. A form with no feedback on validation errors reads as broken. A form with no loading state reads as crashed.

---

# Navigation Interaction Design

Desktop navigation:
- Active page indicator — an underline, color change, or bold weight on the current page link
- Hover states on all nav links (150ms color transition)
- Dropdown menus: fade in with subtle translateY (10-15px) in 150-200ms

Mobile navigation:
- Open/close animation: side drawer (slide from right, 250-350ms) or overlay (fade + scale)
- Hamburger to X icon transition should be animated, not swapped instantly
- Links should stagger in on open (30-50ms delay per link)

Scroll behavior:
- Navigation that changes on scroll (becomes solid when page scrolls past hero) should transition, not snap
- Duration 200-300ms

Rule:
Navigation is used on every page and in every session. Small navigation interaction details compound into a significant impression over time. Invest in them.

---

# Drag and Reorder (When Applicable)

If the product involves draggable items:
- Visual feedback during drag: item becomes semi-transparent, placeholder shows where it will land
- Spring physics on drop (item settles into place)
- Adjacent items shift smoothly, not jump

Rule:
Drag interactions require more implementation investment but create a strong sense of control and physical reality. Only include if the feature warrants the investment.

---

# Scroll Interaction Design

Scroll containers (internal scroll areas):
- Custom scrollbar styling to match design system
- At minimum: thin scrollbar (6-8px) in accent or neutral tone

Page scroll:
- Scroll-triggered animations trigger once, not on every scroll direction change
- Parallax effects (different scroll speeds for layers): maximum 20% speed difference — more creates motion sickness

Horizontal scroll sections:
- Visible scroll indicator (arrow, dots, gradient fade to edge)
- Works correctly on touch devices
- Does not interfere with page vertical scroll

Rule:
Never have an invisible scrollable area. Users should always know when a container scrolls and in which direction.
