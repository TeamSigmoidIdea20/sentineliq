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

const EVENT_TAG: Record<string, { label: string; color: string }> = {
  login: { label: 'Auth', color: '#4B9EF5' },
  transaction: { label: 'Data', color: C.textMuted },
  report_download: { label: 'Export', color: C.medium },
  data_export: { label: 'Export', color: C.medium },
  privilege_use: { label: 'Perm Δ', color: C.critical },
  department_access: { label: 'Data', color: C.textMuted },
  file_access: { label: 'Data', color: C.textMuted },
  system_query: { label: 'Data', color: C.textMuted },
}

const FRAUD_TAG: Record<string, { label: string; color: string }> = {
  off_hours_login: { label: 'Auth', color: C.critical },
  bulk_download: { label: 'Export', color: C.medium },
  cross_department_access: { label: 'Anomaly', color: C.critical },
  privilege_escalation: { label: 'Perm Δ', color: C.critical },
  velocity_spike: { label: 'Anomaly', color: C.critical },
  anomalous_behavior: { label: 'Alert', color: C.critical },
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

function generateExplanation(alert: Alert): string {
  const topPositive = [...alert.shap_values]
    .filter((v) => v.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2)

  const firstName = alert.user_name.split(' ')[0]
  const fraudDesc = formatFraudType(alert.fraud_type)
  const xgbConf = Math.round(alert.model_scores.xgboost * 100)
  const anchorModel =
    alert.model_scores.lstm >= alert.model_scores.isolation_forest
      ? 'LSTM Autoencoder flagged sustained behavioural drift'
      : 'Isolation Forest detected a statistical point anomaly'

  let text = `${firstName} triggered this alert`
  if (topPositive.length >= 1) {
    const f1 = FEATURE_DESC[topPositive[0].feature] ?? topPositive[0].feature.replace(/_/g, ' ')
    text += ` primarily due to abnormal ${f1}`
    if (topPositive.length >= 2) {
      const f2 = FEATURE_DESC[topPositive[1].feature] ?? topPositive[1].feature.replace(/_/g, ' ')
      text += `, combined with elevated ${f2}`
    }
    text += '.'
  } else {
    text += ' due to anomalous behavioural patterns.'
  }
  text += ` The ${anchorModel}, while XGBoost classified this pattern with ${xgbConf}% confidence as ${fraudDesc}.`
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
  inline?: boolean
}

export default function AlertPanel({ alertId, onClose, onResolved, inline = false }: Props) {
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
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
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
    } finally {
      setActing(false)
    }
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
    } finally {
      setActing(false)
    }
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

  if (!alertId) {
    if (inline) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.textMuted, fontSize: 13, gap: 8 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Select an alert to review</span>
        </div>
      )
    }
    return null
  }

  const scoreColor = alert ? riskColor(alert.risk_score) : C.critical
  const action = alert ? recommendedAction(alert.risk_score) : null

  return (
    <>
      {!inline && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

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

      <aside className={inline ? undefined : 'panel-full panel-slide-in'} style={inline ? {
        height: '100%', overflowY: 'auto', background: C.card,
        borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
      } : {
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 520,
        background: C.card, borderLeft: `1px solid ${C.border}`,
        zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, letterSpacing: '0.04em' }}>ALERT DETAIL</span>
          <button onClick={onClose} aria-label="Close alert detail" style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {loading && (
          <div style={{ padding: 24 }}>
            {[80, 120, 60, 140, 100].map((w, i) => (
              <div key={i} style={{ height: 14, width: w, background: '#30363D', borderRadius: 2, marginBottom: 12 }} />
            ))}
          </div>
        )}

        {!loading && alert && (
          <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: scoreColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: C.textPrimary, flexShrink: 0,
                }}>
                  {alert.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{alert.user_name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{alert.user_id} · {timeAgo(alert.ingested_at ?? alert.timestamp)}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <RiskBadge level={alert.risk_level} score={alert.risk_score} />
                </div>
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '10px 14px' }}>
                <p style={{ margin: 0, fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Anomaly Type</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{formatFraudType(alert.fraud_type)}</p>
              </div>
            </div>

            {/* Risk score bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Risk Score</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor }}>
                  {Math.round(alert.risk_score)}<span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>/100</span>
                </span>
              </div>
              <div style={{ height: 8, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${alert.risk_score}%`, height: '100%', background: scoreColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Model scores */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Model Scores</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Isolation Forest', key: 'isolation_forest', weight: '30%' },
                  { label: 'LSTM Autoencoder', key: 'lstm', weight: '40%' },
                  { label: 'XGBoost', key: 'xgboost', weight: '30%' },
                ].map(({ label, key, weight }) => {
                  const score = alert.model_scores[key as keyof typeof alert.model_scores]
                  const pct = Math.round(score * 100)
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: C.textMuted, width: 130, flexShrink: 0 }}>{label}</span>
                      <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct > 60 ? C.critical : pct > 40 ? C.medium : C.low }} />
                      </div>
                      <span style={{ fontSize: 11, color: C.textPrimary, width: 30, textAlign: 'right' }}>{pct}%</span>
                      <span style={{ fontSize: 10, color: C.textMuted, width: 28 }}>{weight}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SHAP */}
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Feature Attribution (SHAP)</p>
              <SHAPChart values={alert.shap_values} />
            </div>

            {/* AI Analysis — uses Grok narrative when available, falls back to template */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>✦</span> {alert.ai_narrative ? 'AI Analysis' : 'Why This Alert Fired'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.7 }}>
                {alert.ai_narrative || generateExplanation(alert)}
              </p>
            </div>

            {/* Investigation Timeline */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <p style={{ margin: '0 0 14px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Investigation Timeline {timeline.length > 0 && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>· {timeline.length} events</span>}
              </p>
              {timeline.length === 0 ? (
                <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>No timeline events recorded for this alert.</p>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  <div style={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 1, background: C.border }} />
                  {timeline.map((item, i) => {
                    const kindColor = item.kind === 'trigger' ? C.critical
                      : item.kind === 'suspicious' ? C.medium
                      : item.kind === 'analyst_action' ? C.low
                      : C.textMuted
                    const kindLabel = item.kind === 'baseline' ? 'BASE'
                      : item.kind === 'suspicious' ? 'WARN'
                      : item.kind === 'trigger' ? 'ALERT'
                      : 'ACTION'
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < timeline.length - 1 ? 12 : 0, position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: -16, top: 5,
                          width: 8, height: 8, borderRadius: '50%',
                          background: kindColor, border: `2px solid ${C.card}`,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
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

            {/* Peer Comparison */}
            {peerData && peerData.metrics.length > 0 && (
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  Peer Comparison
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 5, fontSize: 10 }}>
                    ({peerData.role.replace(/_/g, ' ')} peers)
                  </span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {peerData.metrics.map((m) => {
                    const color = m.multiplier > 3 ? C.critical : m.multiplier > 1.5 ? C.medium : C.low
                    const barPct = Math.min(100, (m.multiplier / 6) * 100)
                    const peerContext = m.multiplier <= 1.2
                      ? `This user's ${m.metric.toLowerCase()} is within normal range for their role.`
                      : m.multiplier > 3
                      ? `This is ${m.multiplier.toFixed(1)}x higher than the ${peerData.role.replace(/_/g, ' ')} average — a strong indicator of abnormal behaviour for this role.`
                      : `This is ${m.multiplier.toFixed(1)}x higher than the ${peerData.role.replace(/_/g, ' ')} average — a significant deviation.`
                    return (
                      <div key={m.metric}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 11, color: C.textMuted, minWidth: 0 }}>{m.metric}</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color, letterSpacing: '-0.02em', flexShrink: 0 }}>
                            {m.multiplier.toFixed(1)}x peer avg
                          </span>
                        </div>
                        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
                          <div style={{ width: `${barPct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: C.textMuted, lineHeight: 1.5 }}>{peerContext}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Case notes */}
            <div>
              <label
                htmlFor="case-notes"
                style={{ display: 'block', margin: '0 0 8px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}
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
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4,
                  color: C.textPrimary, fontSize: 12, fontFamily: 'inherit', lineHeight: 1.6,
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#4D5562' }}
              />
              {noteSavedAt && (
                <p style={{ margin: '4px 0 0', fontSize: 10, color: C.low }}>Saved {timeAgo(noteSavedAt.toISOString())}</p>
              )}
            </div>

            {/* Analyst Feedback */}
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Analyst Feedback</p>
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
            </div>

            {/* Recommended Action */}
            {action && (
              <div style={{
                background: C.hover, border: `1px solid ${action.color}33`,
                borderRadius: 4, padding: '12px 14px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <AlertTriangle size={15} color={action.color} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: action.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Recommended Action
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>{action.text}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              {alert.status === 'open' && (
                <>
                  <button
                    className="btn-action"
                    disabled={acting}
                    onClick={handleResolve}
                    style={{
                      flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 3,
                      background: C.critical, border: 'none', color: C.textPrimary,
                      opacity: acting ? 0.6 : 1,
                    }}
                  >
                    MARK RESOLVED
                  </button>
                  <button
                    className="btn-action"
                    disabled={acting}
                    onClick={handleDismiss}
                    style={{
                      flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 3,
                      background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                      opacity: acting ? 0.6 : 1,
                    }}
                  >
                    DISMISS
                  </button>
                </>
              )}
              {alert.status !== 'open' && (
                <div style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}>
                  <span style={{ fontSize: 12, color: alert.status === 'resolved' ? C.low : C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {alert.status === 'resolved' ? '✓ Resolved' : 'Dismissed'}
                  </span>
                </div>
              )}
              <button
                className="btn-action"
                onClick={handleExport}
                title="Export Evidence Package"
                style={{
                  padding: '10px 14px', fontSize: 12, fontWeight: 700,
                  background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                  borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  flexShrink: 0,
                }}
              >
                <Download size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Analyst Actions */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Analyst Actions
              </p>
              {auditLog.length === 0 ? (
                <p style={{ fontSize: 11, color: C.textMuted }}>No actions recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {auditLog.map((entry) => (
                    <div key={entry.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0, marginTop: 2,
                        color: entry.action_type === 'restrict' ? C.critical : entry.action_type === 'label' ? C.low : C.textMuted,
                        border: `1px solid ${entry.action_type === 'restrict' ? C.critical : entry.action_type === 'label' ? C.low : C.border}`,
                        borderRadius: 2, padding: '1px 5px', textTransform: 'uppercase',
                      }}>
                        {entry.action_type}
                      </span>
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
        )}
      </aside>
    </>
  )
}
