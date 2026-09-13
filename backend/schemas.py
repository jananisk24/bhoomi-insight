from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


# ---------- Projects ----------

class ProjectCreate(BaseModel):
    project_name: str = Field(min_length=1)
    state: str = Field(min_length=1)
    district: str = Field(min_length=1)
    land_required: float = Field(gt=0)
    affected_families: int = Field(gt=0)
    estimated_cost: float = Field(gt=0)


class ProjectResponse(BaseModel):
    # Lets FastAPI serialize a SQLAlchemy model directly and validates
    # + documents the real response shape in Swagger, instead of the
    # route just returning raw ORM objects.
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_name: str
    state: str
    district: str
    land_required: float
    affected_families: int
    estimated_cost: float
    status: str
    created_at: datetime


# ---------- Users / Auth ----------

class UserCreate(BaseModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=8)
    role: Literal["Admin", "Officer"] = "Officer"


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Predictions ----------

class PredictionCreate(BaseModel):
    project_id: int


class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    delay_probability: float
    risk_level: str
    created_at: datetime


# ---------- Simulation (What-If) ----------

class SimulationRequest(BaseModel):
    project_id: int
    affected_families: int = Field(gt=0)
    estimated_cost: float = Field(gt=0)


class SimulationResponse(BaseModel):
    project_id: int
    project_name: str
    simulated_affected_families: int
    simulated_estimated_cost: float
    risk_score: int
    risk_level: str


# ---------- Alerts ----------

class AlertCreate(BaseModel):
    project_id: int
    message: str
    risk_level: str
    is_read: bool = False


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    message: str
    risk_level: str
    is_read: bool
    created_at: datetime


# ---------- Analytics ----------

class AnalyticsResponse(BaseModel):
    total_projects: int
    pending_projects: int
    completed_projects: int
    total_predictions: int
    total_alerts: int
