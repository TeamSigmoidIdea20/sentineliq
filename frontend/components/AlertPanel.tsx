'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { api, type Alert, type AuditEntry, type PeerComparison, type TimelineItem, formatFraudType, timeAgo, normaliseIso } from '@/lib/api'
import { C, riskColor } from '@/lib/tokens'
import RiskBadge from './RiskBadge'
import SHAPChart from './SHAPChart'

const FEATURE_DESC: Record<string, string> = {
  login_hour_deviation: 'login hour deviation from baseline',
  access_entropy: 'cross-department access pattern',
  transaction_velocity_ratio: 'transaction velocity',
  download_volume_zscore: 'download volume anomaly',
  device_change_frequency: 'device switching frequency',
  privilege_use_ratio: 'privilege escalation attempts',
  off_hours_ratio: 'off-hours activity ratio',
  location_mismatch: 'location anomaly',
}

const FRAUD_BEHAVIOR: Record<string, string> = {
  off_hours_login: 'logged into core banking systems outside their normal working hours',
  bulk_download: 'performed a high-volume data download atypical for their role',
  cross_department_access: 'accessed systems and records across departments outside their normal scope',
  privilege_escalation: 'attempted to use elevated privileges or access restricted system functions',
  velocity_spike: 'executed an abnormal surge of transactions in a compressed time window',
  account_modification: 'modified account records in systems outside their department scope',
  anomalous_behavior: 'exhibited multiple behavioural deviations from their established baseline',
}

