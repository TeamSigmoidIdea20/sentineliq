'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, type Alert, type Stats, type User, timeAgo } from '@/lib/api'
import { sevClass, sevLabel } from '@/lib/tokens'
import Accordion from '@/components/Accordion'

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const w = 80, h = 18
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StaticSparkline({ color, data }: { color: string; data: number[] }) {
  const w = 300, h = 56
  if (data.length < 2) return <div style={{ height: h, background: 'var(--bg-2)', borderRadius: 4 }} />
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((v - min) / range) * (h - 4) - 2 }))
  const line = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')} L ${w},${h} L 0,${h} Z`
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={area} fill={color} fillOpacity={0.12} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MonitorPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [banner, setBanner] = useState<Alert | null>(null)
  const prevAlertIds = useRef<Set<string>>(new Set())
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pulse, setPulse] = useState<number[]>(() => Array.from({ length: 24 }, () => 700 + Math.random() * 300))

  useEffect(() => {
    const id = setInterval(() => setPulse(p => [...p.slice(1), 700 + Math.random() * 350]), 1200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [aData, sData, uData] = await Promise.all([api.alerts({ page_size: 20 }), api.stats(), api.users()])
        if (!mounted) return
        const newIds = aData.alerts.map(a => a.id)
        const newOnes = newIds.filter(id => prevAlertIds.current.size > 0 && !prevAlertIds.current.has(id))
        prevAlertIds.current = new Set(newIds)
        if (newOnes.length > 0) {
          const newest = aData.alerts.find(a => a.id === newOnes[0])
          if (newest) {
            setBanner(newest)
            if (bannerTimer.current) clearTimeout(bannerTimer.current)
            bannerTimer.current = setTimeout(() => setBanner(null), 6500)
          }
        }
        setAlerts(aData.alerts)
        setStats(sData)
        setUsers(uData)
      } catch { /* backend not ready */ }
    }
    load()
    const id = setInterval(load, 5000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const openAlerts = alerts.filter(a => a.status === 'open')
  const critAlerts = openAlerts.filter(a => a.risk_level === 'critical')
  const highAlerts = openAlerts.filter(a => a.risk_level === 'high')
  const medAlerts  = openAlerts.filter(a => a.risk_level === 'medium')
  const heroAlert  = critAlerts[0] || highAlerts[0]
  const recentAlerts = openAlerts.filter(a => a.id !== heroAlert?.id).slice(0, 5)

  const tiers = {
    crit:   users.filter(u => u.risk_score > 80).length,
    high:   users.filter(u => u.risk_score > 60 && u.risk_score <= 80).length,
    watch:  users.filter(u => u.risk_score > 35 && u.risk_score <= 60).length,
    normal: users.filter(u => u.risk_score <= 35).length,
    offline: 4,
  }

  const evtPerMin = stats ? Math.round(stats.events_today / 24 / 60) : 0
  const online = users.length > 0 ? users.length - tiers.offline : 46
  const threatColor = critAlerts.length > 0 ? 'var(--red)' : highAlerts.length > 0 ? 'var(--amber)' : 'var(--green)'
  const threatLabel = critAlerts.length > 0 ? 'Elevated' : highAlerts.length > 0 ? 'Guarded' : 'Normal'

  const navToAlert = (id: string) => router.push(`/dashboard/alerts?id=${id}`)

  return (
    <div className="main-scroll">
      {banner && (
        <div className="alert-banner" onClick={() => { navToAlert(banner.id); setBanner(null) }}>
          <span className="dot" style={{ background: '#fff', width: 8, height: 8 }} />
          <span>New {banner.risk_level} alert · {banner.user_name} · {banner.fraud_type.replace(/_/g, ' ')}</span>
          <button className="btn sm" style={{ background: 'rgba(255,255,255,.20)', border: '1px solid rgba(255,255,255,.45)', color: '#fff' }}>Review →</button>
        </div>
      )}

      <div className="page-h">
        <div>
          <div className="crumbs">Home <span className="sep">/</span> Live operations</div>
          <h1>Operations overview</h1>
          <div className="sub">Real-time detection across {users.length || 50} bank employees · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST</div>
        </div>
        <div className="page-h right">
          <button className="btn ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            Filter
          </button>
          <button className="btn" onClick={() => api.simulate()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            Simulate alert
          </button>
        </div>
      </div>

      <div style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>

        <div className="grid-4">
          <div className={`metric ${critAlerts.length > 0 ? 'alert' : ''}`}>
            <div className="lbl"><IcoAlert />Open alerts</div>
            <div className="val">{openAlerts.length}</div>
            <div className="delta up">{critAlerts.length} critical · {highAlerts.length} high · {medAlerts.length} med</div>
          </div>
          <div className="metric">
            <div className="lbl"><IcoDiamond />Threat level</div>
            <div className="val" style={{ color: threatColor }}>{threatLabel}</div>
            <div className="delta">Ensemble model · IF · LSTM · XGB</div>
          </div>
          <div className="metric">
            <div className="lbl"><IcoUsers />Workforce online</div>
            <div className="val">{online}<span className="unit">/ {users.length || 50}</span></div>
            <div className="delta">2 logged in within the hour</div>
          </div>
          <div className="metric">
            <div className="lbl"><IcoBolt />Events / min</div>
            <div className="val">{evtPerMin || '—'}</div>
            <div className="delta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MiniSparkline data={pulse} /> Last 24 min
            </div>
          </div>
        </div>

        {heroAlert && (
          <div className="card" style={{
            borderColor: heroAlert.risk_level === 'critical' ? 'rgba(242,92,92,.35)' : 'var(--line)',
            background: heroAlert.risk_level === 'critical' ? 'linear-gradient(180deg, var(--bg-1), rgba(242,92,92,.04))' : 'var(--bg-1)',
          }}>
            <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span className={`tag ${sevClass(heroAlert.risk_level)}`}>● Needs attention</span>
                  <span className="muted small">{timeAgo(heroAlert.timestamp)} · {heroAlert.id}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.01em' }}>
                  {heroAlert.user_name} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>flagged for</span> {heroAlert.fraud_type.replace(/_/g, ' ').toLowerCase()}
                </div>
                <div className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>
                  Ensemble confidence <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{Math.round(heroAlert.risk_score)}%</span>
                  {heroAlert.shap_values?.[0] && (
                    <> · top driver <span className="mono" style={{ color: 'var(--ink)' }}>{heroAlert.shap_values[0].feature}</span> contributing
                    <span style={{ color: heroAlert.shap_values[0].direction === 'positive' ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>
                      {' '}{heroAlert.shap_values[0].direction === 'positive' ? '+' : ''}{heroAlert.shap_values[0].contribution.toFixed(2)}
                    </span>
                    </>
                  )}
                  {' '}· subject is <span style={{ color: 'var(--red)', fontWeight: 500 }}>{(heroAlert.model_scores.isolation_forest * 4.1).toFixed(1)}σ</span> above peer baseline
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn ghost">Snooze</button>
                <button className="btn primary lg" onClick={() => navToAlert(heroAlert.id)}>Review alert →</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--gap)' }}>
          <div className="card">
            <div className="card-h">
              <span className="title">Open alerts</span>
              <span className="sub">{openAlerts.length} unresolved</span>
              <div className="right">
                <button className="btn sm ghost" onClick={() => router.push('/dashboard/alerts')}>View queue →</button>
              </div>
            </div>
            <div className="card-b tight">
              {recentAlerts.length === 0
                ? <div className="muted" style={{ padding: 24, textAlign: 'center' }}>All clear. No additional open alerts.</div>
                : recentAlerts.map(a => <AlertRow key={a.id} alert={a} onClick={() => navToAlert(a.id)} />)
              }
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <span className="title">Workforce posture</span>
              <span className="sub">By risk tier</span>
              <div className="right">
                <button className="btn sm ghost" onClick={() => router.push('/dashboard/users')}>View people →</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 18 }}>
              {[
                { cls: 'crit',   lbl: 'Critical', n: tiers.crit },
                { cls: 'high',   lbl: 'Elevated',  n: tiers.high },
                { cls: 'watch',  lbl: 'Watch',      n: tiers.watch },
                { cls: 'normal', lbl: 'Normal',     n: tiers.normal },
                { cls: '',       lbl: 'Offline',    n: tiers.offline, numColor: 'var(--ink-3)' },
                { cls: '',       lbl: 'Total',      n: users.length || 50, numColor: 'var(--ink)', barColor: 'var(--accent)' },
              ].map(({ cls, lbl, n, numColor, barColor }) => (
                <div key={lbl} className={`wf-tier ${cls}`}>
                  <div className="lbl">{lbl}</div>
                  <div className="num" style={numColor ? { color: numColor } : {}}>{n}</div>
                  <div className="bar" style={barColor ? { background: barColor } : {}} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <Accordion label="System health & model performance" hint="Latency, drift, model votes — last 24h">
          <div className="grid-3">
            <div>
              <div className="section-h">Inference latency</div>
              <StaticSparkline data={[80,86,84,90,102,88,84,92,110,96,88,84]} color="var(--green)" />
              <div className="muted small" style={{ marginTop: 8 }}>p50 <span style={{ color: 'var(--ink)' }}>84ms</span> · p95 <span style={{ color: 'var(--ink)' }}>312ms</span></div>
            </div>
            <div>
              <div className="section-h">Event ingestion</div>
              <StaticSparkline data={[640,720,810,870,920,940,920,880,950,1020,980,evtPerMin||847]} color="var(--accent)" />
              <div className="muted small" style={{ marginTop: 8 }}>Now <span style={{ color: 'var(--ink)' }}>{evtPerMin||847}/min</span> · Peak <span style={{ color: 'var(--ink)' }}>1,062/min</span></div>
            </div>
            <div>
              <div className="section-h">Model drift (PSI)</div>
              <StaticSparkline data={[0.04,0.05,0.06,0.05,0.08,0.11,0.09]} color="var(--amber)" />
              <div className="muted small" style={{ marginTop: 8 }}>PSI <span style={{ color: 'var(--amber)' }}>0.09</span> · Retrain in 6d</div>
            </div>
          </div>
        </Accordion>

      </div>
    </div>
  )
}

function AlertRow({ alert, onClick }: { alert: Alert; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto 16px', alignItems: 'center', gap: 14,
      padding: '12px 20px', borderTop: '1px solid var(--line-soft)',
      background: hov ? 'var(--bg-2)' : 'transparent', cursor: 'pointer', transition: 'background .12s',
    }}>
      <span className={`tag ${sevClass(alert.risk_level)}`} style={{ fontSize: 10.5 }}>{sevLabel(alert.risk_level)}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--ink)', fontSize: 13.5, fontWeight: 500 }}>{alert.user_name} · {alert.fraud_type.replace(/_/g, ' ')}</div>
        <div className="muted small" style={{ marginTop: 2 }}>{alert.user_id} · Score {(alert.risk_score / 100).toFixed(2)}</div>
      </div>
      <div className="muted mono small">{timeAgo(alert.timestamp)}</div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
    </div>
  )
}

function IcoAlert() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg> }
function IcoDiamond() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> }
function IcoUsers() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg> }
function IcoBolt() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> }
