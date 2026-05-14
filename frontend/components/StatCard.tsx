'use client'

import { C } from '@/lib/tokens'

interface Props {
  label: string
  value: string | number
  sub?: string
  change?: number
  loading?: boolean
  accent?: 'red' | 'amber' | 'green' | 'neutral'
}

export default function StatCard({ label, value, sub, change, loading, accent = 'neutral' }: Props) {
  const accentColor =
    accent === 'red' ? C.critical : accent === 'amber' ? C.medium : accent === 'green' ? C.low : C.textPrimary

  if (loading) {
    return (
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          padding: '20px 24px',
        }}
      >
        <div style={{ width: 80, height: 12, background: '#30363D', borderRadius: 2, marginBottom: 12 }} />
        <div style={{ width: 120, height: 28, background: '#30363D', borderRadius: 2, marginBottom: 8 }} />
        <div style={{ width: 60, height: 10, background: '#30363D', borderRadius: 2 }} />
      </div>
    )
  }

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        padding: '20px 24px',
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: C.textMuted, letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: '10px 0 4px', fontSize: 28, fontWeight: 700, color: accentColor, lineHeight: 1 }}>
        {value}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {change !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: change > 0 ? C.critical : change < 0 ? C.low : C.textMuted,
            }}
          >
            {change > 0 ? `+${change}` : change}
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: C.textMuted }}>{sub}</span>}
      </div>
    </div>
  )
}
