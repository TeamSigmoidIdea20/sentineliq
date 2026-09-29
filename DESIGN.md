---
name: SentinelIQ
description: AI-powered insider fraud detection platform for financial institutions
colors:
  deep-void: "#0D1117"
  absolute-void: "#080D13"
  surface-one: "#161B22"
  surface-two: "#1C2128"
  steel-grid: "#30363D"
  dormant: "#444C56"
  focus-boundary: "#4D5562"
  muted-signal: "#8B949E"
  signal-white: "#F0F6FC"
  threat-red: "#DC2626"
  amber-watch: "#D97706"
  clear-green: "#16A34A"
  auth-blue: "#4472C4"
  access-violet: "#8B49C4"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(34px, 5.2vw, 58px)"
    fontWeight: 800
    lineHeight: 1.07
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(22px, 4vw, 34px)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.72
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sharp: "2px"
  sm: "3px"
  md: "4px"
  circle: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
  2xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.signal-white}"
    textColor: "{colors.deep-void}"
    rounded: "{rounded.sm}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.muted-signal}"
    textColor: "{colors.deep-void}"
    rounded: "{rounded.sm}"
    padding: "12px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.signal-white}"
    rounded: "{rounded.sm}"
    padding: "12px 28px"
  button-danger:
    backgroundColor: "{colors.threat-red}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-muted:
    backgroundColor: "transparent"
    textColor: "{colors.muted-signal}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.surface-one}"
    rounded: "{rounded.md}"
    padding: "20px 24px"
  risk-badge-critical:
    backgroundColor: "transparent"
    textColor: "{colors.threat-red}"
    rounded: "{rounded.sharp}"
    padding: "3px 8px"
  risk-badge-medium:
    backgroundColor: "transparent"
    textColor: "{colors.amber-watch}"
    rounded: "{rounded.sharp}"
    padding: "3px 8px"
  risk-badge-low:
    backgroundColor: "transparent"
    textColor: "{colors.clear-green}"
    rounded: "{rounded.sharp}"
    padding: "3px 8px"
---

# Design System: SentinelIQ

## 1. Overview

**Creative North Star: "The Operations Room"**

SentinelIQ's visual system is built around a single scene: a 24/7 security command centre running under controlled light. Every analyst knows exactly where to look. Every indicator has a single meaning. Nothing decorates; everything informs. The surface is calm because the system is always watching, and it interrupts that calm — precisely, surgically — only when threat demands it.

The system uses four tonal dark layers to convey depth without shadows. Color appears exactly three times: red for threat, amber for watch, green for clear. These are not accent colours. They are the data. Their rarity is what makes them legible — on a screen full of near-black surfaces, a single red badge stops the eye immediately. No gradients, no glows, no glassmorphism dilute that signal.

Typography is Geist throughout: a system sans with optical engineering built in. Display weights at 800 create authority without decoration. Section labels run small, uppercase, tracked wide — the visual grammar of a data readout, not a marketing page. Everything else is functional, precise, and as sparse as the actual information requires.

**Key Characteristics:**
- Four tonal dark layers as the entire depth vocabulary
- Red, amber, green as semantic signals — never decorative
- Sharp corners (2-4px radius) everywhere except avatars
- Uppercase tracked labels as the visual grammar for data headers
- Live pulse indicators as the only ambient motion
- Maximum information density at the data level; no cosmetic padding

## 2. Colors: The Operations Palette

Four surface layers plus three semantic risk signals. Every other colour is secondary or event-specific.

### Primary
- **Threat Red** (`#DC2626`): The only deliberate interruption. Used for critical and high-risk alerts, the brand mark, and calls to action on brand surfaces. When red appears on a dark screen, an analyst's eye goes there first. Its rarity is load-bearing.

### Secondary
- **Amber Watch** (`#D97706`): Medium risk. Elevated attention, not immediate action. Appears in badges, progress bars, and peer comparison bars at medium threat levels.
- **Clear Green** (`#16A34A`): Low risk and confirmed-safe states. Also the live monitoring indicator — a permanently pulsing dot that signals the system is running.

