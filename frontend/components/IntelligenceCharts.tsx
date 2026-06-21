'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Intelligence, DeptRiskItem } from '@/lib/api'
import { formatFraudType } from '@/lib/api'
import { C } from '@/lib/tokens'


function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <p style={{ margin: '0 0 2px', fontSize: 12, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>{title}</p>
        {sub && <p style={{ margin: 0, fontSize: 10, color: C.textMuted }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export default function IntelligenceCharts({ data }: { data: Intelligence }) {
  const sortedAnom = [...data.anomaly_type_breakdown].sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...sortedAnom.map(a => a.count), 1)
  const totalAnom = sortedAnom.reduce((s, a) => s + a.count, 0)

  const anomColors: Record<string, string> = {
    off_hours_login: C.textMuted,
    bulk_download: C.medium,
    cross_department_access: C.textMuted,
    velocity_spike: C.medium,
    privilege_escalation: C.critical,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Alert volume line chart */}
      <Panel title="Alert Volume — Last 7 Days" sub={`${data.alert_volume_last_7_days.reduce((s, d) => s + d.count, 0)} total alerts`}>
        <div role="img" aria-label="Line chart showing alert volume over the last 7 days">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.alert_volume_last_7_days}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary, fontSize: 11 }} />
              <Line type="monotone" dataKey="count" stroke={C.critical} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Anomaly distribution + Department risk side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>

        {/* Anomaly distribution */}
        <Panel title="Anomaly distribution" sub={`Last 7 days · ${totalAnom} total`}>
          {sortedAnom.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>No anomalies detected yet.</p>
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedAnom.map((a, i) => {
              const w = (a.count / maxCount * 100).toFixed(1)
              const barColor = anomColors[a.fraud_type] ?? C.textMuted
              const avgRate = (a.count / Math.max(1, totalAnom) * 0.5).toFixed(2)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 138, fontSize: 12, color: C.textPrimary, flexShrink: 0 }}>
                    {formatFraudType(a.fraud_type).replace('Bulk Download', 'Bulk data download').replace('Cross Department Access', 'Cross-dept access')}
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: 12, background: C.bg, borderRadius: 3 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${w}%`, background: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                  <div className="mono" style={{ width: 32, textAlign: 'right', fontSize: 12, fontWeight: 600, color: C.textPrimary, flexShrink: 0 }}>{a.count}</div>
                  <div style={{ width: 44, textAlign: 'right', fontSize: 10, color: C.textMuted, flexShrink: 0 }}>avg {avgRate}</div>
                </div>
              )
            })}
          </div>
        </Panel>

        {/* Department risk */}
        <Panel title="Department risk" sub="7-day peak">
          {data.department_risk_breakdown.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>No alert data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.department_risk_breakdown.map((d: DeptRiskItem, i: number) => {
                const barColor = d.avg_risk > 70 ? C.critical : d.avg_risk > 50 ? C.medium : C.low
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 72, fontSize: 11.5, color: C.textPrimary, flexShrink: 0 }}>{d.department}</div>
                    <div style={{ flex: 1, position: 'relative', height: 18, background: C.bg, borderRadius: 3 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, d.avg_risk)}%`, background: barColor, opacity: 0.85, borderRadius: 3 }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 7, fontFamily: 'monospace', fontSize: 11, color: C.textPrimary, fontWeight: 600 }}>{d.avg_risk.toFixed(0)}</div>
                    </div>
                    <div style={{ width: 52, textAlign: 'right', fontSize: 10, color: C.textMuted, flexShrink: 0 }}>{d.alert_count} alerts</div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

      </div>

      {/* FP trend */}
      <Panel title="False Positive Rate Trend" sub="Based on analyst labels">
        <div role="img" aria-label="Line chart showing false positive rate trend over time">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.false_positive_rate_trend}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary, fontSize: 11 }} />
              <Line type="monotone" dataKey="rate" stroke={C.medium} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

    </div>
  )
}
