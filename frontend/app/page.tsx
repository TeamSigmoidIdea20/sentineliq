'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
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
  visible: { transition: { staggerChildren: 0.11 } },
}
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } },
}
const BTN_TAP = { scale: 0.97 }

const MOCK_ALERTS = [
  { id: 'a3f9b2c1', user: 'James Sterling', type: 'Bulk Data Export', risk: 'CRITICAL', score: 94, color: C.red },
  { id: 'b7d1e4f0', user: 'Maria Lopez',    type: 'Off-Hours Login',  risk: 'HIGH',     score: 78, color: C.red },
  { id: 'c2a8f3d9', user: 'Arun Kapoor',    type: 'Velocity Spike',   risk: 'MEDIUM',   score: 61, color: C.amber },
]

const SHAP_MOCK = [
  { feature: 'transaction_velocity_ratio', value: 28.4, positive: true },
  { feature: 'off_hours_ratio',            value: 19.2, positive: true },
  { feature: 'access_entropy',             value: 14.1, positive: true },
  { feature: 'login_hour_deviation',       value: 9.3,  positive: true },
  { feature: 'download_volume_zscore',     value: 6.2,  positive: false },
]

const STATS = [
  { value: '12–18', unit: 'months', label: 'Average detection lag for insider fraud' },
  { value: '30%',   unit: '',       label: 'Of banking fraud traced to internal actors' },
  { value: '0.4%',  unit: '',       label: 'False positive rate on 3-model ensemble', red: true },
]

const FEATURES = [
  {
    label: 'Real-time behavioural baselines',
    desc: 'Each employee is scored against their own 30-day pattern — not a generic role profile. Off-hours logins, download queues, cross-department queries all compared against the user\'s actual baseline.',
    visual: 'baseline',
  },
  {
    label: '3-model ensemble',
    desc: 'Isolation Forest, an LSTM Autoencoder, and gradient-boosted trees vote in parallel — a single IF / LSTM / XGB disagreement is itself a signal we surface to the analyst.',
    visual: 'ensemble',
  },
  {
    label: 'SHAP explainability — built in',
    desc: 'Every alert ships with feature attribution. Analysts see which behavioural signals drove the score, by how much, against the user\'s own baseline. No "black-box anomaly" alerts.',
    visual: 'shap',
  },
]

const WORKFLOW = [
  {
    n: '01',
    title: 'Detect',
    desc: 'Every user action is encoded into 8 engineered features and scored in real time across all three models. Within 50ms of the event.',
  },
  {
    n: '02',
    title: 'Surface',
    desc: 'If the ensemble threshold is breached, an alert lands on the analyst\'s home screen with a one-sentence summary — value, what, why.',
  },
  {
    n: '03',
    title: 'Explain',
    desc: 'One click opens the full case view: 21-day risk history, SHAP attribution, model scores, peer comparison, linked events — no, what, why.',
  },
  {
    n: '04',
    title: 'Decide',
    desc: 'Resolve or escalate with a single keystroke. All labels feed back into active learning — the model improves with every analyst decision.',
  },
]

const ENVIRONMENTS = [
  {
    title: 'Retail & corporate banking',
    desc: 'Detect and investigate CRM, ORA, and loan-origination systems. Off-hours access to records of branch tellers, treasury, and loan-ops desks.',
    tags: ['Teller access anomalies', 'Payroll queries', 'Off-hours system use'],
  },
  {
    title: 'Treasury & capital markets',
    desc: 'Privileged security options and cross-department access where a single bad approval can move ₹crores in a single transaction.',
    tags: ['Transaction velocity during trading hours', 'Approved system queries across desks', 'Privileged access during peak management'],
  },
  {
    title: 'Regulatory compliance & audit',
    desc: 'MITRE ATT&CK technique mapping aligns with every alert. Case files include the complete audit chain — ready for RBI / SEBI / Internal audit handoff.',
    tags: ['T1078 — Valid Accounts', 'T1530 — Cloud Storage Access', 'T1087 — Account Manipulation + 30s'],
  },
  {
    title: 'Security operations centres',
    desc: 'Integrates next to your SIEM, not against it. SentinelIQ owns insider models (identity-facing fraud); your SOC tooling owns the rest.',
    tags: ['1-seat monitoring — no onboarding', 'REST API — Microservice / OpenAPI documented', 'Single-sign — CSV / SSO faking owns the seat'],
  },
]

