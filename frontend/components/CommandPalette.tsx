'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Alert } from '@/lib/api'
import { C } from '@/lib/tokens'

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
    { id: 'go.home',    label: 'Go to Overview',   hint: 'G H', run: () => router.push('/dashboard') },
    { id: 'go.alerts',  label: 'Go to Alerts',     hint: 'G A', run: () => router.push('/dashboard/alerts') },
    { id: 'go.cases',   label: 'Go to Cases',      hint: 'G C', run: () => router.push('/dashboard/cases') },
    { id: 'go.intel',   label: 'Go to Intelligence', hint: 'G I', run: () => router.push('/dashboard/intelligence') },
    { id: 'go.users',   label: 'Go to People',     hint: 'G U', run: () => router.push('/dashboard/users') },
  ], [router])

  const alertItems = alerts
    .filter(a => a.status === 'open' && a.risk_score >= 50)
    .slice(0, 6)
    .map(a => ({
      id: a.id,
      label: `${a.user_name} · ${a.fraud_type.replace(/_/g, ' ')}`,
      hint: String(Math.round(a.risk_score)),
      run: () => router.push(`/dashboard/alerts`),
      level: a.risk_level,
    }))

  const lq = q.toLowerCase()
  const visActions = actions.filter(x => x.label.toLowerCase().includes(lq))
  const visAlerts = alertItems.filter(x => x.label.toLowerCase().includes(lq))
  const items: { id: string; label: string; run: () => void }[] = [...visActions, ...visAlerts]

  useEffect(() => { setSel(0) }, [q])

  if (!open) return null

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); e.preventDefault() }
    else if (e.key === 'ArrowDown') { setSel(s => Math.min(items.length - 1, s + 1)); e.preventDefault() }
    else if (e.key === 'ArrowUp')   { setSel(s => Math.max(0, s - 1)); e.preventDefault() }
    else if (e.key === 'Enter' && items[sel]) { items[sel].run(); onClose() }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 96,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 6, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search alerts, users, actions…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: C.textPrimary, fontSize: 14, fontFamily: 'inherit',
            }}
          />
          <kbd style={{ fontSize: 10, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 3, padding: '2px 6px', flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {visActions.length > 0 && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em' }}>NAVIGATION</div>
              {visActions.map((it, i) => (
                <div
                  key={it.id}
                  onClick={() => { it.run(); onClose() }}
                  onMouseEnter={() => setSel(i)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 16px', cursor: 'pointer',
                    background: items[sel]?.id === it.id ? C.hover : 'transparent',
                  }}
                >
                  <span style={{ fontSize: 13, color: C.textPrimary }}>{it.label}</span>
                  <kbd style={{ fontSize: 10, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 3, padding: '2px 6px' }}>{it.hint}</kbd>
                </div>
              ))}
            </>
          )}

          {visAlerts.length > 0 && (
            <>
              <div style={{
                padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: C.textMuted,
                letterSpacing: '0.08em',
                borderTop: visActions.length > 0 ? `1px solid ${C.border}` : 'none',
                marginTop: visActions.length > 0 ? 4 : 0,
              }}>OPEN ALERTS</div>
              {visAlerts.map((it, i) => {
                const level = (it as typeof alertItems[0]).level
                const color = level === 'critical' || level === 'high' ? C.critical : level === 'medium' ? C.medium : C.low
                return (
                  <div
                    key={it.id}
                    onClick={() => { it.run(); onClose() }}
                    onMouseEnter={() => setSel(visActions.length + i)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 16px', cursor: 'pointer',
                      background: items[sel]?.id === it.id ? C.hover : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.textPrimary }}>{it.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{it.hint}</span>
                  </div>
                )
              })}
            </>
          )}

          {items.length === 0 && (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
              No results for &ldquo;{q}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 16, padding: '8px 16px',
          borderTop: `1px solid ${C.border}`,
          fontSize: 10, color: C.textMuted,
        }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span style={{ marginLeft: 'auto' }}>G + H/A/C/I/U to jump</span>
        </div>
      </div>
    </div>
  )
}
