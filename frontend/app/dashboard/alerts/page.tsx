'use client'

import { useCallback, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import AlertTable from '@/components/AlertTable'
import AlertPanel from '@/components/AlertPanel'
import { api, type Alert, type Stats } from '@/lib/api'
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

function Select({
  value, onChange, options, label,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label?: string }[]
  label: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      style={{
        background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary,
        padding: '7px 10px', fontSize: 12, borderRadius: 3, cursor: 'pointer',
        fontFamily: 'inherit', outline: 'none',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label ?? o.value.toUpperCase()}</option>
      ))}
    </select>
  )
}

function StatStrip({ alerts, stats }: { alerts: Alert[]; stats: Stats | null }) {
  const open = alerts.filter((a) => a.status === 'open').length
  const labeled = stats?.labels_collected ?? 0
  const fprRaw = stats?.false_positive_rate ?? null
  const tprRaw = fprRaw !== null && labeled > 0 ? (100 - fprRaw).toFixed(1) : null
  const fprDisplay = labeled === 0 ? 'No labels yet' : fprRaw !== null ? `${fprRaw.toFixed(1)}%` : '—'
  const tprDisplay = labeled === 0 ? 'No labels yet' : tprRaw !== null ? `${tprRaw}%` : '—'
  const avgConf = alerts.length > 0
    ? (alerts.reduce((s, a) => s + a.model_scores.xgboost, 0) / alerts.length).toFixed(2)
    : '—'

  const items = [
    { label: 'Open Alerts', value: String(open), color: C.critical },
    { label: 'True Positive Rate', value: tprDisplay, color: labeled === 0 ? C.textMuted : C.low },
    { label: 'False Positive Rate', value: fprDisplay, color: labeled === 0 ? C.textMuted : C.medium },
    { label: 'Avg. XGB Confidence', value: avgConf, color: C.textPrimary },
  ]

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, display: 'flex' }}>
      {items.map(({ label, value, color }, i) => (
        <div
          key={label}
          style={{
            flex: 1, padding: '14px 20px',
            borderRight: i < items.length - 1 ? `1px solid ${C.border}` : 'none',
          }}
        >
          <p style={{ margin: '0 0 5px', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            {label}
          </p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{value}</p>
        </div>
      ))}
    </div>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [retrainMessage, setRetrainMessage] = useState('')
  const [retraining, setRetraining] = useState(false)

  const [riskLevel, setRiskLevel] = useState('all')
  const [status, setStatus] = useState('all')
  const [timeRange, setTimeRange] = useState('all')
  const [page, setPage] = useState(1)
  const [threshold, setThreshold] = useState(50)
  const [simulateToast, setSimulateToast] = useState('')
  const PAGE_SIZE = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.alerts({
        risk_level: riskLevel === 'all' ? undefined : riskLevel,
        status: status === 'all' ? undefined : status,
        time_range: timeRange === 'all' ? undefined : timeRange,
        page,
      })
      setAlerts(res.alerts)
      setTotal(res.total)
      api.stats().then(setStats).catch(() => null)
    } catch {
      // backend starting up
    } finally {
      setLoading(false)
    }
  }, [riskLevel, status, timeRange, page])

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    setPage(1)
  }, [riskLevel, status, timeRange])

  const filteredAlerts = alerts.filter((a) => a.risk_score >= threshold)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleRetrain = async () => {
    setRetraining(true)
    try {
      const res = await api.retrain()
      setRetrainMessage(res.message)
      api.stats().then(setStats).catch(() => null)
    } catch {
      setRetrainMessage('Retrain failed — backend unavailable')
    } finally {
      setRetraining(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>Alert Management</h1>
            <span style={{ fontSize: 11, color: C.textMuted }}>{total} total alerts</span>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Sensitivity dial */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                Alert Threshold
              </span>
              <input
                id="alert-threshold"
                type="range"
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                aria-label="Alert score threshold"
                aria-valuenow={threshold}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ flex: 1, accentColor: C.critical, cursor: 'pointer', height: 4 }}
              />
              <span style={{
                fontSize: 20, fontWeight: 800, color: C.critical,
                width: 36, textAlign: 'right', flexShrink: 0, letterSpacing: '-0.02em',
              }}>
                {threshold}
              </span>
              <span style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap', borderLeft: `1px solid ${C.border}`, paddingLeft: 14 }}>
                Showing{' '}
                <span style={{ color: C.textPrimary, fontWeight: 700 }}>{filteredAlerts.length}</span>
                {' '}alerts above threshold {threshold}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filter:</span>
            <Select
              value={riskLevel}
              onChange={setRiskLevel}
              options={RISK_LEVELS.map((v) => ({ value: v }))}
              label="Filter by risk level"
            />
            <Select
              value={status}
              onChange={setStatus}
              options={STATUSES.map((v) => ({ value: v }))}
              label="Filter by status"
            />
            <Select
              value={timeRange}
              onChange={setTimeRange}
              options={TIME_RANGES}
              label="Filter by time range"
            />
            <button
              onClick={fetch}
              style={{
                padding: '7px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                borderRadius: 3, cursor: 'pointer',
              }}
            >
              REFRESH
            </button>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ marginRight: 10, fontSize: 11, color: C.textMuted }}>
                {stats ? `${stats.labels_collected} labels collected — next retrain in ${stats.next_retrain_in}` : 'Labels loading'}
              </span>
              <button
                onClick={handleRetrain}
                disabled={retraining}
                style={{
                  padding: '7px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                  borderRadius: 3, cursor: retraining ? 'default' : 'pointer', marginRight: 8,
                  opacity: retraining ? 0.6 : 1,
                }}
              >
                {retraining ? 'RETRAINING' : 'RETRAIN XGB'}
              </button>
              <button
                onClick={async () => {
                  await api.simulate().catch(() => null)
                  setSimulateToast('Attack scenario injected')
                  setTimeout(() => {
                    setSimulateToast('')
                    fetch()
                  }, 3000)
                }}
                style={{
                  padding: '7px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                  borderRadius: 3, cursor: 'pointer',
                }}
              >
                SIMULATE EVENT
              </button>
            </div>
          </div>

          {simulateToast && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '10px 14px', color: C.medium, fontSize: 12, fontWeight: 600 }}>
              {simulateToast} — refreshing in 3 seconds
            </div>
          )}

          {retrainMessage && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '10px 14px', color: C.low, fontSize: 12, fontWeight: 600 }}>
              {retrainMessage}
            </div>
          )}

          {/* Table — receives threshold-filtered alerts */}
          <AlertTable
            alerts={filteredAlerts}
            loading={loading}
            onSelectAlert={setSelectedAlertId}
            onResolved={fetch}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>
                Page {page} of {totalPages} · {total} alerts
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '5px 12px', fontSize: 11, fontWeight: 600,
                    background: 'transparent', border: `1px solid ${C.border}`, color: page <= 1 ? C.textMuted : C.textMuted, opacity: page <= 1 ? 0.4 : 1,
                    borderRadius: 3, cursor: page <= 1 ? 'default' : 'pointer',
                  }}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const pg = start + i
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      style={{
                        padding: '5px 10px', fontSize: 11, fontWeight: 600,
                        background: pg === page ? C.critical : 'transparent',
                        border: `1px solid ${pg === page ? C.critical : C.border}`,
                        color: pg === page ? '#F0F6FC' : C.textMuted,
                        borderRadius: 3, cursor: 'pointer',
                      }}
                    >
                      {pg}
                    </button>
                  )
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '5px 12px', fontSize: 11, fontWeight: 600,
                    background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, opacity: page >= totalPages ? 0.4 : 1,
                    borderRadius: 3, cursor: page >= totalPages ? 'default' : 'pointer',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Stats strip — TP/FP from backend labels, open count from filtered set */}
          <StatStrip alerts={filteredAlerts} stats={stats} />
        </main>
      </div>

      <AlertPanel
        alertId={selectedAlertId}
        onClose={() => setSelectedAlertId(null)}
        onResolved={(id, newStatus) => {
          setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a))
          fetch()
        }}
      />
    </div>
  )
}
