'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { C } from '@/lib/tokens'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: OverviewIcon },
  { href: '/dashboard/alerts', label: 'Alerts', icon: AlertIcon },
  { href: '/dashboard/cases', label: 'Cases', icon: CasesIcon },
  { href: '/dashboard/intelligence', label: 'Intelligence', icon: IntelligenceIcon },
  { href: '/dashboard/users', label: 'Users', icon: UsersIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="sidebar-hidden"
      style={{
        width: 240,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: C.card,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, overflow: 'hidden', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="SentinelIQ logo"
                style={{ height: 28, width: 'auto', display: 'block', objectFit: 'cover', objectPosition: 'left center' }}
              />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.02em' }}>
              SentinelIQ
            </span>
          </div>
        </Link>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.low, display: 'inline-block' }} />
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
        <button
          onClick={() => window.dispatchEvent(new Event('sentinel:cmdk'))}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
            color: C.textMuted, fontSize: 12,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
          <kbd style={{ fontSize: 9, border: `1px solid ${C.border}`, borderRadius: 2, padding: '1px 4px', color: C.textMuted }}>⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <p style={{ margin: '0 0 6px 10px', fontSize: 10, color: C.textMuted, letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase' }}>
          Intelligence
        </p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 4,
                marginBottom: 2,
                textDecoration: 'none',
                background: active ? C.hover : 'transparent',
                color: active ? C.textPrimary : C.textMuted,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: 'background 0.15s',
                borderLeft: active ? `2px solid ${C.critical}` : '2px solid transparent',
              }}
            >
              <Icon active={active} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}` }}>
        <p style={{ margin: 0, fontSize: 10, color: C.textMuted }}>BANK_CORP_01 · Internal Network</p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: C.textMuted }}>SentinelIQ v1.0</p>
      </div>
    </aside>
  )
}

function OverviewIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? C.textPrimary : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function AlertIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? C.textPrimary : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? C.textPrimary : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function CasesIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? C.textPrimary : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18" />
      <path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
      <rect x="3" y="7" width="18" height="14" rx="1" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  )
}

function IntelligenceIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? C.textPrimary : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l3-3 3 2 5-7" />
      <path d="M18 7h-4M18 7v4" />
    </svg>
  )
}
