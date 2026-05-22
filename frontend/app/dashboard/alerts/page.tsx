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

function AlertRow({ alert, selected, onClick }: { alert: Alert; selected: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const color = alert.risk_level === 'critical' || alert.risk_level === 'high' ? C.critical
    : alert.risk_level === 'medium' ? C.medium : C.low

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '11px 14px', borderBottom: `1px solid ${C.border}`,
        cursor: 'pointer', transition: 'background 0.1s',
        background: selected ? C.hover : hov ? '#16191f' : 'transparent',
        borderLeft: `3px solid ${selected ? color : 'transparent'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
        <span style={{ fontSize: 10, color: C.textMuted }}>{timeAgo(alert.timestamp)}</span>
      </div>
    </div>
  )
}

export default function AlertsPage() {
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
  const [page, setPage] = useState(1)
  const [simOpen, setSimOpen] = useState(false)
  const [simToast, setSimToast] = useState('')
  const [simBusy, setSimBusy] = useState(false)
  const simRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 30

  useEffect(() => {
    if (!simOpen) return
    const handler = (e: MouseEvent) => {
      if (simRef.current && !simRef.current.contains(e.target as Node)) setSimOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [simOpen])

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.alerts({
        risk_level: riskLevel === 'all' ? undefined : riskLevel,
        status: status === 'all' ? undefined : status,
        time_range: timeRange === 'all' ? undefined : timeRange,
        page,
        page_size: PAGE_SIZE,
      })
      setAlerts(res.alerts)
      setTotal(res.total)
      api.stats().then(setStats).catch(() => null)
    } catch { /* backend starting */ }
    finally { setLoading(false) }
  }, [riskLevel, status, timeRange, page])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { setPage(1) }, [riskLevel, status, timeRange])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleResolved = (id: string, newStatus: 'resolved' | 'dismissed') => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    setSelectedId(null)
    if (newStatus) fetch()
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
      setTimeout(() => { setSimToast(''); setPage(1); setStatus('open'); fetch() }, 2000)
    } catch {
      setSimToast('Simulate failed — backend may be starting')
      setTimeout(() => setSimToast(''), 4000)
    }
    setSimBusy(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      {/* Queue rail */}
      <div style={{ width: 320, flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, background: C.card }}>

        {/* Rail header */}
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alerts</span>
            <span style={{ fontSize: 10, color: C.textMuted }}>{total} total</span>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Select value={riskLevel} onChange={setRiskLevel} options={RISK_LEVELS.map(v => ({ value: v }))} label="Risk level" />
            <Select value={status} onChange={setStatus} options={STATUSES.map(v => ({ value: v }))} label="Status" />
            <Select value={timeRange} onChange={setTimeRange} options={TIME_RANGES} label="Time range" />
          </div>
        </div>

        {/* Simulate + actions */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
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
                position: 'absolute', top: '100%', left: 0, marginTop: 3, zIndex: 20,
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {[
                  { label: 'Bulk Data Exfiltration', scenario: 'bulk_exfiltration' },
                  { label: 'Privilege Escalation', scenario: 'privilege_escalation' },
                  { label: 'Off-Hours Treasury', scenario: 'off_hours_treasury' },
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
          <button onClick={fetch}
            style={{
              padding: '5px 10px', fontSize: 10, fontWeight: 700,
              background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
              borderRadius: 3, cursor: 'pointer',
            }}
          >↺</button>
        </div>

        {(simToast || retrainMsg) && (
          <div style={{ padding: '6px 14px', background: '#1A2233', borderBottom: `1px solid ${C.border}`, fontSize: 11, color: simToast ? C.medium : C.low, flexShrink: 0 }}>
            {simToast || retrainMsg}
          </div>
        )}

        {/* Stats bar */}
        {stats && (
          <div style={{ display: 'flex', padding: '6px 14px', gap: 14, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>FP Rate</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: stats.labels_collected > 0 ? C.medium : C.textMuted }}>
                {stats.labels_collected > 0 ? `${stats.false_positive_rate}%` : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Labels</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{stats.labels_collected}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Showing</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{alerts.length}</div>
            </div>
          </div>
        )}

        {/* Alert list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && [...Array(8)].map((_, i) => (
            <div key={i} style={{ height: 56, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.border }} />
              <div style={{ flex: 1, height: 10, background: C.border, borderRadius: 2 }} />
              <div style={{ width: 24, height: 10, background: C.border, borderRadius: 2 }} />
            </div>
          ))}
          {!loading && alerts.length === 0 && (
            <div style={{ padding: 20, color: C.textMuted, fontSize: 12 }}>No alerts match filters.</div>
          )}
          {!loading && alerts.map(a => (
            <AlertRow key={a.id} alert={a} selected={selectedId === a.id} onClick={() => setSelectedId(a.id === selectedId ? null : a.id)} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ fontSize: 11, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, padding: '3px 8px', borderRadius: 3, cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
              ← Prev
            </button>
            <span style={{ fontSize: 10, color: C.textMuted }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ fontSize: 11, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, padding: '3px 8px', borderRadius: 3, cursor: 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Inline detail panel */}
      <div style={{ flex: 1, height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        <AlertPanel
          alertId={selectedId}
          onClose={() => setSelectedId(null)}
          onResolved={handleResolved}
          inline={true}
        />
      </div>
    </div>
  )
}
