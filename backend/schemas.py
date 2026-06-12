# Pydantic schemas — the request/response shapes for the API. These define the exact
# JSON the frontend sends and receives, and FastAPI validates against them automatically.
# Grouped below by area: alerts, users, feed/events, cases, intelligence, stats, and
# the small request bodies for actions (label, note, simulate, retrain, webhook, ingest).
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# --- Alerts -----------------------------------------------------------------
# One SHAP feature contribution, and the per-model score triple shown on an alert.
class SHAPValue(BaseModel):
    feature: str
    value: float
    contribution: float
    direction: str = "positive"


class ModelScores(BaseModel):
    isolation_forest: float
    lstm: float
    xgboost: float


# Full alert payload (scores + SHAP + status/label/notes + optional AI narrative).
class AlertResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    id: str
    user_id: str
    user_name: str
    timestamp: datetime
    risk_score: float
    risk_level: str
    fraud_type: str
    model_scores: ModelScores
    shap_values: List[SHAPValue]
    status: str
    label: Optional[str] = None
    notes: Optional[str] = None
    occurred_at: Optional[datetime] = None
    ingested_at: Optional[datetime] = None
    ai_narrative: Optional[str] = None


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int
    page: int
    page_size: int


# --- Users ------------------------------------------------------------------
# User summary, a single risk-history point, and the detailed profile (history + alerts).
class UserResponse(BaseModel):
    id: str
    name: str
    role: str
    department: str
    risk_score: float
    last_seen: datetime
    location: str
    risk_trend: str = "stable"
    restricted: bool = False
    escalated: bool = False


class RiskPoint(BaseModel):
    date: str
    score: float


class UserDetailResponse(UserResponse):
    risk_history: List[RiskPoint]
    recent_alerts: List[AlertResponse]


# --- Feed & events ----------------------------------------------------------
# A live-feed row, a single user's event-timeline row, and a stitched timeline item.
class FeedEvent(BaseModel):
    id: str
    user_id: str
    user_name: str
    timestamp: datetime
    event_type: str
    risk_level: Optional[str] = None
    risk_score: Optional[float] = None
    description: str
    is_anomalous: bool
    alert_id: Optional[str] = None
    occurred_at: Optional[datetime] = None
    ingested_at: Optional[datetime] = None


class UserEventResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    timestamp: datetime
    event_type: str
    department: str
    location: str
    description: str
    risk_score: float
    fraud_type: Optional[str] = None


class TimelineItem(BaseModel):
    id: str
    timestamp: datetime
    kind: str          # baseline | suspicious | trigger | analyst_action
    title: str
    explanation: str
    risk_delta: Optional[str] = None
    source: str        # event | alert | audit_log


# --- Peer comparison & cases ------------------------------------------------
# How a user compares to same-role peers on a metric, and the full case payload.
class PeerComparisonMetric(BaseModel):
    metric: str
    user_value: float
    peer_average: float
    multiplier: float


class PeerComparisonResponse(BaseModel):
    alert_id: str
    user_id: str
    role: str
    metrics: List[PeerComparisonMetric]


class CaseResponse(BaseModel):
    id: str
    name: str
    severity: str
    users_involved: List[str]
    user_names: List[str]
    start_time: datetime
    end_time: datetime
    linked_alerts_count: int
    status: str
    alerts: List[AlertResponse]


# --- Intelligence & stats ---------------------------------------------------
# Building blocks for the Model Intelligence page (P/R/F1, volumes, breakdowns,
# FP trend) and the dashboard's headline stat cards.
class DailyCount(BaseModel):
    date: str
    count: int


class DeptRiskItem(BaseModel):
    department: str
    avg_risk: float
    alert_count: int


class BreakdownItem(BaseModel):
    fraud_type: str
    count: int


class FPTrendPoint(BaseModel):
    date: str
    rate: float


class IntelligenceResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    mean_time_to_detect: Optional[float] = None
    alert_volume_last_7_days: List[DailyCount]
    anomaly_type_breakdown: List[BreakdownItem]
    model_agreement_rate: float
    false_positive_rate_trend: List[FPTrendPoint]
    labeled_count: int = 0
    last_retrain_ts: Optional[str] = None
    training_events: int = 0
    anomaly_rate: float = 0.0
    department_risk_breakdown: List[DeptRiskItem] = []


class CoordinatedPattern(BaseModel):
    pattern: str
    users: int
    window: str


class StatsResponse(BaseModel):
    users_monitored: int
    alerts_24h: int
    high_risk_count: int
    false_positive_rate: float
    alerts_change: int
    high_risk_change: int
    labels_collected: int = 0
    next_retrain_in: str = "3h"
    coordinated_patterns: List[CoordinatedPattern] = []
    events_24h: int = 0


# --- Health & action requests -----------------------------------------------
# Health probe payload, plus the small request/response bodies for analyst actions
# (label, note, simulate, retrain, webhook config) and external event ingestion.
class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    models_loaded: bool
    db_connected: bool
    events_processed: int
    model_version: str
    startup_mode: str


class LabelRequest(BaseModel):
    label: str


class NoteRequest(BaseModel):
    text: str


class SimulateRequest(BaseModel):
    scenario: Optional[str] = None


class RetrainResponse(BaseModel):
    status: str
    message: str
    precision_before: Optional[float] = None
    precision_after: Optional[float] = None
    recall_after: Optional[float] = None
    f1_after: Optional[float] = None
    labels_used: int = 0


class WebhookConfigRequest(BaseModel):
    url: str


class WebhookConfigResponse(BaseModel):
    url: str
    configured: bool


class IngestEventRequest(BaseModel):
    user_id: str
    event_type: str
    department: str
    location: str
    hour: int
    device: str = "workstation_corp"
    download_mb: float = 0.0
    tx_count: int = 1
    description: str = ""
    system: str = ""


class IngestEventResponse(BaseModel):
    event_id: str
    risk_score: float
    risk_level: str
    alert_id: Optional[str] = None
    alert_triggered: bool
