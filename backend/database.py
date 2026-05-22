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


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    action_type: Mapped[str] = mapped_column(String)          # restrict|escalate|label|resolve|dismiss|note
    entity_type: Mapped[str] = mapped_column(String)          # alert|user
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


class CaseAlertModel(Base):
    __tablename__ = "case_alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(String)
    alert_id: Mapped[str] = mapped_column(String)


async def init_db():
    async with engine.begin() as conn:
        await conn.execute(text("PRAGMA journal_mode=WAL"))
        await conn.run_sync(Base.metadata.create_all)
        # Add columns introduced after initial schema; ignored if already present
        for stmt in [
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
        ]:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass


async def get_db():
    async with SessionLocal() as session:
        yield session