### Tertiary
- **Auth Blue** (`#4472C4`): Login event dot in the event timeline only. Semantic, not branded.
- **Access Violet** (`#8B49C4`): Privilege use, file access, and department access events in the timeline only. Semantic, not branded.

### Neutral
- **Signal White** (`#F0F6FC`): All primary body text and active states. Also the background of primary CTA buttons on brand surfaces, creating the highest-contrast interactive element in the system.
- **Muted Signal** (`#8B949E`): Section labels, metadata, inactive nav, placeholder text, and secondary copy. Anything the analyst doesn't need to read first.
- **Focus Boundary** (`#4D5562`): Input border on focus. The single interactive state signal for form fields.
- **Dormant** (`#444C56`): Inactive event indicator dots in the live feed. Visually distinct from both risk colors and the neutral stack.
- **Steel Grid** (`#30363D`): All borders, dividers, skeleton loader backgrounds, and progress bar tracks. The structural layer of the grid.
- **Surface Two** (`#1C2128`): Hover state and lightly elevated surfaces. The second tonal step above the card layer.
- **Surface One** (`#161B22`): All card and panel backgrounds. The first surface above the page floor.
- **Absolute Void** (`#080D13`): Used for the deepest background layer (browser chrome mockup). Reserve for surfaces below Surface One.
- **Deep Void** (`#0D1117`): The page background. Every surface lifts off this floor.

**The One Interruption Rule.** Threat Red appears on less than 10% of any given screen during normal operating conditions. At high alert density it increases — that increase is the signal. Never use red for decoration, emphasis, or branding on product surfaces.

**The Semantic Lock Rule.** Red means critical/high. Amber means medium. Green means low or live. These assignments are immutable. No other UI purpose may borrow these colors.

## 3. Typography

**Display / Body Font:** Geist (fallback: ui-sans-serif, system-ui, -apple-system, sans-serif)

A single typeface throughout. Geist is optically engineered for interfaces: sharp at small sizes, authoritative at large ones. No serif contrast, no script flourish — this is a readout, not a publication.

**Character:** Controlled restraint. The same typeface reads as military precision at 800 weight and 58px, then as dense data at 400 weight and 11px. The hierarchy is built entirely through scale and weight contrast, not variety.

### Hierarchy
- **Display** (800 weight, clamp(34px, 5.2vw, 58px), line-height 1.07, letter-spacing -0.03em): Landing page hero headline only. Maximum visual authority.
- **Headline** (800 weight, clamp(22px, 4vw, 34px), line-height 1.2, letter-spacing -0.02em): Section headings on both landing and dashboard.
- **Title** (700 weight, 16px, line-height 1.35, letter-spacing -0.01em): Component and feature titles. One step below section headings.
- **Body** (400-500 weight, 13-15px, line-height 1.65-1.72): Primary content, descriptions, alert explanations. Line length capped at 65-75ch.
- **Label** (600-700 weight, 10-11px, uppercase, letter-spacing 0.06-0.08em): Section headers within the dashboard, metadata keys, risk badge text, nav category labels. The visual grammar of a data readout.

**The Stat Weight Rule.** Numeric data values (risk scores, transaction counts, stat card numbers) use weight 700-800 at 28-42px with letter-spacing -0.02 to -0.03em. They are display-class typography applied at data scale — the number is the most important thing on that surface.

**The Label Doctrine.** All section-level headers inside the dashboard use the Label style: small, uppercase, tracked. Never sentence case or title case for these. The visual distinction between a label and a value is non-negotiable.

## 4. Elevation

This system is flat. Depth is expressed through four tonal steps in the neutral stack, not shadows.

- **Floor**: Deep Void (`#0D1117`) — page background
- **Surface 1**: Surface One (`#161B22`) — cards, panels, sidebars
- **Surface 2**: Surface Two (`#1C2128`) — hover states, selected rows, lightly elevated containers

Shadows appear in exactly three circumstances and are never decorative:

