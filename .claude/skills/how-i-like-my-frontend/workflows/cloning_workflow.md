# Cloning Workflow

The Level 4 process: deconstructing a premium site's code to understand how it achieves its effects. This is education through emulation, not plagiarism.

---

# When to Use This Workflow

Use cloning when:
- A visual reference is not enough — you want to understand the technique, not just see the result
- The effect you want requires understanding the implementation (custom scroll animations, background effects, specific interaction patterns)
- You want to extract a technique and apply it to an original design

Do not use cloning to copy a site's design wholesale. The goal is to understand techniques and adapt them.

---

# Phase 1: Identify the Target

Step 1 — Find the site with the technique you want to understand.
Awwwards, Godly, or any premium site you have encountered. Identify specifically what you want to extract: "I want to understand how they achieved the scrolling section lock with animated content."

Step 2 — Confirm the effect is achievable in your stack.
Some effects require WebGL or custom shaders (Level 7). Confirm the technique is realistic before investing time in extraction.

---

# Phase 2: Extract the Source Code

Step 3 — Get the HTML.
In browser: Ctrl+U (or Cmd+U on Mac) to open source code. Select all and copy. The HTML is the structure.

Step 4 — Identify the CSS file.
In the HTML, look in the <head> for <link rel="stylesheet"> tags. Copy the URL of the main CSS file. Open it in a new tab. Copy the entire content.

Step 5 — Identify the JavaScript files.
In the HTML, look at the bottom for <script src="..."> tags. Copy the URLs of key JS files (skip analytics, tracking). Open and copy the content.

Step 6 — Use Claude to analyze the extracted files.
Tell Claude: "Here is the HTML, CSS, and JS from [site]. Identify how they achieved [specific effect]. Explain the technique and what libraries they used."

Do not paste only the HTML without CSS and JS — this loses most of the implementation context.

---

# Phase 3: Understand the Technique

Step 7 — Ask targeted questions after extraction.
Do not just ask "clone this site." Ask:
- "How did they achieve this background effect?"
- "What is GSAP ScrollTrigger doing here?"
- "How is the parallax layer controlled?"
- "What creates the magnetic button behavior?"
- "How is this transition between sections triggered?"

Step 8 — Get a vocabulary for the technique.
Ask: "What is the name of this technique? Where can I learn more about it?" Add the technique name to your design vocabulary.

Step 9 — Understand the why, not just the what.
Ask: "Why does this technique create this visual result? What would happen if I changed X?"

---

# Phase 4: Implement in Your Design

Step 10 — Ask Claude to implement the technique in your stack.
"Using the technique I extracted, implement [effect] in my [Next.js / plain HTML] project. Adapt it to use [my color palette, my typography, my layout]."

Step 11 — Adapt, do not copy.
Colors, typography, layout, and spacing must all match your design system. Only the technique transfers.

Step 12 — Iterate until it feels like yours.
The extracted technique should become invisible as a "cloned" element. If the implementation still looks like the source site, the adaptation is incomplete.

---

# Phase 5: Add to Your Toolkit

Step 13 — Document the technique.
Note: what it is called, which library handles it (GSAP, CSS, Framer Motion), and what kind of effect it produces. This becomes a reusable technique.

Step 14 — Identify where else it could apply.
Could this technique work on a different element or a different project? Understand the generalization.

---

# Common Mistakes

Only grabbing the HTML: The HTML without CSS and JS is the skeleton without muscles. Always get all three.
Asking Claude to "clone this site": Too broad. Ask about the specific effect you want to understand.
Using the cloned technique unchanged: The technique must be adapted to your design system. Generic application reveals the source.
Stopping at understanding: Cloning without application does not build skill. Always implement.
