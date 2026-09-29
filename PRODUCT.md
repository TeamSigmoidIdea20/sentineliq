# Product

## Register

product

## Users

Fraud analysts and security operations teams at Union Bank of India. They monitor 50+ bank employees in real time from a dedicated security workstation, often under time pressure when an alert fires. Their primary job on any given screen is: see the anomaly, understand why it fired, decide to resolve or escalate. Secondary audience: hackathon judges with 90 seconds to evaluate — they need to grasp the system's power immediately, without explanation.

## Product Purpose

SentinelIQ detects insider fraud in real time by building a per-employee behavioural baseline and scoring every incoming event through a three-model ML ensemble (Isolation Forest, LSTM Autoencoder, XGBoost). It surfaces anomalies as actionable alerts, backed by SHAP explainability so analysts can see exactly which behavioural features drove each risk score. The system runs continuously — no batch jobs, no cold starts. Success means an analyst can go from alert fired to decision made in under 30 seconds.

## Brand Personality

Command centre. Controlled, authoritative, high-stakes. The interface should feel like a military operations room, not a SaaS tool. Calm under pressure. Confident without being aggressive. Every element communicates that the people using this know what they're doing.

Three words: **precise, authoritative, alert**.

## Anti-references

- Generic SaaS dashboard: blue gradients, rounded pill badges, hero metric cards with gradient accents, identical card grids, Figma-template feel. If it looks like it could be a project management or CRM tool, it's wrong.
- Consumer fintech: friendly colours, onboarding flows, friendly copy. This is not Robinhood.
- Cyberpunk/hacker: neon green terminals, matrix rain, Kali Linux aesthetics. Danger signals should feel precise, not theatrical.

## Design Principles

1. **Authority over decoration.** Every design element must communicate control and precision. If an element is purely decorative, it belongs elsewhere.
2. **Risk is the visual language.** Red (#DC2626), amber (#D97706), and green (#16A34A) are not accent colours — they are the data. Colour carries meaning; it never decorates.
3. **Density as respect.** Analysts need information. White space is earned at the data level, not applied uniformly to look "clean." Don't pad screens to signal quality.
4. **Real-time demands immediacy.** The interface should feel alive: pulsing live indicators, animating new alerts, updating counters. Static dashboards are dashboards that lie about what they're showing.
5. **Explainability builds trust.** SHAP charts and model breakdowns are not secondary features — they are what makes the system credible to a skeptical analyst. They belong in the primary view, not behind a "details" modal.

## Accessibility & Inclusion

WCAG 2.1 AA. Minimum 4.5:1 contrast ratio for body text and interactive elements. Keyboard navigation required for all alert and case workflows. Colour is never the sole indicator of risk level — pair with text labels and iconography.
