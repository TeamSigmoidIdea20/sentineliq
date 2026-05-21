import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SentinelIQ — Insider Fraud Detection',
  description: 'Real-time behavioural analytics for internal bank fraud detection.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%', overflow: 'hidden' }}>
      <body style={{ height: '100%', overflow: 'hidden' }}>{children}</body>
    </html>
  )
}
