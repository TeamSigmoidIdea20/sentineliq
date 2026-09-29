import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SentinelIQ - AI Insider Threat Detection',
  description: 'AI-driven cybersecurity platform that detects insider threats in real time with a 3-model ML ensemble and SHAP explainability.',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