function formatTs(iso: string): string {
  const diff = Date.now() - new Date(normaliseIso(iso)).getTime()
  if (diff < 0) return 'Just now'
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}m ago` : `${h}h ago`
}

function generatePlainExplanation(alert: Alert, peerData?: PeerComparison | null): string {
  const firstName = alert.user_name.split(' ')[0]
  const behavior = FRAUD_BEHAVIOR[alert.fraud_type] ?? 'exhibited unusual behavioural patterns'

  let text = `${firstName} ${behavior}.`

  if (peerData && peerData.metrics.length > 0) {
    const top = [...peerData.metrics].sort((a, b) => b.multiplier - a.multiplier)[0]
    if (top.multiplier > 1.5) {
      text += ` Their ${top.metric.toLowerCase()} is ${top.multiplier.toFixed(1)}x the ${peerData.role.replace(/_/g, ' ')} peer average, a significant deviation from colleagues in the same role.`
    }
  }

  const topShap = [...alert.shap_values]
    .filter((v) => v.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2)

  if (topShap.length >= 1) {
    const f1 = FEATURE_DESC[topShap[0].feature] ?? topShap[0].feature.replace(/_/g, ' ')
    text += ` The clearest sign was ${f1}`
    if (topShap.length >= 2) {
      const f2 = FEATURE_DESC[topShap[1].feature] ?? topShap[1].feature.replace(/_/g, ' ')
      text += `, combined with ${f2}`
    }
    text += ' — both outside normal operating parameters for this user.'
  }

  return text
}

function recommendedAction(risk: number): { text: string; color: string } {
  if (risk >= 80) {
    return {
      text: 'Suspend system access immediately. Notify HR and Security Operations. Preserve audit trail for legal review.',
      color: C.critical,
    }
  }
  if (risk >= 50) {
    return {
      text: 'Force MFA re-authentication. Flag for supervisor review within 4 hours.',
      color: C.medium,
    }
  }
  return { text: 'Monitor for 24 hours. No immediate action required.', color: C.low }
}

interface Props {
  alertId: string | null
  onClose: () => void
  onResolved?: (id: string, newStatus: 'resolved' | 'dismissed') => void
}

export default function AlertPanel({ alertId, onClose, onResolved }: Props) {
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [note, setNote] = useState('')
  const [noteSavedAt, setNoteSavedAt] = useState<Date | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [peerData, setPeerData] = useState<PeerComparison | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!alertId) { setAlert(null); return }
    setLoading(true)
    setTimeline([])
    setPeerData(null)
    api.alert(alertId)
      .then(setAlert)
      .catch(() => setAlert(null))
      .finally(() => setLoading(false))
  }, [alertId])

  useEffect(() => {
    setNote(alert?.notes || '')
    setNoteSavedAt(null)
    setAuditLog([])
    if (!alert) return
    api.alertTimeline(alert.id)
      .then(setTimeline)
      .catch(() => setTimeline([]))
    api.auditLog({ alert_id: alert.id, limit: 10 })
      .then(setAuditLog)
      .catch(() => setAuditLog([]))
    api.peerComparison(alert.id)
      .then(setPeerData)
      .catch(() => setPeerData(null))
  }, [alert?.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const handleResolve = async () => {
    if (!alert) return
    setActing(true)
    try {
      await api.resolveAlert(alert.id)
      setAlert({ ...alert, status: 'resolved' })
      onResolved?.(alert.id, 'resolved')
    } catch {
      showToast('Failed to resolve — please try again')
    } finally { setActing(false) }
  }

  const handleDismiss = async () => {
    if (!alert) return
    setActing(true)
    try {
      await api.dismissAlert(alert.id)
      setAlert({ ...alert, status: 'dismissed' })
      onResolved?.(alert.id, 'dismissed')
    } catch {
      showToast('Failed to dismiss — please try again')
    } finally { setActing(false) }
  }

  const handleLabel = async (label: 'TP' | 'FP') => {
    if (!alert) return
    setActing(true)
    await api.labelAlert(alert.id, label).catch(() => null)
    setAlert({ ...alert, label })
    setActing(false)
    showToast('Feedback recorded — queued for next retraining cycle')
  }

  const saveNote = async () => {
    if (!alert || note === (alert.notes || '')) return
    await api.noteAlert(alert.id, note).catch(() => null)
    setAlert({ ...alert, notes: note })
    setNoteSavedAt(new Date())
  }

  const handleExport = async () => {
    if (!alert) return
    try {
      const data = await api.exportAlert(alert.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sentineliq-evidence-${alert.id.slice(0, 8)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Export failed — please try again')
    }
  }

  if (!alertId) return null

  const scoreColor = alert ? riskColor(alert.risk_score) : C.border
  const action = alert ? recommendedAction(alert.risk_score) : null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100 }}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: C.hover, border: `1px solid ${C.border}`, borderRadius: 4,
          padding: '10px 20px', fontSize: 12, color: C.low, fontWeight: 600,
          zIndex: 200, whiteSpace: 'nowrap', letterSpacing: '0.02em',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {toast}
        </div>
      )}

      {/* Modal */}
      <div
        className="alert-panel-overlay"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          width: 920, maxWidth: 'calc(100vw - 32px)', maxHeight: '88vh',
          background: C.card, border: `1px solid ${C.border}`,
          borderTop: `2px solid ${scoreColor}`,
          zIndex: 101, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          {alert ? (
            <>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: scoreColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {alert.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{alert.user_name}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{alert.user_id} · {timeAgo(alert.ingested_at ?? alert.timestamp)}</p>
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 3, padding: '3px 10px', fontSize: 11, color: C.textMuted, flexShrink: 0 }}>
                {formatFraudType(alert.fraud_type)}
              </div>
              <div style={{ flexShrink: 0 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor, letterSpacing: '-0.02em' }}>{Math.round(alert.risk_score)}</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>/100</span>
              </div>
              <RiskBadge level={alert.risk_level} score={alert.risk_score} />
            </>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: 120, background: C.border, borderRadius: 2, marginBottom: 8 }} />
              <div style={{ height: 10, width: 80, background: C.hover, borderRadius: 2 }} />
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: `1px solid ${C.border}`, color: C.textMuted,
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '4px 9px',
              borderRadius: 3, marginLeft: 4, flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[100, 180, 80, 140, 60, 160, 90].map((w, i) => (
              <div key={i} style={{ height: 13, width: w, background: C.border, borderRadius: 2 }} />
            ))}
          </div>
        )}

        {/* Two-column body */}
        {!loading && alert && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

            {/* ── Left column (55%) ── */}
            <div style={{
              width: '55%', overflowY: 'auto', padding: 20,
              borderRight: `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>

              {/* ML model score cards */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Model Scores
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {([
                    { label: 'Isolation Forest', key: 'isolation_forest', weight: '30%', desc: 'point anomaly' },
                    { label: 'LSTM', key: 'lstm', weight: '40%', desc: 'behavioural drift' },
                    { label: 'XGBoost', key: 'xgboost', weight: '30%', desc: 'fraud pattern' },
                  ] as const).map(({ label, key, weight, desc }) => {
                    const pct = Math.round(alert.model_scores[key] * 100)
                    const color = pct >= 65 ? C.critical : pct >= 40 ? C.medium : C.low
                    return (
                      <div key={key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, padding: '10px 12px' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 10, color: C.textMuted }}>{label}</p>
                        <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
                          {pct}<span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted }}>%</span>
                        </p>
                        <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 9, color: C.textMuted }}>{desc} · {weight} weight</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SHAP chart */}
              <div>
                <p style={{ margin: '0 0 12px', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Feature Attribution (SHAP)
                </p>
                <SHAPChart values={alert.shap_values} />
              </div>

              {/* Analysis block */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: C.amber }}>✦</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {alert.ai_narrative ? 'AI Analysis' : 'Alert Analysis'}
                  </span>
                </div>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    ML Detection Signals
                  </p>
                  {alert.shap_values
                    .filter(v => v.contribution > 0)
                    .sort((a, b) => b.contribution - a.contribution)
                    .slice(0, 3)
                    .map((v, i) => (
                      <div key={v.feature} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: i === 0 ? 0 : 4 }}>
                        <span style={{ fontSize: 9, color: C.critical, fontWeight: 700 }}>↑</span>
                        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: 'monospace' }}>{v.feature}</span>
                        <span style={{ fontSize: 10, color: C.textPrimary, fontWeight: 600 }}>+{v.contribution.toFixed(3)}</span>
                      </div>
                    ))}
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    In Plain Terms
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.7 }}>
                    {alert.ai_narrative || generatePlainExplanation(alert, peerData)}
                  </p>
                </div>
              </div>

              {/* Peer comparison */}
              {peerData && peerData.metrics.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 12px', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Peer Comparison
                    <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 5 }}>({peerData.role.replace(/_/g, ' ')} peers)</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {peerData.metrics.map((m) => {
                      const color = m.multiplier > 3 ? C.critical : m.multiplier > 1.5 ? C.medium : C.low
                      const barPct = Math.min(100, (m.multiplier / 6) * 100)
                      return (
                        <div key={m.metric}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: C.textMuted }}>{m.metric}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{m.multiplier.toFixed(1)}x peer avg</span>
                          </div>
                          <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: `${barPct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
                          </div>
                          <p style={{ margin: 0, fontSize: 10, color: C.textMuted, lineHeight: 1.5 }}>
                            {m.multiplier <= 1.2
                              ? `Within normal range for ${peerData.role.replace(/_/g, ' ')} peers.`
                              : `${m.multiplier.toFixed(1)}x higher than ${peerData.role.replace(/_/g, ' ')} peer average.`}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Recommended action */}
              {action && (
                <div style={{
                  background: C.hover, border: `1px solid ${action.color}33`,
                  borderRadius: 3, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <AlertTriangle size={14} color={action.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: action.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Recommended Action
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>{action.text}</p>
                  </div>
                </div>
              )}

              {/* Case notes */}
              <div>
                <label
                  htmlFor="case-notes"
                  style={{ display: 'block', margin: '0 0 8px', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
                >
                  Case Notes
                </label>
                <textarea
                  id="case-notes"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={(e) => { saveNote(); e.target.style.borderColor = C.border }}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveNote() }}
                  placeholder="Add investigator notes… (Cmd+Enter to save)"
                  style={{
                    width: '100%', minHeight: 80, padding: '10px 12px',
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3,
                    color: C.textPrimary, fontSize: 12, fontFamily: 'inherit', lineHeight: 1.6,
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#4D5562' }}
                />
                {noteSavedAt && (
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: C.low }}>Saved {timeAgo(noteSavedAt.toISOString())}</p>
                )}
              </div>
            </div>

            {/* ── Right column (45%) ── */}
            <div style={{ width: '45%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Scrollable: timeline + audit log */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Investigation Timeline */}
                <div>
                  <p style={{ margin: '0 0 14px', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Investigation Timeline
                    {timeline.length > 0 && (
                      <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>· {timeline.length} events</span>
                    )}
                  </p>
                  {timeline.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>No timeline events recorded for this alert.</p>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: 20 }}>
                      <div style={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 1, background: C.border }} />
                      {timeline.map((item, i) => {
                        const kindColor = item.kind === 'trigger' ? C.critical
                          : item.kind === 'case_opened' ? C.amber
                          : item.kind === 'suspicious' ? C.medium
                          : item.kind === 'analyst_action' ? C.low
                          : C.textMuted
                        const kindLabel = item.kind === 'baseline' ? 'BASE'
                          : item.kind === 'suspicious' ? 'WARN'
                          : item.kind === 'trigger' ? 'ALERT'
                          : item.kind === 'case_opened' ? 'CASE'
                          : 'ACTION'
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < timeline.length - 1 ? 14 : 0, position: 'relative' }}>
                            <div style={{
                              position: 'absolute', left: -16, top: 5,
                              width: 8, height: 8, borderRadius: '50%',
                              background: kindColor, border: `2px solid ${C.card}`,
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                                  border: `1px solid ${kindColor}`, color: kindColor,
                                  flexShrink: 0, letterSpacing: '0.04em',
                                }}>{kindLabel}</span>
                                <p style={{ margin: 0, fontSize: 11, color: kindColor, fontWeight: item.kind !== 'baseline' ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.title}
                                </p>
                                {item.risk_delta && (
                                  <span style={{ fontSize: 10, color: C.critical, fontWeight: 700, flexShrink: 0 }}>{item.risk_delta}</span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: 10, color: C.textMuted, lineHeight: 1.5 }}>{item.explanation}</p>
                            </div>
                            <span style={{ fontSize: 9, color: C.textMuted, flexShrink: 0, marginTop: 2 }}>{formatTs(item.timestamp)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Analyst Actions */}
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Analyst Actions
                  </p>
                  {auditLog.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>No actions recorded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {auditLog.map((entry) => (
                        <div key={entry.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0, marginTop: 2,
                            color: entry.action_type === 'restrict' ? C.critical : entry.action_type === 'label' ? C.low : C.textMuted,
                            border: `1px solid ${entry.action_type === 'restrict' ? C.critical : entry.action_type === 'label' ? C.low : C.border}`,
                            borderRadius: 2, padding: '1px 5px', textTransform: 'uppercase',
                          }}>{entry.action_type}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 11, color: C.textPrimary, lineHeight: 1.4 }}>{entry.message}</p>
                            <p style={{ margin: 0, fontSize: 10, color: C.textMuted }}>{timeAgo(entry.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pinned footer */}
              <div style={{
                borderTop: `1px solid ${C.border}`, padding: '14px 20px',
                flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8,
                background: C.card,
              }}>
                {/* TP / FP label buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['TP', 'FP'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      className="btn-action"
                      disabled={acting}
                      onClick={() => handleLabel(lbl)}
                      style={{
                        flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 3,
                        border: `1px solid ${alert.label === lbl ? (lbl === 'TP' ? C.critical : C.low) : C.border}`,
                        background: alert.label === lbl ? (lbl === 'TP' ? 'rgba(220,38,38,0.12)' : 'rgba(22,163,74,0.12)') : 'transparent',
                        color: alert.label === lbl ? (lbl === 'TP' ? C.critical : C.low) : C.textMuted,
                        transition: 'all 0.15s',
                      }}
                    >
                      {lbl === 'TP' ? 'True Positive' : 'False Positive'}
                    </button>
                  ))}
                </div>

                {/* Resolve / Dismiss / Export */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {alert.status === 'open' ? (
                    <>
                      <button
                        className="btn-action"
                        disabled={acting}
                        onClick={handleResolve}
                        style={{
                          flex: 1, padding: '9px 0', fontSize: 11, fontWeight: 700,
                          letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 3,
                          background: C.critical, border: 'none', color: '#fff',
                          opacity: acting ? 0.6 : 1,
                        }}
                      >MARK RESOLVED</button>
                      <button
                        className="btn-action"
                        disabled={acting}
                        onClick={handleDismiss}
                        style={{
                          flex: 1, padding: '9px 0', fontSize: 11, fontWeight: 700,
                          letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 3,
                          background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                          opacity: acting ? 0.6 : 1,
                        }}
                      >DISMISS</button>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 0' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: alert.status === 'resolved' ? C.low : C.textMuted,
                      }}>
                        {alert.status === 'resolved' ? '✓ Resolved' : 'Dismissed'}
                      </span>
                    </div>
                  )}
                  <button
                    className="btn-action"
                    onClick={handleExport}
                    title="Export Evidence Package"
                    style={{
                      padding: '9px 14px', background: 'transparent',
                      border: `1px solid ${C.border}`, color: C.textMuted,
                      borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <Download size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
