"""All direct database operations live here."""

import math

from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from auth import hash_password, verify_password


# ---------- Users ----------

def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.query(models.User).filter(
        models.User.username == username
    ).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    new_user = models.User(
        username=user.username,
        password=hash_password(user.password),
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(
    db: Session, username: str, password: str
) -> models.User | None:
    user = get_user_by_username(db, username)

    if not user or not verify_password(password, user.password):
        return None

    return user


# ---------- Projects ----------

def create_project(
    db: Session, project: schemas.ProjectCreate
) -> models.Project:
    new_project = models.Project(**project.model_dump())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


def get_projects(
    db: Session, skip: int = 0, limit: int = 100
) -> list[models.Project]:
    return (
        db.query(models.Project)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_project(db: Session, project_id: int) -> models.Project | None:
    return (
        db.query(models.Project)
        .filter(models.Project.id == project_id)
        .first()
    )


def update_project(
    db: Session,
    project: models.Project,
    update: schemas.ProjectUpdate,
) -> models.Project:
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


# ---------- Predictions ----------

def create_prediction(
    db: Session,
    project_id: int,
    delay_probability: float,
    risk_level: str,
    stage_risk: dict[str, dict[str, float | str]],
    highest_risk_stage: str,
) -> models.Prediction:
    new_prediction = models.Prediction(
        project_id=project_id,
        delay_probability=delay_probability,
        risk_level=risk_level,
        stage_risk=stage_risk,
        highest_risk_stage=highest_risk_stage,
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return new_prediction


def get_predictions_for_project(
    db: Session, project_id: int
) -> list[models.Prediction]:
    return (
        db.query(models.Prediction)
        .filter(models.Prediction.project_id == project_id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )


def get_latest_predictions(db: Session) -> list[models.Prediction]:
    latest_ids = (
        db.query(func.max(models.Prediction.id).label("id"))
        .group_by(models.Prediction.project_id)
        .subquery()
    )
    return (
        db.query(models.Prediction)
        .join(latest_ids, models.Prediction.id == latest_ids.c.id)
        .order_by(models.Prediction.project_id)
        .all()
    )


# ---------- Alerts ----------

def create_alert(
    db: Session, alert: schemas.AlertCreate
) -> models.Alert:
    new_alert = models.Alert(**alert.model_dump())

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return new_alert


def get_alerts(db: Session) -> list[models.Alert]:
    return (
        db.query(models.Alert)
        .order_by(models.Alert.created_at.desc())
        .all()
    )


# ---------- Administrative Actions ----------

def create_administrative_action(
    db: Session,
    action: schemas.AdministrativeActionCreate,
    requested_by: str,
) -> models.AdministrativeAction:

    new_action = models.AdministrativeAction(
        project_id=action.project_id,
        action_type=action.action_type,
        status="Requested",
        requested_by=requested_by,
        notes=action.notes,
    )

    db.add(new_action)
    db.commit()
    db.refresh(new_action)

    return new_action


def get_administrative_actions(
    db: Session,
    project_id: int | None = None,
) -> list[models.AdministrativeAction]:

    query = db.query(models.AdministrativeAction)

    if project_id is not None:
        query = query.filter(
            models.AdministrativeAction.project_id == project_id
        )

    return query.order_by(
        models.AdministrativeAction.created_at.desc()
    ).all()


def get_administrative_action(
    db: Session,
    action_id: int,
) -> models.AdministrativeAction | None:

    return (
        db.query(models.AdministrativeAction)
        .filter(models.AdministrativeAction.id == action_id)
        .first()
    )


def update_administrative_action(
    db: Session,
    action: models.AdministrativeAction,
    update: schemas.AdministrativeActionStatusUpdate,
) -> models.AdministrativeAction:

    action.status = update.status

    if update.notes is not None:
        action.notes = update.notes

    db.commit()
    db.refresh(action)

    return action


# ---------- Analytics ----------

def get_analytics(db: Session) -> dict:
    latest_predictions = get_latest_predictions(db)
    valid_predictions = [
        prediction
        for prediction in latest_predictions
        if prediction.delay_probability is not None
        and math.isfinite(prediction.delay_probability)
        and 0 <= prediction.delay_probability <= 1
    ]
    valid_scores = [
        prediction.delay_probability * 100
        for prediction in valid_predictions
    ]

    return {
        "total_projects": db.query(models.Project).count(),

        "pending_projects": db.query(models.Project)
        .filter(models.Project.status == "Pending")
        .count(),

        "completed_projects": db.query(models.Project)
        .filter(models.Project.status == "Completed")
        .count(),

        "total_predictions": db.query(models.Prediction).count(),

        "total_alerts": db.query(models.Alert).count(),
        "predicted_projects": len(valid_predictions),
        "average_risk_score": (
            sum(valid_scores) / len(valid_scores) if valid_scores else None
        ),
        "high_risk_projects": sum(
            prediction.risk_level == "High"
            for prediction in valid_predictions
        ),
        "medium_risk_projects": sum(
            prediction.risk_level == "Medium"
            for prediction in valid_predictions
        ),
        "low_risk_projects": sum(
            prediction.risk_level == "Low"
            for prediction in valid_predictions
        ),
    }