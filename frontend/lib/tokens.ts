export const C = {
  bg:          '#0E1014',
  card:        '#15181F',
  border:      '#232833',
  textPrimary: '#ECEEF2',
  textMuted:   '#7B8493',
  critical:    '#F25C5C',
  medium:      '#E5A24A',
  low:         '#4FC57A',
  hover:       '#1B1F28',
  amber:       '#E5A24A',
  accent:      '#7DB1F0',
} as const

export function riskColor(score: number): string {
  if (score >= 80) return C.critical
  if (score >= 60) return C.critical
  if (score >= 40) return C.medium
  return C.low
}

export function riskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export function sevClass(level: string): string {
  if (level === 'critical' || level === 'high') return 'red'
  if (level === 'medium') return 'amber'
  return 'blue'
}

export function sevLabel(level: string): string {
  if (level === 'critical') return 'Critical'
  if (level === 'high') return 'High'
  if (level === 'medium') return 'Medium'
  return 'Low'
}
