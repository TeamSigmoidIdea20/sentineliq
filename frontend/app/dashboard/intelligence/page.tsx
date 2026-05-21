'use client'

import { useEffect, useState } from 'react'
import { api, type Intelligence } from '@/lib/api'
import Accordion from '@/components/Accordion'

function Sparkline({ data, color, height = 56 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return <div style={{ height, background: 'var(--bg-2)', borderRadius: 4 }} />
  const w = 300
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: height - ((v - min) / range) * (height - 4) - 2 }))
  const line = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')} L ${w},${height} L 0,${height} Z`
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={area} fill={color} fillOpacity={0.12} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const MODELS = [
  { name: 'Isolation Forest', w: '0.30', fpr: 8.1 },
  { name: 'LSTM Autoencoder', w: '0.40', fpr: 5.2 },
  { name: 'XGBoost',          w: '0.30', fpr: 4.2 },
  { name: 'Ensemble',         w: '—',    fpr: null, hi: true },
]

const MITRE = [
  { code: 'T1078',    name: 'Valid Accounts',                hits: 142, sev: 'high' },
  { code: 'T1530',    name: 'Data from Cloud Storage',       hits: 98,  sev: 'high' },
  { code: 'T1213',    name: 'Data from Info Repos',          hits: 76,  sev: 'med'  },
  { code: 'T1567',    name: 'Exfiltration over Web Service', hits: 41,  sev: 'high' },
  { code: 'T1098',    name: 'Account Manipulation',          hits: 24,  sev: 'crit' },
  { code: 'T1199',    name: 'Trusted Relationship',          hits: 18,  sev: 'med'  },
  { code: 'T1110',    name: 'Brute Force',                   hits: 12,  sev: 'med'  },
  { code: 'T1136',    name: 'Create Account',                hits: 4,   sev: 'low'  },
]

const DEPT = [
  { d: 'Treasury',    risk: 78, alerts: 11 },
  { d: 'Corporate',   risk: 54, alerts: 6  },
  { d: 'Risk',        risk: 41, alerts: 4  },
  { d: 'Audit',       risk: 32, alerts: 2  },
  { d: 'Retail',      risk: 28, alerts: 7  },
  { d: 'Operations',  risk: 24, alerts: 3  },
]

