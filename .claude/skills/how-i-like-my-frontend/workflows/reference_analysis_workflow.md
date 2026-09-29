# Reference Analysis Workflow

A structured process for studying a premium site, extracting what makes it work, and translating those principles into original design decisions.

---

# When to Use This Workflow

Use when:
- You have found a site that feels right but cannot articulate why
- You want to understand what principles a premium site embodies before applying them
- You are building a reference collection for a specific project

---

# Phase 1: First Impression Analysis

Step 1 — View the site without scrolling for 5 seconds.
Note: What is the dominant emotional tone? (Precise, bold, warm, playful, premium?) What color do you notice first? What element does the eye go to first?

Step 2 — Identify the emotional archetype.
Which of these best describes the feeling: precise/intelligent, bold/confident, warm/approachable, playful/energetic, premium/exclusive?

Step 3 — Note your initial reaction.
"This feels expensive because ___." or "This feels approachable because ___." The because is the important part.

---

# Phase 2: Visual System Analysis

Step 4 — Identify the palette.
How many colors? What is the dominant? What is the accent? What is the neutral? Where does the accent appear and where does it not?

Step 5 — Analyze the typography.
What typeface(s) are used? What is the headline size and weight? What is the body size and weight? What is the contrast ratio between largest and smallest text?

Step 6 — Measure the spacing.
Does the site feel airy, balanced, or dense? Where does the most whitespace appear? Which elements have the most space around them (and thus feel most important)?

Step 7 — Identify the layout approach.
Is it centered, left-weighted, asymmetric? Does the grid feel standard or unusual? Do sections alternate structure or repeat the same pattern?

---

# Phase 3: Motion and Interaction Analysis

Step 8 — Scroll through the page slowly.
What animates? When does it animate? Is the motion entrance-triggered, scroll-linked, or hover-driven?

Step 9 — Hover over every interactive element.
What is the hover state on buttons, links, cards? How fast is the transition? What changes (color, size, position, shadow)?

Step 10 — Click or tap something.
What is the active state? Is there a visual press response?

Step 11 — Estimate the motion timing.
Fast (100-200ms)? Medium (200-400ms)? Slow (400-800ms)? Describe the easing — does it bounce, ease in, ease out?

---

# Phase 4: Technique Extraction

Step 12 — List 3-5 specific techniques you want to understand or use.
"I want to understand: the background grain texture, the counter animation, the card hover elevation, the navigation transparency-to-solid transition."

Step 13 — For each technique, describe the implementation at a high level.
"The card hover looks like a translateY(-4px) with box-shadow increase." "The counter probably uses requestAnimationFrame with an ease-out function."

Step 14 — Identify which require code extraction (Level 4) vs what can be replicated from description alone.
Simple CSS effects: replicate from description. Complex scroll-linked animations: use the cloning workflow.

---

# Phase 5: Translation to Your Design

Step 15 — Map each extracted principle to your design constraints.
"I want their spacing approach — but in my design the primary color is [X] not dark, so I will adapt the palette while keeping the spacing philosophy."

Step 16 — Write a design brief for your project.
"For this project: emotional direction [X], visual style [Y], typography inspired by [Z site's approach], motion at [timing] pace, spacing at [airy/balanced] density."

Step 17 — Convert the brief to Claude prompts.
Use the visual_direction_prompt.md template to convert your analysis into actionable Claude direction.

---

# The Three Questions

For any element on any reference site, ask:
1. What is this? (Name the technique or pattern)
2. Why does it work? (What psychological or aesthetic principle does it leverage?)
3. How can I adapt it? (What changes for my product's context?)

The third question prevents copying and ensures originality.
