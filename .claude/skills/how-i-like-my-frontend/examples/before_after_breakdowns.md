# Before / After Breakdowns

Documented design transformations with analysis of what changed and why each change improved the design.

---

# Hero: Generic → Premium

Before:
- Background: purple-to-indigo diagonal gradient
- Layout: centered headline, centered subtext, centered button
- Headline: "Supercharge your workflow" at 40px, weight 600
- Visual: none
- Particle field decorating the background

After:
- Background: near-black #0A0A0A with no gradient
- Layout: left-weighted two-column — headline left 60%, product UI right 40%
- Headline: "See what's next" at 80px, weight 900, letter-spacing -0.03em
- Visual: product UI screenshot in dark device frame, floating with subtle entrance animation
- No particle field — grain texture at 3% opacity on background only

What Changed and Why:
The gradient was removed because it communicated no design decision. The layout shift from centered to left-weighted broke the monotony and created visual tension. The headline was rewritten to be concept-specific and scaled up 2x to create genuine dominance. The product UI replaced the absent visual — now users see the product immediately. The particle field was removed because it served no semantic purpose.

Result: Level 1 → Level 4 output.

---

# Feature Section: Three Cards → Bento Grid

Before:
- Three identical columns: icon at top, bold title, two sentences of description
- All cards same height, same structure, same visual weight
- Background: slightly lighter grey card on dark background
- No hover states

After:
- Bento grid: one card occupies 2/3 width (the primary feature), two smaller cards share 1/3 width
- Large card has a product UI screenshot, not just text
- Smaller cards have a brief label and a one-line descriptor — no icon
- Cards have elevation hover state: translateY(-3px) + shadow increase on click
- Border at 8% white opacity

What Changed and Why:
The three-card identical structure was replaced because it communicates no hierarchy — every feature appeared equally important. The bento layout makes the primary feature visually dominant. The product UI in the large card provides visual evidence. The simplified smaller cards reduce cognitive load. Hover states confirm interactivity.

---

# Typography: Flat → Contrasted

Before:
- Page heading: "Our Features" at 28px, weight 600
- Subheading: "Everything you need to [verb]" at 20px, weight 500
- Body: 16px, weight 400
- All text same color (#FFFFFF or near equivalent)
- Total visible hierarchy difference: minimal

After:
- Section label: "Features" at 12px, weight 600, letter-spacing 0.1em, uppercase, 35% opacity
- Heading: "Everything in one place" at 48px, weight 800
- Subheading: "Built for teams that move fast" at 20px, weight 400, 55% opacity
- Body: 16px, weight 400, 55% opacity
- Ratio from heading to body: 3x size, 2x weight, deliberate opacity tiers

What Changed and Why:
The original typography had a 1.75x size ratio between heading and body — barely distinguishable. The new ratio is 3x. Weight contrast increased from 600/400 to 800/400. An uppercase label at tertiary opacity was added above the heading to create a navigation-style marker. The subheading became secondary opacity to yield to the heading. Result: hierarchy is legible from across the room.

---

# Color: Scattered → Disciplined

Before:
- 5 visible colors: blue CTAs, purple section backgrounds, teal link highlights, orange badges, white text
- Multiple gradients using different color combinations per section
- No clear dominant/accent/neutral distinction

After:
- Dominant: #0A0A0A (near black background) — structural surfaces
- Accent: #6366F1 (indigo) — primary CTAs, active states, key emphasis only (5 uses max)
- Neutral: three-level grey system for text (92%, 55%, 35% white opacity)
- Zero gradients (removed from all backgrounds)
- Badge colors brought into the accent family

What Changed and Why:
Five colors competing creates visual noise — the eye does not know which elements are important. The disciplined palette creates clarity: the accent always means "action" or "emphasis," the neutrals always mean "content," the dominant always means "background." Removing the gradients removed the AI signature.

---

# Spacing: Compressed → Breathable

Before:
- Section padding: 40px vertical (top and bottom)
- Card padding: 16px internal
- Headline to subtext gap: 8px
- Grid gap between cards: 12px
- Body text column: full container width (~1200px)

After:
- Section padding: 96px vertical
- Card padding: 28px internal
- Headline to subtext gap: 20px
- Grid gap: 28px
- Body text column: max-width 680px (constrained for readability)

What Changed and Why:
Every spacing value was compressed to near-default. The result felt like a content document, not a landing page. Doubling (or more) every spacing value immediately elevated the perceived quality. The body text constraint eliminated the exhausting wide-line-length read.

Visible change: The page went from 2800px tall to 3800px tall. The extra 1000px is breathing room — not wasted space.
