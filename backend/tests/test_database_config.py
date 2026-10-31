import os
import subprocess
import sys


def run_database_import(**overrides):
    environment = os.environ.copy()
    environment.pop("DATABASE_URL", None)
    environment.update(overrides)
    return subprocess.run(
        [sys.executable, "-c", "import database; print(database.engine.dialect.name)"],
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )


def test_production_database_requires_explicit_url():
    result = run_database_import(ENVIRONMENT="production")

    assert result.returncode != 0
    assert "DATABASE_URL must be configured in production" in result.stderr


def test_production_database_rejects_sqlite():
    result = run_database_import(
        ENVIRONMENT="production",
        DATABASE_URL="sqlite:///./bhoomi_insight.db",
    )

    assert result.returncode != 0
    assert "Production DATABASE_URL must use PostgreSQL" in result.stderr


def test_production_database_accepts_postgresql_without_connecting():
    result = run_database_import(
        ENVIRONMENT="production",
        DATABASE_URL="postgresql://user:password@localhost:5432/bhoomi_test",
    )

    assert result.returncode == 0
    assert result.stdout.strip() == "postgresql"
