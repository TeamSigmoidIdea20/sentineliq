'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api, type Alert, type PeerComparison, type UserEvent, timeAgo } from '@/lib/api'
import { sevClass, sevLabel } from '@/lib/tokens'
import Accordion from '@/components/Accordion'

export default function AlertsPage() {
  return <Suspense fallback={<div className="muted" style={{ padding: 40 }}>Loading…</div>}><AlertsInner /></Suspense>
}

function AlertsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [openId, setOpenId] = useState<string | null>(searchParams.get('id'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await api.alerts({ page_size: 50 })
        if (!mounted) return
        setAlerts(data.alerts)
        if (!openId && data.alerts.length > 0) {
          setOpenId(data.alerts.find(a => a.status === 'open')?.id || data.alerts[0].id)
        }
      } catch { /* skip */ }
      finally { if (mounted) setLoading(false) }
    }
    load()
    const id = setInterval(load, 5000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) setOpenId(id)
  }, [searchParams])

  const openAlerts = alerts.filter(a => a.status === 'open' || a.status !== 'resolved')
  const alert = alerts.find(a => a.id === openId) || openAlerts[0] || alerts[0]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100%', minHeight: 0 }}>
      {/* Queue rail */}
      <aside style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
        <div style={{ padding: '18px 18px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.04em', marginBottom: 4 }}>QUEUE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.01em' }}>{openAlerts.length}</div>
            <div className="muted small">open alerts</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 16px' }}>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 72, background: 'var(--bg-1)', borderRadius: 8, marginBottom: 4, border: '1px solid var(--line)' }} />
            ))
          ) : openAlerts.map(a => {
            const isSel = a.id === alert?.id
            return (
              <div key={a.id} onClick={() => setOpenId(a.id)} style={{
                padding: '12px 14px', marginBottom: 4, borderRadius: 8,
                background: isSel ? 'var(--bg-2)' : 'transparent',
                border: `1px solid ${isSel ? 'var(--line-2)' : 'transparent'}`,
                cursor: 'pointer', position: 'relative',
              }}>
                {isSel && <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 2, background: 'var(--accent)', borderRadius: 2 }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`tag ${sevClass(a.risk_level)}`} style={{ fontSize: 10 }}>{sevLabel(a.risk_level)}</span>
                  <span className="muted mono small" style={{ marginLeft: 'auto' }}>{timeAgo(a.timestamp)}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{a.user_name}</div>
                <div className="muted small" style={{ marginTop: 2 }}>{a.fraud_type.replace(/_/g, ' ')}</div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* Detail panel */}
      {alert ? (
        <AlertDetail
          alert={alert}
          onResolve={async (id) => {
            await api.resolveAlert(id)
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a))
            const next = openAlerts.find(a => a.id !== id)
            setOpenId(next?.id || null)
          }}
          onDismiss={async (id) => {
            await api.dismissAlert(id)
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'dismissed' } : a))
            const next = openAlerts.find(a => a.id !== id)
            setOpenId(next?.id || null)
          }}
          onLabel={async (id, label) => {
            await api.labelAlert(id, label)
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, label } : a))
          }}
        />
      ) : (
        <div className="muted" style={{ padding: 40, textAlign: 'center' }}>No alerts to triage.</div>
      )}
    </div>
  )
}

