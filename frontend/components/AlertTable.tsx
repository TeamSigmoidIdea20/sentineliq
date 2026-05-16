'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Alert } from '@/lib/api'
import { formatFraudType, timeAgo } from '@/lib/api'
import { C } from '@/lib/tokens'
import RiskBadge from './RiskBadge'

interface Props {
  alerts: Alert[]
  loading?: boolean
  onSelectAlert?: (id: string) => void
  onResolved?: () => void
}

export default function AlertTable({ alerts, loading, onSelectAlert, onResolved }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === alerts.length) setSelected(new Set())
    else setSelected(new Set(alerts.map((a) => a.id)))
  }

  if (loading) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 52, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
            {[60, 100, 120, 60, 80, 60, 80].map((w, j) => (
              <div key={j} style={{ height: 10, width: w, background: '#30363D', borderRadius: 2 }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
      {selected.size > 0 && (
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>{selected.size} selected</span>
          {(['MARK RESOLVED', 'DISMISS'] as const).map((action) => (
            <button
              key={action}
              className="btn-action"
              style={{
                padding: '4px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                borderRadius: 3, cursor: 'pointer',
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            <th style={{ width: 36, padding: '10px 12px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={selected.size === alerts.length && alerts.length > 0}
                onChange={toggleAll}
                aria-label="Select all alerts"
                style={{ cursor: 'pointer' }}
              />
            </th>
            {['Alert ID', 'User', 'Anomaly Type', 'Risk', 'Models', 'Time', 'Status'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: C.textMuted, fontWeight: 600, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout" initial={false}>
            {alerts.map((alert) => (
              <motion.tr
                key={alert.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                onClick={() => onSelectAlert?.(alert.id)}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.hover }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <td style={{ padding: '12px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); toggleSelect(alert.id) }}>
                  <input
                    type="checkbox"
                    checked={selected.has(alert.id)}
                    onChange={() => toggleSelect(alert.id)}
                    aria-label={`Select alert ${alert.id.slice(0, 8)}`}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '12px', color: C.textMuted, fontFamily: 'monospace', fontSize: 11 }}>
                  {alert.id.slice(0, 8)}
                </td>
                <td style={{ padding: '12px', color: C.textPrimary, fontWeight: 500 }}>{alert.user_name}</td>
                <td style={{ padding: '12px', color: C.textMuted }}>{formatFraudType(alert.fraud_type)}</td>
                <td style={{ padding: '12px' }}>
                  <RiskBadge level={alert.risk_level} score={alert.risk_score} size="sm" />
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {['IF', 'LSTM', 'XGB'].map((m) => (
                      <span key={m} style={{ fontSize: 9, padding: '2px 5px', border: `1px solid ${C.border}`, borderRadius: 2, color: C.textMuted, fontWeight: 600 }}>{m}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px', color: C.textMuted }}>{timeAgo(alert.timestamp)}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 2, fontWeight: 600,
                    border: `1px solid ${alert.status === 'open' ? C.critical : alert.status === 'resolved' ? C.low : C.border}`,
                    color: alert.status === 'open' ? C.critical : alert.status === 'resolved' ? C.low : C.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {alert.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      </div>

      {alerts.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
          No alerts match your filters.
        </div>
      )}
    </div>
  )
}
