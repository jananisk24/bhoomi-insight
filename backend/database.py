import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

ENVIRONMENT = os.getenv("ENVIRONMENT", "production").strip().lower()
configured_database_url = os.getenv("DATABASE_URL")

if ENVIRONMENT in {"production", "prod"}:
    if not configured_database_url:
        raise RuntimeError("DATABASE_URL must be configured in production.")
    if not configured_database_url.startswith(
        ("postgres://", "postgresql://", "postgresql+psycopg2://")
    ):
        raise RuntimeError("Production DATABASE_URL must use PostgreSQL.")

DATABASE_URL = configured_database_url or "sqlite:///./bhoomi_insight.db"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# check_same_thread is only needed for SQLite.
is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Single source of truth for DB sessions - import this everywhere,
    don't redefine it in main.py."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
