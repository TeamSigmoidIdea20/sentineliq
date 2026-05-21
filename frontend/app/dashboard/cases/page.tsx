'use client'

import { useEffect, useState } from 'react'
import { api, type CaseItem, type Alert, timeAgo } from '@/lib/api'
import { sevClass, sevLabel } from '@/lib/tokens'
import Accordion from '@/components/Accordion'
import { useRouter } from 'next/navigation'

type TabType = 'Active' | 'Monitor' | 'Closed'

export default function CasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabType>('Active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await api.cases()
        if (!mounted) return
        setCases(data)
        if (data.length > 0 && !selId) setSelId(data[0].id)
      } catch { /* skip */ }
      finally { if (mounted) setLoading(false) }
    }
    load()
    const id = setInterval(load, 10000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const filterCases = (c: CaseItem) => {
    const sev = c.severity
    if (tab === 'Active') return sev === 'critical' || sev === 'high'
    if (tab === 'Monitor') return sev === 'medium'
    return sev === 'low'
  }

  const visible = cases.filter(filterCases)
  const sel = cases.find(c => c.id === selId) || cases[0]

  const buildTimeline = (c: CaseItem) => {
    if (!c.alerts.length) return []
    const types = [
      { kind: 'Auth',    cls: 'blue',  off: -38 },
      { kind: 'Data',    cls: 'blue',  off: -32 },
      { kind: 'Data',    cls: 'blue',  off: -22 },
      { kind: 'Anomaly', cls: 'amber', off: -16 },
      { kind: 'Perm Δ',  cls: 'red',   off: -11 },
      { kind: 'Perm Δ',  cls: 'red',   off: -9 },
      { kind: 'Alert',   cls: 'red',   off: -4 },
      { kind: 'Export',  cls: 'red',   off: -2 },
      { kind: 'Action',  cls: 'green', off: 0 },
    ]
    const base = new Date(c.start_time.endsWith('Z') ? c.start_time : c.start_time + 'Z').getTime()
    return types.map((t, i) => ({
      ...t,
      id: `tl-${i}`,
      t: base + t.off * 60000,
      lbl: tlLabel(t.kind, c),
    }))
  }

  const tlLabel = (kind: string, c: CaseItem) => {
    const u = c.user_names[0] || 'Subject'
    const labels: Record<string, string> = {
      'Auth':    `Login from workstation · MFA push success`,
      'Data':    `DB query · ${Math.floor(Math.random() * 100 + 50)} rows`,
      'Anomaly': `Cross-dept query (baseline 0.3/d, observed 7)`,
      'Perm Δ':  `Self-grant · read:treasury (out of policy)`,
      'Alert':   `${c.alerts[0]?.id || 'ALT-0000'} — ${c.severity} alert · ensemble ${(c.alerts[0]?.risk_score / 100 || 0.94).toFixed(2)}`,
      'Export':  `Download · /exports/treasury-q3.csv · ${(Math.random() * 3 + 1).toFixed(1)} MB`,
      'Action':  `Session auto-suspended pending review`,
    }
    return labels[kind] || kind
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '100%', minHeight: 0 }}>
      {/* Case list */}
      <aside style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
        <div style={{ padding: '18px 18px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.04em', marginBottom: 4 }}>CASES</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.01em' }}>{cases.filter(c => c.severity === 'critical' || c.severity === 'high').length}</div>
            <div className="muted small">active investigations</div>
          </div>
        </div>
        <div style={{ padding: '0 14px 8px' }}>
          <div className="tabs">
            {(['Active', 'Monitor', 'Closed'] as TabType[]).map(t => (
              <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 16px' }}>
          {loading
            ? [...Array(4)].map((_, i) => <div key={i} style={{ height: 76, background: 'var(--bg-1)', borderRadius: 8, marginBottom: 4, border: '1px solid var(--line)' }} />)
            : visible.map(c => {
              const isSel = c.id === sel?.id
              return (
                <div key={c.id} onClick={() => setSelId(c.id)} style={{
                  padding: '12px 14px', marginBottom: 4, borderRadius: 8,
                  background: isSel ? 'var(--bg-2)' : 'transparent',
                  border: `1px solid ${isSel ? 'var(--line-2)' : 'transparent'}`,
                  cursor: 'pointer', position: 'relative',
                }}>
                  {isSel && <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 2, background: 'var(--accent)', borderRadius: 2 }} />}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                    <span className="mono small muted">{c.id}</span>
                    <span className={`tag ${sevClass(c.severity)}`} style={{ fontSize: 10 }}>{sevLabel(c.severity)}</span>
                    <span className="muted mono small" style={{ marginLeft: 'auto' }}>{timeAgo(c.start_time)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{c.name}</div>
                  <div className="muted small" style={{ marginTop: 4 }}>{c.linked_alerts_count} alerts · {c.user_names.slice(0, 2).join(', ')}</div>
                </div>
              )
            })
          }
          {!loading && visible.length === 0 && (
            <div className="muted" style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>No {tab.toLowerCase()} cases.</div>
          )}
        </div>
      </aside>

      {/* Case detail */}
      {sel ? (
        <div className="main-scroll">
          <div className="page-h">
            <div>
              <div className="crumbs">Cases <span className="sep">/</span> <span className="mono" style={{ color: 'var(--ink)' }}>{sel.id}</span></div>
              <h1>{sel.name}</h1>
              <div className="sub">
                Opened {timeAgo(sel.start_time)} · Subject <span style={{ color: 'var(--ink)' }}>{sel.user_names[0] || '—'}</span> · {sel.linked_alerts_count} correlated alerts
              </div>
            </div>
            <div className="page-h right">
              <button className="btn ghost">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Subscribe
              </button>
              <button className="btn warn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 21 7 17 3" /><path d="M21 7H9a4 4 0 000 8h1" /></svg>
                Escalate
              </button>
              <button className="btn primary">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Close case
              </button>
            </div>
          </div>

          <div style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>

            <div className="grid-4">
              <div className="metric">
                <div className="lbl">Correlated alerts</div>
                <div className="val">{sel.linked_alerts_count}</div>
                <div className="delta">across 38-minute window</div>
              </div>
              <div className={`metric ${sel.alerts[0]?.risk_score > 80 ? 'alert' : ''}`}>
                <div className="lbl">Highest score</div>
                <div className="val">{sel.alerts[0] ? (sel.alerts[0].risk_score / 100).toFixed(2) : '—'}</div>
                <div className="delta">{sel.alerts[0]?.id || '—'} · Ensemble</div>
              </div>
              <div className="metric">
                <div className="lbl">Departments touched</div>
                <div className="val">{Math.min(sel.users_involved.length + 2, 4)}</div>
                <div className="delta">Treasury · Risk · Audit · Operations</div>
              </div>
              <div className="metric">
                <div className="lbl">Peer deviation</div>
                <div className="val" style={{ color: 'var(--red)' }}>4.1σ</div>
                <div className="delta">Role cohort N=12</div>
              </div>
            </div>

            {/* Timeline */}
            <Accordion label="Stitched timeline" hint={`${buildTimeline(sel).length} events · 40-minute window`} defaultOpen
              right={
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="tag red">3 Perm Δ</span>
                  <span className="tag red">1 Export</span>
                </div>
              }>
              <div className="tl">
                {buildTimeline(sel).map(e => (
                  <div key={e.id} className={`tl-evt ${e.cls}`}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span className="mono small muted" style={{ width: 110, flexShrink: 0 }}>
                        T{e.off >= 0 ? '+' : ''}{e.off}m · {new Date(e.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`tag ${e.cls === 'red' ? 'red' : e.cls === 'amber' ? 'amber' : e.cls === 'green' ? 'green' : 'ghost'}`} style={{ fontSize: 10.5 }}>{e.kind}</span>
                      <span style={{ color: e.cls === 'red' ? 'var(--red)' : e.cls === 'green' ? 'var(--green)' : 'var(--ink)', fontSize: 13 }}>{e.lbl}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Accordion>

            {/* Linked alerts */}
            <Accordion label="Linked alerts" hint={`${sel.alerts.length} alerts associated with this case`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sel.alerts.map(a => (
                  <div key={a.id}
                    onClick={() => router.push(`/dashboard/alerts?id=${a.id}`)}
                    style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 8, background: 'var(--bg-2)', cursor: 'pointer' }}>
                    <span className={`tag ${sevClass(a.risk_level)}`}>{sevLabel(a.risk_level)}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.user_name} · {a.fraud_type.replace(/_/g, ' ')}</div>
                      <div className="muted small mono" style={{ marginTop: 2 }}>{a.id} · {timeAgo(a.timestamp)} · Score {(a.risk_score / 100).toFixed(2)}</div>
                    </div>
                    <button className="btn sm ghost">Open <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></button>
                  </div>
                ))}
                {sel.alerts.length === 0 && <div className="muted" style={{ textAlign: 'center', padding: 16 }}>No linked alerts yet.</div>}
              </div>
            </Accordion>

            {/* Analyst notes */}
            <Accordion label="Analyst notes" hint="Case notes"
              right={<button className="btn sm" onClick={e => e.stopPropagation()}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add note
              </button>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { who: 'S. Pratap · L2', t: '4m ago', txt: 'Three permission grants in <2 min, all targeting own account. None passed change-mgmt queue. Auto-suspending session.' },
                  { who: 'Auto · SOC',     t: '2m ago', txt: 'Session terminated. Endpoint snapshot captured. Export file quarantined.' },
                ].map((n, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 8 }}>
                    <div className="muted small" style={{ marginBottom: 4 }}><span style={{ color: 'var(--ink-2)' }}>{n.who}</span> · {n.t}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.55 }}>{n.txt}</div>
                  </div>
                ))}
              </div>
            </Accordion>

          </div>
        </div>
      ) : (
        <div className="muted" style={{ padding: 40, textAlign: 'center' }}>No case selected.</div>
      )}
    </div>
  )
}
