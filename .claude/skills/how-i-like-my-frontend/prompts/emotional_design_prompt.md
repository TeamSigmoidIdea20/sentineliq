# Emotional Design Prompt

Prompts for setting emotional direction and auditing emotional consistency across a design.

---

# Emotional Direction Setting Prompt

```
I want to set the emotional direction for this design before building.

TARGET EMOTION: [What should the user feel when they land on this page?]
Choose one: precise and intelligent / bold and confident / warm and approachable / playful and energetic / premium and exclusive

EMOTIONAL ARCHETYPE: [Optional — describe the personality. E.g., "the expert who shows, not tells" / "the energetic creative" / "the calm authority"]

Translate this emotional direction into specific design decisions:

1. COLOR TEMPERATURE
Given the target emotion, what color temperature is appropriate?
- Cool tones for: precision, calm, control, intelligence
- Warm tones for: energy, creativity, warmth, urgency
- Neutral for: confidence, editorial, absence of emotional push
Recommend specific palette direction.

2. TYPOGRAPHY PERSONALITY
What typeface category matches this emotion?
- Heavy geometric sans: powerful, direct
- Humanist sans: approachable, trustworthy
- Transitional serif: editorial, premium
- Monospace: technical, developer
Recommend specific typeface choice.

3. MOTION PACE
What motion pace matches this emotion?
- Fast and snappy: efficiency, energy, directness
- Medium balanced: versatile, professional
- Slow and deliberate: confidence, premium, gravity
Recommend timing standards.

4. SPACING DENSITY
What spacing density matches this emotion?
- Airy: premium, confident, editorial
- Balanced: professional, functional
- Dense: utility, information-rich
Recommend section padding and component density.

5. LAYOUT APPROACH
What layout approach matches this emotion?
- Asymmetric with strong left-weight: editorial, confident
- Grid-structured bento: organized, comprehensive
- Centered with strong typographic focus: bold, declarative
- Alternating sections: systematic, thorough
Recommend primary layout approach.

Produce a 5-point emotional design spec that will govern all design decisions for this project.
```

---

# Emotional Consistency Audit Prompt (Attach Screenshot)

```
Audit this design for emotional consistency.

First, identify: what emotion does this design communicate on first impression? (One sentence)

Then evaluate each design element against that emotion:

1. COLOR: Does the palette reinforce the identified emotion, or does it contradict it?
2. TYPOGRAPHY: Does the typeface and weight communicate the same emotional tone?
3. IMAGERY: Does the visual element match the emotional direction, or feel like it came from a different design?
4. SPACING: Does the density feel right for the emotion (premium = airy, efficient = denser)?
5. MOTION: Does the motion pace and style reinforce the emotion (subtle = premium, snappy = efficient)?
6. COPY TONE: Does the copy feel like it belongs to the same emotional direction as the visual design?

For each contradicting element: name it, explain the contradiction, and suggest how to align it.

Final verdict: Is this design emotionally consistent (all elements reinforce the same feeling) or emotionally scattered (elements communicate conflicting feelings)?
```

---

# CTA Emotional Alignment Prompt

```
The CTA section should re-establish the emotional state set in the hero. Currently it feels generic/disconnected.

Hero emotional direction: [describe the hero's tone — e.g., "bold and confident, dark, minimal, direct"]
Current CTA problem: [describe what feels off — e.g., "it feels like a generic 'get started' box, not an invitation that matches the rest of the page"]

Redesign the CTA section to:
1. Echo or answer the hero's headline (narrative bookend)
2. Match the hero's visual energy level (this is the second-most-important section)
3. Use CTA copy that reflects the emotional direction — not generic "Get started today"
4. Include one visual element that connects back to the hero concept (at minimum: the same color system, or the same imagery treatment at reduced scale)

Produce the redesigned CTA section.
```
