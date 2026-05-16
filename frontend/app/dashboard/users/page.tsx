'use client'

import { useCallback, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import UserTable from '@/components/UserTable'
import SHAPChart from '@/components/SHAPChart'
import RiskBadge from '@/components/RiskBadge'
import { api, type User, type UserDetail, timeAgo } from '@/lib/api'
import { C, riskColor, riskLevel } from '@/lib/tokens'

function RiskHistoryChart({ history }: { history: { date: string; score: number }[] }) {
  if (!history.length) return null
  const h = 80
  const w = 300
  const max = 100
  const pts = history.map((p, i) => {
    const x = (i / (history.length - 1)) * w
    const y = h - (p.score / max) * h
    return `${x},${y}`
  }).join(' L ')
  const area = `M ${pts.replace(' L ', ' L ')} L ${w},${h} L 0,${h} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.critical} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.critical} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#riskGrad)" />
      <polyline points={pts} fill="none" stroke={C.critical} strokeWidth="1.5" />
    </svg>
  )
}

function UserProfilePanel({
  userId, onClose, onRestrict, onEscalate,
}: {
  userId: string
  onClose: () => void
  onRestrict: (id: string, name: string) => void
  onEscalate: (id: string, name: string) => void
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [restricted, setRestricted] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [banner, setBanner] = useState<{ text: string; color: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    setRestricted(false)
    setEscalated(false)
    setBanner(null)
    api.user(userId)
      .then((d) => {
        setDetail(d)
        setRestricted(d.restricted ?? false)
        setEscalated(d.escalated ?? false)
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [userId])

  const handleRestrict = async () => {
    if (restricted || !detail) return
    await api.restrictUser(userId).catch(() => null)
    setRestricted(true)
    const msg = `Access restricted for ${detail.name}. All active sessions terminated. Security team notified.`
    setBanner({ text: msg, color: '#DC2626' })
    onRestrict(userId, detail.name)
  }

  const handleEscalate = async () => {
    if (escalated || !detail) return
    await api.escalateUser(userId).catch(() => null)
    setEscalated(true)
    const ref = `ESC-${Math.floor(1000 + Math.random() * 9000)}`
    setBanner({ text: `Case escalated to Senior Investigator. Reference: ${ref}`, color: '#D97706' })
    onEscalate(userId, detail.name)
  }

  return (
    <aside
      className="panel-full panel-slide-in"
      style={{
        width: 480, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
        background: C.card, borderLeft: `1px solid ${C.border}`,
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>User Profile</span>
        <button
          onClick={onClose}
          aria-label="Close user profile"
          style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
        >
          ×
        </button>
      </div>

      {loading && (
        <div style={{ padding: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 14, background: '#30363D', borderRadius: 2, marginBottom: 12, width: [80, 140, 100, 120, 90, 110][i] }} />
          ))}
        </div>
      )}

      {!loading && detail && (
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: riskColor(detail.risk_score),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 800, color: '#F0F6FC', flexShrink: 0,
              }}
            >
              {detail.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{detail.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textMuted }}>
                {detail.role.replace(/_/g, ' ')} · {detail.department.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: riskColor(detail.risk_score) }}>
              {Math.round(detail.risk_score)}
            </span>
            <div>
              <RiskBadge level={riskLevel(detail.risk_score)} score={detail.risk_score} />
              <p style={{ margin: '4px 0 0', fontSize: 10, color: C.textMuted }}>
                Last seen {timeAgo(detail.last_seen)} · {detail.location}
              </p>
            </div>
          </div>

          {/* Risk history chart */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              30-Day Risk History
            </p>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '12px 14px', overflow: 'hidden' }}>
              <RiskHistoryChart history={detail.risk_history} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 9, color: C.textMuted }}>30d ago</span>
                <span style={{ fontSize: 9, color: C.textMuted }}>Today</span>
              </div>
            </div>
          </div>

          {/* Recent alerts */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Linked Alerts ({detail.recent_alerts.length})
            </p>
            {detail.recent_alerts.length === 0 && (
              <p style={{ fontSize: 12, color: C.textMuted }}>No recent alerts.</p>
            )}
            {detail.recent_alerts.slice(0, 4).map((alert) => {
              const color = alert.risk_level === 'critical' || alert.risk_level === 'high' ? C.critical : alert.risk_level === 'medium' ? C.medium : C.low
              return (
                <div
                  key={alert.id}
                  style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.fraud_type.replace(/_/g, ' ')}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: C.textMuted }}>{timeAgo(alert.timestamp)}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{Math.round(alert.risk_score)}</span>
                </div>
              )
            })}
          </div>

          {/* SHAP from most recent alert */}
          {detail.recent_alerts[0]?.shap_values?.length > 0 && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Top Risk Factors (Latest Alert)
              </p>
              <SHAPChart values={detail.recent_alerts[0].shap_values} />
            </div>
          )}

          {/* Actions */}
          {banner && (
            <div
              role="status"
              aria-live="polite"
              style={{
                padding: '10px 12px', fontSize: 11, color: '#F0F6FC',
                background: `${banner.color}22`, border: `1px solid ${banner.color}`, borderRadius: 3,
                lineHeight: 1.5,
              }}
            >
              {banner.text}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <button
              className="btn-action"
              onClick={handleRestrict}
              disabled={restricted}
              style={{
                padding: '9px 0', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                background: restricted ? '#30363D' : C.critical,
                border: 'none', color: restricted ? C.textMuted : '#F0F6FC',
                borderRadius: 3, cursor: restricted ? 'default' : 'pointer',
              }}
            >
              {restricted ? 'ACCESS RESTRICTED' : 'RESTRICT ACCESS'}
            </button>
            <button
              className="btn-action"
              onClick={handleEscalate}
              disabled={escalated}
              style={{
                padding: '9px 0', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                background: escalated ? `${C.amber}22` : 'transparent',
                border: `1px solid ${escalated ? C.amber : C.border}`,
                color: escalated ? C.amber : C.textMuted,
                borderRadius: 3, cursor: escalated ? 'default' : 'pointer',
              }}
            >
              {escalated ? 'ESCALATED' : 'ESCALATE CASE'}
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [watchlistFilter, setWatchlistFilter] = useState<'all' | 'watchlist'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [restrictedUsers, setRestrictedUsers] = useState<Set<string>>(new Set())
  const [watchlist, setWatchlist] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('sentinel_watchlist')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set()
    }
  })

  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try {
        localStorage.setItem('sentinel_watchlist', JSON.stringify(Array.from(next)))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }

  const fetchUsers = useCallback(async () => {
    try {
      const u = await api.users()
      setUsers(u)
    } catch {
      // backend starting up
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 15000)
    return () => clearInterval(interval)
  }, [fetchUsers])

  // Sort: watchlisted first, then by risk_score descending
  const q = searchQuery.trim().toLowerCase()
  const displayedUsers = users
    .filter((u) => watchlistFilter === 'all' || watchlist.has(u.id))
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
    .sort((a, b) => {
      const aW = watchlist.has(a.id) ? 1 : 0
      const bW = watchlist.has(b.id) ? 1 : 0
      if (aW !== bW) return bW - aW
      return b.risk_score - a.risk_score
    })

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <div
          style={{
            height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', borderBottom: `1px solid ${C.border}`,
            background: C.card, flexShrink: 0,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>User Monitoring</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: C.textMuted }}>INTERNAL NETWORK: BANK_CORP_01</span>
            <span style={{ fontSize: 11, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 3, padding: '3px 8px' }}>
              {users.length} Active Employees
            </span>
          </div>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Monitoring Queue
              </h2>
              {/* Watchlist filter tabs */}
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', 'watchlist'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setWatchlistFilter(tab)}
                    style={{
                      padding: '4px 10px', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      background: watchlistFilter === tab ? C.textPrimary : 'transparent',
                      border: `1px solid ${watchlistFilter === tab ? C.textPrimary : C.border}`,
                      color: watchlistFilter === tab ? C.bg : C.textMuted,
                      borderRadius: 3, cursor: 'pointer',
                    }}
                  >
                    {tab === 'all' ? 'All' : `Watchlist${watchlist.size > 0 ? ` (${watchlist.size})` : ''}`}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(displayedUsers, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `sentineliq-users-${new Date().toISOString().slice(0, 10)}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              style={{
                padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                borderRadius: 3, cursor: 'pointer',
              }}
            >
              EXPORT REPORT
            </button>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or user ID..."
            style={{
              width: '100%', padding: '8px 12px', marginBottom: 12,
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 0,
              color: C.textPrimary, fontSize: 12, fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#4D5562' }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = C.border }}
          />

          <UserTable
            users={displayedUsers}
            loading={loading}
            onSelectUser={setSelectedUserId}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            restrictedUsers={restrictedUsers}
          />
        </main>
      </div>

      {selectedUserId && (
        <UserProfilePanel
          key={selectedUserId}
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRestrict={(id) => setRestrictedUsers((prev) => new Set([...prev, id]))}
          onEscalate={() => {}}
        />
      )}
    </div>
  )
}
