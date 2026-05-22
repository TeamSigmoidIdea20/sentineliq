'use client'

import { useEffect, useRef, useState } from 'react'
import { api, type FeedEvent } from '@/lib/api'
import { C } from '@/lib/tokens'

const RISK_COLORS: Record<string, string> = {
  critical: C.critical,
  high: C.critical,
  medium: C.medium,
  low: C.low,
}

function FeedRow({ event, isNew, onAlertClick }: { event: FeedEvent; isNew: boolean; onAlertClick?: (id: string) => void }) {
  const color = event.risk_level ? RISK_COLORS[event.risk_level] || C.textMuted : C.textMuted
  const [hovered, setHovered] = useState(false)
  const pulse = event.is_anomalous && (event.risk_level === 'critical' || event.risk_level === 'high')
  const clickable = !!event.alert_id && !!onAlertClick

  return (
    <div
      className={isNew ? 'animate-slide-in' : ''}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => clickable && onAlertClick!(event.alert_id!)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        borderBottom: `1px solid ${C.border}`,
        background: hovered ? C.hover : 'transparent',
        transition: 'background 0.15s',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div
        className={pulse ? 'animate-pulse-dot' : ''}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: event.is_anomalous ? color : C.border,
          marginTop: 4,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12, color: C.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.description}
          </span>
        </div>
        <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: C.textMuted }}>{event.user_id}</span>
          {event.is_anomalous && event.risk_score !== undefined && (
            <span style={{ fontSize: 10, fontWeight: 700, color }}>
              RISK {Math.round(event.risk_score)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LiveFeed({ onAlertClick }: { onAlertClick?: (alertId: string) => void } = {}) {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const prevIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true

    const poll = async () => {
      try {
        const data = await api.feed()
        if (!mounted) return
        const incoming = new Set<string>()
        data.forEach((e) => {
          if (!prevIds.current.has(e.id)) incoming.add(e.id)
        })
        prevIds.current = new Set(data.map((e) => e.id))
        setEvents(data)
        setNewIds(incoming)
        setTimeout(() => setNewIds(new Set()), 800)
      } catch {
        // backend not ready yet — silently skip
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.low, display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Live Intelligence Feed
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 48, background: C.hover, borderRadius: 2, marginBottom: 4 }} />
          ))}
        </div>
      ) : (
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {events.map((ev) => (
            <FeedRow key={ev.id} event={ev} isNew={newIds.has(ev.id)} onAlertClick={onAlertClick} />
          ))}
        </div>
      )}
    </div>
  )
}
