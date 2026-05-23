'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import AlertPanel from '@/components/AlertPanel'
import RiskBadge from '@/components/RiskBadge'
import { api, type Alert, type Stats, formatFraudType, timeAgo } from '@/lib/api'
import { C } from '@/lib/tokens'

const RISK_LEVELS = ['all', 'critical', 'high', 'medium', 'low']
const STATUSES = ['all', 'open', 'resolved', 'dismissed']
const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '1h', label: 'Last 1h' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7d' },
  { value: '30d', label: 'Last 30d' },
]

function Select({ value, onChange, options, label }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label?: string }[]; label: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      style={{
        background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary,
        padding: '5px 8px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
        fontFamily: 'inherit', outline: 'none',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label ?? o.value.toUpperCase()}</option>
      ))}
    </select>
  )
}

function AlertRow({ alert, selected, onClick, isRight }: {
  alert: Alert; selected: boolean; onClick: () => void; isRight?: boolean
}) {
  const [hov, setHov] = useState(false)
  const color = alert.risk_level === 'critical' || alert.risk_level === 'high' ? C.critical
    : alert.risk_level === 'medium' ? C.medium : C.low

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '13px 18px', borderBottom: `1px solid ${C.border}`,
        cursor: 'pointer', transition: 'background 0.1s',
        background: selected ? C.hover : hov ? '#16191f' : 'transparent',
        borderLeft: isRight
          ? `${selected ? 3 : 1}px solid ${selected ? color : C.border}`
          : `3px solid ${selected ? color : 'transparent'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: selected ? 700 : 500, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {alert.user_name}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color, flexShrink: 0 }}>
          {Math.round(alert.risk_score)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>{formatFraudType(alert.fraud_type)}</span>
        <span style={{ fontSize: 10, color: C.textMuted }}>{timeAgo(alert.ingested_at ?? alert.timestamp)}</span>
      </div>
      {alert.status !== 'open' && (
        <div style={{ marginTop: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '1px 5px',
            border: `1px solid ${alert.status === 'resolved' ? C.low : C.border}`,
            color: alert.status === 'resolved' ? C.low : C.textMuted, borderRadius: 2,
          }}>
            {alert.status.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}

export default function AlertsPage() {
  const [fraudTypeFilter, setFraudTypeFilter] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [retraining, setRetraining] = useState(false)
  const [retrainMsg, setRetrainMsg] = useState('')

  const [riskLevel, setRiskLevel] = useState('all')
  const [status, setStatus] = useState('open')
  const [timeRange, setTimeRange] = useState('all')
  const [minScore, setMinScore] = useState(65)
  const [page, setPage] = useState(1)
  const [simOpen, setSimOpen] = useState(false)
  const [simToast, setSimToast] = useState('')
  const [simBusy, setSimBusy] = useState(false)
  const simRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 40

  useEffect(() => {
    if (!simOpen) return
    const handler = (e: MouseEvent) => {
      if (simRef.current && !simRef.current.contains(e.target as Node)) setSimOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [simOpen])

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.alerts({
        risk_level: riskLevel === 'all' ? undefined : riskLevel,
        status: status === 'all' ? undefined : status,
        time_range: timeRange === 'all' ? undefined : timeRange,
        page,
        page_size: PAGE_SIZE,
        min_score: minScore,
      })
      setAlerts(res.alerts)
      setTotal(res.total)
      api.stats().then(setStats).catch(() => null)
    } catch { /* backend starting */ }
    finally { setLoading(false) }
  }, [riskLevel, status, timeRange, page, minScore])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])
  useEffect(() => { setPage(1) }, [riskLevel, status, timeRange, minScore])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ft = params.get('fraud_type')
    if (ft) setFraudTypeFilter(ft)
    const id = params.get('id')
    if (id) setSelectedId(id)
  }, [])

  useEffect(() => {
    if (!fraudTypeFilter || alerts.length === 0 || selectedId) return
    const match = alerts.find((a) => a.fraud_type === fraudTypeFilter)
    if (match) setSelectedId(match.id)
  }, [fraudTypeFilter, alerts, selectedId])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleResolved = (id: string, newStatus: 'resolved' | 'dismissed') => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    setSelectedId(null)
    if (newStatus) fetchAlerts()
  }

  const handleRetrain = async () => {
    setRetraining(true)
    setRetrainMsg('')
    try {
      const res = await api.retrain()
      setRetrainMsg(res.message)
    } catch { setRetrainMsg('Retrain failed') }
    finally { setRetraining(false) }
  }

  const handleSimulate = async (label: string, scenario: string) => {
    setSimOpen(false)
    setSimBusy(true)
    setSimToast(`Simulating ${label}…`)
    try {
      await api.simulate(scenario)
      setSimToast(`${label} injected — refreshing`)
      setTimeout(() => { setSimToast(''); setPage(1); setStatus('open'); fetchAlerts() }, 2000)
    } catch {
      setSimToast('Simulate failed — backend may be starting')
      setTimeout(() => setSimToast(''), 4000)
    }
    setSimBusy(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Alert Queue
            </span>
            <span style={{ fontSize: 10, color: C.textMuted, paddingRight: 8, borderRight: `1px solid ${C.border}` }}>
              {total} total
            </span>

            {stats && (
              <>
                <span style={{ fontSize: 10, color: C.textMuted }}>
                  <span style={{ color: C.textPrimary, fontWeight: 700 }}>{stats.labels_collected}</span> labels
                </span>
                {stats.labels_collected > 0 && (
                  <span style={{ fontSize: 10, color: C.textMuted }}>
                    <span style={{ color: stats.false_positive_rate > 20 ? C.medium : C.low, fontWeight: 700 }}>
                      {stats.false_positive_rate}%
                    </span> FP rate
                  </span>
                )}
              </>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Simulate dropdown */}
              <div ref={simRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setSimOpen(o => !o)}
                  disabled={simBusy}
                  style={{
                    padding: '5px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                    borderRadius: 3, cursor: 'pointer',
                  }}
                >
                  SIMULATE ▾
                </button>
                {simOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 3, zIndex: 20,
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                    minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    {[
                      { label: 'Bulk Data Exfiltration', scenario: 'bulk_exfiltration' },
                      { label: 'Privilege Escalation', scenario: 'privilege_escalation' },
                      { label: 'Off-Hours Treasury', scenario: 'off_hours_treasury' },
                      { label: 'Account Record Tampering', scenario: 'account_tampering' },
                    ].map(({ label, scenario }, idx, arr) => (
                      <button key={scenario} onClick={() => handleSimulate(label, scenario)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '9px 12px', fontSize: 11, color: C.textPrimary,
                          background: 'transparent', border: 'none',
                          borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleRetrain} disabled={retraining}
                style={{
                  padding: '5px 10px', fontSize: 10, fontWeight: 700,
                  background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                  borderRadius: 3, cursor: 'pointer', opacity: retraining ? 0.5 : 1,
                }}
              >
                {retraining ? 'RETRAINING…' : 'RETRAIN'}
              </button>

              <button onClick={fetchAlerts}
                style={{
                  padding: '5px 10px', fontSize: 10, fontWeight: 700,
                  background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                  borderRadius: 3, cursor: 'pointer',
                }}
              >↺</button>
            </div>
          </div>

          {/* Filters row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', flexWrap: 'wrap' }}>
            <Select value={riskLevel} onChange={setRiskLevel} options={RISK_LEVELS.map(v => ({ value: v }))} label="Risk level" />
            <Select value={status} onChange={setStatus} options={STATUSES.map(v => ({ value: v }))} label="Status" />
            <Select value={timeRange} onChange={setTimeRange} options={TIME_RANGES} label="Time range" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0 }}>Min score</span>
              <input
                type="range" min={0} max={100} value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{ width: 120, accentColor: C.critical, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary, width: 24, flexShrink: 0 }}>{minScore}</span>
            </div>

            {fraudTypeFilter && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.critical, border: `1px solid ${C.critical}`, borderRadius: 2, padding: '2px 6px', letterSpacing: '0.05em' }}>
                  PATTERN
                </span>
                <span style={{ fontSize: 10, color: C.textPrimary, fontWeight: 600 }}>
                  {formatFraudType(fraudTypeFilter)}
                </span>
                <button onClick={() => setFraudTypeFilter(null)} style={{ fontSize: 10, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  × clear
                </button>
              </div>
            )}
          </div>

          {/* Toast / retrain message */}
          {(simToast || retrainMsg) && (
            <div style={{ padding: '6px 20px', background: '#1A2233', borderTop: `1px solid ${C.border}`, fontSize: 11, color: simToast ? C.medium : C.low }}>
              {simToast || retrainMsg}
            </div>
          )}
        </div>

        {/* Alert grid — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {[...Array(16)].map((_, i) => (
                <div key={i} style={{
                  height: 64, borderBottom: `1px solid ${C.border}`,
                  borderLeft: i % 2 === 1 ? `1px solid ${C.border}` : undefined,
                  display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.border }} />
                  <div style={{ flex: 1, height: 10, background: C.border, borderRadius: 2 }} />
                  <div style={{ width: 24, height: 10, background: C.border, borderRadius: 2 }} />
                </div>
              ))}
            </div>
          )}

          {!loading && alerts.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span style={{ fontSize: 12, color: C.textMuted }}>No alerts match the current filters</span>
            </div>
          )}

          {!loading && alerts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {alerts.map((a, i) => (
                <AlertRow
                  key={a.id}
                  alert={a}
                  selected={selectedId === a.id}
                  onClick={() => setSelectedId(a.id === selectedId ? null : a.id)}
                  isRight={i % 2 === 1}
                />
              ))}
              {/* Fill empty right cell if odd count */}
              {alerts.length % 2 === 1 && (
                <div style={{ borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}` }} />
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0,
            background: C.card,
          }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ fontSize: 11, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
              ← Prev
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textMuted }}>
              Page
              <input
                type="number" min={1} max={totalPages} defaultValue={page} key={page}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = parseInt((e.target as HTMLInputElement).value)
                    if (!isNaN(v)) setPage(Math.max(1, Math.min(totalPages, v)))
                  }
                }}
                onBlur={(e) => {
                  const v = parseInt(e.target.value)
                  if (!isNaN(v)) setPage(Math.max(1, Math.min(totalPages, v)))
                }}
                style={{
                  width: 36, textAlign: 'center', background: C.bg, border: `1px solid ${C.border}`,
                  color: C.textPrimary, fontSize: 11, borderRadius: 3, padding: '3px 4px',
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              of {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ fontSize: 11, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Overlay alert panel */}
      <AlertPanel
        alertId={selectedId}
        onClose={() => setSelectedId(null)}
        onResolved={handleResolved}
      />
    </div>
  )
}
