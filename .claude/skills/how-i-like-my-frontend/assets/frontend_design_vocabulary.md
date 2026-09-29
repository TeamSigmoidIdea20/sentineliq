# Frontend Design Vocabulary

Shared terminology for communicating about design with precision. Use these terms when directing Claude or describing design problems. The vocabulary reduces the translation gap between intent and output.

---

# Hierarchy Terms

Visual weight: The degree to which an element attracts the eye relative to surrounding elements. Weight is created through size, color contrast, font weight, and position.

Focal point: The single element in a section that the eye goes to first. Every section should have exactly one.

Scan path: The order in which the eye moves through a design. Designed scan paths guide users from the most important information to the next.

Contrast ratio: The luminance difference between text and its background. Minimum 4.5:1 for body text (WCAG AA), 3:1 for large text.

Visual hierarchy: The system of differences in visual weight that communicates the order of importance across all elements on a page.

---

# Layout Terms

Negative space: Empty space used deliberately as a design element. Premium designs use significantly more negative space than instinct suggests.

Breathing room: The space around an element that allows it to be perceived as distinct and important. More breathing room = more perceived importance.

Asymmetric balance: Layout where elements are not mirrored on a central axis, but visual weight is still balanced through size, color, and position contrast.

Left-weighted: Layout where the primary visual weight (text, focal element) falls to the left of center, with the right side holding a secondary element or negative space.

Full-bleed: An element (image, color block) that extends to the edges of the viewport with no margin.

Bento grid: A grid layout with cells of varied sizes, creating visual hierarchy within the grid itself.

Grid gutter: The space between columns in a grid layout. Typically 24-32px for landing pages.

---

# Typography Terms

Type hierarchy: The system of size, weight, and style differences between heading levels.

Weight contrast: The difference in font weight between type levels. More contrast = clearer hierarchy.

Line height (leading): The vertical space between lines of text. Body text: 1.5-1.7. Headlines: 1.0-1.2.

Letter spacing (tracking): The uniform space between all characters in a word or line. Negative for large headlines. Positive for uppercase labels.

Widow: A single word on the last line of a paragraph. Undesirable in headlines and important copy.

Optical sizing: Adjusting letter-spacing and line height based on type size — large text needs tighter tracking, small text needs looser.

---

# Color Terms

Dominant color: The color that appears most frequently by area. Usually a neutral.

Accent color: The single high-visibility color used for emphasis. Should appear on 3-5 elements maximum per page.

Neutral system: A palette of greys used for text, borders, and surface variation.

Opacity hierarchy: Using opacity levels of a single color (rather than different colors) to create text hierarchy. Standard: 92%, 55%, 35% on dark backgrounds.

Color temperature: The warm-to-cool spectrum. Warm tones (orange, amber) feel energetic. Cool tones (blue, slate) feel precise and calm.

---

# Motion Terms

Ease-out: Animation that starts fast and decelerates. Feels like a physical object settling. Use for elements entering the screen.

Ease-in: Animation that starts slow and accelerates. Use for elements leaving the screen.

Spring physics: Animation that overshoots the target and oscillates back, simulating physical spring behavior. Creates natural, physical feel.

Stagger: Sequential delay applied to sibling elements so they animate in series rather than simultaneously.

Scroll trigger: Animation that activates when an element enters the viewport.

Scroll-linked: Animation whose progress is directly tied to scroll position (not triggered by, but controlled by scroll).

Reduced motion: CSS media query (prefers-reduced-motion: reduce) that signals the user wants minimal animation.

---

# Interaction Terms

Hover state: The visual change applied to an element when the cursor is positioned over it.

Active state: The visual change applied to an element at the moment of click (mousedown/active).

Focus state: The visual indicator shown when an element is selected via keyboard navigation.

Affordance: Visual cues that signal an element's interactivity. A button with hover state has high affordance.

Magnetic interaction: An interactive effect where an element moves toward the cursor as the cursor approaches within a radius.

---

# Polish Terms

Micro-interaction: A small, focused interaction design moment — a hover state, a toggle flip, a loading indicator.

Microdetail: A small visual refinement that most users won't consciously notice but will collectively feel as "quality."

Skeleton screen: A placeholder representation of a loading content block that matches the content structure.

Count-up: A number animating from 0 to its target value, typically on scroll into view.

Grain / noise: A fine texture applied at low opacity to surfaces to add tactile depth to flat digital surfaces.
