from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
import main
from auth import create_token, hash_password
from admin_bootstrap import provision_first_admin
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


def test_registration_remains_disabled_in_production(api_client, monkeypatch):
    client, _ = api_client
    monkeypatch.setattr(main, "is_production", True)
    monkeypatch.setenv("ALLOW_USER_REGISTRATION", "true")

    response = client.post(
        "/register",
        json={"username": "not-allowed", "password": "valid-password"},
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

    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    profile = client.get("/me", headers=headers)
    assert profile.status_code == 200
    assert profile.json() == {"username": "new-officer", "role": "Officer"}

    projects = client.get(
        "/projects",
        headers=headers,
    )
    assert projects.status_code == 200


def test_current_user_profile_rejects_missing_or_invalid_token(api_client):
    client, _ = api_client

    assert client.get("/me").status_code == 401
    assert client.get(
        "/me",
        headers={"Authorization": "Bearer invalid-token"},
    ).status_code == 401


def test_bootstrapped_admin_can_login_and_project_persists(api_client):
    client, session_factory = api_client
    password = "secure-test-password"
    with session_factory() as db:
        admin = provision_first_admin(db, "  first-admin  ", password)
        assert admin.role == "Admin"
        assert admin.username == "first-admin"
        assert admin.password != password

    login = client.post(
        "/login",
        json={"username": "first-admin", "password": password},
    )
    assert login.status_code == 200
    assert login.json()["role"] == "Admin"
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    created = client.post(
        "/projects",
        headers=headers,
        json={
            "project_name": "Admin persistence verification",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 100,
            "estimated_cost": 10_000_000,
        },
    )
    assert created.status_code == 200
    project_id = created.json()["id"]

    retrieved = client.get(f"/projects/{project_id}", headers=headers)
    assert retrieved.status_code == 200
    assert retrieved.json()["project_name"] == "Admin persistence verification"

    with session_factory() as db:
        stored_project = db.get(models.Project, project_id)
        assert stored_project is not None
        assert stored_project.project_name == "Admin persistence verification"


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


def test_legacy_project_types_are_accepted_and_preserved(api_client):
    client, session_factory = api_client
    create_user(session_factory)
    headers = {
        "Authorization": f"Bearer {create_token('officer', 'Officer')}"
    }

    created = client.post(
        "/projects",
        headers=headers,
        json={
            "project_name": "Airport expansion verification",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 123,
            "affected_families": 282,
            "estimated_cost": 10000000,
            "project_type": "Airport Expansion",
        },
    )
    assert created.status_code == 200
    project_id = created.json()["id"]
    assert created.json()["project_type"] == "Airport Expansion"
    stored = client.get(f"/projects/{project_id}", headers=headers)
    assert stored.status_code == 200
    assert stored.json()["project_type"] == "Airport Expansion"

    partial_update = client.put(
        f"/projects/{project_id}",
        headers=headers,
        json={"district": "Kanchipuram"},
    )
    assert partial_update.status_code == 200
    assert partial_update.json()["project_type"] == "Airport Expansion"

    unsupported_prediction = client.put(
        f"/projects/{project_id}/predict",
        headers=headers,
        json={"project_type": "Airport Expansion"},
    )
    assert unsupported_prediction.status_code == 422

    expressway = client.post(
        "/projects",
        headers=headers,
        json={
            "project_name": "Expressway type verification",
            "state": "Maharashtra",
            "district": "Nashik",
            "land_required": 350,
            "affected_families": 423,
            "estimated_cost": 20000000,
            "project_type": "Highway / Expressway",
        },
    )
    assert expressway.status_code == 200
    assert expressway.json()["project_type"] == "Highway / Expressway"

    unsupported = client.post(
        "/projects",
        headers=headers,
        json={
            "project_name": "Unsupported type",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 10,
            "estimated_cost": 10000000,
            "project_type": "Space Elevator",
        },
    )
    assert unsupported.status_code == 422


def test_alert_read_status_can_be_updated_and_persists(api_client):
    client, session_factory = api_client
    create_user(session_factory)
    with session_factory() as db:
        project = models.Project(
            project_name="Alert read test",
            state="Tamil Nadu",
            district="Chennai",
            land_required=10,
            affected_families=100,
            estimated_cost=10000000,
        )
        db.add(project)
        db.flush()
        alert = models.Alert(
            project_id=project.id,
            message="Project has medium delay risk",
            risk_level="Medium",
            is_read=False,
        )
        db.add(alert)
        db.commit()
        alert_id = alert.id

    headers = {
        "Authorization": f"Bearer {create_token('officer', 'Officer')}"
    }
    listed = client.get("/alerts", headers=headers)
    assert listed.status_code == 200
    assert listed.json()[0]["is_read"] is False

    updated = client.patch(
        f"/alerts/{alert_id}",
        headers=headers,
        json={"is_read": True},
    )
    assert updated.status_code == 200
    assert updated.json()["is_read"] is True

    with session_factory() as db:
        assert db.get(models.Alert, alert_id).is_read is True

    listed_again = client.get("/alerts", headers=headers)
    assert listed_again.json()[0]["is_read"] is True

    missing = client.patch(
        "/alerts/9999",
        headers=headers,
        json={"is_read": True},
    )
    assert missing.status_code == 404


def test_projects_are_listed_oldest_first(api_client):
    client, session_factory = api_client
    create_user(session_factory)
    headers = {
        "Authorization": f"Bearer {create_token('officer', 'Officer')}"
    }

    ids = []
    for name in ("Oldest project", "Middle project", "Newest project"):
        created = client.post(
            "/projects",
            headers=headers,
            json={
                "project_name": name,
                "state": "Tamil Nadu",
                "district": "Chennai",
                "land_required": 10,
                "affected_families": 10,
                "estimated_cost": 10000000,
            },
        )
        assert created.status_code == 200
        ids.append(created.json()["id"])

    with session_factory() as db:
        timestamps = (
            datetime(2026, 1, 2),
            datetime(2026, 1, 3),
            datetime(2026, 1, 1),
        )
        for project_id, timestamp in zip(ids, timestamps):
            project = db.get(models.Project, project_id)
            project.created_at = timestamp
        db.commit()

    listed = client.get("/projects", headers=headers)
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [ids[2], ids[0], ids[1]]


def test_latest_prediction_uses_timestamp_not_highest_id(api_client):
    client, session_factory = api_client
    create_user(session_factory)
    with session_factory() as db:
        project = models.Project(
            project_name="Prediction ordering test",
            state="Tamil Nadu",
            district="Chennai",
            land_required=10,
            affected_families=100,
            estimated_cost=10000000,
        )
        db.add(project)
        db.flush()
        newer = models.Prediction(
            project_id=project.id,
            delay_probability=0.25,
            risk_level="Low",
            created_at=datetime(2026, 2, 1),
        )
        older = models.Prediction(
            project_id=project.id,
            delay_probability=0.75,
            risk_level="High",
            created_at=datetime(2026, 1, 1),
        )
        db.add(newer)
        db.add(older)
        db.commit()
        newer_id = newer.id

    latest = client.get(
        "/predictions/latest",
        headers={
            "Authorization": f"Bearer {create_token('officer', 'Officer')}"
        },
    )
    assert latest.status_code == 200
    assert len(latest.json()) == 1
    assert latest.json()[0]["id"] == newer_id
    assert latest.json()[0]["delay_probability"] == 0.25


@pytest.mark.parametrize("field", ["project_name", "state", "approval_status"])
def test_project_update_rejects_explicit_null(api_client, field):
    client, session_factory = api_client
    create_user(session_factory)
    headers = {
        "Authorization": f"Bearer {create_token('officer', 'Officer')}"
    }
    created = client.post(
        "/projects",
        headers=headers,
        json={
            "project_name": "Null update test",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 10,
            "estimated_cost": 10000000,
        },
    )
    assert created.status_code == 200
    project_id = created.json()["id"]
    original_value = created.json()[field]

    response = client.put(
        f"/projects/{project_id}",
        headers=headers,
        json={field: None},
    )
    assert response.status_code == 422

    with session_factory() as db:
        assert getattr(db.get(models.Project, project_id), field) == original_value


def test_project_update_can_clear_coordinate_pair_only(api_client):
    client, session_factory = api_client
    create_user(session_factory)
    headers = {
        "Authorization": f"Bearer {create_token('officer', 'Officer')}"
    }
    created = client.post(
        "/projects",
        headers=headers,
        json={
            "project_name": "Coordinate clear test",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 10,
            "estimated_cost": 10000000,
            "latitude": 13.08,
            "longitude": 80.27,
        },
    )
    assert created.status_code == 200
    project_id = created.json()["id"]

    one_sided = client.put(
        f"/projects/{project_id}",
        headers=headers,
        json={"latitude": None},
    )
    assert one_sided.status_code == 422
    with session_factory() as db:
        project = db.get(models.Project, project_id)
        assert (project.latitude, project.longitude) == (13.08, 80.27)

    cleared = client.put(
        f"/projects/{project_id}",
        headers=headers,
        json={"latitude": None, "longitude": None},
    )
    assert cleared.status_code == 200
    assert cleared.json()["latitude"] is None
    assert cleared.json()["longitude"] is None


def test_expressway_prediction_normalizes_model_input_but_preserves_type(
    api_client,
):
    client, session_factory = api_client
    create_user(session_factory)
    headers = {
        "Authorization": f"Bearer {create_token('officer', 'Officer')}"
    }

    response = client.post(
        "/projects/predict",
        headers=headers,
        json={
            "project_name": "Expressway prediction test",
            "state": "Maharashtra",
            "district": "Nashik",
            "land_required": 10,
            "affected_families": 10,
            "estimated_cost": 10000000,
            "project_type": "Highway / Expressway",
        },
    )
    assert response.status_code == 201
    assert response.json()["project"]["project_type"] == "Highway / Expressway"


def test_airport_prediction_rejects_unseen_model_category_without_saving(
    api_client,
):
    client, session_factory = api_client
    create_user(session_factory)
    headers = {
        "Authorization": f"Bearer {create_token('officer', 'Officer')}"
    }

    response = client.post(
        "/projects/predict",
        headers=headers,
        json={
            "project_name": "Airport prediction test",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "land_required": 10,
            "affected_families": 10,
            "estimated_cost": 10000000,
            "project_type": "Airport Expansion",
        },
    )
    assert response.status_code == 422
    with session_factory() as db:
        assert db.query(models.Project).count() == 0
        assert db.query(models.Prediction).count() == 0


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