### Shadow Vocabulary
- **Overlay Mask** (`rgba(0,0,0,0.5)` full-screen): Alert panel backdrop. Signals modal-level interruption.
- **Float** (`0 8px 32px rgba(0,0,0,0.5)`): Toast notifications. Signals temporary, top-layer messaging.
- **Hero Depth** (`0 32px 96px rgba(0,0,0,0.6)`): Browser mockup on the landing page only. Decorative, contained to the brand surface.
- **Threat Glow** (`0 0 6px #DC262688`): Fraud event dots in the event timeline. Semantic: a soft pulse that draws the eye to a confirmed fraud event without animation.

**The Flat-By-Default Rule.** Data surfaces are flat at rest. Surface Two (`#1C2128`) is the hover state — it communicates interactivity through tonal shift, not shadow. If you're adding a shadow to a card or row, you're adding it to the wrong thing.

## 5. Components

### Buttons
Four variants, each with a distinct authority level.

- **Shape:** Minimally rounded (3px). Barely perceptible curve — corners read as sharp in context.
- **Primary (CTA):** Background `#F0F6FC`, text `#0D1117`, padding 12px 28px, font-size 14px, weight 700, letter-spacing 0.02em. The highest-contrast element on any dark surface. Used for "View Live Demo", "Get a Demo" — primary conversion actions.
- **Primary hover:** Background shifts to `#8B949E`. No scale, no shadow.
- **Ghost:** Transparent background, `1px solid #30363D` border, text `#F0F6FC`. Same padding. Secondary actions alongside a Primary.
- **Danger:** Background `#DC2626`, text `#FFFFFF`, no border. Used for "MARK RESOLVED" — destructive or high-commitment actions in the analyst workflow. Full-width inside the alert panel.
- **Muted Ghost:** Transparent, `1px solid #30363D`, text `#8B949E`. Tertiary actions (Dismiss, Export) that should not compete with the primary action.
- **Text treatment:** Uppercase with tracked letter-spacing (`0.05-0.06em`) on short utility labels (e.g. "MARK RESOLVED"). Sentence case on longer CTA labels (e.g. "View Live Demo"). Never mix within a single button group.

### Risk Badges
The most important component in the system. A risk badge tells an analyst what to do before they read anything else.

- **Shape:** Near-flat (2px radius). Sharp, clinical.
- **Structure:** Colored border + colored text + small filled dot + uppercase label + optional numeric score.
- **Critical / High:** `1px solid #DC2626`, text `#DC2626`, padding 3px 8px, font-size 11px, weight 700, letter-spacing 0.08em. Label: "CRITICAL" or "HIGH RISK".
- **Medium:** Same structure, `#D97706`.
- **Low:** Same structure, `#16A34A`.
- **The Dot Requirement.** The 6px filled circle before the label is non-negotiable. Color alone does not meet WCAG AA; the dot provides a redundant non-color signal. Never remove it.

### Cards / Containers
- **Corner Style:** Gently sharp (4px radius).
- **Background:** Surface One (`#161B22`) on the Deep Void floor.
- **Border:** `1px solid #30363D`. Always present. Cards without borders disappear into the floor.
- **Shadow Strategy:** None. Depth is tonal, not shadow-based (see Elevation).
- **Internal Padding:** 20-24px. Section content within a card uses 12-14px horizontal padding with 10-12px between rows.

### Inputs / Fields
- **Style:** Background Deep Void (`#0D1117`), border `1px solid #30363D`, radius 4px. Sits visually below the card surface it lives in.
- **Focus:** Border shifts to Focus Boundary (`#4D5562`). No glow, no color change beyond the border.
- **Font:** Same font stack, 12px, color Signal White.
- **Placeholder:** Muted Signal (`#8B949E`).

### Navigation (Sidebar)
- **Default item:** Transparent background, text Muted Signal, 13px, weight 400, padding 8px 10px, 4px radius.
- **Active item:** Background Surface Two (`#1C2128`), text Signal White, weight 600. Left border `2px solid #DC2626` — the only intentional side-stripe in the system. Justified: the sidebar is a navigation rail, not a data card, and the vertical accent directly marks position.
- **Category label:** Muted Signal, 10px, uppercase, letter-spacing 0.08em, weight 600. Treated as a Label, not a heading.

