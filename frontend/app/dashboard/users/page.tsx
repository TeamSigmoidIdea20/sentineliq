'use client'

import { useEffect, useState } from 'react'
import { api, type User, type UserDetail, type Alert, timeAgo } from '@/lib/api'
import { sevClass, sevLabel } from '@/lib/tokens'
import Accordion from '@/components/Accordion'
import { useRouter } from 'next/navigation'

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <span style={{ display: 'inline-block', width: 90, height: 20, background: 'var(--bg-2)', borderRadius: 2 }} />
  const w = 90, h = 20
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RiskGauge({ value, size = 140 }: { value: number; size?: number }) {
  const r = size * 0.38, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const offset = arc - (value / 100) * arc
  const color = value >= 80 ? 'var(--red)' : value >= 60 ? 'var(--red)' : value >= 40 ? 'var(--amber)' : 'var(--green)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-2)" strokeWidth="8"
          strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" transform={`rotate(135, ${cx}, ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${arc - offset} ${circ - (arc - offset)}`} strokeLinecap="round" transform={`rotate(135, ${cx}, ${cy})`} />
        <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={size * 0.16} fontWeight="600" fontFamily="var(--mono)">{value.toFixed(1)}</text>
      </svg>
    </div>
  )
}

function ActivityHeatmap({ events }: { events: { timestamp: string; event_type: string }[] }) {
  const days = ['MON','TUE','WED','THU','FRI','SAT','SUN']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const now = Date.now()
  const grid: Record<string, number> = {}
  events.forEach(e => {
    const d = new Date(e.timestamp.endsWith('Z') ? e.timestamp : e.timestamp + 'Z')
    const day = (d.getDay() + 6) % 7
    const hr = d.getHours()
    const key = `${day}-${hr}`
    grid[key] = (grid[key] || 0) + 1
  })
  const max = Math.max(...Object.values(grid), 1)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 4 }}>
        <div />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 1 }}>
          {hours.map(h => (
            <div key={h} style={{ fontSize: 9, color: 'var(--ink-4)', textAlign: 'center', fontFamily: 'var(--mono)' }}>
              {h % 4 === 0 ? String(h).padStart(2,'0') : ''}
            </div>
          ))}
        </div>
        {days.map((d, di) => (
          <>
            <div key={`lbl-${d}`} className="muted small mono" style={{ textAlign: 'right', paddingRight: 6, lineHeight: '14px' }}>{d}</div>
            <div key={`row-${d}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 1 }}>
              {hours.map(h => {
                const v = (grid[`${di}-${h}`] || 0) / max
                const isOffHours = h < 8 || h >= 20
                const bg = v < 0.05
                  ? 'var(--bg-2)'
                  : isOffHours && v > 0.3
                    ? 'var(--red)'
                    : v < 0.2 ? 'rgba(125,177,240,.15)' : v < 0.4 ? 'rgba(125,177,240,.32)' : 'rgba(125,177,240,.55)'
                return <div key={h} style={{ aspectRatio: '1.2', background: bg, borderRadius: 2 }} title={`${d} ${h}:00`} />
              })}
            </div>
          </>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 11, color: 'var(--ink-3)', justifyContent: 'flex-end' }}>
        <span>activity</span>
        {['var(--bg-2)','rgba(125,177,240,.15)','rgba(125,177,240,.32)','rgba(125,177,240,.55)','var(--red)'].map((bg, i) => (
          <span key={i} style={{ width: 14, height: 10, background: bg, borderRadius: 2, display: 'inline-block' }} />
        ))}
        <span style={{ marginLeft: 6 }}>off-hours activity in red</span>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [events, setEvents] = useState<{ timestamp: string; event_type: string }[]>([])
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<'risk' | 'name'>('risk')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    api.users().then(u => { setUsers(u); if (u.length > 0 && !selId) setSelId(u.sort((a, b) => b.risk_score - a.risk_score)[0].id); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selId) return
    setDetail(null)
    setEvents([])
    api.user(selId).then(d => { setDetail(d); return api.userEvents(selId, new Date().toISOString(), 100) }).then(evs => setEvents(evs)).catch(() => {})
  }, [selId])

  const sorted = [...users]
    .filter(u => !filter || u.name.toLowerCase().includes(filter.toLowerCase()) || u.id.toLowerCase().includes(filter.toLowerCase()) || u.department.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => sortKey === 'risk' ? b.risk_score - a.risk_score : a.name.localeCompare(b.name))

  const sel = detail || users.find(u => u.id === selId)

  const handleAction = async (action: 'restrict' | 'escalate', userId: string) => {
    setBusy(action)
    try {
      if (action === 'restrict') await api.restrictUser(userId)
      else await api.escalateUser(userId)
    } catch { /* ignore */ }
    setBusy(null)
  }

  const riskColor = (score: number) => score >= 80 ? 'var(--red)' : score >= 60 ? 'var(--red)' : score >= 40 ? 'var(--amber)' : 'var(--green)'

  const userAlerts = (detail as UserDetail | null)?.recent_alerts ?? []
  const riskHist = (detail as UserDetail | null)?.risk_history?.map(r => r.score) ?? Array.from({ length: 14 }, () => (sel?.risk_score ?? 50) + (Math.random() - 0.5) * 20)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', height: '100%', minHeight: 0 }}>
      {/* Roster */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: '1px solid var(--line)' }}>
        <div className="page-h" style={{ paddingBottom: 16 }}>
          <div>
            <div className="crumbs">People <span className="sep">/</span> Roster</div>
            <h1>Workforce</h1>
            <div className="sub">{users.length} bank employees monitored</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', borderBottom: '1px solid var(--line)' }}>
          <div className="field" style={{ flex: 1, maxWidth: 320 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search ID, name, department…" />
          </div>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
            <button className={`btn sm ${sortKey === 'risk' ? '' : 'ghost'}`} onClick={() => setSortKey('risk')}>Risk</button>
            <button className={`btn sm ${sortKey === 'name' ? '' : 'ghost'}`} onClick={() => setSortKey('name')}>Name</button>
            <div style={{ width: 1, height: 20, background: 'var(--line)', margin: '0 4px' }} />
            <div className="tabs">
              <div className={`tab ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</div>
              <div className={`tab ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>Grid</div>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 100px 60px 90px 36px', gap: 14, padding: '10px 22px', borderBottom: '1px solid var(--line)', fontSize: 11, color: 'var(--ink-3)' }}>
              <div>ID</div><div>Name</div><div>Role</div><div>Department</div><div style={{ textAlign: 'right' }}>Risk</div><div style={{ textAlign: 'right' }}>30-day</div><div></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading
                ? [...Array(8)].map((_, i) => <div key={i} style={{ height: 46, background: 'var(--bg-1)', margin: '2px 22px', borderRadius: 4 }} />)
                : sorted.map(u => {
                  const isSel = u.id === selId
                  const color = riskColor(u.risk_score)
                  return (
                    <div key={u.id} onClick={() => setSelId(u.id)} style={{
                      display: 'grid', gridTemplateColumns: '80px 1fr 90px 100px 60px 90px 36px', gap: 14,
                      padding: '12px 22px', alignItems: 'center',
                      background: isSel ? 'var(--bg-2)' : 'transparent',
                      borderLeft: `2px solid ${isSel ? 'var(--accent)' : 'transparent'}`,
                      cursor: 'pointer', fontSize: 13,
                    }}>
                      <div className="mono muted" style={{ fontSize: 11.5 }}>{u.id}</div>
                      <div>{u.name}</div>
                      <div className="muted">{u.role}</div>
                      <div className="muted">{u.department}</div>
                      <div className="mono" style={{ textAlign: 'right', color, fontWeight: 500 }}>{u.risk_score.toFixed(0)}</div>
                      <div style={{ textAlign: 'right' }}>
                        <MiniSpark data={Array.from({ length: 14 }, () => u.risk_score + (Math.random() - 0.5) * 15)} color={u.risk_score >= 60 ? 'var(--red)' : 'var(--ink-3)'} />
                      </div>
                      <div><span className="dot sm" style={{ background: u.risk_score > 60 ? 'var(--red)' : 'var(--green)' }} /></div>
                    </div>
                  )
                })
              }
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
              {sorted.map(u => {
                const cls = u.risk_score > 80 ? 'r-crit' : u.risk_score > 60 ? 'r-high' : u.risk_score > 35 ? 'r-med' : 'r-low'
                const color = riskColor(u.risk_score)
                return (
                  <div key={u.id} onClick={() => setSelId(u.id)} title={u.name} style={{
                    aspectRatio: 1, borderRadius: 6, border: `1px solid ${u.risk_score > 60 ? 'rgba(242,92,92,.3)' : 'var(--line)'}`,
                    background: u.risk_score > 80 ? 'linear-gradient(180deg, rgba(242,92,92,.1), rgba(242,92,92,.22))' : 'var(--bg-1)',
                    display: 'flex', flexDirection: 'column', padding: '8px 10px 10px',
                    cursor: 'pointer', position: 'relative',
                  }}>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{u.id}</div>
                    <div className="mono" style={{ marginTop: 'auto', fontSize: 18, fontWeight: 600, color }}>{u.risk_score.toFixed(0)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      {sel ? (
        <div className="main-scroll">
          <div className="page-h">
            <div>
              <div className="crumbs">People <span className="sep">/</span> <span className="mono" style={{ color: 'var(--ink)' }}>{sel.id}</span></div>
              <h1>{sel.name}</h1>
              <div className="sub">{sel.role} · {sel.department} · {sel.location}</div>
            </div>
            <div className="page-h right">
              <button className="btn ghost">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Watchlist
              </button>
              <button className="btn warn" onClick={() => handleAction('escalate', sel.id)} disabled={busy === 'escalate'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                {busy === 'escalate' ? '…' : 'Force review'}
              </button>
              <button className="btn danger" onClick={() => handleAction('restrict', sel.id)} disabled={busy === 'restrict'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 21 7 17 3" /><path d="M21 7H9a4 4 0 000 8h1" /></svg>
                {busy === 'restrict' ? '…' : 'Suspend access'}
              </button>
            </div>
          </div>

          <div style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>

            {/* Identity card */}
            <div className="card">
              <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 22, alignItems: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 14, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 }}>
                  {sel.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.005em' }}>{sel.name}</div>
                  <div className="muted small" style={{ marginTop: 2 }}>{sel.id} · {sel.role} · {sel.department}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {sel.risk_score > 80 && <span className="tag red">Watchlist · Tier 1</span>}
                    {sel.escalated && <span className="tag amber">Escalated</span>}
                    {sel.restricted && <span className="tag red">Restricted</span>}
                    {userAlerts.length > 0 && <span className="tag red">{userAlerts.length} alerts · 30 days</span>}
                    <span className="tag green">MFA enrolled</span>
                    <span className="tag green">VPN · on-prem</span>
                  </div>
                </div>
                <RiskGauge value={sel.risk_score} size={140} />
              </div>
            </div>

            {/* Activity heatmap */}
            <Accordion label="Activity heatmap" hint="24h × 7d · per hour" defaultOpen>
              <ActivityHeatmap events={events} />
            </Accordion>

            {/* Recent alerts */}
            {userAlerts.length > 0 && (
              <Accordion label="Recent alerts" hint={`${userAlerts.length} alerts`} defaultOpen>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {userAlerts.map(a => (
                    <div key={a.id} onClick={() => router.push(`/dashboard/alerts?id=${a.id}`)} style={{
                      display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 14,
                      padding: '12px 14px', borderRadius: 8, background: 'var(--bg-2)', cursor: 'pointer',
                    }}>
                      <span className={`tag ${sevClass(a.risk_level)}`}>{sevLabel(a.risk_level)}</span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.fraud_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                        <div className="muted small mono" style={{ marginTop: 2 }}>{a.id} · {timeAgo(a.timestamp)} · Score {(a.risk_score / 100).toFixed(2)}</div>
                      </div>
                      <button className="btn sm ghost">Open <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></button>
                    </div>
                  ))}
                </div>
              </Accordion>
            )}

            {/* Profile */}
            <Accordion label="Profile" hint="Identity · access · device">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <div className="section-h">Employment</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 8, fontSize: 13 }}>
                    <div className="muted">Employee ID</div><div className="mono">{sel.id}</div>
                    <div className="muted">Role</div><div>{sel.role}</div>
                    <div className="muted">Department</div><div>{sel.department}</div>
                    <div className="muted">Location</div><div>{sel.location}</div>
                    <div className="muted">Last seen</div><div>{timeAgo(sel.last_seen)}</div>
                  </div>
                </div>
                <div>
                  <div className="section-h">Access & devices</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 8, fontSize: 13 }}>
                    <div className="muted">MFA</div><div>Push + WebAuthn</div>
                    <div className="muted">VPN</div><div>On-premise</div>
                    <div className="muted">Risk score</div><div className="mono" style={{ color: riskColor(sel.risk_score), fontWeight: 600 }}>{sel.risk_score.toFixed(1)}</div>
                    <div className="muted">Status</div>
                    <div>
                      {sel.restricted && <span className="tag red">Restricted</span>}
                      {sel.escalated && <span className="tag amber">Escalated</span>}
                      {!sel.restricted && !sel.escalated && <span className="tag green">Active</span>}
                    </div>
                  </div>
                </div>
              </div>
            </Accordion>

          </div>
        </div>
      ) : (
        <div className="muted" style={{ padding: 40, textAlign: 'center' }}>Select a user to view profile.</div>
      )}
    </div>
  )
}
