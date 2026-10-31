from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Boolean,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from database import Base


def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, nullable=False, index=True)
    state = Column(String, index=True)
    district = Column(String, index=True)
    land_required = Column(Float)
    affected_families = Column(Integer)
    estimated_cost = Column(Float)
    project_type = Column(String, default="Highway")
    compensation_status = Column(String, default="In Progress")
    approval_days_pending = Column(Integer, default=0)
    approval_status = Column(
        String,
        default="In Administrative Review",
        nullable=False,
    )
    legal_dispute = Column(String, default="No")
    possession_status = Column(String, default="Not Taken")
    rehabilitation_progress = Column(Float, default=0)
    stakeholder_score = Column(Float, default=5)
    district_historical_delay = Column(Float, default=0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String, default="Pending", index=True)
    created_at = Column(DateTime, default=utc_now_naive)

    predictions = relationship(
        "Prediction",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    alerts = relationship(
        "Alert",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    administrative_actions = relationship(
        "AdministrativeAction",
        back_populates="project",
        cascade="all, delete-orphan",
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    delay_probability = Column(Float)
    risk_level = Column(String)
    stage_risk = Column(JSON, nullable=True)
    highest_risk_stage = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)

    project = relationship("Project", back_populates="predictions")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="Officer")
    created_at = Column(DateTime, default=utc_now_naive)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )
    message = Column(String)
    risk_level = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now_naive)

    project = relationship("Project", back_populates="alerts")


class AdministrativeAction(Base):
    __tablename__ = "administrative_actions"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
    )

    action_type = Column(String, nullable=False, index=True)

    status = Column(
        String,
        nullable=False,
        default="Requested",
        index=True,
    )

    requested_by = Column(String, nullable=False)

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=utc_now_naive,
        nullable=False,
    )

    project = relationship(
        "Project",
        back_populates="administrative_actions",
    )