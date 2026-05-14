'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Intelligence } from '@/lib/api'
import { formatFraudType } from '@/lib/api'
import { C } from '@/lib/tokens'

const CHART_COLORS = [C.critical, C.medium, C.low, '#4472C4', '#8B49C4', '#8B949E']

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 18, minHeight: 300 }}>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>{title}</p>
      {children}
    </div>
  )
}

export default function IntelligenceCharts({ data }: { data: Intelligence }) {
  const agreementData = [
    { name: 'Agreement', value: data.model_agreement_rate },
    { name: 'Disagreement', value: Math.max(0, 100 - data.model_agreement_rate) },
  ]

  return (
    <div className="intel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <Panel title="Alert Volume - Last 7 Days">
        <div role="img" aria-label="Line chart showing alert volume over the last 7 days">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.alert_volume_last_7_days}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary }} />
              <Line type="monotone" dataKey="count" stroke={C.critical} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Anomaly Type Breakdown">
        <div role="img" aria-label="Bar chart showing count of each anomaly type detected">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.anomaly_type_breakdown.map((d) => ({ ...d, name: formatFraudType(d.fraud_type) }))}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="name" stroke={C.textMuted} tick={{ fontSize: 9 }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary }} />
              <Bar dataKey="count">
                {data.anomaly_type_breakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Model Agreement">
        <div
          role="img"
          aria-label={`Donut chart showing model agreement rate of ${data.model_agreement_rate.toFixed(1)} percent`}
          style={{ position: 'relative', height: 240 }}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={agreementData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} stroke={C.card}>
                <Cell fill={C.low} />
                <Cell fill={C.border} />
              </Pie>
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary }} />
            </PieChart>
          </ResponsiveContainer>
          <p
            aria-hidden="true"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              margin: 0, fontSize: 24, fontWeight: 800, color: C.low,
              pointerEvents: 'none',
            }}
          >
            {data.model_agreement_rate.toFixed(1)}%
          </p>
        </div>
      </Panel>

      <Panel title="False Positive Rate Trend">
        <div role="img" aria-label="Line chart showing false positive rate trend over time">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.false_positive_rate_trend}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary }} />
              <Line type="monotone" dataKey="rate" stroke={C.medium} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  )
}
