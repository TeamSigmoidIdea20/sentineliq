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
  occurred_at?: string | null
  ingested_at?: string | null
  ai_narrative?: string | null
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
  restricted?: boolean
  escalated?: boolean
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
  alert_id?: string | null
  occurred_at?: string | null
  ingested_at?: string | null
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

export interface DeptRiskItem {
  department: string
  avg_risk: number
  alert_count: number
}

export interface Stats {
  users_monitored: number
  alerts_24h: number
  alerts_today?: number  // backwards-compat alias for older backend
  high_risk_count: number
  false_positive_rate: number
  alerts_change: number
  high_risk_change: number
  labels_collected: number
  next_retrain_in: string
  coordinated_patterns: CoordinatedPattern[]
  events_24h: number
  events_today?: number  // backwards-compat alias for older backend
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
  precision: number | null
  recall: number | null
  f1: number | null
  mean_time_to_detect: number | null
  alert_volume_last_7_days: { date: string; count: number }[]
  anomaly_type_breakdown: { fraud_type: string; count: number }[]
  model_agreement_rate: number
  false_positive_rate_trend: { date: string; rate: number }[]
  labeled_count: number
  last_retrain_ts: string | null
  training_events: number
  anomaly_rate: number
  department_risk_breakdown: DeptRiskItem[]
}

export interface ModelInfo {
  isolation_forest: { weight: number; n_estimators: number; contamination: number; fitted: boolean }
  lstm: { weight: number; seq_len: number; hidden_size: number; n_features: number; fitted: boolean }
  xgboost: { weight: number; n_estimators: number; max_depth: number; learning_rate: number; fitted: boolean }
}

export interface RetrainResponse {
  status: string
  message: string
  precision_before?: number
  precision_after?: number
  recall_after?: number
  f1_after?: number
  labels_used: number
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
    page_size?: number
    min_score?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.risk_level) q.set('risk_level', params.risk_level)
    if (params?.status) q.set('status', params.status)
    if (params?.time_range) q.set('time_range', params.time_range)
    if (params?.page) q.set('page', String(params.page))
    if (params?.page_size) q.set('page_size', String(params.page_size))
    if (params?.min_score != null) q.set('min_score', String(params.min_score))
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

  simulate: (scenario?: string) => fetchApi<{ status: string }>('/api/simulate', {
    method: 'POST',
    body: JSON.stringify({ scenario: scenario ?? null }),
  }),

  restrictUser: (id: string) =>
    fetchApi<{ status: string; user_id: string }>(`/api/users/${id}/restrict`, { method: 'POST' }),

  escalateUser: (id: string) =>
    fetchApi<{ status: string; user_id: string }>(`/api/users/${id}/escalate`, { method: 'POST' }),

  retrain: () => fetchApi<RetrainResponse>('/api/retrain', { method: 'POST' }),

  modelInfo: () => fetchApi<ModelInfo>('/api/model-info'),

  alertTimeline: (id: string) => fetchApi<TimelineItem[]>(`/api/alerts/${id}/timeline`),

  caseTimeline: (id: string) => fetchApi<TimelineItem[]>(`/api/cases/${id}/timeline`),
  resolveCase: (id: string) => fetchApi<{ status: string }>(`/api/cases/${id}/resolve`, { method: 'POST' }),
  dismissCase: (id: string) => fetchApi<{ status: string }>(`/api/cases/${id}/dismiss`, { method: 'POST' }),

  auditLog: (params?: { user_id?: string; alert_id?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.user_id) q.set('user_id', params.user_id)
    if (params?.alert_id) q.set('alert_id', params.alert_id)
    if (params?.limit) q.set('limit', String(params.limit))
    return fetchApi<AuditEntry[]>(`/api/audit-log?${q}`)
  },
}

export interface TimelineItem {
  id: string
  timestamp: string
  kind: 'baseline' | 'suspicious' | 'trigger' | 'analyst_action' | 'case_opened'
  title: string
  explanation: string
  risk_delta?: string | null
  source: 'event' | 'alert' | 'audit_log'
}

export interface AuditEntry {
  id: string
  created_at: string
  action_type: string
  entity_type: string
  entity_id: string
  user_id: string
  alert_id: string
  message: string
}

export function riskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export function formatFraudType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Backend sends naive UTC datetimes (no Z suffix). Without Z, JS Date parses
// date-time strings as *local* time, making them appear future in timezones
// behind UTC. Append Z to force correct UTC interpretation.
export function normaliseIso(iso: string): string {
  return /Z$|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z'
}

export function timeAgo(iso: string): string {
  const normalised = normaliseIso(iso)
  const diff = Date.now() - new Date(normalised).getTime()
  if (diff < -5000) {
    const futureS = Math.floor(-diff / 1000)
    // Small skew (< 5 min): likely a just-processed event, show countdown
    if (futureS < 300) {
      if (futureS < 60) return `in ${futureS}s`
      return `in ${Math.floor(futureS / 60)}m`
    }
    // Large skew (≥ 5 min): server clock issue — show absolute date so it's readable
    const d = new Date(normalised)
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
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
