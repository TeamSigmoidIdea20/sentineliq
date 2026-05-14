const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface SHAPValue {
  feature: string
  value: number
  contribution: number
  direction: 'positive' | 'negative'
}

export interface ModelScores {
  isolation_forest: number
  lstm: number
  xgboost: number
}

export interface Alert {
  id: string
  user_id: string
  user_name: string
  timestamp: string
  risk_score: number
  risk_level: 'critical' | 'high' | 'medium' | 'low'
  fraud_type: string
  model_scores: ModelScores
  shap_values: SHAPValue[]
  status: 'open' | 'resolved' | 'dismissed'
  label?: string
  notes?: string
}

export interface AlertListResponse {
  alerts: Alert[]
  total: number
  page: number
  page_size: number
}

export interface User {
  id: string
  name: string
  role: string
  department: string
  risk_score: number
  last_seen: string
  location: string
  risk_trend?: 'up' | 'down' | 'stable'
}

export interface UserDetail extends User {
  risk_history: { date: string; score: number }[]
  recent_alerts: Alert[]
}

export interface FeedEvent {
  id: string
  user_id: string
  user_name: string
  timestamp: string
  event_type: string
  risk_level?: string
  risk_score?: number
  description: string
  is_anomalous: boolean
}

export interface UserEvent {
  id: string
  user_id: string
  user_name: string
  timestamp: string
  event_type: string
  department: string
  location: string
  description: string
  risk_score: number
  fraud_type?: string
}

export interface PeerComparisonMetric {
  metric: string
  user_value: number
  peer_average: number
  multiplier: number
}

export interface PeerComparison {
  alert_id: string
  user_id: string
  role: string
  metrics: PeerComparisonMetric[]
}

export interface CoordinatedPattern {
  pattern: string
  users: number
  window: string
}

export interface Stats {
  users_monitored: number
  alerts_today: number
  high_risk_count: number
  false_positive_rate: number
  alerts_change: number
  high_risk_change: number
  labels_collected: number
  next_retrain_in: string
  coordinated_patterns: CoordinatedPattern[]
}

export interface CaseItem {
  id: string
  name: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  users_involved: string[]
  user_names: string[]
  start_time: string
  end_time: string
  linked_alerts_count: number
  status: string
  alerts: Alert[]
}

export interface Intelligence {
  precision: number
  recall: number
  f1: number
  mean_time_to_detect: number
  alert_volume_last_7_days: { date: string; count: number }[]
  anomaly_type_breakdown: { fraud_type: string; count: number }[]
  model_agreement_rate: number
  false_positive_rate_trend: { date: string; rate: number }[]
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${path} failed ${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  health: () => fetchApi<{ status: string; models_loaded: boolean }>('/health'),

  stats: () => fetchApi<Stats>('/api/stats'),

  feed: () => fetchApi<FeedEvent[]>('/api/feed'),

  alerts: (params?: {
    risk_level?: string
    status?: string
    time_range?: string
    page?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.risk_level) q.set('risk_level', params.risk_level)
    if (params?.status) q.set('status', params.status)
    if (params?.time_range) q.set('time_range', params.time_range)
    if (params?.page) q.set('page', String(params.page))
    return fetchApi<AlertListResponse>(`/api/alerts?${q}`)
  },

  alert: (id: string) => fetchApi<Alert>(`/api/alerts/${id}`),

  userEvents: (userId: string, before: string, limit = 10) =>
    fetchApi<UserEvent[]>(`/api/users/${userId}/events?before=${encodeURIComponent(before)}&limit=${limit}`),

  peerComparison: (id: string) =>
    fetchApi<PeerComparison>(`/api/alerts/${id}/peer-comparison`),

  resolveAlert: (id: string) =>
    fetchApi<{ status: string }>(`/api/alerts/${id}/resolve`, { method: 'POST' }),

  dismissAlert: (id: string) =>
    fetchApi<{ status: string }>(`/api/alerts/${id}/dismiss`, { method: 'POST' }),

  labelAlert: (id: string, label: 'TP' | 'FP') =>
    fetchApi<{ status: string }>(`/api/alerts/${id}/label`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),

  noteAlert: (id: string, text: string) =>
    fetchApi<{ status: string }>(`/api/alerts/${id}/note`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  exportAlert: (id: string) =>
    fetchApi<Record<string, unknown>>(`/api/alerts/${id}/export`),

  users: () => fetchApi<User[]>('/api/users'),

  user: (id: string) => fetchApi<UserDetail>(`/api/users/${id}`),

  cases: () => fetchApi<CaseItem[]>('/api/cases'),

  intelligence: () => fetchApi<Intelligence>('/api/intelligence'),

  simulate: () => fetchApi<{ status: string }>('/api/simulate', { method: 'POST' }),

  retrain: () => fetchApi<{ status: string; message: string; precision_before?: number; precision_after?: number; labels_used: number }>('/api/retrain', { method: 'POST' }),
}

export function riskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export function formatFraudType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function timeAgo(iso: string): string {
  // Backend sends naive UTC datetimes (no Z suffix). Without Z, JS Date parses
  // date-time strings as *local* time, making them appear future in timezones
  // behind UTC. Append Z to force correct UTC interpretation.
  const normalised = /Z$|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z'
  const diff = Date.now() - new Date(normalised).getTime()
  const s = Math.floor(diff / 1000)
  if (s <= 5) return 'Just now'
  if (s < 60) return `${s} seconds ago`
  const m = Math.floor(s / 60)
  if (m < 60) return m === 1 ? '1 minute ago' : `${m} minutes ago`
  const h = Math.floor(m / 60)
  if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`
  const d = Math.floor(h / 24)
  return d === 1 ? '1 day ago' : `${d} days ago`
}
