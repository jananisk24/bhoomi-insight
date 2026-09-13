import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Allows overriding via an environment variable when you move to
# PostgreSQL for real deployment, without touching any code.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bhoomi_insight.db")

# check_same_thread is only needed for SQLite.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

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
