'use client'

import type { SHAPValue } from '@/lib/api'
import { C as TOKENS } from '@/lib/tokens'

const C = {
  border: TOKENS.border,
  textPrimary: TOKENS.textPrimary,
  textMuted: TOKENS.textMuted,
  positive: TOKENS.critical,
  negative: TOKENS.low,
  divider: TOKENS.border,
}

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
    return (
      <div style={{ color: C.textMuted, fontSize: 12, padding: '12px 0' }}>No SHAP data available.</div>
    )
  }

  const maxAbs = Math.max(...values.map((v) => Math.abs(v.contribution)), 0.001)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {values.map((sv) => {
        const pct = (Math.abs(sv.contribution) / maxAbs) * 100
        const isPositive = sv.direction === 'positive'
        const color = isPositive ? C.positive : C.negative

        return (
          <div key={sv.feature}>
            {/* Label row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
                {LABELS[sv.feature] || sv.feature}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '-0.01em' }}>
                {sv.contribution >= 0 ? '+' : ''}{sv.contribution.toFixed(3)}
              </span>
            </div>

            {/* Centered waterfall bar + inline val */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 6 }}>
                {/* Left half — negative bars grow rightward (toward center) */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
                  {!isPositive && (
                    <div
                      style={{
                        width: `${pct}%`,
                        height: 6,
                        background: C.negative,
                        borderRadius: '2px 0 0 2px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  )}
                </div>

                {/* Center line */}
                <div style={{ width: 1, height: 10, background: C.divider, flexShrink: 0 }} />

                {/* Right half — positive bars grow leftward (away from center) */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', height: '100%', alignItems: 'center' }}>
                  {isPositive && (
                    <div
                      style={{
                        width: `${pct}%`,
                        height: 6,
                        background: C.positive,
                        borderRadius: '0 2px 2px 0',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  )}
                </div>
              </div>
              <span style={{ fontSize: 9, color: C.textMuted, flexShrink: 0, width: 46, textAlign: 'right' }}>
                val: {sv.value.toFixed(3)}
              </span>
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div style={{ marginTop: 4, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 6, background: C.negative, borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: C.textMuted }}>← Decreases risk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 6, background: C.positive, borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: C.textMuted }}>Increases risk →</span>
        </div>
      </div>
    </div>
  )
}
