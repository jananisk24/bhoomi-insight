from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship

from database import Base


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
    legal_dispute = Column(String, default="No")
    possession_status = Column(String, default="Not Taken")
    rehabilitation_progress = Column(Float, default=0)
    stakeholder_score = Column(Float, default=5)
    district_historical_delay = Column(Float, default=0)
    status = Column(String, default="Pending", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Reverse lookups: project.predictions / project.alerts
    predictions = relationship(
        "Prediction", back_populates="project", cascade="all, delete-orphan"
    )
    alerts = relationship(
        "Alert", back_populates="project", cascade="all, delete-orphan"
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    # Real FK instead of a bare int - enforces referential integrity
    # and enables cascading deletes / joined queries.
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    delay_probability = Column(Float)
    risk_level = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="predictions")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    # Matches the "Admin / Officer" role selection mentioned in the guide.
    role = Column(String, default="Officer")
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    message = Column(String)
    risk_level = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="alerts")
