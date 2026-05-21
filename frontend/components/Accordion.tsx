'use client'

import { useState } from 'react'

interface AccordionProps {
  label: string
  hint?: string
  right?: React.ReactNode
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function Accordion({ label, hint, right, badge, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`accord ${open ? 'open' : ''}`}>
      <div className="accord-h" onClick={() => setOpen(o => !o)}>
        <svg className="accord-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 4 10 8 6 12" />
        </svg>
        <span className="accord-label">{label}</span>
        {hint && <span className="accord-hint">{hint}</span>}
        {badge}
        {right && <div className="accord-right">{right}</div>}
      </div>
      {open && <div className="accord-b">{children}</div>}
    </div>
  )
}
