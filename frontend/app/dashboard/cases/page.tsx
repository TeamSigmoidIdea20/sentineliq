'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import AlertPanel from '@/components/AlertPanel'
import { api, type Alert, type CaseItem, type TimelineItem, formatFraudType, timeAgo, normaliseIso } from '@/lib/api'
import { C } from '@/lib/tokens'

const CASE_EXPLANATIONS: Record<string, string> = {
  'Coordinated Insider Threat': 'Multiple fraud patterns detected across several users in a 24-hour window — suggesting coordinated insider activity.',
  'Multi-Pattern Insider Threat': 'Three or more distinct fraud patterns detected from a single user within a 24-hour window — indicating deliberate, multi-vector insider activity.',
  'Data Exfiltration Attempt': 'Bulk downloads combined with cross-department access — consistent with data aggregation before extraction.',
  'Privilege Abuse Sequence': 'Repeated privilege escalation combined with off-hours access — indicates active boundary probing.',
  'Treasury Manipulation': 'Velocity spikes combined with account modifications in treasury — consistent with financial manipulation.',
  'Escalating Insider Risk': 'Risk score trending upward across multiple sessions — cumulative pattern warrants heightened monitoring.',
}


function CaseCard({ item, active, onClick }: { item: CaseItem; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const color = item.severity === 'critical' || item.severity === 'high' ? C.critical
    : item.severity === 'medium' ? C.medium : C.low

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', background: active || hov ? C.hover : C.card,
        borderTop: `1px solid ${active ? color : C.border}`,
        borderRight: `1px solid ${active ? color : C.border}`,
        borderBottom: `1px solid ${active ? color : C.border}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 4, padding: 16, cursor: 'pointer',
        color: C.textPrimary, fontFamily: 'inherit', transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.textPrimary }}>{item.name}</p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textMuted }}>
            {item.user_names.join(', ')} · {item.users_involved.length} user{item.users_involved.length === 1 ? '' : 's'}
          </p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 3, padding: '2px 7px', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
          {item.severity}
        </span>
      </div>
      {CASE_EXPLANATIONS[item.name] && (
        <p style={{ margin: '0 0 10px', fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
          {CASE_EXPLANATIONS[item.name]}
        </p>
      )}
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.textMuted }}>
        <span>{item.linked_alerts_count} alerts</span>
        <span>{timeAgo(item.start_time)}</span>
        <span style={{ color: item.status === 'open' ? C.critical : C.low, fontWeight: 600, textTransform: 'uppercase', marginLeft: 'auto' }}>{item.status}</span>
      </div>
    </button>
  )
}

const KIND_TAG: Record<TimelineItem['kind'], { tag: string; color: string }> = {
  baseline:       { tag: 'BASE',   color: C.textMuted },
  suspicious:     { tag: 'WARN',   color: C.medium },
  trigger:        { tag: 'ALERT',  color: C.critical },
  analyst_action: { tag: 'ACTION', color: C.low },
  case_opened:    { tag: 'CASE',   color: C.amber },
}

function CaseTimeline({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!caseId) return
    setLoading(true)
    api.caseTimeline(caseId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [caseId])

  if (loading) return <p style={{ color: C.textMuted, fontSize: 12, padding: '12px 0' }}>Loading timeline…</p>
  if (!items.length) return <p style={{ color: C.textMuted, fontSize: 12, padding: '12px 0' }}>No timeline data.</p>

  return (
    <div style={{ position: 'relative', paddingLeft: 22 }}>
      <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 1, background: C.border }} />
      {items.map((item, i) => {
        const { tag, color } = KIND_TAG[item.kind] ?? { tag: 'EVENT', color: C.textMuted }
        const bold = item.kind === 'trigger'
        const ts = new Date(normaliseIso(item.timestamp)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < items.length - 1 ? 14 : 0, position: 'relative' }}>
            <div style={{
              position: 'absolute', left: -17, top: 4,
              width: 9, height: 9, borderRadius: '50%',
              background: color, border: `2px solid ${C.card}`,
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flex: 1, minWidth: 0 }}>
              <div style={{ flexShrink: 0, lineHeight: 1, paddingTop: 1 }}>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'monospace' }}>{ts}</div>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
                border: `1px solid ${color}`, color,
                flexShrink: 0, letterSpacing: '0.04em', lineHeight: 1.4,
              }}>{tag}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 11, color: bold ? color : C.textPrimary,
                  fontWeight: bold ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.title}</div>
                {item.explanation && (
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{item.explanation}</div>
                )}
                {item.risk_delta && (
                  <div style={{ fontSize: 10, color: C.medium, marginTop: 1 }}>{item.risk_delta}</div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'timeline' | 'alerts'>('timeline')
  const [acting, setActing] = useState(false)
  const [banner, setBanner] = useState<{ text: string; color: string } | null>(null)

  useEffect(() => {
    api.cases()
      .then(data => { setCases(data); setSelectedCaseId(data[0]?.id ?? null) })
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [])

  const selectedCase = cases.find(c => c.id === selectedCaseId) ?? null

  const removeCase = (id: string) => {
    setCases(prev => {
      const remaining = prev.filter(c => c.id !== id)
      setSelectedCaseId(remaining[0]?.id ?? null)
      return remaining
    })
  }

  const handleResolve = async () => {
    if (!selectedCaseId || acting) return
    setActing(true)
    await api.resolveCase(selectedCaseId).catch(() => null)
    setBanner({ text: 'Case closed. Investigation marked resolved — audit trail preserved.', color: C.low })
    setTimeout(() => { removeCase(selectedCaseId) }, 1400)
    setActing(false)
  }

  const handleDismiss = async () => {
    if (!selectedCaseId || acting) return
    setActing(true)
    await api.dismissCase(selectedCaseId).catch(() => null)
    setBanner({ text: 'Case dismissed. Marked as false cluster — no further action required.', color: C.textMuted })
    setTimeout(() => { removeCase(selectedCaseId) }, 1400)
    setActing(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>

        {/* Case list */}
        <div style={{ flex: 1, minWidth: 300, maxWidth: 480, flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}` }}>
          <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Kill Chain Cases</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{cases.length} active</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading && [...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 110, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }} />
            ))}
            {!loading && cases.length === 0 && (
              <div style={{ color: C.textMuted, fontSize: 12, padding: 16 }}>No open kill-chain cases.</div>
            )}
            {cases.map(item => (
              <CaseCard key={item.id} item={item} active={item.id === selectedCaseId} onClick={() => { setSelectedCaseId(item.id); setBanner(null) }} />
            ))}
          </div>
        </div>

        {/* Case detail */}
        <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedCase ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: 13 }}>
              Select a case to inspect
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: banner ? 10 : 0 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{selectedCase.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{selectedCase.user_names.join(', ')} · {selectedCase.linked_alerts_count} alerts</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* View toggle */}
                    {(['timeline', 'alerts'] as const).map(v => (
                      <button key={v} onClick={() => setView(v)}
                        style={{
                          padding: '5px 12px', fontSize: 11, fontWeight: view === v ? 700 : 400,
                          background: view === v ? C.hover : 'transparent',
                          border: `1px solid ${view === v ? C.border : 'transparent'}`,
                          color: view === v ? C.textPrimary : C.textMuted,
                          borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit',
                          textTransform: 'capitalize',
                        }}
                      >{v}</button>
                    ))}
                    <div style={{ width: 1, height: 20, background: C.border, margin: '0 2px' }} />
                    {/* Case actions */}
                    <button
                      onClick={handleResolve}
                      disabled={acting}
                      style={{
                        padding: '5px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                        background: C.low, border: 'none', color: '#fff',
                        borderRadius: 3, cursor: acting ? 'default' : 'pointer', fontFamily: 'inherit',
                        opacity: acting ? 0.6 : 1,
                      }}
                    >RESOLVE</button>
                    <button
                      onClick={handleDismiss}
                      disabled={acting}
                      style={{
                        padding: '5px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                        background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                        borderRadius: 3, cursor: acting ? 'default' : 'pointer', fontFamily: 'inherit',
                        opacity: acting ? 0.6 : 1,
                      }}
                    >DISMISS</button>
                  </div>
                </div>
                {banner && (
                  <div style={{
                    padding: '7px 10px', fontSize: 11, color: banner.color,
                    background: `${banner.color}18`, border: `1px solid ${banner.color}44`,
                    borderRadius: 3, lineHeight: 1.5,
                  }}>
                    {banner.text}
                  </div>
                )}
              </div>

              {/* Detail body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                {view === 'timeline' ? (
                  <div>
                    <p style={{ margin: '0 0 16px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      Investigation Timeline
                    </p>
                    <CaseTimeline caseId={selectedCase.id} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {selectedCase.alerts.map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => setSelectedAlertId(alert.id)}
                        style={{ padding: 14, borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{alert.user_name}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: alert.risk_level === 'critical' || alert.risk_level === 'high' ? C.critical : alert.risk_level === 'medium' ? C.medium : C.low }}>
                            {Math.round(alert.risk_score)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMuted }}>
                          <span>{formatFraudType(alert.fraud_type)}</span>
                          <span>{timeAgo(alert.ingested_at ?? alert.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <AlertPanel alertId={selectedAlertId} onClose={() => setSelectedAlertId(null)} />
    </div>
  )
}
