'use client'

import type { SHAPValue } from '@/lib/api'
import { C } from '@/lib/tokens'

const LABELS: Record<string, string> = {
  login_hour_deviation: 'login_hour_z',
  transaction_velocity_ratio: 'tx_velocity_ratio',
  access_entropy: 'access_entropy',
  download_volume_zscore: 'download_vol_z',
  location_mismatch: 'location_mismatch',
  privilege_use_ratio: 'privilege_use_ratio',
  device_change_frequency: 'device_change_freq',
  off_hours_ratio: 'off_hours_ratio',
}

interface Props {
  values: SHAPValue[]
}

export default function SHAPChart({ values }: Props) {
  if (!values || values.length === 0) {
    return <div style={{ color: C.textMuted, fontSize: 12, padding: '12px 0' }}>No SHAP data available.</div>
  }

  const absMax = values.reduce((m, v) => Math.max(m, Math.abs(v.contribution ?? 0)), 1e-9)
  const top = values[0]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature attribution</span>
        <span style={{ fontSize: 10, color: C.textMuted }}>SHAP · XGBoost · TreeExplainer</span>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {values.map((sv) => {
          const contrib = sv.contribution ?? 0
          const absVal = Math.abs(contrib)
          const isPositive = sv.direction ? sv.direction === 'positive' : contrib >= 0
          const barPct = (absVal / absMax) * 46  // max bar fills 46% of half-width
          const color = isPositive ? C.critical : C.low
          const isZero = absVal < 1e-4

          return (
            <div key={sv.feature} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 56px', alignItems: 'center', gap: 0 }}>
              {/* Feature name */}
              <span style={{
                fontSize: 11, color: C.textMuted, fontFamily: 'monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                paddingRight: 8,
              }}>
                {LABELS[sv.feature] || sv.feature}
              </span>

              {/* Bar track */}
              <div style={{ position: 'relative', height: 14, display: 'flex', alignItems: 'center' }}>
                {/* Center axis */}
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: C.border }} />
                {/* Bar */}
                {isPositive ? (
                  <div style={{
                    position: 'absolute', left: '50%', top: 2, bottom: 2,
                    width: isZero ? 1 : `${barPct}%`,
                    background: C.critical, borderRadius: '0 2px 2px 0',
                    transition: 'width 0.4s ease',
                    minWidth: isZero ? 1 : undefined,
                  }} />
                ) : (
                  <div style={{
                    position: 'absolute', right: '50%', top: 2, bottom: 2,
                    width: isZero ? 1 : `${barPct}%`,
                    background: C.low, borderRadius: '2px 0 0 2px',
                    transition: 'width 0.4s ease',
                    minWidth: isZero ? 1 : undefined,
                  }} />
                )}
              </div>

              {/* SHAP value */}
              <span style={{
                fontSize: 11, fontWeight: 700, color,
                textAlign: 'right', fontFamily: 'monospace', letterSpacing: '-0.01em',
                paddingLeft: 8,
              }}>
                {contrib >= 0 ? '+' : ''}{contrib.toFixed(3)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Column labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 56px', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>Feature</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: 4 }}>
          <span style={{ fontSize: 10, color: C.low }}>← reduces risk</span>
          <span style={{ fontSize: 10, color: C.critical }}>increases risk →</span>
        </div>
        <span style={{ fontSize: 10, color: C.textMuted, textAlign: 'right', fontWeight: 700 }}>SHAP</span>
      </div>

      {/* Summary line */}
      {top && Math.abs(top.contribution ?? 0) > 1e-4 && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4,
          fontSize: 11, color: C.textMuted, lineHeight: 1.6,
        }}>
          Top driver <span style={{ color: C.textPrimary, fontFamily: 'monospace', fontWeight: 600 }}>{LABELS[top.feature] || top.feature}</span>
          {' '}recorded a value of{' '}
          <span style={{ color: C.textPrimary, fontWeight: 600 }}>{(top.value ?? 0).toFixed(2)}</span>
          {' '}— contributing{' '}
          <span style={{ color: top.contribution >= 0 ? C.critical : C.low, fontWeight: 600 }}>
            {top.contribution >= 0 ? '+' : ''}{(top.contribution ?? 0).toFixed(3)}
          </span>
          {' '}to the final risk score.
        </div>
      )}
    </div>
  )
}
