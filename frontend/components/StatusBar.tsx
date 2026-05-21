'use client'

interface Props {
  eventsPerMin?: number
  healthy?: boolean
}

export default function StatusBar({ eventsPerMin = 0, healthy = true }: Props) {
  return (
    <footer className="statusbar">
      <div className="seg">
        <span className="dot" style={{ width: 6, height: 6, background: healthy ? 'var(--green)' : 'var(--red)' }} />
        <span>API {healthy ? 'healthy' : 'degraded'}</span>
      </div>
      <div className="seg">
        <span className="dot" style={{ width: 6, height: 6, background: 'var(--green)' }} />
        <span>3 models loaded</span>
      </div>
      <div className="seg">Latency <span className="val">p95 312ms</span></div>
      <div className="seg">Events <span className="val">{eventsPerMin}/min</span></div>
      <div className="right">
        <div className="seg">Uptime <span className="val">14d 07h</span></div>
        <div className="seg">Polling <span className="val">3s</span></div>
      </div>
    </footer>
  )
}
