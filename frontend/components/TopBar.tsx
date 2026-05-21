'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  onCmdK: () => void
  openAlerts?: number
}

function useClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

export default function TopBar({ onCmdK, openAlerts = 0 }: Props) {
  const now = useClock()
  const utc = `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')} UTC`

  const threatCls = openAlerts >= 3 ? 'crit' : openAlerts >= 1 ? 'elev' : 'norm'
  const threatLabel = openAlerts >= 3 ? 'Elevated' : openAlerts >= 1 ? 'Guarded' : 'Normal'

  return (
    <header className="topbar">
      <Link href="/" className="topbar-brand" title="Back to home">
        <div className="glyph" />
        <span>SentinelIQ</span>
        <span className="ver">v2.3</span>
      </Link>

      <div className={`topbar-chip ${threatCls}`}>
        <span className="dot live" style={{ width: 6, height: 6 }} />
        <span className="lbl">Threat</span>
        <span className="val">{threatLabel}</span>
      </div>

      <div className="topbar-clock">{utc}</div>

      <div className="topbar-right">
        <button className="topbar-search" onClick={onCmdK}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search alerts, users, actions…</span>
          <span className="kbd">⌘K</span>
        </button>
        <div className="topbar-user">
          <div className="av">SP</div>
          <span>S. Pratap</span>
          <span style={{ color: 'var(--ink-4)' }}>· L2</span>
        </div>
      </div>
    </header>
  )
}
