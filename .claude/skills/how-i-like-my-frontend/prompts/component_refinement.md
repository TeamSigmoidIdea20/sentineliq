# Component Refinement Prompt

For adapting sourced components to the design system and iterating on individual components to premium quality.

---

# Component Adaptation Prompt (After Sourcing)

```
I have sourced this component from [21st.dev / CodePen / shadcn]. [Paste component code or describe it]

Adapt it to my design system using these specifications:

COLOR SYSTEM:
- Background: [color]
- Primary text: [color]
- Secondary text: [color at opacity]
- Accent/interactive: [color]
- Border: [color at opacity]

TYPOGRAPHY:
- Typeface: [family]
- Text sizes: [heading: Xpx, body: Xpx, label: Xpx]
- Weights: [heading: X, body: X]

SPACING:
- Internal padding: [Xpx]
- Gap between elements: [Xpx]
- Border radius: [Xpx — specific to this component type]

MOTION:
- Hover timing: [150ms / 200ms / etc]
- Hover effect: [describe — background shift / elevation / border color]
- Other transitions: [describe]

After adapting:
1. Confirm all hardcoded colors from the source are replaced
2. Confirm the component matches the design system's border-radius convention
3. Confirm hover and focus states are present and styled
4. Identify any part of the source component that was kept unchanged and whether that should be adapted further
```

---

# Component Premium Upgrade Prompt

```
This component is working but not yet premium. Upgrade it.

Current component: [description or paste code]
Current problems: [describe what feels generic or incomplete]

Upgrade in this order:
1. Hover state: is it present? Is it physically responsive (not a flat color swap)?
2. Active/pressed state: does it respond to click?
3. Focus state: is it custom styled?
4. Transition timing: is it 150-250ms with ease-out? Not linear, not instant.
5. Typography: is the text hierarchy clear inside the component?
6. Spacing: is the internal padding generous enough (at least 24px for cards)?
7. Border treatment: is the border present where needed, and absent where not?
8. Any shadow/elevation: is it directional and subtle, or flat and generic?

Make each upgrade and explain what specifically changed and why.
```

---

# Button Component Refinement

```
Refine the primary button component.

Current state: [paste code or describe]
Target feel: [physical / subtle / bold]

Required states:
1. Default: [background color, text color, border radius, padding, font size/weight]
2. Hover: transition 150ms ease-out, [background shift OR scale 1.02 OR shadow increase]
3. Active/pressed: scale 0.97, duration 80ms — feels like pressing a physical button
4. Focus: 2px solid [accent color], offset 2px — not the browser default
5. Disabled: opacity 0.4, cursor not-allowed
6. Loading: spinner replaces label, disable pointer events

Produce all five states in the component code.
```
