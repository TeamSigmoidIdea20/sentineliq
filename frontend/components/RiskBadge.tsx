'use client'

import { C } from '@/lib/tokens'

const COLORS = {
  critical: C.critical,
  high: C.critical,
  medium: C.medium,
  low: C.low,
  border: C.border,
}

const LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH RISK',
  medium: 'MEDIUM',
  low: 'LOW',
}

interface Props {
  level: 'critical' | 'high' | 'medium' | 'low'
  score?: number
  size?: 'sm' | 'md'
}

export default function RiskBadge({ level, score, size = 'md' }: Props) {
  const color = COLORS[level]
  const padding = size === 'sm' ? '2px 6px' : '3px 8px'
  const fontSize = size === 'sm' ? '10px' : '11px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        border: `1px solid ${color}`,
        color,
        padding,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.08em',
        borderRadius: 2,
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {LABELS[level]}
      {score !== undefined && (
        <span style={{ opacity: 0.8, marginLeft: 2 }}>{Math.round(score)}</span>
      )}
    </span>
  )
}
