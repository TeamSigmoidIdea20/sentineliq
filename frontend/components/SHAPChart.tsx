'use client'

import type { SHAPValue } from '@/lib/api'
import { C } from '@/lib/tokens'

const LABELS: Record<string, string> = {
  login_hour_deviation: 'Login Hour Dev.',
  transaction_velocity_ratio: 'Tx Velocity',
  access_entropy: 'Access Entropy',
  download_volume_zscore: 'Download Vol. Z',
  location_mismatch: 'Location Mismatch',
  privilege_use_ratio: 'Privilege Use',
  device_change_frequency: 'Device Change Freq.',
  off_hours_ratio: 'Off-Hours Ratio',
}

interface Props {
  values: SHAPValue[]
}

export default function SHAPChart({ values }: Props) {
  if (!values || values.length === 0) {
    return <div style={{ color: C.textMuted, fontSize: 12, padding: '12px 0' }}>No SHAP data available.</div>
  }

  const absContribs = values.map((v) => Math.abs(v.contribution ?? 0))
  const maxAbs = absContribs.reduce((a, b) => Math.max(a, b), 1e-9)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {values.map((sv) => {
        const contrib = sv.contribution ?? 0
        const absVal = Math.abs(contrib)
        const isPositive = sv.direction ? sv.direction === 'positive' : contrib >= 0
        const color = isPositive ? C.critical : C.low
        const pct = (absVal / maxAbs) * 48
        const isZero = absVal < 1e-9

        return (
          <div key={sv.feature} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span style={{
              width: 140, flexShrink: 0,
              fontSize: 11, color: C.textMuted, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {LABELS[sv.feature] || sv.feature}
            </span>

            <div style={{ flex: 1, position: 'relative', height: 10 }}>
              <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0,
                width: 1, background: C.border,
              }} />

              {isPositive && (
                <div style={{
                  position: 'absolute', left: '50%', top: 2, bottom: 2,
                  width: isZero ? '1px' : `${pct}%`,
                  minWidth: 1, background: C.critical,
                  borderRadius: '0 2px 2px 0', transition: 'width 0.4s ease',
                }} />
              )}

              {!isPositive && (
                <div style={{
                  position: 'absolute', right: '50%', top: 2, bottom: 2,
                  width: isZero ? '1px' : `${pct}%`,
                  minWidth: 1, background: C.low,
                  borderRadius: '2px 0 0 2px', transition: 'width 0.4s ease',
                }} />
              )}
            </div>

            <span style={{
              width: 60, flexShrink: 0,
              fontSize: 11, fontWeight: 700, color,
              textAlign: 'right', letterSpacing: '-0.01em', paddingLeft: 8,
            }}>
              {contrib >= 0 ? '+' : ''}{contrib.toFixed(3)}
            </span>

            <span style={{
              width: 50, flexShrink: 0,
              fontSize: 9, color: C.textMuted,
              textAlign: 'right', paddingLeft: 4,
            }}>
              {(sv.value ?? 0).toFixed(3)}
            </span>
          </div>
        )
      })}

      <div style={{ marginTop: 6, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 6, background: C.low, borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: C.textMuted }}>← Decreases risk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 6, background: C.critical, borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: C.textMuted }}>Increases risk →</span>
        </div>
      </div>
    </div>
  )
}
