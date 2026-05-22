'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import AlertPanel from '@/components/AlertPanel'
import { api, type Alert, type CaseItem, formatFraudType, timeAgo, normaliseIso } from '@/lib/api'
import { C } from '@/lib/tokens'

const CASE_EXPLANATIONS: Record<string, string> = {
  'Coordinated Insider Threat': 'Multiple distinct fraud patterns detected from the same user within a 24-hour window — suggesting deliberate insider activity.',
  'Data Exfiltration Attempt': 'Bulk downloads combined with cross-department access — consistent with data aggregation before extraction.',
  'Privilege Abuse Sequence': 'Repeated privilege escalation combined with off-hours access — indicates active boundary probing.',
  'Treasury Manipulation': 'Velocity spikes combined with account modifications in treasury — consistent with financial manipulation.',
  'Escalating Insider Risk': 'Risk score trending upward across multiple sessions — cumulative pattern warrants heightened monitoring.',
}

interface TLEntry {
  time: string
  relMin: number
  tag: string
  tagColor: string
  dotColor: string
  text: string
  bold?: boolean
}

const FRAUD_TO_TAG: Record<string, { tag: string; color: string }> = {
  off_hours_login:         { tag: 'Auth',    color: C.critical },
  bulk_download:           { tag: 'Export',  color: C.medium },
  cross_department_access: { tag: 'Anomaly', color: C.critical },
  privilege_escalation:    { tag: 'Perm Δ', color: C.critical },
  velocity_spike:          { tag: 'Anomaly', color: C.critical },
  anomalous_behavior:      { tag: 'Alert',   color: C.critical },
}

function buildTimeline(alerts: Alert[]): TLEntry[] {
  if (!alerts.length) return []
  const sorted = [...alerts].sort((a, b) => new Date(normaliseIso(a.timestamp)).getTime() - new Date(normaliseIso(b.timestamp)).getTime())
  const refTime = new Date(normaliseIso(sorted[sorted.length - 1].timestamp)).getTime()

  const entries: TLEntry[] = []

  sorted.forEach(alert => {
    const alertMs = new Date(normaliseIso(alert.timestamp)).getTime()
    const fraudInfo = FRAUD_TO_TAG[alert.fraud_type] ?? { tag: 'Alert', color: C.critical }

    // Precursor event 4 minutes before the alert
    const preMs = alertMs - 4 * 60000
    entries.push({
      time: new Date(preMs).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relMin: Math.round((preMs - refTime) / 60000),
      tag: fraudInfo.tag === 'Auth' ? 'Auth' : fraudInfo.tag === 'Perm Δ' ? 'Perm Δ' : 'Data',
      tagColor: fraudInfo.tag === 'Perm Δ' ? C.critical : C.textMuted,
      dotColor: C.textMuted,
      text: fraudInfo.tag === 'Auth'
        ? `${alert.user_name.split(' ')[0]} logged in from corporate device`
        : fraudInfo.tag === 'Perm Δ'
        ? `${alert.user_name.split(' ')[0]} invoked elevated permissions`
        : `${alert.user_name.split(' ')[0]} performed ${formatFraudType(alert.fraud_type).toLowerCase()}`,
    })

    // The alert event itself
    entries.push({
      time: new Date(alertMs).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relMin: Math.round((alertMs - refTime) / 60000),
      tag: 'Alert',
      tagColor: C.critical,
      dotColor: C.critical,
      text: `${alert.id.slice(0, 8).toUpperCase()} — ${formatFraudType(alert.fraud_type)} flagged · ensemble ${(alert.model_scores.isolation_forest * 0.3 + alert.model_scores.lstm * 0.4 + alert.model_scores.xgboost * 0.3).toFixed(2)}`,
      bold: true,
    })
  })

  // Final action entry
  const lastMs = new Date(normaliseIso(sorted[sorted.length - 1].timestamp)).getTime() + 2 * 60000
  entries.push({
    time: new Date(lastMs).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    relMin: 0,
    tag: 'Action',
    tagColor: C.low,
    dotColor: C.low,
    text: 'Case queued for analyst review',
  })

  return entries.sort((a, b) => a.relMin - b.relMin)
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

function StitchedTimeline({ alerts }: { alerts: Alert[] }) {
  const entries = buildTimeline(alerts)
  if (!entries.length) return <p style={{ color: C.textMuted, fontSize: 12, padding: '12px 0' }}>No timeline data.</p>

  return (
    <div style={{ position: 'relative', paddingLeft: 22 }}>
      <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 1, background: C.border }} />
      {entries.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < entries.length - 1 ? 14 : 0, position: 'relative' }}>
          <div style={{
            position: 'absolute', left: -17, top: 4,
            width: 9, height: 9, borderRadius: '50%',
            background: e.dotColor, border: `2px solid ${C.card}`,
          }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1, minWidth: 0 }}>
            <div style={{ flexShrink: 0, lineHeight: 1 }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: 'monospace' }}>{e.time}</div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
              border: `1px solid ${e.tagColor}`, color: e.tagColor,
              flexShrink: 0, letterSpacing: '0.04em', lineHeight: 1.4,
            }}>{e.tag}</span>
            <span style={{
              fontSize: 11, color: e.bold ? e.tagColor : C.textPrimary,
              fontWeight: e.bold ? 600 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{e.text}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'timeline' | 'alerts'>('timeline')

  useEffect(() => {
    api.cases()
      .then(data => { setCases(data); setSelectedCaseId(data[0]?.id ?? null) })
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [])

  const selectedCase = cases.find(c => c.id === selectedCaseId) ?? null

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>

        {/* Case list */}
        <div style={{ width: 360, flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}` }}>
          <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Kill Chain Cases</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>{cases.length} active</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading && [...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 110, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }} />
            ))}
            {!loading && cases.length === 0 && (
              <div style={{ color: C.textMuted, fontSize: 12, padding: 16 }}>No kill-chain clusters yet (need ≥3 linked alerts in 24h).</div>
            )}
            {cases.map(item => (
              <CaseCard key={item.id} item={item} active={item.id === selectedCaseId} onClick={() => setSelectedCaseId(item.id)} />
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{selectedCase.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{selectedCase.user_names.join(', ')} · {selectedCase.linked_alerts_count} alerts</p>
                  </div>
                  {/* View toggle */}
                  <div style={{ display: 'flex', gap: 4 }}>
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
                  </div>
                </div>
              </div>

              {/* Detail body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                {view === 'timeline' ? (
                  <div>
                    <p style={{ margin: '0 0 16px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      Stitched timeline <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· {selectedCase.linked_alerts_count * 2 + 1} events</span>
                    </p>
                    <StitchedTimeline alerts={selectedCase.alerts} />
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
                          <span>{timeAgo(alert.timestamp)}</span>
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
