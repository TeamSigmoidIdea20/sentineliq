'use client'

import type { SHAPValue } from '@/lib/api'
import { C as TOKENS } from '@/lib/tokens'

const C = {
  border: TOKENS.border,
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
  // Debug: log raw SHAP data coming from API
  if (typeof window !== 'undefined' && values?.length) {
    console.log('[SHAPChart] shap_values from API:', JSON.stringify(values.slice(0, 2)))
  }

  if (!values || values.length === 0) {
    return <div style={{ color: C.textMuted, fontSize: 12, padding: '12px 0' }}>No SHAP data available.</div>
  }

  // Use the true max absolute contribution (not a floored fallback) so bars
  // scale relative to each other even when all values are tiny
  const absContribs = values.map((v) => Math.abs(v.contribution ?? 0))
  const maxAbs = Math.max(...absContribs, 1e-9)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {values.map((sv) => {
        const contrib = sv.contribution ?? 0
        const absVal = Math.abs(contrib)

        // Determine direction from field first, fall back to sign of contribution
        const isPositive = sv.direction
          ? sv.direction === 'positive'
          : contrib >= 0

        const color = isPositive ? C.positive : C.negative

        // Bar width: proportional to absolute value, max 48% per side
        // Always at least 1px (represented as a stub class flag)
        const pct = (absVal / maxAbs) * 48
        const isZero = absVal < 1e-9

        return (
          <div key={sv.feature} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Feature name — fixed 140px */}
            <span style={{
              width: 140, flexShrink: 0,
              fontSize: 11, color: C.textMuted, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {LABELS[sv.feature] || sv.feature}
            </span>

            {/* Bar area — flex-1, position relative */}
            <div style={{ flex: 1, position: 'relative', height: 10 }}>
              {/* Center axis */}
              <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0,
                width: 1, background: C.divider,
              }} />

              {/* Positive bar: starts at 50%, extends right */}
              {isPositive && (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: 2, bottom: 2,
                  width: isZero ? 1 : `${pct}%`,
                  minWidth: 1,
                  background: C.positive,
                  borderRadius: '0 2px 2px 0',
                  transition: 'width 0.4s ease',
                }} />
              )}

              {/* Negative bar: ends at 50%, extends left */}
              {!isPositive && (
                <div style={{
                  position: 'absolute',
                  right: '50%',
                  top: 2, bottom: 2,
                  width: isZero ? 1 : `${pct}%`,
                  minWidth: 1,
                  background: C.negative,
                  borderRadius: '2px 0 0 2px',
                  transition: 'width 0.4s ease',
                }} />
              )}
            </div>

            {/* SHAP contribution value — fixed 60px, colored */}
            <span style={{
              width: 60, flexShrink: 0,
              fontSize: 11, fontWeight: 700, color,
              textAlign: 'right', letterSpacing: '-0.01em',
              paddingLeft: 8,
            }}>
              {contrib >= 0 ? '+' : ''}{contrib.toFixed(3)}
            </span>

            {/* Feature raw value — fixed 50px, muted */}
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

      {/* Legend */}
      <div style={{ marginTop: 6, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 20 }}>
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
