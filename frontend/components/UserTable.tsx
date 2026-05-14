'use client'

import { useMemo } from 'react'
import { Star } from 'lucide-react'
import type { User } from '@/lib/api'
import { timeAgo } from '@/lib/api'
import { C, riskColor, riskLevel } from '@/lib/tokens'
import RiskBadge from './RiskBadge'

function TrendArrow({ trend }: { trend?: string }) {
  if (trend === 'up') return <span style={{ fontSize: 13, color: C.critical, fontWeight: 700 }}>↑</span>
  if (trend === 'down') return <span style={{ fontSize: 13, color: C.low, fontWeight: 700 }}>↓</span>
  return <span style={{ fontSize: 13, color: C.textMuted }}>→</span>
}

function MiniSparkline({ score, userId }: { score: number; userId: string }) {
  const points = useMemo(() => {
    const seed = userId.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0)
    return Array.from({ length: 7 }, (_, i) => {
      const pseudo = Math.sin(seed + i * 127.1) * 0.5 + 0.5
      const jitter = (pseudo - 0.5) * 20
      return Math.max(0, Math.min(100, score + jitter))
    })
  }, [userId, score])
  const max = 100
  const h = 28
  const w = 60
  const path = points
    .map((v, i) => `${(i / 6) * w},${h - (v / max) * h}`)
    .join(' L ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={path} fill="none" stroke={riskColor(score)} strokeWidth="1.5" />
    </svg>
  )
}

interface Props {
  users: User[]
  loading?: boolean
  onSelectUser?: (id: string) => void
  watchlist?: Set<string>
  onToggleWatchlist?: (id: string) => void
}

export default function UserTable({ users, loading, onSelectUser, watchlist, onToggleWatchlist }: Props) {
  if (loading) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ height: 52, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#30363D' }} />
            {[100, 80, 60, 50, 70].map((w, j) => (
              <div key={j} style={{ height: 10, width: w, background: '#30363D', borderRadius: 2 }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {onToggleWatchlist && (
              <th style={{ width: 36, padding: '10px 14px' }} />
            )}
            {['User', 'Role', 'Department', 'Risk Score', '7d Trend', 'Last Active', ''].map((h) => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.textMuted, fontWeight: 600, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const level = riskLevel(user.risk_score)
            const isWatched = watchlist?.has(user.id) ?? false
            return (
              <tr
                key={user.id}
                tabIndex={onSelectUser ? 0 : undefined}
                role={onSelectUser ? 'button' : undefined}
                aria-label={onSelectUser ? `View profile for ${user.name}` : undefined}
                onClick={() => onSelectUser?.(user.id)}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onSelectUser) { e.preventDefault(); onSelectUser(user.id) } }}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  cursor: onSelectUser ? 'pointer' : 'default',
                  background: isWatched ? C.hover : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.hover }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isWatched ? C.hover : 'transparent' }}
              >
                {onToggleWatchlist && (
                  <td style={{ padding: '10px 14px', width: 36 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleWatchlist(user.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                      aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      <Star
                        size={14}
                        color={isWatched ? C.amber : C.textMuted}
                        fill={isWatched ? C.amber : 'none'}
                        strokeWidth={2}
                      />
                    </button>
                  </td>
                )}
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: riskColor(user.risk_score),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#F0F6FC', flexShrink: 0,
                      }}
                    >
                      {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p style={{ margin: 0, color: C.textPrimary, fontWeight: 500, fontSize: 12 }}>{user.name}</p>
                      <p style={{ margin: 0, color: C.textMuted, fontSize: 10 }}>{user.id}</p>
                    </div>
                    {isWatched && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, color: C.amber,
                        border: `1px solid ${C.amber}`, borderRadius: 2,
                        padding: '1px 5px', letterSpacing: '0.05em', marginLeft: 4,
                      }}>
                        WATCH
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '10px 14px', color: C.textMuted, textTransform: 'capitalize' }}>
                  {user.role.replace('_', ' ')}
                </td>
                <td style={{ padding: '10px 14px', color: C.textMuted }}>
                  {user.department.replace('_', ' ')}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: riskColor(user.risk_score) }}>
                      {Math.round(user.risk_score)}
                    </span>
                    <TrendArrow trend={user.risk_trend} />
                    <RiskBadge level={level} size="sm" />
                  </div>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <MiniSparkline score={user.risk_score} userId={user.id} />
                </td>
                <td style={{ padding: '10px 14px', color: C.textMuted }}>
                  {timeAgo(user.last_seen)}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {onSelectUser && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectUser(user.id) }}
                      style={{
                        fontSize: 10, padding: '4px 8px', borderRadius: 3,
                        background: 'transparent', border: `1px solid ${C.border}`,
                        color: C.textMuted, cursor: 'pointer', fontWeight: 600, letterSpacing: '0.04em',
                      }}
                    >
                      VIEW
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {users.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
          No users found.
        </div>
      )}
    </div>
  )
}
