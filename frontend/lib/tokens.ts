export const C = {
  bg: '#0D1117',
  card: '#161B22',
  border: '#30363D',
  textPrimary: '#F0F6FC',
  textMuted: '#8B949E',
  critical: '#DC2626',
  medium: '#D97706',
  low: '#16A34A',
  hover: '#1C2128',
  amber: '#D97706',
} as const

export function riskColor(score: number): string {
  if (score >= 65) return C.critical
  if (score >= 40) return C.medium
  return C.low
}

export function riskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
