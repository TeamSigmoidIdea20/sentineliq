from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class SHAPValue(BaseModel):
    feature: str
    value: float
    contribution: float
    direction: str = "positive"


class ModelScores(BaseModel):
    isolation_forest: float
    lstm: float
    xgboost: float


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


class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int
    page: int
    page_size: int


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


class DailyCount(BaseModel):
    date: str
    count: int


class BreakdownItem(BaseModel):
    fraud_type: str
    count: int


class FPTrendPoint(BaseModel):
    date: str
    rate: float


class IntelligenceResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    precision: float
    recall: float
    f1: float
    mean_time_to_detect: float
    alert_volume_last_7_days: List[DailyCount]
    anomaly_type_breakdown: List[BreakdownItem]
    model_agreement_rate: float
    false_positive_rate_trend: List[FPTrendPoint]
    labeled_count: int = 0
    last_retrain_ts: Optional[str] = None
    training_events: int = 0
    anomaly_rate: float = 0.0


class CoordinatedPattern(BaseModel):
    pattern: str
    users: int
    window: str


class StatsResponse(BaseModel):
    users_monitored: int
    alerts_today: int
    high_risk_count: int
    false_positive_rate: float
    alerts_change: int
    high_risk_change: int
    labels_collected: int = 0
    next_retrain_in: str = "3h"
    coordinated_patterns: List[CoordinatedPattern] = []
    events_today: int = 0


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
