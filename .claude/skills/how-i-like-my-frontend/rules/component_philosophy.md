# Component Philosophy Rules

A component sourced from a library and dropped in unchanged reads as sourced. A component adapted to the surrounding system reads as designed. The goal is always the latter.

---

# The Core Principle

Components are ingredients, not meals. Sourcing a component from 21st.dev, CodePen, or a UI library gives you a starting point with quality baseline and technical implementation. Your job is to make it part of this design system — not drop it in and move on.

The moment a component looks like it came from somewhere else, it breaks the cohesion of the design.

---

# The Adaptation Protocol

When sourcing any component, run through these five adaptations before accepting it:

1. Color: Replace all hardcoded colors with the design system's palette. Buttons should use the system accent, not the component library's blue.
2. Typography: Replace fonts with the design system's typeface. Adjust weight and size to match the surrounding hierarchy.
3. Spacing: Adjust internal padding and margins to match the design system's spacing rhythm.
4. Border radius: Match the system's border-radius convention — do not accept the component's default radius.
5. Motion: Replace or adjust the component's animation timing and easing to match the system's motion principles.

Rule:
All five adaptations must happen before a component is accepted. A component that passes none of them has not been integrated — it has been dropped.

---

# Component Cohesion

Cohesion means the components on a page feel like they belong to the same family.

Signs of cohesion:
- All buttons share the same radius, weight, and interaction pattern
- All cards share the same border treatment and elevation approach
- All form elements share the same focus ring and validation style
- All icons come from the same family and scale system

Signs of incoherence:
- Three different button styles across three sections (each sourced separately)
- Cards that are solid in one section, glass in another, outlined in a third
- Icons from three different libraries at mismatched scales
- Input fields with different border treatments depending on which section they appear in

Rule:
Before sourcing a new component, check if an adapted version of an existing component could serve the same purpose. Every new component pattern added to a page increases the cognitive load of the design system.

---

# When to Source vs When to Build

Source from a library when:
- The component has established interaction patterns (slider, date picker, dropdown menu)
- Building it from scratch adds no design differentiation
- The implementation is technically complex (rich text editor, drag-and-drop)
- Time is the constraint

Build from scratch when:
- The component is the signature visual element of the design
- The component is simple enough that sourcing adds no advantage
- The component needs to be highly specific to the product concept

Rule:
Never source the hero section, the primary feature showcase, or any component that is supposed to feel original. These are the elements that create identity.

---

# Component Library Selection

Best libraries for quality components with minimal visual noise:
- 21st.dev: Production-ready React components with clean default styling. Good baseline for adaptation.
- Radix UI: Headless, unstyled, accessible. Maximum adaptation flexibility.
- shadcn/ui: Composable, design-system-friendly, easy to adapt.
- Framer Motion: For animated components.
- CodePen: Useful for specific effects and interaction patterns.

Libraries that produce visible "library look" without heavy adaptation:
- Material UI out of the box
- Chakra UI out of the box
- Most Bootstrap-based component sets

Rule:
Headless or minimally-styled component libraries require more implementation work but produce less "library look." This is almost always worth the tradeoff for marketing and landing pages.

---

# Icon System Discipline

Icons must come from one family. Mixing icon libraries creates immediate visual inconsistency.

Recommended families:
- Lucide: Clean, modern, consistent stroke weight. Excellent for SaaS.
- Phosphor: More expressive, multiple weights available.
- Heroicons: Clean, limited set, works well for utility products.
- Radix Icons: Minimal, precise, pairs well with Radix UI components.

Icon sizing:
- Navigation: 16-18px
- Feature icons: 24-32px (inline) or 40-48px (featured)
- Hero icons or decorative: 48-64px+

Rule:
If you find yourself downloading icons from different families because one family does not have the perfect icon, find the closest icon in the chosen family and use it. One slightly imperfect icon from the right family beats the perfect icon from the wrong family.

---

# Component State Completeness

Every component must be designed in all its states before it is considered done.

Button states: default, hover, active, focus, disabled, loading
Input states: default, focus, filled, error, disabled
Card states: default, hover (if clickable), selected (if selectable)
Navigation items: default, hover, active (current page), focus
Toggle: off, on, disabled

Rule:
Sketch or verify all states in the browser before signing off on a component. A component that only looks designed in its default state is not designed.
