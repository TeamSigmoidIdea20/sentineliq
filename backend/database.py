import datetime
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, DateTime, Text, Integer, text

_DB_PATH = Path(__file__).resolve().parent / "sentineliq.db"
DATABASE_URL = f"sqlite+aiosqlite:///{_DB_PATH}"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    last_seen: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    location: Mapped[str] = mapped_column(String)
    restricted: Mapped[int] = mapped_column(Integer, default=0)
    escalated: Mapped[int] = mapped_column(Integer, default=0)
    risk_updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)


class EventModel(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String)
    user_name: Mapped[str] = mapped_column(String)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime)
    event_type: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)
    location: Mapped[str] = mapped_column(String)
    hour: Mapped[int] = mapped_column(Integer)
    device: Mapped[str] = mapped_column(String, default="")
    download_mb: Mapped[float] = mapped_column(Float, default=0.0)
    tx_count: Mapped[int] = mapped_column(Integer, default=0)
    features_json: Mapped[str] = mapped_column(Text, default="{}")
    fraud_type: Mapped[str] = mapped_column(String, default="")
    is_fraud: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(String, default="")
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    event_source: Mapped[str] = mapped_column(String, default="live")
    occurred_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    ingested_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    source: Mapped[str] = mapped_column(String, default="live")
    scenario_id: Mapped[str] = mapped_column(String, default="")
    system: Mapped[str] = mapped_column(String, default="")


class AlertModel(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String)
    user_name: Mapped[str] = mapped_column(String)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime)       # event time
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)  # alert creation time
    risk_score: Mapped[float] = mapped_column(Float)
    fraud_type: Mapped[str] = mapped_column(String)
    model_scores_json: Mapped[str] = mapped_column(Text, default="{}")
    shap_values_json: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String, default="open")
    label: Mapped[str] = mapped_column(String, default="")
    event_id: Mapped[str] = mapped_column(String, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    label_updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    occurred_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    ingested_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    ai_narrative: Mapped[str] = mapped_column(Text, nullable=True)


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    action_type: Mapped[str] = mapped_column(String)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[str] = mapped_column(String)
    user_id: Mapped[str] = mapped_column(String, default="")
    alert_id: Mapped[str] = mapped_column(String, default="")
    message: Mapped[str] = mapped_column(Text, default="")


class ModelMetricModel(Base):
    __tablename__ = "model_metrics"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    model_name: Mapped[str] = mapped_column(String)
    precision_before: Mapped[float] = mapped_column(Float, default=0.0)
    precision_after: Mapped[float] = mapped_column(Float, default=0.0)
    recall: Mapped[float] = mapped_column(Float, default=0.0)
    f1: Mapped[float] = mapped_column(Float, default=0.0)
    labels_used: Mapped[int] = mapped_column(Integer, default=0)


class CaseModel(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="open")
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime.datetime] = mapped_column(DateTime)
    user_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    user_names_json: Mapped[str] = mapped_column(Text, default="[]")
    alert_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    title: Mapped[str] = mapped_column(String, nullable=True)
    user_id: Mapped[str] = mapped_column(String, nullable=True)
    user_name: Mapped[str] = mapped_column(String, nullable=True)
    first_seen: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    last_seen: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    scenario_id: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)


class CaseAlertModel(Base):
    __tablename__ = "case_alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(String)
    alert_id: Mapped[str] = mapped_column(String)


class TimelineItemModel(Base):
    __tablename__ = "timeline_items"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String)   # "alert" | "case"
    entity_id: Mapped[str] = mapped_column(String)
    user_id: Mapped[str] = mapped_column(String, default="")
    alert_id: Mapped[str] = mapped_column(String, default="")
    case_id: Mapped[str] = mapped_column(String, default="")
    occurred_at: Mapped[datetime.datetime] = mapped_column(DateTime)
    ingested_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=True)
    kind: Mapped[str] = mapped_column(String)   # baseline | suspicious | trigger | analyst_action
    title: Mapped[str] = mapped_column(String)
    explanation: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[str] = mapped_column(String, default="")
    source_record_id: Mapped[str] = mapped_column(String, default="")


