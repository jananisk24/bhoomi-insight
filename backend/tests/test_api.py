import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
import main
from auth import create_token, hash_password
from database import Base, get_db
from main import app


@pytest.fixture
def api_client(tmp_path, monkeypatch):
    database_engine = create_engine(
        f"sqlite:///{tmp_path / 'api-test.sqlite'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=database_engine)
    test_sessions = sessionmaker(bind=database_engine)

    def override_get_db():
        db = test_sessions()
        try:
            yield db
        finally:
            db.close()

    monkeypatch.delenv("ALLOW_USER_REGISTRATION", raising=False)
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as client:
            yield client, test_sessions
    finally:
        app.dependency_overrides.clear()
        database_engine.dispose()


def create_user(session_factory, username="officer", role="Officer"):
    with session_factory() as db:
        user = models.User(
            username=username,
            password=hash_password("valid-password"),
            role=role,
        )
        db.add(user)
        db.commit()
        return user.id


def test_registration_is_disabled_by_default(api_client):
    client, _ = api_client

    response = client.post(
        "/register",
        json={"username": "new-officer", "password": "valid-password"},
    )

    assert response.status_code == 403


def test_registration_and_login_succeed_when_enabled(api_client, monkeypatch):
    client, _ = api_client
    monkeypatch.setenv("ALLOW_USER_REGISTRATION", "true")

    registered = client.post(
        "/register",
        json={"username": "new-officer", "password": "valid-password"},
    )
    assert registered.status_code == 200

    login = client.post(
        "/login",
        json={"username": "new-officer", "password": "valid-password"},
    )
    assert login.status_code == 200
    assert login.json()["role"] == "Officer"

    projects = client.get(
        "/projects",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert projects.status_code == 200


def test_saved_project_prediction_and_simulation_share_model_probability(api_client):
    client, session_factory = api_client
    create_user(session_factory)
    token = create_token("officer", "Officer")
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/projects",
        headers=headers,
        json={
            "project_name": "API persistence test",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 100,
            "estimated_cost": 10000000,
        },
    )
    assert created.status_code == 200
    project_id = created.json()["id"]

    prediction = client.post(
        "/predict",
        headers=headers,
        json={"project_id": project_id},
    )
    assert prediction.status_code == 200
    saved_probability = prediction.json()["delay_probability"]

    history = client.get(f"/predictions/{project_id}", headers=headers)
    assert history.status_code == 200
    assert history.json()[0]["delay_probability"] == saved_probability

    simulation = client.post(
        "/simulate",
        headers=headers,
        json={
            "project_id": project_id,
            "approval_days_pending": 90,
        },
    )
    assert simulation.status_code == 200
    assert simulation.json()["baseline_delay_probability"] == saved_probability

    listed = client.get("/projects", headers=headers)
    assert listed.status_code == 200
    assert any(item["id"] == project_id for item in listed.json())


def test_project_edit_alerts_and_analytics_use_latest_prediction(api_client):
    client, session_factory = api_client
    create_user(session_factory)
    headers = {
        "Authorization": f"Bearer {create_token('officer', 'Officer')}"
    }

    created = client.post(
        "/projects/predict",
        headers=headers,
        json={
            "project_name": "Workflow verification",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 100,
            "estimated_cost": 10000000,
        },
    )
    assert created.status_code == 201
    project_id = created.json()["project"]["id"]

    updated = client.put(
        f"/projects/{project_id}/predict",
        headers=headers,
        json={"approval_days_pending": 180},
    )
    assert updated.status_code == 200
    assert updated.json()["project"]["approval_days_pending"] == 180
    assert updated.json()["prediction"]["project_id"] == project_id

    latest = client.get("/predictions/latest", headers=headers)
    assert latest.status_code == 200
    assert len(latest.json()) == 1

    alert = client.post(
        "/alerts",
        headers=headers,
        json={
            "project_id": project_id,
            "message": "Review pending approvals",
            "risk_level": "High",
        },
    )
    assert alert.status_code == 200
    alerts = client.get("/alerts", headers=headers)
    assert alerts.status_code == 200
    assert len(alerts.json()) == 1

    analytics = client.get("/analytics", headers=headers)
    assert analytics.status_code == 200
    stats = analytics.json()
    assert stats["total_projects"] == 1
    assert stats["total_predictions"] == 2
    assert stats["total_alerts"] == 1
    assert stats["predicted_projects"] == 1
    assert (
        stats["average_risk_score"]
        == latest.json()[0]["delay_probability"] * 100
    )
    assert (
        stats["high_risk_projects"]
        + stats["medium_risk_projects"]
        + stats["low_risk_projects"]
        == 1
    )


def test_atomic_project_submission_saves_matching_prediction(api_client):
    client, session_factory = api_client
    create_user(session_factory)

    response = client.post(
        "/projects/predict",
        headers={"Authorization": f"Bearer {create_token('officer', 'Officer')}"},
        json={
            "project_name": "Atomic save test",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 100,
            "estimated_cost": 10000000,
        },
    )

    assert response.status_code == 201
    result = response.json()
    assert result["project"]["id"] == result["prediction"]["project_id"]
    assert result["prediction"]["risk_level"] in {"Low", "Medium", "High"}
    with session_factory() as db:
        assert db.query(models.Project).count() == 1
        assert db.query(models.Prediction).count() == 1


def test_failed_prediction_does_not_persist_new_project(api_client, monkeypatch):
    client, session_factory = api_client
    create_user(session_factory)

    def fail_prediction(*_args, **_kwargs):
        raise ValueError("invalid legacy feature")

    monkeypatch.setattr(main, "predict_project", fail_prediction)
    response = client.post(
        "/projects/predict",
        headers={"Authorization": f"Bearer {create_token('officer', 'Officer')}"},
        json={
            "project_name": "Must not partially save",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 100,
            "estimated_cost": 10000000,
        },
    )

    assert response.status_code == 422
    with session_factory() as db:
        assert db.query(models.Project).count() == 0
        assert db.query(models.Prediction).count() == 0


def test_deleted_account_token_cannot_access_projects(api_client):
    client, _ = api_client
    token = create_token("deleted-user", "Officer")

    response = client.get(
        "/projects",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_existing_admin_can_update_administrative_action(api_client):
    client, session_factory = api_client
    create_user(session_factory, username="existing-admin", role="Admin")
    with session_factory() as db:
        project = models.Project(project_name="Admin action test")
        db.add(project)
        db.flush()
        action = models.AdministrativeAction(
            project_id=project.id,
            action_type="COLLECTOR_NOTIFICATION",
            status="Requested",
            requested_by="existing-admin",
        )
        db.add(action)
        db.commit()
        action_id = action.id

    login = client.post(
        "/login",
        json={"username": "existing-admin", "password": "valid-password"},
    )
    assert login.status_code == 200
    assert login.json()["role"] == "Admin"

    response = client.patch(
        f"/administrative-actions/{action_id}",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
        json={"status": "Completed"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Completed"


def test_officer_cannot_update_administrative_action(api_client):
    client, session_factory = api_client
    create_user(session_factory)
    with session_factory() as db:
        project = models.Project(project_name="Officer action test")
        db.add(project)
        db.flush()
        action = models.AdministrativeAction(
            project_id=project.id,
            action_type="COLLECTOR_NOTIFICATION",
            status="Requested",
            requested_by="officer",
        )
        db.add(action)
        db.commit()
        action_id = action.id

    response = client.patch(
        f"/administrative-actions/{action_id}",
        headers={"Authorization": f"Bearer {create_token('officer', 'Officer')}"},
        json={"status": "Completed"},
    )

    assert response.status_code == 403
