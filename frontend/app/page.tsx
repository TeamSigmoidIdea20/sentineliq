'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Activity, GitBranch, Search } from 'lucide-react'
import { C as TOKENS } from '@/lib/tokens'

const C = {
  bg: TOKENS.bg,
  card: TOKENS.card,
  border: TOKENS.border,
  primary: TOKENS.textPrimary,
  muted: TOKENS.textMuted,
  red: TOKENS.critical,
  amber: TOKENS.amber,
  green: TOKENS.low,
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

const MOCK_ALERTS = [
  { id: 'a3f9b2c1', user: 'James Sterling', type: 'Bulk Data Export', risk: 'CRITICAL', score: 94, color: C.red },
  { id: 'b7d1e4f0', user: 'Maria Lopez', type: 'Off-Hours Login', risk: 'HIGH', score: 78, color: C.red },
  { id: 'c2a8f3d9', user: 'Arun Kapoor', type: 'Velocity Spike', risk: 'MEDIUM', score: 61, color: C.amber },
]

const STEPS = [
  {
    step: '1',
    title: 'Every User Gets a Fingerprint',
    Icon: Activity,
    desc: "SentinelIQ learns each employee's normal patterns across login timing, transaction volume, department access, and device usage over a 90-day rolling window.",
  },
  {
    step: '2',
    title: 'Three Models. One Verdict.',
    Icon: GitBranch,
    desc: 'Every incoming event is scored in real time by three ML models working in parallel. Isolation Forest catches sudden anomalies. LSTM Autoencoder detects slow drift. XGBoost produces the final risk score.',
  },
  {
    step: '3',
    title: 'Investigators See Why, Not Just What',
    Icon: Search,
    desc: 'When a threshold is breached, SentinelIQ generates an alert with a SHAP waterfall explanation showing exactly which behaviours drove the score. No black boxes.',
  },
]

const FRAMEWORKS = ['Isolation Forest', 'LSTM Autoencoder', 'XGBoost', 'SHAP', 'FastAPI', 'Next.js']

const FEATURES = [
  {
    title: 'Real-Time Monitoring',
    desc: 'Continuous behavioural event stream scored in under 50ms. Every login, transaction, and file access evaluated against a per-user baseline.',
    badge: '50ms latency',
  },
  {
    title: '3-Model Ensemble',
    desc: 'Isolation Forest for point anomalies, LSTM Autoencoder for temporal sequences, and XGBoost for supervised pattern scoring, combined into a single risk signal.',
    badge: 'IF · LSTM · XGB',
  },
  {
    title: 'SHAP Explainability',
    desc: 'Every alert ships with feature-level SHAP attributions from TreeExplainer. Analysts see exactly which behaviours drove the risk score.',
    badge: 'Top-5 features per alert',
  },
]

const STATS = [
  { value: '12–18', unit: 'months', label: 'Average detection lag for insider fraud: the time attackers operate undetected', red: false },
  { value: '30%', unit: '', label: 'Of all banking fraud events traced back to internal actors with valid access', red: false },
  { value: '0.4%', unit: '', label: 'False positive rate on SentinelIQ\'s 3-model ensemble', red: true },
]

const THREAT_PATTERNS = [
  {
    type: 'Privilege Escalation',
    desc: 'Exploiting temporary permissions or misconfigured roles to reach systems outside their clearance level, often done incrementally to avoid triggering single-event rules.',
  },
  {
    type: 'Bulk Data Exfiltration',
    desc: 'Anomalous download volumes compressed into narrow time windows. Often timed around resignation notices or performance reviews, when monitoring attention is elsewhere.',
  },
  {
    type: 'Off-Hours Access',
    desc: 'Logins and high-value transactions at 2am from unfamiliar device fingerprints. Invisible to day-shift supervisors and nearly impossible to catch with manual review cycles.',
  },
  {
    type: 'Cross-Department Queries',
    desc: 'A teller querying treasury systems. An analyst accessing HR payroll data. Each access might look legitimate in isolation; only behavioural baseline comparison reveals the pattern.',
  },
]

const SHAP_MOCK = [
  { feature: 'transaction_velocity_ratio', value: 28.4, positive: true },
  { feature: 'off_hours_ratio', value: 19.2, positive: true },
  { feature: 'access_entropy', value: 14.1, positive: true },
  { feature: 'login_hour_deviation', value: 9.3, positive: true },
  { feature: 'download_volume_zscore', value: 6.2, positive: false },
]

const ALERT_STEPS = [
  {
    n: '01',
    heading: 'Event scored in real time',
    body: 'Every user action (login, transaction, or file access) is encoded into 8 engineered features and passed through all three models simultaneously in under 50ms.',
  },
  {
    n: '02',
    heading: 'Ensemble threshold triggers the alert',
    body: 'When the weighted ensemble score (IF 0.3 + LSTM 0.4 + XGB 0.3) exceeds 70, an alert is created with severity level, user context, and a frozen snapshot of the triggering event.',
  },
  {
    n: '03',
    heading: 'SHAP explains why the score fired',
    body: 'TreeExplainer runs on the XGBoost component and returns the top 5 feature contributions — positive values push the score up, negative values pulled it down.',
  },
  {
    n: '04',
    heading: 'Analyst reviews the full evidence package',
    body: 'The investigator sees the risk score, SHAP breakdown, 30 days of risk history, and all linked prior alerts for the user — then labels it TP/FP to improve future model accuracy.',
  },
]


export default function LandingPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'inherit', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(13,17,23,0.92)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, overflow: 'hidden', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="SentinelIQ logo"
                style={{ height: 28, width: 'auto', display: 'block', objectFit: 'cover', objectPosition: 'left center' }}
              />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.primary, letterSpacing: '-0.02em' }}>SentinelIQ</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {['Features', 'Models', 'Enterprise'].map((item) => (
              <span key={item} style={{ fontSize: 13, color: C.muted, cursor: 'default' }}>{item}</span>
            ))}
            <Link href="/dashboard" style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              padding: '7px 16px', borderRadius: 3,
              background: C.primary, color: C.bg, textDecoration: 'none',
            }}>
              VIEW LIVE DEMO
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        backgroundImage: `linear-gradient(to right, rgba(13,17,23,1) 40%, rgba(13,17,23,0.4) 100%), url('/hero-bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        backgroundRepeat: 'no-repeat',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0', textAlign: 'center' }}>

          {/* Announcement badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: `1px solid ${C.border}`, borderRadius: 3,
              padding: '5px 12px', marginBottom: 18,
            }}
          >
            <span
              className="animate-pulse-dot"
              style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block', flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>New: Behavioural Pattern Detection v2.4</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            style={{
              margin: '0 auto 14px',
              fontSize: 'clamp(34px, 5.2vw, 58px)',
              fontWeight: 800,
              color: C.primary,
              lineHeight: 1.07,
              letterSpacing: '-0.03em',
              maxWidth: 780,
            }}
          >
            Detect Insider Fraud{' '}
            <span style={{ color: C.red }}>Before It Happens</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            style={{
              margin: '0 auto 24px',
              maxWidth: 680,
              fontSize: 20,
              fontWeight: 500,
              color: C.primary,
              lineHeight: 1.7,
            }}
          >
            Every year, insider fraud costs Indian banks thousands of crores. Most cases are discovered 12–18 months after the damage is done; by which point it is too late. SentinelIQ watches every privileged user, every action, in real time. The moment behaviour deviates from baseline, investigators know.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}
          >
            <Link href="/dashboard" style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
              padding: '12px 28px', borderRadius: 3,
              background: C.primary, color: C.bg, textDecoration: 'none',
              display: 'inline-block',
            }}>
              View Live Demo →
            </Link>
            <a href="#how-it-works" style={{
              fontSize: 14, fontWeight: 600,
              padding: '12px 28px', borderRadius: 3,
              background: 'transparent', color: C.primary,
              border: `1px solid ${C.border}`, textDecoration: 'none',
              display: 'inline-block',
            }}>
              See How It Works
            </a>
          </motion.div>

          {/* ── Browser mockup ── */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 80 }}
          >
            <div style={{
              border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden',
              boxShadow: '0 32px 96px rgba(0,0,0,0.6)',
            }}>
              {/* Browser chrome */}
              <div style={{
                background: '#080D13', borderBottom: `1px solid ${C.border}`,
                padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {[C.red, C.amber, C.green].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.75 }} />
                ))}
                <div style={{
                  flex: 1, marginLeft: 14, height: 22, background: C.card,
                  borderRadius: 3, border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', paddingLeft: 10, gap: 6,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
                  <span style={{ fontSize: 11, color: C.muted }}>sentineliq.vercel.app/dashboard</span>
                </div>
              </div>

              {/* Dashboard layout */}
              <div style={{ background: C.bg, display: 'grid', gridTemplateColumns: '152px 1fr', minHeight: 320 }}>

                {/* Sidebar */}
                <div style={{ borderRight: `1px solid ${C.border}`, padding: '14px 0', background: C.bg }}>
                  <div style={{ padding: '4px 14px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 20, height: 20, overflow: 'hidden', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo.png"
                        alt=""
                        aria-hidden="true"
                        style={{ height: 20, width: 'auto', display: 'block', objectFit: 'cover', objectPosition: 'left center' }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: '-0.01em' }}>SentinelIQ</span>
                  </div>
                  {[
                    { label: 'Overview', active: true },
                    { label: 'Alerts', active: false },
                    { label: 'Users', active: false },
                  ].map(({ label, active }) => (
                    <div key={label} style={{
                      padding: '7px 14px', fontSize: 11,
                      color: active ? C.primary : C.muted,
                      background: active ? '#1C2128' : 'transparent',
                      borderLeft: active ? `2px solid ${C.red}` : '2px solid transparent',
                    }}>
                      {label}
                    </div>
                  ))}
                  <div style={{ margin: '16px 14px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span
                      className="animate-pulse-dot"
                      style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 8, color: C.green, fontWeight: 700, letterSpacing: '0.06em' }}>MONITORING ACTIVE</span>
                  </div>
                </div>

                {/* Main panel */}
                <div style={{ padding: 14 }}>
                  {/* Stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Users Monitored', value: '50', color: C.primary },
                      { label: 'Alerts Today', value: '7', color: C.primary },
                      { label: 'High Risk', value: '3', color: C.red },
                      { label: 'False Positive Rate', value: '0.4%', color: C.green },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{
                        background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: 4, padding: '10px 12px',
                      }}>
                        <p style={{ margin: '0 0 4px', fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Alert table */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      padding: '7px 12px', borderBottom: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span
                        className="animate-pulse-dot"
                        style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 8, color: C.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live Intelligence Feed</span>
                    </div>
                    {MOCK_ALERTS.map((alert, i) => (
                      <div key={alert.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                        borderBottom: i < MOCK_ALERTS.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}>
                        <span style={{ fontSize: 8, color: C.muted, fontFamily: 'monospace', width: 48, flexShrink: 0 }}>{alert.id.slice(0, 7)}</span>
                        <span style={{ fontSize: 10, color: C.primary, fontWeight: 600, width: 100, flexShrink: 0 }}>{alert.user}</span>
                        <span style={{ fontSize: 10, color: C.muted, flex: 1 }}>{alert.type}</span>
                        <span style={{
                          fontSize: 7, fontWeight: 700, color: alert.color,
                          border: `1px solid ${alert.color}`,
                          borderRadius: 2, padding: '2px 6px', letterSpacing: '0.05em', flexShrink: 0,
                        }}>{alert.risk}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: alert.color, width: 26, textAlign: 'right', flexShrink: 0 }}>{alert.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          {STATS.map(({ value, unit, label, red }, i) => (
            <motion.div
              key={label}
              variants={fadeIn}
              style={{
                padding: '48px 40px',
                borderRight: i < STATS.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: 11, color: C.muted, lineHeight: 1.55 }}>{label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontSize: 40, fontWeight: 800, lineHeight: 1,
                  color: red ? C.red : C.primary, letterSpacing: '-0.03em',
                }}>{value}</span>
                {unit && <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{unit}</span>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Problem Statement ── */}
      <section style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px' }}
        >
          <div className="problem-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>

            {/* Left: narrative */}
            <motion.div variants={fadeInUp}>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                The Problem
              </p>
              <h2 style={{ margin: '0 0 24px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Rule-based systems don't catch the employee who already knows where the cameras are.
              </h2>
              <p style={{ margin: '0 0 18px', fontSize: 14, color: C.muted, lineHeight: 1.72 }}>
                Traditional fraud controls work on known patterns. Blocklists, velocity thresholds, static rules: they stop the fraud you have already seen. Insider threats are different. The attacker has valid credentials, legitimate access, and years of institutional knowledge about exactly how systems are monitored.
              </p>
              <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.72 }}>
                By the time a rule fires, the data has already left the building. SentinelIQ builds a statistical fingerprint of what each employee's normal behaviour looks like — and flags deviation the moment it begins, not 12 months later when an audit cycle finally catches up.
              </p>
            </motion.div>

            {/* Right: threat patterns */}
            <motion.div variants={fadeInUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {THREAT_PATTERNS.map(({ type, desc }) => (
                <div
                  key={type}
                  style={{
                    padding: '18px 20px',
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                  }}
                >
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: '-0.01em' }}>{type}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px' }}
        >
          <motion.div variants={fadeIn} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em' }}>
              From Event to Evidence in Under 30 Seconds
            </h2>
            <p style={{ margin: 0, color: C.muted, fontSize: 15 }}>
              50ms to score. Under a minute for an analyst to have a verdict.
            </p>
          </motion.div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {STEPS.map(({ step, title, Icon, desc }) => (
              <motion.div
                key={step}
                variants={fadeInUp}
                style={{
                  position: 'relative', overflow: 'hidden',
                  padding: '32px 28px',
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                }}
              >
                <span style={{
                  position: 'absolute', top: -8, left: 12,
                  fontSize: 96, fontWeight: 800, lineHeight: 1,
                  color: C.muted, opacity: 0.15,
                  userSelect: 'none', pointerEvents: 'none',
                  letterSpacing: '-0.04em',
                }}>
                  {step}
                </span>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ marginBottom: 18 }}>
                    <Icon size={22} color={C.red} strokeWidth={1.5} />
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: C.primary, letterSpacing: '-0.01em' }}>
                    {title}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.72 }}>
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Operations Room image strip ── */}
      <section style={{
        position: 'relative', height: 400, overflow: 'hidden',
        backgroundImage: `url('/ops-room.png')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(13,17,23,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(22px, 4vw, 40px)',
            fontWeight: 800,
            color: C.primary,
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}>
            Your analysts shouldn't be the last to know.
          </h2>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px', borderBottom: `1px solid ${C.border}` }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 52 }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em' }}>
            Built for High-Stakes Detection
          </h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 15 }}>
            Production-grade ML pipeline running end-to-end on every event.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}
        >
          {FEATURES.map(({ title, desc, badge }, i) => (
            <div
              key={title}
              style={{
                display: 'grid', gridTemplateColumns: '52px 1fr auto',
                gap: 28, padding: '32px 36px',
                borderBottom: i < FEATURES.length - 1 ? `1px solid ${C.border}` : 'none',
                alignItems: 'start',
              }}
            >
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 700, fontFamily: 'monospace', paddingTop: 3, letterSpacing: '0.02em' }}>
                0{i + 1}
              </span>
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: C.primary, letterSpacing: '-0.01em' }}>{title}</p>
                <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{desc}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: C.red,
                border: `1px solid ${C.red}`, borderRadius: 2,
                padding: '3px 8px', letterSpacing: '0.05em', whiteSpace: 'nowrap', marginTop: 4,
              }}>{badge}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Inside a Live Alert ── */}
      <section style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px' }}
        >
          <motion.div variants={fadeIn} style={{ marginBottom: 64 }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Investigator View
            </p>
            <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', maxWidth: 640 }}>
              When the score breaks threshold, the analyst sees the full picture.
            </h2>
            <p style={{ margin: 0, color: C.muted, fontSize: 15, maxWidth: 560, lineHeight: 1.65 }}>
              Not a severity flag: a complete evidence package. Risk score, SHAP explanation, 30 days of behavioural history, and every linked prior incident for that user.
            </p>
          </motion.div>

          <div className="alert-demo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>

            {/* Left: step-by-step */}
            <motion.div variants={fadeInUp} style={{ display: 'flex', flexDirection: 'column' }}>
              {ALERT_STEPS.map(({ n, heading, body }, i) => (
                <div key={n} style={{ display: 'flex', gap: 18, paddingBottom: i < ALERT_STEPS.length - 1 ? 32 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: 3,
                      background: C.bg, border: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: C.red, letterSpacing: '0.04em', flexShrink: 0,
                    }}>{n}</span>
                    {i < ALERT_STEPS.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: C.border, marginTop: 8, minHeight: 24 }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 6 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.primary }}>{heading}</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{body}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Right: SHAP panel mockup */}
            <motion.div variants={fadeInUp}>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${C.red}`, borderRadius: 2, padding: '2px 6px' }}>Critical</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: C.red, lineHeight: 1 }}>94</span>
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: C.primary }}>Bulk Data Export Detected</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.muted }}>James Sterling · Treasury Dept · 2 minutes ago</p>
                </div>
                <div style={{ padding: '18px 18px 20px' }}>
                  <p style={{ margin: '0 0 18px', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Top Risk Factors (SHAP)
                  </p>
                  {SHAP_MOCK.map(({ feature, value, positive }) => (
                    <div key={feature} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{feature}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: positive ? C.red : C.green }}>
                          {positive ? '+' : '−'}{value}
                        </span>
                      </div>
                      <div style={{ height: 3, background: C.border, borderRadius: 1 }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((value / 30) * 100, 100)}%`,
                          background: positive ? C.red : C.green,
                          borderRadius: 1,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ── Trusted Frameworks ── */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 0 }}>
            {FRAMEWORKS.map((name, i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <span style={{ width: 1, height: 14, background: C.border, display: 'inline-block', margin: '0 18px', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px', textAlign: 'center' }}
        >
          <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em' }}>
            The next insider fraud attempt is already in progress.
          </h2>
          <p style={{ margin: '0 auto 40px', color: C.muted, fontSize: 15, maxWidth: 460, lineHeight: 1.65 }}>
            SentinelIQ surfaces it before the damage is done.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
              padding: '12px 28px', borderRadius: 3,
              background: C.primary, color: C.bg, textDecoration: 'none',
              display: 'inline-block',
            }}>
              Get a Demo
            </Link>
            <a href="#" style={{
              fontSize: 14, fontWeight: 600,
              padding: '12px 28px', borderRadius: 3,
              background: 'transparent', color: C.primary,
              border: `1px solid ${C.border}`, textDecoration: 'none',
              display: 'inline-block',
            }}>
              Contact Enterprise Sales
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 0' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginBottom: 48, justifyContent: 'space-between', alignItems: 'flex-start' }}>

            {/* Brand + team */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 24, height: 24, overflow: 'hidden', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="" aria-hidden="true" style={{ height: 24, width: 'auto', display: 'block', objectFit: 'cover', objectPosition: 'left center' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>SentinelIQ</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
                Team SIGMOID, iDEA 2.0, Union Bank of India
              </p>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
              <a href="#" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>GitHub Repository</a>
              <Link href="/dashboard" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>View Demo</Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: `1px solid ${C.border}`, padding: '20px 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
              © 2026 SentinelIQ Fraud Intelligence. All rights reserved.
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.muted,
              border: `1px solid ${C.border}`, borderRadius: 2,
              padding: '3px 8px', letterSpacing: '0.06em',
            }}>
              ISO 27001 Certified
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
