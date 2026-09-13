"""All direct database operations live here, so route handlers in main.py
stay thin (parse request -> call crud function -> shape response)."""

from sqlalchemy.orm import Session

import models
import schemas
from auth import hash_password, verify_password


# ---------- Users ----------

def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.query(models.User).filter(models.User.username == username).first()


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


def authenticate_user(db: Session, username: str, password: str) -> models.User | None:
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.password):
        return None
    return user


# ---------- Projects ----------

def create_project(db: Session, project: schemas.ProjectCreate) -> models.Project:
    new_project = models.Project(**project.model_dump())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


def get_projects(db: Session, skip: int = 0, limit: int = 100) -> list[models.Project]:
    return db.query(models.Project).offset(skip).limit(limit).all()


def get_project(db: Session, project_id: int) -> models.Project | None:
    return db.query(models.Project).filter(models.Project.id == project_id).first()


# ---------- Predictions ----------

def create_prediction(
    db: Session, project_id: int, delay_probability: float, risk_level: str
) -> models.Prediction:
    new_prediction = models.Prediction(
        project_id=project_id,
        delay_probability=delay_probability,
        risk_level=risk_level,
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)
    return new_prediction


def get_predictions_for_project(db: Session, project_id: int) -> list[models.Prediction]:
    return (
        db.query(models.Prediction)
        .filter(models.Prediction.project_id == project_id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )


# ---------- Alerts ----------

def create_alert(db: Session, alert: schemas.AlertCreate) -> models.Alert:
    new_alert = models.Alert(**alert.model_dump())
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


def get_alerts(db: Session) -> list[models.Alert]:
    return db.query(models.Alert).order_by(models.Alert.created_at.desc()).all()


# ---------- Analytics ----------

def get_analytics(db: Session) -> dict:
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
    }
