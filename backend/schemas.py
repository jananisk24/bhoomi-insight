from datetime import datetime
import re
from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


ProjectType = Literal[
    "Highway",
    "Railway",
    "Irrigation",
    "Power",
    # Values already present in production data. The trained encoder ignores
    # categories it was not trained on, but the API must preserve them exactly.
    "Airport Expansion",
    "Highway / Expressway",
]
CompensationStatus = Literal[
    "Disbursed (100%)",
    "Paid",
    "Partially Disbursed (50-75%)",
    "In Progress",
    "Pending (<25%)",
    "Pending",
    "Not Started",
    "Under Dispute",
]
ApprovalStatus = Literal[
    "Cleared / Approved",
    "In Administrative Review",
    "Environmental Clearance Pending",
    "Incomplete Documentation",
]
PossessionStatus = Literal["Not Taken", "Partial", "Full"]


# ---------- Projects ----------

class ProjectCreate(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)

    project_name: str = Field(min_length=1)
    state: str = Field(min_length=1)
    district: str = Field(min_length=1)
    land_required: float = Field(gt=0)
    affected_families: int = Field(ge=0)
    estimated_cost: float = Field(gt=0)
    project_type: ProjectType = "Highway"
    compensation_status: CompensationStatus = "In Progress"
    approval_days_pending: int = Field(default=0, ge=0, le=365)
    approval_status: ApprovalStatus = "In Administrative Review"
    legal_dispute: Literal["Yes", "No"] = "No"
    possession_status: PossessionStatus = "Not Taken"
    rehabilitation_progress: float = Field(default=0, ge=0, le=100)
    stakeholder_score: float = Field(default=5, ge=1, le=5)
    district_historical_delay: float = Field(default=0, ge=0, le=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def coordinates_must_be_paired(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class ProjectUpdate(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def reject_explicit_nulls(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        non_coordinate_fields = {
            "project_name", "state", "district", "land_required",
            "affected_families", "estimated_cost", "project_type",
            "compensation_status", "approval_days_pending", "approval_status",
            "legal_dispute", "possession_status", "rehabilitation_progress",
            "stakeholder_score", "district_historical_delay",
        }
        null_fields = sorted(
            field for field in non_coordinate_fields
            if field in data and data[field] is None
        )
        if null_fields:
            raise ValueError(
                f"Fields cannot be null: {', '.join(null_fields)}"
            )

        latitude_is_null = "latitude" in data and data["latitude"] is None
        longitude_is_null = "longitude" in data and data["longitude"] is None
        if latitude_is_null != longitude_is_null:
            raise ValueError("latitude and longitude must be cleared together")

        return data

    model_config = ConfigDict(allow_inf_nan=False)

    project_name: str | None = Field(default=None, min_length=1)
    state: str | None = Field(default=None, min_length=1)
    district: str | None = Field(default=None, min_length=1)
    land_required: float | None = Field(default=None, gt=0)
    affected_families: int | None = Field(default=None, ge=0)
    estimated_cost: float | None = Field(default=None, gt=0)
    project_type: ProjectType | None = None
    compensation_status: CompensationStatus | None = None
    approval_days_pending: int | None = Field(default=None, ge=0, le=365)
    approval_status: ApprovalStatus | None = None
    legal_dispute: Literal["Yes", "No"] | None = None
    possession_status: PossessionStatus | None = None
    rehabilitation_progress: float | None = Field(default=None, ge=0, le=100)
    stakeholder_score: float | None = Field(default=None, ge=1, le=5)
    district_historical_delay: float | None = Field(default=None, ge=0, le=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def coordinates_must_be_paired(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_name: str
    state: str
    district: str
    land_required: float
    affected_families: int
    estimated_cost: float
    project_type: str
    compensation_status: str
    approval_days_pending: int
    legal_dispute: str
    possession_status: str
    rehabilitation_progress: float
    stakeholder_score: float
    district_historical_delay: float
    status: str
    created_at: datetime
    approval_status: str
    latitude: float | None
    longitude: float | None


# ---------- Users / Auth ----------

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8)
    role: Literal["Officer"] = "Officer"

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 3 or len(normalized) > 64:
            raise ValueError("username must be between 3 and 64 characters")
        if re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{2,63}", normalized) is None:
            raise ValueError(
                "username must start with a letter or number and contain only "
                "letters, numbers, periods, underscores, or hyphens"
            )
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password must be at most 72 UTF-8 bytes")
        return value


class UserLogin(BaseModel):
    username: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password must be at most 72 UTF-8 bytes")
        return value


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


# ---------- Predictions ----------

class PredictionCreate(BaseModel):
    project_id: int


class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    delay_probability: float
    risk_level: str
    stage_risk: dict[str, dict[str, float | str]] | None = None
    highest_risk_stage: str | None = None
    created_at: datetime


class ProjectPredictionResponse(BaseModel):
    project: ProjectResponse
    prediction: PredictionResponse


# ---------- Simulation (What-If) ----------

class SimulationRequest(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)

    project_id: int
    affected_families: int | None = Field(default=None, ge=0)
    compensation_status: Literal["Paid", "In Progress", "Not Started"] | None = None
    approval_days_pending: int | None = Field(default=None, ge=0, le=365)
    legal_dispute: Literal["Yes", "No"] | None = None
    possession_status: PossessionStatus | None = None
    rehabilitation_progress: float | None = Field(default=None, ge=0, le=100)
    stakeholder_score: float | None = Field(default=None, ge=1, le=5)
    district_historical_delay: float | None = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def require_scenario_changes(self):
        if not any(
            getattr(self, field) is not None
            for field in (
                "affected_families",
                "compensation_status",
                "approval_days_pending",
                "legal_dispute",
                "possession_status",
                "rehabilitation_progress",
                "stakeholder_score",
                "district_historical_delay",
            )
        ):
            raise ValueError("at least one scenario input must be provided")
        return self


class SimulationResponse(BaseModel):
    project_id: int
    project_name: str
    baseline_delay_probability: float
    delay_probability: float
    risk_score: float
    risk_level: str
    stage_risk: dict[str, dict[str, float | str]]
    highest_risk_stage: str


# ---------- Alerts ----------

class AlertCreate(BaseModel):
    project_id: int
    message: str = Field(min_length=1)
    risk_level: Literal["High", "Medium", "Low"]
    is_read: bool = False


class AlertUpdate(BaseModel):
    is_read: bool


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    message: str
    risk_level: str
    is_read: bool
    event_type: str | None = None
    project_name: str | None = None
    risk_score: float | None = None
    reason: str | None = None
    is_resolved: bool
    created_at: datetime
    resolved_at: datetime | None = None


# ---------- Administrative Actions ----------

ActionType = Literal[
    "COLLECTOR_NOTIFICATION",
    "FAST_TRACK_NOC",
    "DBT_TRANCHE_REQUEST",
]

ActionStatus = Literal[
    "Requested",
    "In Progress",
    "Completed",
    "Rejected",
]


class AdministrativeActionCreate(BaseModel):
    project_id: int
    action_type: ActionType
    notes: str | None = Field(default=None, max_length=2000)


class AdministrativeActionStatusUpdate(BaseModel):
    status: ActionStatus
    notes: str | None = Field(default=None, max_length=2000)


class AdministrativeActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    action_type: str
    status: str
    requested_by: str
    notes: str | None
    created_at: datetime


# ---------- Analytics ----------

class AnalyticsResponse(BaseModel):
    total_projects: int
    pending_projects: int
    completed_projects: int
    total_predictions: int
    total_alerts: int
    predicted_projects: int
    average_risk_score: float | None
    high_risk_projects: int
    medium_risk_projects: int
    low_risk_projects: int