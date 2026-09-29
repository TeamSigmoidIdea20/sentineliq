# Component Libraries

---

# 21st.dev

Purpose:
Production-ready React components designed for visual quality. Community-contributed. Frequently updated.

Best For:
- Navigation patterns with animations
- Button variants (including magnetic, animated)
- Hero backgrounds (particle systems, grid patterns, gradient meshes)
- Card components
- Testimonial sections
- Feature showcase components

How to Use:
- Browse categories to find the closest component to the need
- Copy the component code or the prompt
- Adapt: replace colors, fonts, radius, and motion timing to match the design system
- Do not use with default styling — always adapt

Risk:
Default styling is opinionated. Components look like 21st.dev without adaptation. Never skip the adaptation protocol.

---

# Radix UI

Purpose:
Headless, accessible, unstyled component primitives for React.

Best For:
- Form components (select, checkbox, radio, slider)
- Overlay components (dialog, popover, tooltip, dropdown)
- Navigation components (tabs, accordion)
- Any interactive component that needs accessibility built in

How to Use:
- Install the specific primitive needed (not the full library)
- Build styling entirely from scratch — Radix provides behavior only
- Use with Tailwind or CSS modules for styling

Risk:
More implementation work than styled libraries. Worth it for production products.

---

# shadcn/ui

Purpose:
Composable React components built on Radix UI with Tailwind CSS. Designed to be copied into projects and modified, not imported as a dependency.

Best For:
- Starting point for full design systems
- Form inputs, buttons, cards, modals, and tables with clean baseline styling
- Projects using Tailwind CSS

How to Use:
- Use the CLI to add individual components: npx shadcn-ui@latest add [component]
- Components are added directly to your codebase for full modification
- Adjust colors, radius, and spacing in the globals to match the design system

Risk:
Default shadcn/ui styling is recognizable. Customize the theme configuration before using — change the default accent color, border-radius, and font immediately.

---

# CodePen

Purpose:
Community platform for sharing standalone code demos. Excellent for specific effects and interaction patterns.

Best For:
- CSS animation effects
- Specific hover interactions
- Background effects (noise, grain, gradient mesh, glass)
- Custom cursor implementations
- Scroll effect techniques

How to Use:
- Search for the specific effect needed
- Read the code to understand the technique before adapting
- Do not lift code directly — understand it, then implement the technique in the project context

Risk:
CodePen code is often not production-ready. Always clean up and adapt the technique, do not import raw demos.

---

# Framer Motion

Purpose:
React animation library. The standard for production-grade animations in React applications.

Best For:
- Scroll-linked animations
- Page transitions
- Staggered list entrances
- Spring-physics interactions
- Drag and reorder
- Layout animations (animating between layout states)

How to Use:
- Import individual components: motion.div, AnimatePresence, useScroll, useTransform
- Use variants for reusable animation definitions
- Combine with Intersection Observer or useInView for scroll triggers

Risk:
Performance overhead if misused. Animate CSS properties that trigger compositing (opacity, transform) rather than layout-triggering properties (width, height, margin).

---

# Monae

Purpose:
Curated collection of premium UI components and effects. Smaller library, higher individual component quality.

Best For:
- Hero backgrounds
- Signature animated effects
- Premium UI accents

How to Use:
- Browse for specific visual effects
- Treat as inspiration and technique reference as much as direct source

Risk:
Smaller collection than 21st.dev. Use as a secondary source.
