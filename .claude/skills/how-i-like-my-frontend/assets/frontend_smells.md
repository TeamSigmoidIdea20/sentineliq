# Frontend Smells

Design smells — signals that something is wrong with a design, even if you cannot immediately articulate what. Like code smells, these are warning signs that warrant investigation.

---

# "Looks like a template"

Signal: The design is recognizable as a template. The visitor could name the template, or it could be any of 50 other sites.

Underlying problems to check:
- Generic color palette (purple gradient, or default blue)
- Identical section structures repeated
- No visual element specific to this product
- Copy that could be on any competitor's site

---

# "Feels busy but nothing stands out"

Signal: Many elements on the page, but nothing commands attention. The eye does not know where to go.

Underlying problems to check:
- Multiple elements at equal visual weight competing
- Too many colors (each element is a different color)
- Too many animations happening simultaneously
- No clear focal point established in each section

---

# "Looks cheap despite looking polished"

Signal: The design has effects and decoration but still feels low-quality. Effects are making it worse.

Underlying problems to check:
- Glow and gradient effects compensating for weak hierarchy
- Generic stock imagery dressed up with effects
- Typography that is flat despite surrounding decoration
- The effects are the design — nothing remains if you remove them

---

# "Feels like it was assembled, not designed"

Signal: The page looks like sourced components placed side by side. Nothing feels unified.

Underlying problems to check:
- Components from different libraries with different radius, weight, and color conventions
- Section backgrounds that each use a different design language
- No consistent spacing system — padding varies per section
- Typography that changes between sections without logic

---

# "Hard to read the most important thing"

Signal: The user's eye goes somewhere unimportant first, or gets lost trying to find the headline.

Underlying problems to check:
- Headline is not the heaviest or largest text on the page
- A visual element (image, animation) is drawing more attention than the headline
- Navigation is too visually heavy relative to the page content
- The CTA competes with the headline for attention

---

# "Feels like it's trying too hard"

Signal: Too many effects, too many animations, too many elements. Exhausting to look at.

Underlying problems to check:
- Multiple competing motion elements
- Excessive glassmorphism or glow effects
- Too many font styles or sizes
- Gradients used as decoration on every background
- Particle fields or floating shapes

---

# "Nothing happens when I hover"

Signal: Interactive elements have no visual feedback. The page feels static and potentially broken.

Underlying problems to check:
- Missing hover states on buttons, links, cards
- State transitions are instantaneous (no easing, no duration)
- Only some elements have hover states, creating inconsistency

---

# "The hero doesn't tell me what this does"

Signal: After seeing the hero for 5 seconds, the product's purpose is unclear.

Underlying problems to check:
- Tagline is generic ("The best platform for modern teams")
- Visual element is decorative, not product-specific
- Subheading doesn't clarify what the product actually does
- Product UI is absent from the hero section entirely

---

# "Feels like a draft"

Signal: The design looks like a first scaffold that was accepted without iteration.

Underlying problems to check:
- Placeholder copy still present
- Missing hover states on all interactive elements
- Default spacing and padding values throughout
- No micro-details (loading states, transitions, scroll reveals)
- Typography at near-default scale with low contrast between levels

---

# "The mobile version looks like a different site"

Signal: The desktop design is intentional but mobile is clearly an afterthought.

Underlying problems to check:
- Spacing collapsed to near-zero on mobile
- Font sizes uncomfortably large or small on mobile
- Components that do not reflow correctly
- Hero image missing or mis-sized on mobile
- Navigation broken or inaccessible on mobile

---

# How to Use Frontend Smells

When a design feels wrong but you cannot articulate why: scan this list for the matching smell.
The smell names the symptom. The "underlying problems to check" provide the diagnostic starting point.
Once the underlying problem is identified, address it specifically — do not try to treat the symptom.
