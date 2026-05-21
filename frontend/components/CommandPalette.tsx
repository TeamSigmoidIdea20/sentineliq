'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Alert } from '@/lib/api'
import { sevLabel } from '@/lib/tokens'

interface Props {
  open: boolean
  onClose: () => void
  alerts?: Alert[]
}

export default function CommandPalette({ open, onClose, alerts = [] }: Props) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 0) }
  }, [open])

  const actions = useMemo(() => [
    { id: 'go.home',    lbl: 'Go to Home',       desc: 'G H', run: () => router.push('/dashboard') },
    { id: 'go.alerts',  lbl: 'Go to Alerts',     desc: 'G A', run: () => router.push('/dashboard/alerts') },
    { id: 'go.cases',   lbl: 'Go to Cases',      desc: 'G C', run: () => router.push('/dashboard/cases') },
    { id: 'go.intel',   lbl: 'Go to Insights',   desc: 'G I', run: () => router.push('/dashboard/intelligence') },
    { id: 'go.users',   lbl: 'Go to People',     desc: 'G U', run: () => router.push('/dashboard/users') },
  ], [router])

  const alertItems = alerts.slice(0, 6).map(a => ({
    id: a.id,
    lbl: `${a.id} · ${a.user_name} · ${a.fraud_type.replace(/_/g, ' ')}`,
    desc: sevLabel(a.risk_level),
    run: () => router.push(`/dashboard/alerts?id=${a.id}`),
  }))

  const visActions = actions.filter(x => x.lbl.toLowerCase().includes(q.toLowerCase()))
  const visAlerts  = alertItems.filter(x => x.lbl.toLowerCase().includes(q.toLowerCase()))
  const items = [...visActions, ...visAlerts]

  useEffect(() => { setSel(s => Math.min(s, Math.max(0, items.length - 1))) }, [q, items.length])

  if (!open) return null

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { setSel(s => Math.min(items.length - 1, s + 1)); e.preventDefault() }
    else if (e.key === 'ArrowUp')   { setSel(s => Math.max(0, s - 1)); e.preventDefault() }
    else if (e.key === 'Enter')     { items[sel]?.run(); onClose() }
  }

  return (
    <div className="cmdk-back" onClick={onClose}>
      <div className="cmdk" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          placeholder="Search alerts, users, actions…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="cmdk-items">
          {visActions.length > 0 && <div className="cmdk-group-h">ACTIONS</div>}
          {visActions.map((it, idx) => (
            <div key={it.id}
              className={`cmdk-item ${items[sel]?.id === it.id ? 'active' : ''}`}
              onMouseEnter={() => setSel(idx)}
              onClick={() => { it.run(); onClose() }}>
              <span>{it.lbl}</span>
              <span className="desc">{it.desc}</span>
            </div>
          ))}
          {visAlerts.length > 0 && <div className="cmdk-group-h">OPEN ALERTS</div>}
          {visAlerts.map((it, idx) => (
            <div key={it.id}
              className={`cmdk-item ${items[sel]?.id === it.id ? 'active' : ''}`}
              onMouseEnter={() => setSel(visActions.length + idx)}
              onClick={() => { it.run(); onClose() }}>
              <span>{it.lbl}</span>
              <span className="desc">{it.desc}</span>
            </div>
          ))}
          {items.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-4)' }}>No results</div>}
        </div>
        <div className="cmdk-footer">
          <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
        </div>
      </div>
    </div>
  )
}
