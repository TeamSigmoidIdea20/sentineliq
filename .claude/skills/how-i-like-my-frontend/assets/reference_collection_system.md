# Reference Collection System

How to build and maintain a personal reference library that makes every future project better.

---

# Why Reference Libraries Matter

The gap between "I know what I like when I see it" and "I can direct Claude to produce what I like" is vocabulary and examples. A well-organized reference library closes this gap.

References give Claude a concrete target instead of a verbal description.
References give you a vocabulary for what you want.
References accumulate into taste — the more you study, the faster you identify good from bad.

---

# Folder Structure

Organize references by category, not by project.

Recommended folders:
/heroes — hero sections that work and why
/features — feature section layouts
/typography — typeface and hierarchy examples
/dark-systems — premium dark design examples
/light-systems — premium light design examples
/motion — animations and interactions worth studying
/components — buttons, cards, forms, navigation
/color-palettes — disciplined palette examples
/section-patterns — specific section type examples (pricing, testimonials, stats)
/site-teardowns — complete sites for deep study

Within each folder, name files descriptively: "linear-hero-left-weighted.png" not "screenshot-01.png"

---

# What to Capture

When you find something worth saving:

1. Screenshot the specific element (not the full page unless it's a full-page reference)
2. Note: what specifically works here
3. Note: which technique is worth extracting
4. Note: the site URL (for later code extraction)

Do not save things that only look vaguely interesting. Save things where you can name specifically what is worth learning from.

---

# When to Add to the Library

Active browsing (dedicated sessions):
30-60 minutes on Awwwards, Godly, or Pinterest specifically to find references.
Target: 10-20 new references per session.

Passive collection:
When you encounter something that stops you while browsing for other reasons, save it immediately.

Project-driven:
At the start of every project, spend time specifically finding project-relevant references. Add them to the library with the project tag.

---

# How to Use References in Claude Prompts

Attach the screenshot and describe what you want to borrow:

"Attached reference: [description]. From this reference I want to borrow specifically: [the left-weighted hero layout / the card elevation hover / the typography scale approach]. I do NOT want to copy: [the color palette / the exact component structure]. Adapt this for my design system: [brief description of your system]."

The more specific the extraction instruction, the more useful the reference.

"Make it look like this" — too broad. Claude will copy the surface.
"From this reference I want: the section padding approach and the text opacity hierarchy" — specific. Claude will extract the technique.

---

# Reference Analysis Before Use

Before using a reference in a prompt, spend 3 minutes analyzing it:

1. What is the dominant color? What is the accent?
2. What is the approximate headline size and weight?
3. How much section padding is there? (Estimate in pixels)
4. What layout approach is used? (Left-weighted, centered, asymmetric)
5. What makes it feel premium? (Name one specific thing)
6. What would I borrow? (Name one or two specific elements)

This analysis makes the reference usable, not just visually inspirational.

---

# Building a Teardown Library

For sites worth deep study (Linear, Stripe, Vercel, Raycast):

1. Screenshot: full page, individual sections, individual components
2. Note: key design decisions at each level (page, section, component)
3. Code extraction: HTML/CSS for any specific effect worth understanding
4. Vocabulary: name the techniques used ("opacity text hierarchy", "bento feature grid", "gradient border on featured card")

Over time, your teardown library becomes a catalog of techniques with implementations, not just images.

---

# Maintenance

Review and prune quarterly:
- Remove references that are dated or no longer inspiring
- Update notes where your understanding has deepened
- Add new references from recent browsing sessions

The library should feel current. A reference library full of 2019 designs produces 2019-feeling outputs.
