import sqlite3

import pytest
from sqlalchemy import create_engine, inspect, text

from migrations import _migration_engine, upgrade_schema


def test_upgrade_adds_columns_and_preserves_existing_project(tmp_path):
    database_path = tmp_path / "legacy.sqlite"
    raw_connection = sqlite3.connect(database_path)
    raw_connection.execute(
        "CREATE TABLE projects "
        "(id INTEGER PRIMARY KEY, project_name VARCHAR NOT NULL)"
    )
    raw_connection.execute(
        "INSERT INTO projects (id, project_name) VALUES (17, 'Existing project')"
    )
    raw_connection.commit()
    raw_connection.close()

    database_engine = create_engine(f"sqlite:///{database_path}")
    try:
        upgrade_schema(database_engine)
        upgrade_schema(database_engine)

        with database_engine.connect() as connection:
            project = connection.execute(
                text(
                    "SELECT id, project_name, approval_status, latitude, longitude "
                    "FROM projects WHERE id = 17"
                )
            ).one()
            versions = connection.execute(
                text("SELECT version FROM schema_migrations ORDER BY version")
            ).scalars().all()

        assert project == (
            17,
            "Existing project",
            "In Administrative Review",
            None,
            None,
        )
        assert versions == [
            "0001_project_approval_status",
            "0002_project_coordinates",
            "0003_prediction_stage_risk",
        ]
        assert {"stage_risk", "highest_risk_stage"} <= {
            column["name"]
            for column in inspect(database_engine).get_columns("predictions")
        }
    finally:
        database_engine.dispose()


def test_migration_engine_prefers_direct_database_url(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL_UNPOOLED",
        "postgresql://test@ep-example.us-east-2.aws.neon.tech/bhoomi",
    )

    migration_engine, owns_engine = _migration_engine()
    try:
        assert owns_engine is True
        assert migration_engine.url.host == "ep-example.us-east-2.aws.neon.tech"
    finally:
        migration_engine.dispose()


def test_migration_engine_rejects_pooled_unpooled_url(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL_UNPOOLED",
        "postgresql://test@ep-example-pooler.us-east-2.aws.neon.tech/bhoomi",
    )

    with pytest.raises(RuntimeError, match="direct, non-pooled"):
        _migration_engine()