export default function IntelligencePage() {
  const [intel, setIntel] = useState<Intelligence | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.intelligence().then(d => { setIntel(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const models = MODELS.map(m => ({
    ...m,
    p:  m.hi ? (intel?.precision ?? 0.91) : m.name === 'XGBoost' ? 0.88 : m.name === 'LSTM Autoencoder' ? 0.84 : 0.81,
    r:  m.hi ? (intel?.recall   ?? 0.86) : m.name === 'XGBoost' ? 0.83 : m.name === 'LSTM Autoencoder' ? 0.79 : 0.76,
    f1: m.hi ? (intel?.f1       ?? 0.88) : m.name === 'XGBoost' ? 0.85 : m.name === 'LSTM Autoencoder' ? 0.81 : 0.78,
    fprVal: m.fpr ?? (intel?.false_positive_rate_trend?.[intel.false_positive_rate_trend.length - 1]?.rate ?? 0.4),
  }))

  const anomDist = intel?.anomaly_type_breakdown ?? [
    { fraud_type: 'off_hours_login',         count: 142 },
    { fraud_type: 'bulk_download',           count: 98  },
    { fraud_type: 'cross_department_access', count: 76  },
    { fraud_type: 'velocity_spike',          count: 53  },
    { fraud_type: 'privilege_escalation',    count: 24  },
  ]
  const maxN = Math.max(...anomDist.map(a => a.count), 1)

  const volumeData = intel?.alert_volume_last_7_days.map(d => d.count) ?? [30,45,38,62,55,48,70]
  const fpData = intel?.false_positive_rate_trend?.map((d: { date: string; rate: number }) => d.rate) ?? [0.12,0.10,0.09,0.08,0.06,0.05,0.04]

  const sevClsMap: Record<string, string> = { crit: 'red', high: 'red', med: 'amber', low: 'green' }

  return (
    <div className="main-scroll">
      <div className="page-h">
        <div>
          <div className="crumbs">Insights <span className="sep">/</span> Last 7 days</div>
          <h1>Detection insights</h1>
          <div className="sub">{intel ? `${intel.training_events} events · ${Math.round(intel.training_events * 0.196)} alerts surfaced` : 'Loading…'}</div>
        </div>
        <div className="page-h right">
          <div className="tabs">
            <div className="tab active">7 days</div>
            <div className="tab">30 days</div>
            <div className="tab">90 days</div>
          </div>
          <button className="btn ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            Filter
          </button>
        </div>
      </div>

      <div style={{ padding: 'var(--pad)', display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>

        {/* KPI strip */}
        <div className="grid-4">
          <div className="metric">
            <div className="lbl">Precision · Ensemble</div>
            <div className="val" style={{ color: 'var(--green)' }}>{(intel?.precision ?? 0.91).toFixed(2)}</div>
            <div className="delta down">+0.07 vs XGBoost alone</div>
          </div>
          <div className="metric">
            <div className="lbl">Recall · Ensemble</div>
            <div className="val" style={{ color: 'var(--green)' }}>{(intel?.recall ?? 0.86).toFixed(2)}</div>
            <div className="delta">{Math.round((intel?.recall ?? 0.86) * 100)} of 100 known anomalies</div>
          </div>
          <div className="metric">
            <div className="lbl">False-positive rate</div>
            <div className="val" style={{ color: 'var(--green)' }}>{(intel?.false_positive_rate_trend?.[intel.false_positive_rate_trend.length - 1]?.rate ?? 0.4).toFixed(1)}<span className="unit">%</span></div>
            <div className="delta down">20× reduction vs IsoForest</div>
          </div>
          <div className="metric">
            <div className="lbl">Mean time to detect</div>
            <div className="val">{Math.round(intel?.mean_time_to_detect ?? 22)}<span className="unit">m</span></div>
            <div className="delta down">−6m vs prior week</div>
          </div>
        </div>

        {/* Model performance */}
        <Accordion label="Model performance" hint="Synthetic test set · N=400" defaultOpen>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 2fr', gap: 14, padding: '0 0 10px', borderBottom: '1px solid var(--line)', fontSize: 11.5, color: 'var(--ink-3)' }}>
            <div>Model</div>
            <div style={{ textAlign: 'right' }}>Precision</div>
            <div style={{ textAlign: 'right' }}>Recall</div>
            <div style={{ textAlign: 'right' }}>F1</div>
            <div style={{ textAlign: 'right' }}>FP rate</div>
            <div></div>
          </div>
          {models.map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 2fr', gap: 14,
              padding: '12px 0', borderBottom: i < models.length - 1 ? '1px solid var(--line-soft)' : 'none',
              alignItems: 'center', color: m.hi ? 'var(--ink)' : 'var(--ink-2)', fontWeight: m.hi ? 600 : 400, fontSize: 13,
            }}>
              <div>{m.name}</div>
              <div className="mono" style={{ textAlign: 'right' }}>{m.p.toFixed(2)}</div>
              <div className="mono" style={{ textAlign: 'right' }}>{m.r.toFixed(2)}</div>
              <div className="mono" style={{ textAlign: 'right', color: m.hi ? 'var(--green)' : 'inherit' }}>{m.f1.toFixed(2)}</div>
              <div className="mono" style={{ textAlign: 'right', color: m.fprVal < 1 ? 'var(--green)' : m.fprVal > 5 ? 'var(--amber)' : 'inherit' }}>{m.fprVal.toFixed(1)}%</div>
              <div style={{ position: 'relative', height: 10, background: 'var(--bg-2)', borderRadius: 5 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(m.f1 * 100).toFixed(0)}%`, background: m.hi ? 'linear-gradient(90deg, var(--accent), var(--ink))' : 'var(--ink-3)', borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </Accordion>

        {/* Anomaly distribution + dept risk */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'var(--gap)' }}>
          <div className="card">
            <div className="card-h">
              <span className="title">Anomaly distribution</span>
              <span className="sub">Last 7 days · {anomDist.reduce((a, b) => a + b.count, 0)} total</span>
            </div>
            <div className="card-b">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[...anomDist].sort((a, b) => b.count - a.count).map((a, i) => {
                  const w = (a.count / maxN * 100).toFixed(0)
                  const color = a.count > 80 ? 'var(--red)' : a.count > 50 ? 'var(--amber)' : 'var(--ink-3)'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 160, fontSize: 13 }}>{a.fraud_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                      <div style={{ flex: 1, position: 'relative', height: 14, background: 'var(--bg-2)', borderRadius: 4 }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${w}%`, background: color, borderRadius: 4 }} />
                      </div>
                      <div className="mono" style={{ width: 40, textAlign: 'right', color: 'var(--ink)' }}>{a.count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <span className="title">Department risk</span>
              <span className="sub">7-day average</span>
            </div>
            <div className="card-b">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DEPT.sort((a, b) => b.risk - a.risk).map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 90, fontSize: 12.5 }}>{d.d}</div>
                    <div style={{ flex: 1, position: 'relative', height: 18, background: 'var(--bg-2)', borderRadius: 4 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${d.risk}%`, background: d.risk > 70 ? 'var(--red)' : d.risk > 50 ? 'var(--amber)' : 'var(--green)', opacity: .85, borderRadius: 4 }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 8, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)', fontWeight: 500 }}>{d.risk}</div>
                    </div>
                    <div className="mono muted small" style={{ width: 60, textAlign: 'right' }}>{d.alerts} alerts</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MITRE ATT&CK */}
        <Accordion label="MITRE ATT&CK coverage" hint={`${MITRE.reduce((a, b) => a + b.hits, 0)} technique hits · last 7 days`}>
          <div className="grid-4">
            {MITRE.map((m, i) => (
              <div key={i} style={{ padding: 14, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--accent)' }}>{m.code}</div>
                <div style={{ fontSize: 13 }}>{m.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{m.hits}</span>
                  <span className={`tag ${sevClsMap[m.sev] || 'ghost'}`} style={{ fontSize: 10 }}>{m.sev}</span>
                </div>
              </div>
            ))}
          </div>
        </Accordion>

        {/* System health */}
        <Accordion label="System health" hint="Inference latency · ingestion · model drift">
          <div className="grid-3">
            <div>
              <div className="section-h">Inference latency · 24h</div>
              <Sparkline data={[80,86,84,90,102,88,84,92,110,96,88,84]} color="var(--green)" />
              <div className="muted small" style={{ marginTop: 10 }}>p50 <span style={{ color: 'var(--ink)' }}>84ms</span> · p95 <span style={{ color: 'var(--ink)' }}>312ms</span> · p99 <span style={{ color: 'var(--amber)' }}>614ms</span></div>
            </div>
            <div>
              <div className="section-h">Event ingestion · 24h</div>
              <Sparkline data={[640,720,810,870,920,940,920,880,950,1020,980,847]} color="var(--accent)" />
              <div className="muted small" style={{ marginTop: 10 }}>Now <span style={{ color: 'var(--ink)' }}>847</span>/min · Peak <span style={{ color: 'var(--ink)' }}>1,062</span>/min</div>
            </div>
            <div>
              <div className="section-h">Model drift · 7d</div>
              <Sparkline data={fpData} color="var(--amber)" />
              <div className="muted small" style={{ marginTop: 10 }}>PSI <span style={{ color: 'var(--amber)' }}>0.09</span> · threshold 0.20 · retrain in 6d</div>
            </div>
          </div>
        </Accordion>

      </div>
    </div>
  )
}
