'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'
import { api, type Intelligence } from '@/lib/api'
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

export default function IntelligencePage() {
  const [data, setData] = useState<Intelligence | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.intelligence()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>Model Intelligence</h1>
          <span style={{ fontSize: 11, color: C.textMuted }}>Synthetic validation and live alert telemetry</span>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {loading && <div style={{ height: 120, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }} />}
          {data && (
            <>
              <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                <Stat label="Precision" value={`${(data.precision * 100).toFixed(1)}%`} />
                <Stat label="Recall" value={`${(data.recall * 100).toFixed(1)}%`} />
                <Stat label="F1 Score" value={`${(data.f1 * 100).toFixed(1)}%`} />
                <Stat label="Mean Detect Time" value={`${data.mean_time_to_detect.toFixed(1)}s`} sub="fraud event to alert" />
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
