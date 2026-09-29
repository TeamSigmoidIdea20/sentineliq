# Bad UI Patterns

Named bad patterns with analysis of why they fail and what to replace them with.

---

# The Generic Purple Gradient Hero

What It Is:
A purple or violet gradient background (usually diagonal, sometimes radial) behind centered text and a button. Often accompanied by a particle field.

Why It Fails:
This is the AI default. Every Claude/GPT-generated landing page that receives no direction produces this exact output. It signals "zero design decisions were made." Users recognize it immediately, even unconsciously, as "AI slop."

Replace With:
A dark solid background with a concept-specific visual element. Or a specific brand color gradient (not purple) with a strong reason for the gradient.

---

# The Three-Card Feature Grid

What It Is:
Three columns, each with an icon at top, a short title, and 2-3 sentences of description. All three cards are identical in structure, size, and visual weight.

Why It Fails:
Every product uses this. It requires no design decision. Users can parse what it is before reading — and then skip it because they know what identical feature cards contain.

Replace With:
A bento grid with varied card sizes. An alternating feature row layout. A numbered list with oversized type. Anything that requires a design decision.

---

# The Centered Everything Page

What It Is:
Hero text: centered. Feature heading: centered. Testimonials: centered. CTA: centered. Every section on the same vertical axis.

Why It Fails:
Visually monotonous. No tension, no movement, no editorial intention. The eye falls straight down the center and has nothing to catch it. Feels templated.

Replace With:
Left-weighted hero. Alternating section alignment. One section centered maximum per page (usually the CTA). Asymmetric layouts in features.

---

# Glow Cards

What It Is:
Cards with a colored glow or bright shadow emanating from their edges. Often in the brand accent color — blue glow on dark cards, purple glow on feature cards.

Why It Fails:
Decoration without hierarchy. If every card glows equally, the glow communicates nothing about which card is more important. Adds visual noise and draws attention away from the content.

Replace With:
Subtle box-shadow for depth (dark, directional). A gradient border on a single featured element only. Clean card edges with a thin, low-opacity border.

---

# Generic Glassmorphism Everything

What It Is:
Every card, panel, modal, navigation bar, and CTA box is a frosted glass panel. The entire page is glass on glass.

Why It Fails:
When everything is elevated, nothing is elevated. Glass creates depth by contrasting with non-glass surfaces. When the surface and the element are both glass, the depth disappears.

Replace With:
Solid backgrounds for structural elements. Glass reserved for one accent component (a modal, a floating card, one featured element). Matte surfaces as the default.

---

# Placeholder Copy That Shipped

What It Is:
"Supercharge your workflow." "The platform for modern teams." "Build better products faster." Copy that could be on any competitor's site.

Why It Fails:
It says nothing specific about this product, this team, or this user's actual problem. It activates the skip-reading reflex users have trained for marketing copy.

Replace With:
Copy that names a specific problem or outcome. Copy that uses the product's actual vocabulary. A tagline that would be wrong on a competitor's site.

---

# The Broken Hover State

What It Is:
An interactive element (button, card, link) with no hover state, or a hover state that is instantaneous (no transition).

Why It Fails:
Makes the element feel undesigned or broken. Users expect visual confirmation that an element is interactive. Absent feedback creates uncertainty.

Replace With:
Every interactive element gets a hover state. Every hover state has a transition (minimum 150ms ease-out).

---

# Particle Field Background

What It Is:
Animated dots or lines floating and connecting in the hero section background. Usually on a dark background. Often with lines forming when particles come close.

Why It Fails:
Peaked in 2016. Immediately recognized as a template decoration. Communicates no product concept. Creates visual noise that competes with the actual content.

Replace With:
A static subtle background (grain texture, geometric grid at very low opacity). A concept-specific visual. A strong typography-only hero that needs no background decoration. A looping concept video with actual meaning.

---

# The Weak Final CTA

What It Is:
A small section at the bottom with "Get started today" in medium-sized text, one button, and a very low-energy design that looks like it was designed last and quickly.

Why It Fails:
The final CTA is the last thing users see before deciding to convert or leave. A low-energy final impression cancels some of the work done by the rest of the page.

Replace With:
A CTA section designed with the same care as the hero. A headline that echoes or answers the hero's message. Visual energy that matches the hero's level.

---

# Inconsistent Component Styles

What It Is:
Cards in three different styles across three sections. Buttons with different radius in different sections. Navigation links styled differently from body links.

Why It Fails:
Communicates that sections were designed independently without a system. Users notice inconsistency unconsciously — it registers as "unfinished" or "assembled."

Replace With:
A design system established before building. One card style. One button style per variant. Consistent radius, spacing, and color across all instances of each component type.
