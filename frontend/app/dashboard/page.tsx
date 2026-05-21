'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import StatCard from '@/components/StatCard'
import LiveFeed from '@/components/LiveFeed'
import AlertPanel from '@/components/AlertPanel'
import UserTable from '@/components/UserTable'
import { api, type Alert, type Stats, type User, formatFraudType } from '@/lib/api'
import { C } from '@/lib/tokens'

const _SIMULATE_SCENARIOS = [
  { label: 'Bulk Data Exfiltration', scenario: 'bulk_exfiltration' },
  { label: 'Privilege Escalation', scenario: 'privilege_escalation' },
  { label: 'Off-Hours Treasury Access', scenario: 'off_hours_treasury' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [newAlertNotif, setNewAlertNotif] = useState<Alert | null>(null)
  const prevAlertIds = useRef<Set<string>>(new Set())
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [simOpen, setSimOpen] = useState(false)
  const [simToast, setSimToast] = useState('')
  const simRef = useRef<HTMLDivElement>(null)
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('sentinel_dismissed_patterns')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set()
    }
  })

  const fetchStats = useCallback(async () => {
    try {
      const s = await api.stats()
      setStats(s)
      setLastUpdated(new Date())
    } catch {
      // backend starting up
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.alerts({ page: 1 })
      const incoming = res.alerts
      if (prevAlertIds.current.size > 0) {
        const fresh = incoming.filter((a) => !prevAlertIds.current.has(a.id))
        if (fresh.length > 0) {
          const top = fresh.sort((a, b) => b.risk_score - a.risk_score)[0]
          setNewAlertNotif(top)
          if (notifTimer.current) clearTimeout(notifTimer.current)
          notifTimer.current = setTimeout(() => setNewAlertNotif(null), 7000)
        }
      }
      incoming.forEach((a) => prevAlertIds.current.add(a.id))
      setAlerts(incoming)
    } catch {
      // backend starting up
    } finally {
      setAlertsLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const u = await api.users()
      setUsers(u)
    } catch {
      // backend starting up
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchAlerts()
    fetchUsers()
    const interval = setInterval(() => {
      fetchStats()
      fetchAlerts()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchStats, fetchAlerts])

  useEffect(() => {
    if (!simOpen) return
    const handler = (e: MouseEvent) => {
      if (simRef.current && !simRef.current.contains(e.target as Node)) setSimOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [simOpen])

  const activePatterns = (stats?.coordinated_patterns ?? []).filter(
    (cp) => !dismissedPatterns.has(cp.pattern)
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>Fraud Intelligence Overview</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {simToast && (
              <span style={{ fontSize: 11, color: C.medium, fontWeight: 600 }}>{simToast}</span>
            )}
            <div ref={simRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setSimOpen((o) => !o)}
                style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Simulate ▾
              </button>
              {simOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, zIndex: 50, minWidth: 210, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  {_SIMULATE_SCENARIOS.map(({ label, scenario }, idx, arr) => (
                    <button
                      key={scenario}
                      onClick={async () => {
                        setSimOpen(false)
                        await api.simulate(scenario).catch(() => null)
                        setSimToast(`${label} injected`)
                        setTimeout(() => setSimToast(''), 7000)
                      }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 12, color: C.textPrimary, background: 'transparent', border: 'none', borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.hover }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {lastUpdated && (
              <span style={{ fontSize: 10, color: C.textMuted }}>Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.low, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: C.low, fontWeight: 600 }}>OPERATIONAL</span>
            </div>
          </div>
        </div>

        {/* New alert pop-up notification */}
        <AnimatePresence>
          {newAlertNotif && (
            <motion.div
              key={newAlertNotif.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ flexShrink: 0 }}
            >
              <div
                role="alert"
                style={{
                  background: '#1A2233', padding: '10px 24px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${newAlertNotif.risk_level === 'critical' || newAlertNotif.risk_level === 'high' ? C.critical : newAlertNotif.risk_level === 'medium' ? C.medium : C.low}`,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: newAlertNotif.risk_level === 'critical' || newAlertNotif.risk_level === 'high' ? C.critical : newAlertNotif.risk_level === 'medium' ? C.medium : C.low, flexShrink: 0, display: 'inline-block' }} />
                <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, fontWeight: 600, flex: 1 }}>
                  New alert — <span style={{ fontWeight: 700 }}>{newAlertNotif.user_name}</span>
                  {' · '}{newAlertNotif.fraud_type.replace(/_/g, ' ')}
                  {' · '}score <span style={{ fontWeight: 800, color: newAlertNotif.risk_level === 'critical' || newAlertNotif.risk_level === 'high' ? C.critical : newAlertNotif.risk_level === 'medium' ? C.medium : C.low }}>{Math.round(newAlertNotif.risk_score)}</span>
                </p>
                <button
                  onClick={() => { setSelectedAlertId(newAlertNotif.id); setNewAlertNotif(null) }}
                  style={{ fontSize: 11, color: C.textMuted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  View
                </button>
                <button
                  onClick={() => setNewAlertNotif(null)}
                  aria-label="Dismiss"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4, display: 'flex', flexShrink: 0 }}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coordinated activity banners */}
        <AnimatePresence>
          {activePatterns.map((cp) => (
            <motion.div
              key={cp.pattern}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ flexShrink: 0 }}
            >
              <div
                role="alert"
                style={{
                  background: C.critical, padding: '10px 24px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <AlertTriangle size={15} color="#F0F6FC" strokeWidth={2} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#F0F6FC', fontWeight: 600, flex: 1 }}>
                  Coordinated Activity Detected:{' '}
                  <span style={{ fontWeight: 700 }}>{formatFraudType(cp.pattern)}</span>
                  {' '}across <span style={{ fontWeight: 700 }}>{cp.users} users</span> in the {cp.window}.{' '}
                  <Link
                    href="/dashboard/alerts"
                    style={{ color: '#F0F6FC', textDecoration: 'underline', fontSize: 13 }}
                  >
                    View pattern →
                  </Link>
                </p>
                <button
                  onClick={() => setDismissedPatterns((prev) => {
                    const next = new Set(Array.from(prev).concat(cp.pattern))
                    try { localStorage.setItem('sentinel_dismissed_patterns', JSON.stringify(Array.from(next))) } catch {}
                    return next
                  })}
                  aria-label="Dismiss alert"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F0F6FC', padding: 4, display: 'flex', flexShrink: 0 }}
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stat cards */}
          <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard
              label="Users Monitored"
              value={stats?.users_monitored ?? '—'}
              sub="active employees"
              loading={statsLoading}
            />
            <StatCard
              label="Alerts Today"
              value={stats?.alerts_today ?? '—'}
              change={stats?.alerts_change}
              sub="vs yesterday"
              loading={statsLoading}
              accent="red"
            />
            <StatCard
              label="High Risk"
              value={stats?.high_risk_count ?? '—'}
              change={stats?.high_risk_change}
              sub="open alerts ≥80"
              loading={statsLoading}
              accent="red"
            />
            <StatCard
              label="False Positive Rate"
              value={stats ? `${stats.false_positive_rate}%` : '—'}
              sub={stats ? `${stats.labels_collected} labels collected · next retrain in ${stats.next_retrain_in}` : 'from labeled alerts'}
              loading={statsLoading}
              accent="green"
            />
          </div>

          {/* Labels counter */}
          {stats && stats.labels_collected > 0 && (
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
              padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>
                <span style={{ color: C.textPrimary, fontWeight: 700 }}>{stats.labels_collected}</span>
                {' '}analyst labels collected — next retrain in{' '}
                <span style={{ color: C.textPrimary, fontWeight: 700 }}>{stats.next_retrain_in}</span>
              </span>
              <span style={{ fontSize: 10, padding: '2px 7px', border: `1px solid ${C.border}`, borderRadius: 2, color: C.textMuted, marginLeft: 'auto' }}>
                ACTIVE LEARNING
              </span>
            </div>
          )}

          {/* Feed + Recent alerts */}
          <div className="feed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
            <LiveFeed />

            <div
              style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Recent Alerts
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {alertsLoading
                  ? [...Array(5)].map((_, i) => (
                      <div key={i} style={{ height: 52, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#30363D' }} />
                        <div style={{ flex: 1, height: 10, background: '#30363D', borderRadius: 2 }} />
                        <div style={{ width: 40, height: 10, background: '#30363D', borderRadius: 2 }} />
                      </div>
                    ))
                  : alerts.slice(0, 10).map((alert) => {
                      const color =
                        alert.risk_level === 'critical' || alert.risk_level === 'high'
                          ? C.critical
                          : alert.risk_level === 'medium'
                          ? C.medium
                          : C.low
                      return (
                        <div
                          key={alert.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedAlertId(alert.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAlertId(alert.id) } }}
                          aria-label={`Alert: ${alert.user_name}, ${alert.fraud_type.replace(/_/g, ' ')}, score ${Math.round(alert.risk_score)}`}
                          style={{
                            padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
                            cursor: 'pointer', transition: 'background 0.1s',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1C2128' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {alert.user_name}
                            </p>
                            <p style={{ margin: 0, fontSize: 10, color: C.textMuted }}>
                              {alert.fraud_type.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color, flexShrink: 0 }}>
                            {Math.round(alert.risk_score)}
                          </span>
                        </div>
                      )
                    })}
              </div>
            </div>
          </div>

          {/* Users table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Monitored Employees
              </h2>
              <span style={{ fontSize: 11, color: C.textMuted }}>{users.length} active</span>
            </div>
            <UserTable users={users} loading={usersLoading} />
          </div>
        </main>
      </div>

      <AlertPanel
        alertId={selectedAlertId}
        onClose={() => setSelectedAlertId(null)}
        onResolved={(id, newStatus) => {
          setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a))
          fetchAlerts()
        }}
      />
    </div>
  )
}