function DecisionTimer({ timestamp }: { timestamp: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z').getTime()) / 1000))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [timestamp])
  const color = elapsed > 1800 ? 'var(--red)' : elapsed > 900 ? 'var(--amber)' : 'var(--green)'
  const m = Math.floor(elapsed / 60), s = elapsed % 60
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
      <span className="xs">Decision timer</span>
      <span className="mono" style={{ fontSize: 18, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
        {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </span>
      <span className="muted2 small">/ target</span>
    </div>
  )
}

function RiskGauge({ value }: { value: number }) {
  const size = 110, r = 42, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const offset = arc - (value / 100) * arc
  const color = value >= 80 ? 'var(--red)' : value >= 60 ? 'var(--red)' : value >= 40 ? 'var(--amber)' : 'var(--green)'
  const startAngle = 135
  const rotate = `rotate(${startAngle}, ${cx}, ${cy})`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-2)" strokeWidth="8" strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" transform={rotate} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${arc - offset} ${circ - (arc - offset)}`} strokeLinecap="round" transform={rotate}
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="18" fontWeight="600" fontFamily="var(--mono)">{value.toFixed(1)}</text>
      </svg>
    </div>
  )
}

function SHAPBars({ features }: { features: { feature: string; value: number; contribution: number; direction: string }[] }) {
  const maxAbs = Math.max(...features.map(f => Math.abs(f.contribution)), 0.01)
  return (
    <div className="shap">
      {features.map((f, i) => {
        const w = Math.abs(f.contribution) / maxAbs * 45
        return (
          <div key={i} className="shap-row">
            <div className="shap-name">{f.feature}</div>
            <div className="shap-bar-wrap">
              <div className={`shap-bar ${f.direction === 'positive' ? 'pos' : 'neg'}`} style={{ width: `${w}%` }} />
            </div>
            <div className="shap-val" style={{ color: f.direction === 'positive' ? 'var(--red)' : 'var(--green)', fontSize: 12 }}>
              {f.direction === 'positive' ? '+' : ''}{f.contribution.toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface DetailProps {
  alert: Alert
  onResolve: (id: string) => Promise<void>
  onDismiss: (id: string) => Promise<void>
  onLabel: (id: string, label: 'TP' | 'FP') => Promise<void>
}

function AlertDetail({ alert, onResolve, onDismiss, onLabel }: DetailProps) {
  const [peer, setPeer] = useState<PeerComparison | null>(null)
  const [events, setEvents] = useState<UserEvent[]>([])
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPeer(null)
    setEvents([])
    api.peerComparison(alert.id).then(setPeer).catch(() => {})
    api.userEvents(alert.user_id, alert.timestamp, 8).then(setEvents).catch(() => {})
  }, [alert.id])

  const peerZ = peer ? (peer.metrics[0]?.multiplier ?? 1).toFixed(1) : '—'

  const narrative = `${alert.user_name} (${alert.user_id}), a ${alert.user_id.includes('E') ? 'bank employee' : 'analyst'}, triggered a ` +
    `${alert.fraud_type.replace(/_/g, ' ')} alert with an ensemble risk score of ` +
    `${alert.risk_score.toFixed(1)}. ` +
    (alert.shap_values?.[0]
      ? `The top contributing feature is ${alert.shap_values[0].feature} with a value of ${alert.shap_values[0].value.toFixed(2)}, contributing ${alert.shap_values[0].direction === 'positive' ? '+' : ''}${alert.shap_values[0].contribution.toFixed(2)} to the risk score. `
      : '') +
    `All three models flagged this event. XGBoost score: ${(alert.model_scores.xgboost * 100).toFixed(0)}%, ` +
    `LSTM: ${(alert.model_scores.lstm * 100).toFixed(0)}%, Isolation Forest: ${(alert.model_scores.isolation_forest * 100).toFixed(0)}%.`

  const mitreMap: Record<string, { code: string; name: string }[]> = {
    bulk_download:            [{ code: 'T1530', name: 'Data from Cloud Storage' }, { code: 'T1567', name: 'Exfiltration over Web' }],
    privilege_escalation:     [{ code: 'T1098', name: 'Account Manipulation' }, { code: 'T1078.003', name: 'Local Accounts' }],
    off_hours_login:          [{ code: 'T1078', name: 'Valid Accounts' }, { code: 'T1199', name: 'Trusted Relationship' }],
    cross_department_access:  [{ code: 'T1213', name: 'Data from Info Repos' }, { code: 'T1078', name: 'Valid Accounts' }],
    velocity_spike:           [{ code: 'T1078', name: 'Valid Accounts' }, { code: 'T1110', name: 'Brute Force' }],
  }
  const mitre = mitreMap[alert.fraud_type] || [{ code: 'T1078', name: 'Valid Accounts' }]

  const saveNote = async () => {
    if (!noteText.trim()) return
    setSaving(true)
    try { await api.noteAlert(alert.id, noteText); setNoteText('') } catch { /* ignore */ }
    setSaving(false)
  }

  return (
    <div className="main-scroll">
      <div className="page-h">
        <div>
          <div className="crumbs">Alerts <span className="sep">/</span> <span className="mono" style={{ color: 'var(--ink)' }}>{alert.id}</span></div>
          <h1>{alert.fraud_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h1>
          <div className="sub">{alert.user_name} · {alert.user_id} · {timeAgo(alert.timestamp)}</div>
        </div>
        <div className="page-h right">
          <DecisionTimer timestamp={alert.timestamp} />
          <button className="btn ghost">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Watchlist
          </button>
          <button className="btn danger" onClick={() => onDismiss(alert.id)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 21 7 17 3" /><path d="M21 7H9a4 4 0 000 8h1" /><polyline points="7 21 3 17 7 13" /><path d="M3 17h12a4 4 0 000-8h-1" /></svg>
            Escalate
          </button>
          <button className="btn primary" onClick={() => onResolve(alert.id)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Resolve
          </button>
        </div>
      </div>

      <div style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>

        {/* Hero summary */}
        <div className="card" style={{ borderColor: 'rgba(242,92,92,.30)', background: 'linear-gradient(180deg, var(--bg-1), rgba(242,92,92,.04))' }}>
          <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 22, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600 }}>
              {alert.user_name.split(' ').map(p => p[0]).join('').slice(0, 2)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span className={`tag ${sevClass(alert.risk_level)}`}>{sevLabel(alert.risk_level)} severity</span>
                <span className="tag ghost mono">Score {(alert.risk_score / 100).toFixed(2)}</span>
                <span className="muted small">· {events.length} correlated events · 12-minute window</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.01em', lineHeight: 1.25 }}>
                {alert.fraud_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} —{' '}
                {alert.user_name}, {alert.user_id} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>in {alert.user_id.slice(0, 2)}</span>
              </div>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>
                Ensemble flagged this as <span style={{ color: 'var(--red)', fontWeight: 500 }}>{Math.round(alert.risk_score)}% confidence</span>.
                {alert.shap_values?.[0] && <>
                  {' '}Top driver <span className="mono" style={{ color: 'var(--ink)' }}>{alert.shap_values[0].feature}</span> contributes
                  <span style={{ color: alert.shap_values[0].direction === 'positive' ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>
                    {' '}{alert.shap_values[0].direction === 'positive' ? '+' : ''}{alert.shap_values[0].contribution.toFixed(2)}
                  </span>;
                </>}
                {' '}behaviour is <span style={{ color: 'var(--red)', fontWeight: 500 }}>{peerZ}σ above peers</span> in the same role.
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {mitre.map((m, i) => (
                  <span key={i} className="mitre"><span className="code">{m.code}</span> {m.name}</span>
                ))}
              </div>
            </div>
            <RiskGauge value={alert.risk_score} />
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag red">● Recommended</span>
              <div className="muted small"><span style={{ color: 'var(--ink)' }}>Escalate to SOC L3</span> — Auto-suspend session · Notify CISO · Open case</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn ghost" onClick={() => api.exportAlert(alert.id)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                Add to case
              </button>
              <button className="btn danger" onClick={() => onDismiss(alert.id)}>Escalate now</button>
            </div>
          </div>
        </div>

        {/* Why this fired */}
        <Accordion label="Why this fired" hint="AI-summarised explanation + feature attribution" defaultOpen
          right={<span className="tag ghost"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> Updated {timeAgo(alert.timestamp)}</span>}>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink)' }}>{narrative}</div>
          {alert.shap_values?.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              <div className="section-h">Feature attribution <span className="muted small" style={{ fontWeight: 400 }}>SHAP · XGBoost · TreeExplainer</span></div>
              <SHAPBars features={alert.shap_values} />
              <div className="muted small" style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 6, lineHeight: 1.55 }}>
                Top driver <span className="mono" style={{ color: 'var(--red)' }}>{alert.shap_values[0].feature}</span> recorded a value of
                <span className="mono" style={{ color: 'var(--ink)' }}> {alert.shap_values[0].value.toFixed(2)}</span> — contributing
                <span style={{ color: 'var(--red)' }}> {alert.shap_values[0].direction === 'positive' ? '+' : ''}{alert.shap_values[0].contribution.toFixed(2)}</span> to the final risk score.
              </div>
            </div>
          )}
        </Accordion>

        {/* Model confidence */}
        <Accordion label="Model confidence" hint="3-model ensemble vote · weighted 0.3 / 0.4 / 0.3">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
            {[
              { label: 'Isolation Forest', val: alert.model_scores.isolation_forest, w: '0.3' },
              { label: 'LSTM Autoencoder', val: alert.model_scores.lstm, w: '0.4' },
              { label: 'XGBoost', val: alert.model_scores.xgboost, w: '0.3' },
              { label: 'Ensemble', val: alert.risk_score / 100, w: '—', hi: true },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--bg-2)', border: `1px solid ${m.hi ? 'rgba(125,177,240,.3)' : 'var(--line)'}`, borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--mono)', color: m.hi ? 'var(--accent)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{m.val.toFixed(2)}</div>
                <div className="muted small" style={{ marginTop: 4 }}>weight {m.w}</div>
                <div style={{ marginTop: 10, height: 6, background: 'var(--bg-3)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${m.val * 100}%`, background: m.hi ? 'var(--accent)' : 'var(--ink-3)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="muted small" style={{ marginTop: 14, lineHeight: 1.55 }}>
            All three models flagged this event independently. XGBoost: {(alert.model_scores.xgboost * 100).toFixed(0)}% ·
            LSTM: {(alert.model_scores.lstm * 100).toFixed(0)}% · Isolation Forest: {(alert.model_scores.isolation_forest * 100).toFixed(0)}%.
            Weighted ensemble = <span style={{ color: 'var(--ink)' }}>{(alert.risk_score / 100).toFixed(2)}</span>.
          </div>
        </Accordion>

        {/* Subject profile */}
        <Accordion label={`Subject — ${alert.user_name}`} hint={`${alert.user_id}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div className="section-h">Identity</div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 8, fontSize: 13 }}>
                <div className="muted">Employee ID</div><div className="mono">{alert.user_id}</div>
                <div className="muted">Alert ID</div><div className="mono">{alert.id}</div>
                <div className="muted">Status</div><div><span className={`tag ${alert.status === 'open' ? 'red' : 'green'}`}>{alert.status}</span></div>
                <div className="muted">Label</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className={`btn sm ${alert.label === 'TP' ? '' : 'ghost'}`} onClick={() => onLabel(alert.id, 'TP')}>TP</button>
                  <button className={`btn sm ${alert.label === 'FP' ? '' : 'ghost'}`} onClick={() => onLabel(alert.id, 'FP')}>FP</button>
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag green">MFA · enrolled</span>
                <span className="tag green">VPN · on-prem</span>
              </div>
            </div>
            <div>
              <div className="section-h">Model scores · 30-day risk</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { lbl: 'IF Score', val: alert.model_scores.isolation_forest },
                  { lbl: 'LSTM Score', val: alert.model_scores.lstm },
                  { lbl: 'XGB Score', val: alert.model_scores.xgboost },
                ].map(s => (
                  <div key={s.lbl} style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '10px 12px', border: '1px solid var(--line)' }}>
                    <div className="muted" style={{ fontSize: 11 }}>{s.lbl}</div>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{s.val.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Accordion>

        {/* Correlated events */}
        {events.length > 0 && (
          <Accordion label="Correlated events" hint={`${events.length} events in the last 38 minutes`}>
            <div className="tl">
              {events.map(e => {
                const isAnom = e.risk_score > 60
                return (
                  <div key={e.id} className={`tl-evt ${isAnom ? 'red' : 'blue'}`}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span className="mono small muted" style={{ width: 70 }}>{new Date(e.timestamp.endsWith('Z') ? e.timestamp : e.timestamp + 'Z').toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className={`tag ${isAnom ? 'red' : 'ghost'}`} style={{ fontSize: 10.5 }}>{e.event_type.replace(/_/g, ' ')}</span>
                      <span style={{ color: isAnom ? 'var(--red)' : 'var(--ink-2)', fontFamily: 'var(--mono)', fontSize: 12 }}>{e.description}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Accordion>
        )}

        {/* Peer comparison */}
        {peer && (
          <Accordion label="Peer comparison" hint={`Same-role cohort · 30-day window`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {peer.metrics.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px 80px', gap: 14, alignItems: 'center', fontSize: 13 }}>
                  <div style={{ color: 'var(--ink-2)' }}>{m.metric}</div>
                  <div style={{ position: 'relative', height: 10, background: 'var(--bg-2)', borderRadius: 5 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min((m.user_value / (m.peer_average * 3)) * 100, 100)}%`, background: m.multiplier > 2 ? 'var(--red)' : 'var(--accent)', borderRadius: 5 }} />
                  </div>
                  <div className="mono" style={{ textAlign: 'right', color: m.multiplier > 2 ? 'var(--red)' : 'var(--ink)' }}>×{m.multiplier.toFixed(1)}</div>
                  <div className="mono muted small" style={{ textAlign: 'right' }}>avg {m.peer_average.toFixed(1)}</div>
                </div>
              ))}
            </div>
            <div className="muted small" style={{ marginTop: 14, lineHeight: 1.6 }}>
              Subject scores <span style={{ color: 'var(--red)', fontWeight: 500 }}>{peerZ}σ above the role mean</span> — in the top percentile of this cohort.
            </div>
          </Accordion>
        )}

        {/* Analyst notes */}
        <Accordion label="Analyst notes" hint={alert.notes ? '1 note' : 'No notes'}>
          {alert.notes && (
            <div style={{ padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 8, marginBottom: 12, fontSize: 13, lineHeight: 1.55 }}>
              <div className="muted small" style={{ marginBottom: 4 }}>Analyst note · {timeAgo(alert.timestamp)}</div>
              {alert.notes}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add analyst note…"
              style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--ink)', fontSize: 13, outline: 'none' }}
              onKeyDown={e => { if (e.key === 'Enter') saveNote() }}
            />
            <button className="btn" onClick={saveNote} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Accordion>

      </div>
    </div>
  )
}
