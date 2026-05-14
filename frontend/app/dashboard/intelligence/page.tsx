'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'
import { api, type Intelligence, timeAgo } from '@/lib/api'
import { C } from '@/lib/tokens'

const IntelligenceCharts = dynamic(() => import('@/components/IntelligenceCharts'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ height: 300, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }} />
      ))}
    </div>
  ),
})

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '18px 20px' }}>
      <p style={{ margin: '0 0 8px', fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, color: C.textPrimary, fontWeight: 800 }}>{value}</p>
      {sub && <p style={{ margin: '5px 0 0', fontSize: 11, color: C.textMuted }}>{sub}</p>}
    </div>
  )
}

function ModelCard({
  name, weight, description, params, metric,
}: {
  name: string
  weight: string
  description: string
  params: { label: string; value: string }[]
  metric: { label: string; value: string }
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '20px 20px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{name}</p>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.critical, border: `1px solid ${C.critical}`, borderRadius: 2, padding: '2px 7px', letterSpacing: '0.05em' }}>
          WEIGHT {weight}
        </span>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: C.textMuted, lineHeight: 1.65 }}>{description}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
        {params.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: C.textMuted }}>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.textPrimary, fontFamily: 'monospace' }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: C.textMuted }}>{metric.label}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.critical }}>{metric.value}</span>
        </div>
      </div>
    </div>
  )
}

export default function IntelligencePage() {
  const [data, setData] = useState<Intelligence | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.intelligence()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const detectDisplay = data
    ? data.mean_time_to_detect < 1
      ? 'Real-time'
      : `${data.mean_time_to_detect.toFixed(1)}s`
    : '—'

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>Model Intelligence</h1>
          <span style={{ fontSize: 11, color: C.textMuted }}>Synthetic validation set · 20% held-out</span>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {loading && <div style={{ height: 120, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }} />}

          {data && (
            <>
              {/* ML Pipeline header */}
              <div>
                <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Model Pipeline
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <ModelCard
                    name="Isolation Forest"
                    weight="30%"
                    description="Trained on 2,000 synthetic events at startup. Contamination parameter set to 0.1 — meaning the model expects ~10% of events to be anomalous. Scores each incoming event by how isolated it is from the normal cluster. No labels required — fully unsupervised."
                    params={[
                      { label: 'contamination', value: '0.1' },
                      { label: 'n_estimators', value: '100' },
                      { label: 'training events', value: String(data.training_events || 2000) },
                    ]}
                    metric={{ label: 'Live anomaly rate', value: `${data.anomaly_rate?.toFixed(1) ?? '—'}%` }}
                  />
                  <ModelCard
                    name="LSTM Autoencoder"
                    weight="40%"
                    description="Trained on sequences of 20 consecutive events per user. Learns to reconstruct normal behavioural sequences. When reconstruction error exceeds threshold, the event is flagged. Detects slow behavioural drift that point anomaly models miss."
                    params={[
                      { label: 'seq_len', value: '20' },
                      { label: 'hidden_dim', value: '64' },
                      { label: 'framework', value: 'PyTorch 2.1' },
                    ]}
                    metric={{ label: 'Model agreement rate', value: `${data.model_agreement_rate.toFixed(1)}%` }}
                  />
                  <ModelCard
                    name="XGBoost Classifier"
                    weight="30%"
                    description="Trained on labeled synthetic data with 5 fraud pattern classes. Retrains automatically when investigators label alerts as True Positive or False Positive — active learning loop. Each retrain incorporates new analyst feedback to improve precision."
                    params={[
                      { label: 'n_estimators', value: '100' },
                      { label: 'labeled alerts', value: String(data.labeled_count ?? 0) },
                      { label: 'last retrain', value: data.last_retrain_ts ? timeAgo(data.last_retrain_ts) : 'Not yet' },
                    ]}
                    metric={{ label: 'Labels collected', value: String(data.labeled_count ?? 0) }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Ensemble Performance
                </p>
                <p style={{ margin: '0 0 14px', fontSize: 11, color: C.textMuted }}>
                  Metrics computed on held-out 20% of synthetic validation set · Training data: {data.training_events || 2000} events
                </p>
                <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  <Stat label="Precision" value={`${(data.precision * 100).toFixed(1)}%`} />
                  <Stat label="Recall" value={`${(data.recall * 100).toFixed(1)}%`} />
                  <Stat label="F1 Score" value={`${(data.f1 * 100).toFixed(1)}%`} />
                  <Stat label="Mean Detect Time" value={detectDisplay} sub="event scored to alert created" />
                </div>
              </div>

              <IntelligenceCharts data={data} />
            </>
          )}

          {!loading && !data && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24, color: C.textMuted }}>
              Intelligence metrics unavailable while the backend starts.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