async def init_db():
    async with engine.begin() as conn:
        await conn.execute(text("PRAGMA journal_mode=WAL"))
        await conn.run_sync(Base.metadata.create_all)
        for stmt in [
            # Original migrations
            "ALTER TABLE alerts ADD COLUMN notes TEXT DEFAULT ''",
            "ALTER TABLE events ADD COLUMN device TEXT DEFAULT ''",
            "ALTER TABLE events ADD COLUMN download_mb REAL DEFAULT 0.0",
            "ALTER TABLE events ADD COLUMN tx_count INTEGER DEFAULT 0",
            "ALTER TABLE alerts ADD COLUMN label_updated_at DATETIME",
            "ALTER TABLE alerts ADD COLUMN created_at DATETIME",
            "ALTER TABLE users ADD COLUMN restricted INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN escalated INTEGER DEFAULT 0",
            "ALTER TABLE model_metrics ADD COLUMN recall REAL DEFAULT 0.0",
            "ALTER TABLE model_metrics ADD COLUMN f1 REAL DEFAULT 0.0",
            "ALTER TABLE events ADD COLUMN event_source TEXT DEFAULT 'live'",
            "CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, created_at DATETIME, action_type TEXT, entity_type TEXT, entity_id TEXT, user_id TEXT DEFAULT '', alert_id TEXT DEFAULT '', message TEXT DEFAULT '')",
            "CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, name TEXT, severity TEXT, status TEXT DEFAULT 'open', start_time DATETIME, end_time DATETIME, user_ids_json TEXT DEFAULT '[]', user_names_json TEXT DEFAULT '[]', alert_count INTEGER DEFAULT 0, updated_at DATETIME)",
            "CREATE TABLE IF NOT EXISTS case_alerts (id TEXT PRIMARY KEY, case_id TEXT, alert_id TEXT)",
            # Phase 1 migrations
            "ALTER TABLE users ADD COLUMN risk_updated_at DATETIME",
            "ALTER TABLE events ADD COLUMN occurred_at DATETIME",
            "ALTER TABLE events ADD COLUMN ingested_at DATETIME",
            "ALTER TABLE events ADD COLUMN source TEXT DEFAULT 'live'",
            "ALTER TABLE events ADD COLUMN scenario_id TEXT DEFAULT ''",
            "ALTER TABLE events ADD COLUMN system TEXT DEFAULT ''",
            "ALTER TABLE alerts ADD COLUMN occurred_at DATETIME",
            "ALTER TABLE alerts ADD COLUMN ingested_at DATETIME",
            "ALTER TABLE alerts ADD COLUMN ai_narrative TEXT",
            "ALTER TABLE cases ADD COLUMN title TEXT",
            "ALTER TABLE cases ADD COLUMN user_id TEXT",
            "ALTER TABLE cases ADD COLUMN user_name TEXT",
            "ALTER TABLE cases ADD COLUMN first_seen DATETIME",
            "ALTER TABLE cases ADD COLUMN last_seen DATETIME",
            "ALTER TABLE cases ADD COLUMN scenario_id TEXT",
            "ALTER TABLE cases ADD COLUMN created_at DATETIME",
            # TimelineItemModel
            """CREATE TABLE IF NOT EXISTS timeline_items (
                id TEXT PRIMARY KEY,
                entity_type TEXT,
                entity_id TEXT,
                user_id TEXT DEFAULT '',
                alert_id TEXT DEFAULT '',
                case_id TEXT DEFAULT '',
                occurred_at DATETIME,
                ingested_at DATETIME,
                kind TEXT,
                title TEXT,
                explanation TEXT DEFAULT '',
                severity TEXT DEFAULT '',
                source_record_id TEXT DEFAULT ''
            )""",
            # Indexes
            "CREATE INDEX IF NOT EXISTS idx_events_source_ingested ON events(source, ingested_at)",
            "CREATE INDEX IF NOT EXISTS idx_events_user_occurred ON events(user_id, occurred_at)",
            "CREATE INDEX IF NOT EXISTS idx_alerts_status_risk ON alerts(status, risk_score)",
            "CREATE INDEX IF NOT EXISTS idx_alerts_user_occurred ON alerts(user_id, occurred_at)",
            "CREATE INDEX IF NOT EXISTS idx_timeline_alert_occurred ON timeline_items(alert_id, occurred_at)",
            "CREATE INDEX IF NOT EXISTS idx_timeline_case_occurred ON timeline_items(case_id, occurred_at)",
            "CREATE INDEX IF NOT EXISTS idx_case_alerts_case ON case_alerts(case_id)",
            "CREATE INDEX IF NOT EXISTS idx_case_alerts_alert ON case_alerts(alert_id)",
        ]:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass


async def get_db():
    async with SessionLocal() as session:
        yield session