### Section Labels (Dashboard)
The visual grammar that separates data from metadata. Used as headers for every collapsible section and data group inside panels.

- **Style:** 10-11px, uppercase, weight 600, letter-spacing 0.06-0.08em, color Muted Signal (`#8B949E`). No divider. Margin 0.

### Progress Bars / Score Bars
Used for risk scores, model confidence, and peer comparison metrics.

- **Track:** Height 4-8px, background Steel Grid (`#30363D`), radius 2px.
- **Fill:** Risk color (red/amber/green) based on the value threshold. Transition `width 0.4s ease`.
- **Numeric label:** Displayed alongside, not inside. Weight 700-800.

### Live Indicator
A permanently pulsing 5-6px circle in Clear Green (`#16A34A`). Indicates the system is actively monitoring. Appears in the sidebar below the logo and in the live feed header.

- **Animation:** `opacity: [1, 0.2, 1]`, duration 1.8-2s, repeat infinite, ease-in-out. Subtle enough to read as ambient; distinct enough to confirm the system is alive.

## 6. Do's and Don'ts

### Do:
- **Do** use the four tonal dark surfaces (`#0D1117`, `#161B22`, `#1C2128`, `#30363D`) as the entire depth vocabulary. Every surface should sit on one of these four steps.
- **Do** pair every risk color with a text label and the filled dot in RiskBadge. Color alone is insufficient for WCAG AA and insufficient for analysts under pressure.
- **Do** use uppercase tracked labels (10-11px, weight 600, letter-spacing 0.06-0.08em) for all section headers inside the dashboard. This is the visual grammar of a data readout.
- **Do** apply `transition: background 0.15s` on interactive rows and nav items. State changes should be immediate and perceptible without being distracting.
- **Do** use easeOut curves for all entry animations. Exponential ease-out (ease-out-quart or expo) for slides. Never bounce, elastic, or spring.
- **Do** stagger child entry animations at 0.13s intervals on landing sections. Choreography is justified on brand surfaces; product surfaces animate only live data updates.
- **Do** reserve the pulsing live indicator (Clear Green, opacity loop) for components that represent real-time system state.

### Don't:
- **Don't** use generic SaaS dashboard patterns: blue gradients, rounded pill badges, hero metric cards with gradient accents, identical icon-heading-text card grids. If it looks like it could be a project management or CRM tool, it is wrong.
- **Don't** use red (`#DC2626`) for decoration, hover states, emphasis, or any purpose other than critical/high risk and primary CTAs. The One Interruption Rule. Its rarity is the signal.
- **Don't** add shadows to cards, table rows, or any data surface. The system uses tonal depth. Shadows on data surfaces register as design noise, not hierarchy.
- **Don't** use gradient text (`background-clip: text`). The system uses solid color. Emphasis is through weight or size, never gradient.
- **Don't** use glassmorphism (backdrop-filter blur as decoration). The landing page nav uses a subtle blur for functional layering over scroll content. That is the only acceptable use.
- **Don't** use border-radius greater than 4px on any card, button, or data container. 6px is permitted only on the outermost browser-mockup wrapper on the landing page. The system reads sharp by intent.
- **Don't** add padding to screens to make them "look clean." Whitespace is earned at the data level. An empty analyst dashboard is a failed one.
- **Don't** animate CSS layout properties (width, height, margin, padding). Animate opacity and transform only.
- **Don't** build modals as a first-choice pattern. The alert panel is a fixed sidebar drawer, not a modal. Inline progressive disclosure before overlay.
- **Don't** use consumer fintech visual language: friendly rounded corners, warm background tints, onboarding illustrations, playful copy. SentinelIQ is a forensic instrument.
- **Don't** use cyberpunk aesthetics: neon green terminals, matrix-style motion, high-chroma color schemes. Threat signals must be precise, not theatrical.