const FRAMEWORKS = ['Isolation Forest', 'LSTM Autoencoder', 'XGBoost', 'SHAP', 'FastAPI', 'Next.js']

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
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, overflow: 'hidden', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="SentinelIQ" style={{ height: 26, width: 'auto', display: 'block' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.primary, letterSpacing: '-0.02em' }}>SentinelIQ</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {['Models', 'Explainability', 'Enterprise'].map(item => (
              <span key={item} style={{ fontSize: 13, color: C.muted, cursor: 'default' }}>{item}</span>
            ))}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={BTN_TAP}>
              <Link href="/dashboard" style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
                padding: '7px 16px', borderRadius: 3,
                background: C.primary, color: C.bg, textDecoration: 'none', display: 'block',
              }}>
                VIEW LIVE DEMO
              </Link>
            </motion.div>
          </nav>
        </div>
      </header>

      {/* ── Hero — split layout ── */}
      <section style={{
        backgroundImage: `linear-gradient(to right, rgba(13,17,23,1) 55%, rgba(13,17,23,0.3) 100%), url('/hero-bg.png')`,
        backgroundSize: 'cover', backgroundPosition: 'center right', backgroundRepeat: 'no-repeat',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left: text */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ margin: '0 0 20px', fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Designed for the SOC desk
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.07 }}
              style={{ margin: '0 0 20px', fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 800, color: C.primary, lineHeight: 1.08, letterSpacing: '-0.03em' }}
            >
              Detect Insider Fraud{' '}
              <span style={{ color: C.red }}>Before the Damage Is Done.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }}
              style={{ margin: '0 0 32px', fontSize: 15, color: C.muted, lineHeight: 1.72, maxWidth: 460 }}
            >
              SentinelIQ builds a behavioural fingerprint for every privileged employee and scores every action in real time. The moment behaviour deviates from baseline, investigators know — not 12 months later.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.22 }}
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={BTN_TAP}>
                <Link href="/dashboard" style={{
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                  padding: '11px 24px', borderRadius: 3,
                  background: C.primary, color: C.bg, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  View Live Demo →
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={BTN_TAP}>
                <a href="#workflow" style={{
                  fontSize: 13, fontWeight: 600, padding: '11px 24px', borderRadius: 3,
                  background: 'transparent', color: C.primary,
                  border: `1px solid ${C.border}`, textDecoration: 'none', display: 'block',
                }}>
                  See How It Works
                </a>
              </motion.div>
            </motion.div>
          </div>

          {/* Right: browser mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.3 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            >
              <div style={{
                border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}>
                <div className="mockup-scanline" />
                <div style={{ background: '#080D13', borderBottom: `1px solid ${C.border}`, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {[C.red, C.amber, C.green].map((c, i) => (
                    <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
                  ))}
                  <div style={{ flex: 1, marginLeft: 12, height: 20, background: C.card, borderRadius: 3, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                    <span style={{ fontSize: 10, color: C.muted }}>sentineliq.vercel.app/dashboard</span>
                  </div>
                </div>
                <div style={{ background: C.bg, display: 'grid', gridTemplateColumns: '130px 1fr', minHeight: 280 }}>
                  <div style={{ borderRight: `1px solid ${C.border}`, padding: '12px 0', background: C.bg }}>
                    <div style={{ padding: '4px 12px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="" aria-hidden="true" style={{ height: 18, width: 'auto', display: 'block' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.primary }}>SentinelIQ</span>
                    </div>
                    {[{ label: 'Overview', active: true }, { label: 'Alerts', active: false }, { label: 'Users', active: false }].map(({ label, active }) => (
                      <div key={label} style={{
                        padding: '6px 12px', fontSize: 10,
                        color: active ? C.primary : C.muted,
                        background: active ? '#1C2128' : 'transparent',
                        borderLeft: active ? `2px solid ${C.red}` : '2px solid transparent',
                      }}>{label}</div>
                    ))}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                      {[
                        { label: 'Users Monitored', value: '50', color: C.primary },
                        { label: 'Alerts Today',    value: '7',  color: C.primary },
                        { label: 'High Risk',       value: '3',  color: C.red },
                        { label: 'FP Rate',         value: '0.4%', color: C.green },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, padding: '8px 10px' }}>
                          <p style={{ margin: '0 0 3px', fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
                          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span className="animate-pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
                        <span style={{ fontSize: 7, color: C.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live Intelligence Feed</span>
                      </div>
                      {MOCK_ALERTS.map((alert, i) => (
                        <div key={alert.id} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                          borderBottom: i < MOCK_ALERTS.length - 1 ? `1px solid ${C.border}` : 'none',
                        }}>
                          <span style={{ fontSize: 8, color: C.muted, fontFamily: 'monospace', width: 44, flexShrink: 0 }}>{alert.id.slice(0, 7)}</span>
                          <span style={{ fontSize: 9, color: C.primary, fontWeight: 600, flex: 1 }}>{alert.user}</span>
                          <span style={{ fontSize: 9, color: C.muted }}>{alert.type}</span>
                          <span style={{ fontSize: 6, fontWeight: 700, color: alert.color, border: `1px solid ${alert.color}`, borderRadius: 2, padding: '1px 5px', letterSpacing: '0.05em', flexShrink: 0 }}>{alert.risk}</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: alert.color, width: 22, textAlign: 'right', flexShrink: 0 }}>{alert.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ borderBottom: `1px solid ${C.border}` }}>
        <motion.div
          variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
          style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {STATS.map(({ value, unit, label, red }, i) => (
            <motion.div key={label} variants={fadeIn}
              style={{ padding: '40px 40px', borderRight: i < STATS.length - 1 ? `1px solid ${C.border}` : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: red ? C.red : C.primary, letterSpacing: '-0.03em' }}>{value}</span>
                {unit && <span style={{ fontSize: 12, color: C.muted }}>{unit}</span>}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features — 3 columns ── */}
      <section style={{ borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ marginBottom: 52 }}
          >
            <p style={{ margin: '0 0 12px', fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Built around the analyst</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1.15, maxWidth: 560 }}>
              Every screen, every chart, every chip is there because an analyst asked for it.
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}
          >
            {FEATURES.map(({ label, desc, visual }) => (
              <motion.div key={label} variants={fadeInUp}
                style={{ background: C.card, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Visual preview */}
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, padding: '12px 14px', minHeight: 72 }}>
                  {visual === 'baseline' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {[{ label: 'Login hour', pct: 72, color: C.red }, { label: 'Download vol', pct: 45, color: C.amber }, { label: 'Dept access', pct: 28, color: C.green }].map(b => (
                        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 8, color: C.muted, width: 56, flexShrink: 0 }}>{b.label}</span>
                          <div style={{ flex: 1, height: 4, background: '#30363D', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 8, color: b.color, width: 24, textAlign: 'right' }}>{b.pct}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {visual === 'ensemble' && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 60 }}>
                      {[{ m: 'IF', h: 48, c: C.red }, { m: 'LSTM', h: 62, c: C.amber }, { m: 'XGB', h: 55, c: C.green }].map(b => (
                        <div key={b.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                          <div style={{ width: '100%', height: b.h, background: b.c, opacity: 0.75, borderRadius: '2px 2px 0 0' }} />
                          <span style={{ fontSize: 7, color: C.muted, fontWeight: 700 }}>{b.m}</span>
                        </div>
                      ))}
                      <div style={{ width: 1, height: 62, background: C.border, alignSelf: 'flex-start' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', paddingLeft: 4 }}>
                        <span style={{ fontSize: 7, color: C.muted }}>score</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: C.red, lineHeight: 1 }}>88</span>
                      </div>
                    </div>
                  )}
                  {visual === 'shap' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {SHAP_MOCK.slice(0, 3).map(s => (
                        <div key={s.feature} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 7, color: C.muted, fontFamily: 'monospace', width: 76, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.feature}</span>
                          <div style={{ flex: 1, height: 3, background: '#30363D', borderRadius: 1, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min((s.value / 30) * 100, 100)}%`, background: s.positive ? C.red : C.green, borderRadius: 1 }} />
                          </div>
                          <span style={{ fontSize: 7, color: s.positive ? C.red : C.green, width: 20, textAlign: 'right' }}>{s.positive ? '+' : '−'}{s.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: '-0.01em' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Analyst workflow — 4 steps ── */}
      <section id="workflow" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ marginBottom: 52 }}
          >
            <p style={{ margin: '0 0 12px', fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analyst workflow</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Detect, explain, decide. In under 30 seconds.
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}
          >
            {WORKFLOW.map(({ n, title, desc }) => (
              <motion.div key={n} variants={fadeInUp}
                whileHover={{ backgroundColor: '#1A1F26', transition: { duration: 0.15 } }}
                style={{ background: C.bg, padding: '28px 22px', cursor: 'default' }}
              >
                <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 800, color: C.red, fontFamily: 'monospace', letterSpacing: '0.04em' }}>{n}</p>
                <p style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: C.primary, letterSpacing: '-0.01em' }}>{title}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SHAP investigator view ── */}
      <section style={{ borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Investigator view</p>
            <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              When the score breaks threshold, the analyst sees the full picture.
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.72 }}>
              Not a severity flag — a complete evidence package. Risk score, SHAP explanation, 30 days of behavioural history, peer comparison, and every linked prior incident for that user.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${C.red}`, borderRadius: 2, padding: '2px 6px' }}>Critical</span>
                  <span style={{ fontSize: 26, fontWeight: 800, color: C.red, lineHeight: 1 }}>94</span>
                </div>
                <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: C.primary }}>Bulk Data Export Detected</p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>James Sterling · Treasury Dept · 2 minutes ago</p>
              </div>
              <div style={{ padding: '16px 16px 18px' }}>
                <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Top Risk Factors (SHAP)</p>
                {SHAP_MOCK.map(({ feature, value, positive }, idx) => (
                  <div key={feature} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>{feature}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: positive ? C.red : C.green }}>{positive ? '+' : '−'}{value}</span>
                    </div>
                    <div style={{ height: 3, background: C.border, borderRadius: 1, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min((value / 30) * 100, 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.08 }}
                        style={{ height: '100%', background: positive ? C.red : C.green, borderRadius: 1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Environments ── */}
      <section style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ marginBottom: 48 }}
          >
            <p style={{ margin: '0 0 12px', fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Built for</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1.15, maxWidth: 560 }}>
              High-stakes environments where insider risk is existential.
            </h2>
          </motion.div>
          <motion.div
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}
          >
            {ENVIRONMENTS.map(({ title, desc, tags }) => (
              <motion.div key={title} variants={fadeInUp}
                whileHover={{ backgroundColor: '#1A1F26', transition: { duration: 0.15 } }}
                style={{ background: C.bg, padding: '28px 28px', cursor: 'default' }}
              >
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.primary, letterSpacing: '-0.01em' }}>{title}</p>
                <p style={{ margin: '0 0 14px', fontSize: 12, color: C.muted, lineHeight: 1.65 }}>{desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {tags.map(t => (
                    <span key={t} style={{ fontSize: 11, color: C.muted }}>· {t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Frameworks strip ── */}
      <section style={{ borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
            {FRAMEWORKS.map((name, i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span style={{ width: 1, height: 12, background: C.border, display: 'inline-block', margin: '0 16px' }} />}
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.04em' }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}
        >
          <p style={{ margin: '0 0 16px', fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>The next incident</p>
          <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 580 }}>
            The next insider fraud attempt is already in progress.
          </h2>
          <p style={{ margin: '0 0 36px', color: C.muted, fontSize: 14, maxWidth: 420, lineHeight: 1.65 }}>
            SentinelIQ surfaces it before the damage is done.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={BTN_TAP}>
              <Link href="/dashboard" style={{
                fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                padding: '11px 24px', borderRadius: 3,
                background: C.primary, color: C.bg, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                Get a Demo →
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={BTN_TAP}>
              <a href="#" style={{
                fontSize: 13, fontWeight: 600, padding: '11px 24px', borderRadius: 3,
                background: 'transparent', color: C.primary,
                border: `1px solid ${C.border}`, textDecoration: 'none', display: 'block',
              }}>
                Contact Enterprise Sales
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" aria-hidden="true" style={{ height: 20, width: 'auto', display: 'block' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>SentinelIQ</span>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>Team SIGMOID · iDEA 2.0 · Union Bank of India</span>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <a href="#" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>GitHub</a>
            <Link href="/dashboard" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>Demo</Link>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 2, padding: '2px 7px', letterSpacing: '0.06em' }}>ISO 27001</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
