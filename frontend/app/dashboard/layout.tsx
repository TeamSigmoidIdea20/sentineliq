'use client'

import { useEffect, useRef, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import StatusBar from '@/components/StatusBar'
import CommandPalette from '@/components/CommandPalette'
import { api, type Alert } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [eventsPerMin, setEventsPerMin] = useState(0)
  const [healthy, setHealthy] = useState(true)
  const gMode = useRef(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [alertData, stats] = await Promise.all([
          api.alerts({ status: 'open', page_size: 20 }),
          api.stats(),
        ])
        if (!mounted) return
        setAlerts(alertData.alerts)
        setEventsPerMin(Math.round(stats.events_today / 24 / 60))
      } catch { /* silently skip */ }
    }
    load()
    const id = setInterval(load, 5000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    api.health().then(h => setHealthy(h.status === 'ok' || h.models_loaded)).catch(() => setHealthy(false))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); setCmdkOpen(true) }
      if (k === 'escape') setCmdkOpen(false)
      if (gMode.current) {
        const routes: Record<string, string> = { h: '/dashboard', a: '/dashboard/alerts', c: '/dashboard/cases', i: '/dashboard/intelligence', u: '/dashboard/users' }
        if (routes[k]) router.push(routes[k])
        gMode.current = false
      } else if (k === 'g') {
        gMode.current = true
        setTimeout(() => { gMode.current = false }, 800)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  // openAlerts used by TopBar for threat level indicator

  return (
    <div className="app-shell">
      <TopBar onCmdK={() => setCmdkOpen(true)} openAlerts={alerts.length} />
      <Sidebar alertQueue={alerts.length} />
      <main className="main-area">
        {children}
      </main>
      <StatusBar eventsPerMin={eventsPerMin} healthy={healthy} />
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} alerts={alerts} />
      <div className="sim-btn">
        <SimBtn />
      </div>
    </div>
  )
}

function SimBtn() {
  const [busy, setBusy] = useState(false)
  const simulate = async () => {
    setBusy(true)
    try { await api.simulate() } catch { /* ignore */ }
    setBusy(false)
  }
  return (
    <button className="btn danger lg" onClick={simulate} disabled={busy}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
      {busy ? 'Simulating…' : 'Simulate alert'}
    </button>
  )
}
