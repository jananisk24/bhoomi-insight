"""Explicit, additive database upgrades for existing SQLite and PostgreSQL data."""

import os
from urllib.parse import urlsplit

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

from database import engine
from models import Base


_MIGRATIONS = (
    (
        "0001_project_approval_status",
        "projects",
        "approval_status",
        "VARCHAR NOT NULL DEFAULT 'In Administrative Review'",
    ),
    ("0002_project_coordinates", "projects", "latitude", "FLOAT"),
    ("0002_project_coordinates", "projects", "longitude", "FLOAT"),
    ("0003_prediction_stage_risk", "predictions", "stage_risk", "JSON"),
    (
        "0003_prediction_stage_risk",
        "predictions",
        "highest_risk_stage",
        "VARCHAR",
    ),
)


def upgrade_schema(database_engine: Engine = engine) -> None:
    """Create missing tables and add missing columns without dropping data."""
    Base.metadata.create_all(bind=database_engine)

    with database_engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS schema_migrations "
                "(version VARCHAR PRIMARY KEY, applied_at TIMESTAMP "
                "NOT NULL DEFAULT CURRENT_TIMESTAMP)"
            )
        )

    for version, table, column, column_definition in _MIGRATIONS:
        inspector = inspect(database_engine)
        if table not in inspector.get_table_names():
            raise RuntimeError(
                f"Expected table {table!r} to exist after creating missing tables."
            )

        existing_columns = {
            entry["name"] for entry in inspector.get_columns(table)
        }
        if column not in existing_columns:
            with database_engine.begin() as connection:
                connection.execute(
                    text(
                        f"ALTER TABLE {table} ADD COLUMN {column} "
                        f"{column_definition}"
                    )
                )

        with database_engine.begin() as connection:
            already_applied = connection.execute(
                text("SELECT 1 FROM schema_migrations WHERE version = :version"),
                {"version": version},
            ).first()
            if already_applied is None:
                connection.execute(
                    text(
                        "INSERT INTO schema_migrations (version) "
                        "VALUES (:version)"
                    ),
                    {"version": version},
                )


def _migration_engine() -> tuple[Engine, bool]:
    """Prefer Neon’s direct URL for schema changes; return ownership as well."""
    database_url = os.getenv("DATABASE_URL_UNPOOLED")
    migration_engine = engine
    owns_engine = False

    if database_url:
        hostname = urlsplit(database_url).hostname or ""
        if any(label.endswith("-pooler") for label in hostname.split(".")):
            raise RuntimeError(
                "DATABASE_URL_UNPOOLED must use a direct, non-pooled PostgreSQL URL."
            )
        if database_url.startswith("postgres://"):
            database_url = database_url.replace(
                "postgres://", "postgresql://", 1
            )
        migration_engine = create_engine(database_url, pool_pre_ping=True)
        owns_engine = True
    else:
        hostname = engine.url.host or ""
        if any(label.endswith("-pooler") for label in hostname.split(".")):
            raise RuntimeError(
                "Set DATABASE_URL_UNPOOLED to a direct PostgreSQL URL before running migrations."
            )

    return migration_engine, owns_engine


if __name__ == "__main__":
    migration_database_engine, owns_engine = _migration_engine()
    try:
        upgrade_schema(migration_database_engine)
        print("Database schema upgrades completed.")
    finally:
        if owns_engine:
            migration_database_engine.dispose()
