'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import RiskBadge from '@/components/RiskBadge'
import AlertPanel from '@/components/AlertPanel'
import { api, type CaseItem, formatFraudType, timeAgo } from '@/lib/api'
import { C } from '@/lib/tokens'

const CASE_EXPLANATIONS: Record<string, string> = {
  'Coordinated Insider Threat': 'Multiple distinct fraud patterns detected from the same user within a 24-hour window. This sequence suggests deliberate, planned insider activity rather than accidental policy violation.',
  'Data Exfiltration Attempt': 'A pattern of bulk downloads combined with cross-department access detected. This behaviour matches known data theft sequences where insiders aggregate data before extraction.',
  'Privilege Abuse Sequence': 'Repeated privilege escalation attempts combined with off-hours access detected. Indicates a user actively probing system boundaries beyond their authorised scope.',
  'Treasury Manipulation': 'Velocity spikes combined with account modifications in treasury systems detected. This pattern is consistent with financial manipulation attempts targeting high-value accounts.',
  'Escalating Insider Risk': 'Risk score has been trending upward across multiple sessions. While no single event is conclusive, the cumulative pattern warrants heightened monitoring.',
}

function severityColor(severity: string) {
  if (severity === 'critical') return C.critical
  if (severity === 'high') return C.critical
  if (severity === 'medium') return C.medium
  return C.low
}

function CaseCard({
  item,
  active,
  onClick,
}: {
  item: CaseItem
  active: boolean
  onClick: () => void
}) {
  const color = severityColor(item.severity)
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: active ? C.hover : C.card,
        border: `1px solid ${active ? color : C.border}`,
        borderRadius: 4,
        padding: 18,
        cursor: 'pointer',
        color: C.textPrimary,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.textPrimary }}>{item.name}</p>
            {active && (
              <span style={{ fontSize: 8, fontWeight: 700, color: C.textMuted, letterSpacing: '0.07em', border: `1px solid ${C.border}`, borderRadius: 2, padding: '1px 5px' }}>
                VIEWING
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textMuted }}>
            {item.user_names.join(', ')} · {item.users_involved.length} user{item.users_involved.length === 1 ? '' : 's'}
          </p>
          {CASE_EXPLANATIONS[item.name] && (
            <p style={{ margin: '8px 0 0', fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              {CASE_EXPLANATIONS[item.name]}
            </p>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color, border: `1px solid ${color}`, borderRadius: 2, padding: '3px 7px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {item.severity}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Span</p>
          <p style={{ margin: 0, fontSize: 12, color: C.textPrimary }}>{timeAgo(item.start_time)} to {timeAgo(item.end_time)}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alerts</p>
          <p style={{ margin: 0, fontSize: 12, color: C.textPrimary }}>{item.linked_alerts_count} linked</p>
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</p>
          <p style={{ margin: 0, fontSize: 12, color: item.status === 'open' ? C.critical : C.low, textTransform: 'uppercase', fontWeight: 700 }}>{item.status}</p>
        </div>
      </div>
    </button>
  )
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.cases()
      .then((data) => {
        setCases(data)
        setSelectedCaseId(data[0]?.id ?? null)
      })
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [])

  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? null

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>Kill Chain Cases</h1>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textMuted }}>
              Related alerts from the same user grouped into attack sequences — see the full pattern, not isolated events.
            </p>
          </div>
          <span style={{ fontSize: 11, color: C.textMuted }}>{cases.length} active patterns</span>
        </div>

        <main className="cases-grid" style={{ flex: 1, overflow: 'hidden', padding: 24, display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) 420px', gap: 18 }}>
          <section style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading && [...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 132, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }} />
            ))}
            {!loading && cases.length === 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 28, color: C.textMuted, fontSize: 13 }}>
                No 24-hour alert clusters with 3 or more linked alerts yet.
              </div>
            )}
            {cases.map((item) => (
              <CaseCard
                key={item.id}
                item={item}
                active={item.id === selectedCaseId}
                onClick={() => setSelectedCaseId(item.id)}
              />
            ))}
          </section>

          <aside style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.textPrimary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Linked Alerts
              </p>
              {selectedCase && (
                <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textMuted }}>{selectedCase.name}</p>
              )}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {!selectedCase && (
                <p style={{ margin: 0, padding: 18, fontSize: 12, color: C.textMuted }}>Select a case to inspect linked alerts.</p>
              )}
              {selectedCase?.alerts.map((alert) => (
                <div
                  key={alert.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAlertId(alert.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAlertId(alert.id) } }}
                  aria-label={`Alert: ${alert.user_name}, ${formatFraudType(alert.fraud_type)}, score ${Math.round(alert.risk_score)}`}
                  style={{ padding: 14, borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.hover }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, fontWeight: 700 }}>{alert.user_name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.textMuted }}>{formatFraudType(alert.fraud_type)} · {timeAgo(alert.timestamp)}</p>
                    </div>
                    <RiskBadge level={alert.risk_level} score={alert.risk_score} size="sm" />
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
                    IF {(alert.model_scores.isolation_forest * 100).toFixed(0)}% · LSTM {(alert.model_scores.lstm * 100).toFixed(0)}% · XGB {(alert.model_scores.xgboost * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </main>
      </div>

      <AlertPanel alertId={selectedAlertId} onClose={() => setSelectedAlertId(null)} />
    </div>
  )
}
