# Frontend Case Studies

The 7-level progression applied to a real project, with decisions and outcomes documented at each level.

---

# Case Study: Argus (Social Media Intelligence Tool)

Product: Argus — monitors social media conversations and identifies emerging trends before they peak.
Visual concept: Intelligence radar. The eye that sees what others miss. Pattern in noise.

---

## Level 1: Vague Prompt

Prompt: "Create a landing page for Argus, my social media web app."

Output: Purple-to-indigo gradient hero. Centered headline: "Supercharge your social media intelligence." Three feature cards (icon + title + text). Generic stats section. Default navigation.

Design assessment: Level 1. Standard AI output. No concept specificity. Purple gradient. Identical cards. Centered everything.

Problems:
- No visual connection to the product concept (intelligence, pattern recognition, foresight)
- The word "supercharge" could appear on any SaaS product
- Purple gradient is the AI default
- Three identical feature cards with no hierarchy

---

## Level 2: With Skills

Added design skill with anti-slop rules and premium conventions.

Improvements: Better typography scale. Spacing increased. Three cards gained more breathing room. Some hierarchy added to the feature section.

Still problems:
- The purple gradient persisted (skill alone didn't remove it — no visual reference)
- Layout still fully centered
- No product concept expressed visually
- Still reads as "designed AI template"

Assessment: Level 2. Incrementally better. Not meaningfully different to a visitor.

---

## Level 3: Visual References

Added two reference screenshots: Linear's hero (dark, left-weighted, minimal) and a radar/surveillance photography reference from Godly.

Prompt: "I want the design to feel like these references. The hero should be left-weighted, dark, with surveillance/intelligence imagery."

Improvements:
- Background changed from purple gradient to near-black
- Layout shifted to left-weighted
- Product concept (surveillance, intelligence) started appearing in visual choices
- Typography scaled up significantly

Remaining gap: The translation from screenshot reference to code was imperfect — the hero still felt like an approximation of the reference, not a confident original.

Assessment: Level 3. Meaningfully better. Still 50-60% of the way to the reference.

---

## Level 4: Site Deconstruction

Grabbed HTML and CSS from Linear. Analyzed how they achieved: the text opacity hierarchy, the card border treatment, the section spacing system, the hover state feel.

Key extractions:
- Text hierarchy: rgba(255,255,255,0.92), 0.55, 0.35 for three text levels
- Card borders: rgba(255,255,255,0.08) — barely visible but present
- Section padding: 128px vertical on primary sections
- Hover states: 200ms ease-out with very subtle translateY on cards

Applied to Argus:
- Replaced all white text with opacity-tiered system
- Added border definition to cards using the extracted value
- Increased section padding dramatically
- Hover states rebuilt to match extracted timing

Assessment: Level 4. Design now feels like it belongs to the same quality tier as the studied reference. The technique transfer was more effective than any description.

---

## Level 5: Original Character

Added elements specific to Argus:

Custom imagery: MidJourney-generated — dark background, scanning beam across distributed data points. Generated 6 variations, selected the most concept-specific.

Custom motion: Subtle looping video of the scanning beam. 14 seconds, seamless loop. Still frame on mobile.

21st.dev component: Found a magnetic button component, adapted to the design system (accent color, border radius, timing).

Micro-details: Counter animations on stats (tracking 12,000+ queries daily, 3.2M posts analyzed). Scroll progress bar. Custom text selection color (accent at 25% opacity).

Tagline iteration: "See what's next" — concept-specific, competitor-swap proof, active voice.

Assessment: Level 5. The page now has a distinct identity. The scanning beam motion directly communicates the product concept. The statistics animate to confirm product scale.

---

## Level 6: Visual Tool Iteration

Exported the hero from Stitch (visual tool). Redesigned the bottom half of the page where the feature section still felt generic.

Iteration process:
- Screenshot current state
- Identified: feature section still using similar-looking cards
- Redesigned as bento: large card (primary capability) + two supporting cards
- Screenshot redesign from Stitch
- Told Claude: "I like this layout from the visual redesign. Implement this with these specific changes: [list]"

Result: Feature section now uses varied card sizes with product UI embedded in the large card.

Additional refinements iterated:
- Testimonials moved from 3-column grid to single large featured quote
- Pricing section added "recommended" plan with gradient border
- Final CTA section brought back to hero energy level

Assessment: Level 6. Creative direction in the driver's seat. Claude implementing. The design feels like a designed page, not a generated one.

---

## Outcome

Total iteration cycles: approximately 22 significant changes.
Time from Level 1 to Level 6: would take an experienced user 4-6 hours.

The difference: every iteration was direction-driven. References were provided at the start. Anti-slop rules were set. Visual tools were used for ideation. Claude executed implementation decisions.

The product cannot be confused with an AI-generated landing page anymore. That is the goal.
