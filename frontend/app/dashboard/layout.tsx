'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import CommandPalette from '@/components/CommandPalette'
import { api, type Alert } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const gMode = useRef(false)

  useEffect(() => {
    const load = () => api.alerts({ status: 'open', page_size: 20 }).then(r => setAlerts(r.alerts)).catch(() => null)
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); setCmdkOpen(true); return }
      if (k === 'escape') { setCmdkOpen(false); return }
      if (gMode.current) {
        const routes: Record<string, string> = {
          h: '/dashboard', a: '/dashboard/alerts', c: '/dashboard/cases',
          i: '/dashboard/intelligence', u: '/dashboard/users',
        }
        if (routes[k]) { router.push(routes[k]) }
        gMode.current = false
      } else if (k === 'g' && !e.ctrlKey && !e.metaKey) {
        gMode.current = true
        setTimeout(() => { gMode.current = false }, 800)
      }
    }
    window.addEventListener('keydown', onKey)
    const onCustom = () => setCmdkOpen(true)
    window.addEventListener('sentinel:cmdk', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('sentinel:cmdk', onCustom)
    }
  }, [router])

  return (
    <>
      {children}
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} alerts={alerts} />
    </>
  )
}
