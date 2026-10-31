import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from pathlib import Path
from urllib.parse import urlsplit

import crud
import models
import joblib
from auth import create_token, verify_token
from types import SimpleNamespace
from sqlalchemy.exc import SQLAlchemyError

from predict import (
    model_compensation_status,
    predict_project,
    project_features_from_record,
)
from database import get_db

from schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectPredictionResponse,
    UserCreate,
    UserLogin,
    TokenResponse,
    PredictionCreate,
    PredictionResponse,
    AlertCreate,
    AlertResponse,
    AnalyticsResponse,
    SimulationRequest,
    SimulationResponse,
    AdministrativeActionCreate,
    AdministrativeActionResponse,
    AdministrativeActionStatusUpdate,
)

environment = os.getenv("ENVIRONMENT", "production").strip().lower()
is_production = environment in {"production", "prod"}
app = FastAPI(
    title="Bhoomi Insight API",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)

MODEL_PATH = Path(__file__).parent / "models" / "model.pkl"
model = joblib.load(MODEL_PATH)

configured_origins = os.getenv("CORS_ORIGINS")
allowed_origins = [
    origin.strip() for origin in (configured_origins or "").split(",")
    if origin.strip()
]
if is_production:
    if not allowed_origins:
        raise RuntimeError("CORS_ORIGINS must be configured in production.")
    if any(
        urlsplit(origin).scheme != "https"
        or not urlsplit(origin).netloc
        or urlsplit(origin).path not in {"", "/"}
        or urlsplit(origin).query
        or urlsplit(origin).fragment
        for origin in allowed_origins
    ):
        raise RuntimeError(
            "Production CORS_ORIGINS must contain exact HTTPS origins."
        )
elif not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

# ========================= CORS =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


security = HTTPBearer()


# ========================= AUTHENTICATION =========================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> str:

    username = verify_token(credentials.credentials)

    if username is None or crud.get_user_by_username(db, username) is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    return username


def get_current_admin(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> str:

    user = crud.get_user_by_username(db, current_user)

    if user is None or user.role != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return current_user


def _predict_features(features):
    try:
        return predict_project(model, features)
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Project data cannot be scored: {exc}",
        ) from exc


def _predict_project_data(project_data):
    return _predict_features(project_features_from_record(project_data))


def _save_project_with_prediction(db: Session, payload, project=None):
    is_update = project is not None
    fields = payload.model_dump(exclude_unset=is_update)
    if is_update:
        feature_values = {
            name: getattr(project, name)
            for name in (
                "project_type",
                "state",
                "district",
                "land_required",
                "affected_families",
                "compensation_status",
                "approval_days_pending",
                "legal_dispute",
                "possession_status",
                "rehabilitation_progress",
                "stakeholder_score",
                "district_historical_delay",
            )
        }
        feature_values.update(fields)
    else:
        feature_values = fields

    prediction_result = _predict_project_data(
        SimpleNamespace(**feature_values)
    )

    if is_update:
        for field, value in fields.items():
            setattr(project, field, value)
    else:
        project = models.Project(**fields)
        db.add(project)

    try:
        db.flush()
        prediction = models.Prediction(
            project_id=project.id,
            delay_probability=prediction_result["delay_probability"],
            risk_level=prediction_result["risk_category"],
            stage_risk=prediction_result["stage_risk"],
            highest_risk_stage=prediction_result["highest_risk_stage"],
        )
        db.add(prediction)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Project and prediction could not be saved.",
        ) from exc

    db.refresh(project)
    db.refresh(prediction)
    return project, prediction




# ========================= HOME =========================

@app.get("/")
def home():
    return {
        "message": "Bhoomi Insight Backend is running!"
    }


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Database health check failed.",
        ) from exc
    return {"status": "ok"}


# ========================= AUTH =========================

@app.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    if os.getenv("ALLOW_USER_REGISTRATION", "").strip().lower() != "true":
        raise HTTPException(
            status_code=403,
            detail="Account registration is disabled. Contact an administrator.",
        )

    if crud.get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=400,
            detail="Username already exists",
        )

    new_user = crud.create_user(db, user)

    return {
        "message": "User registered successfully",
        "username": new_user.username,
    }


@app.post("/login", response_model=TokenResponse)
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    authenticated = crud.authenticate_user(
       db,
       user.username,
       user.password,
    )

    if not authenticated:
       raise HTTPException(
           status_code=401,
           detail="Invalid username or password",
        )

    token = create_token(
        authenticated.username,
        authenticated.role,
    )

    return TokenResponse(
        access_token=token,
        username=authenticated.username,
        role=authenticated.role,
    )


# ========================= PROJECTS =========================

@app.post("/projects", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    return crud.create_project(db, project)


@app.get("/projects", response_model=list[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    return crud.get_projects(
        db,
        skip=skip,
        limit=limit,
    )


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    project = crud.get_project(db, project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


@app.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return crud.update_project(db, project, update)


@app.post(
    "/projects/predict",
    response_model=ProjectPredictionResponse,
    status_code=201,
)
def create_project_with_prediction(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    saved_project, prediction = _save_project_with_prediction(db, project)
    return {"project": saved_project, "prediction": prediction}


@app.put(
    "/projects/{project_id}/predict",
    response_model=ProjectPredictionResponse,
)
def update_project_with_prediction(
    project_id: int,
    update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    saved_project, prediction = _save_project_with_prediction(
        db,
        update,
        project,
    )
    return {"project": saved_project, "prediction": prediction}


# ========================= PREDICTIONS =========================

# ========================= PREDICTIONS =========================

@app.post("/predict")
def predict(
    prediction: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(
        db,
        prediction.project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    result = _predict_project_data(project)

    new_prediction = crud.create_prediction(
        db,
        project.id,
        result["delay_probability"],
        result["risk_category"],
        result["stage_risk"],
        result["highest_risk_stage"],
    )

    return {
        "message": "Prediction saved successfully",
        "prediction_id": new_prediction.id,
        "project_id": project.id,
        "project_name": project.project_name,
        "delayed": result["delayed"],
        "delay_probability": result["delay_probability"],
        "risk_score": result["risk_score"],
        "risk_level": result["risk_category"],
        "stage_risk": result["stage_risk"],
        "highest_risk_stage": result["highest_risk_stage"],
        "status": "M2 ML model connected",
    }


@app.get(
    "/predictions/latest",
    response_model=list[PredictionResponse],
)
def get_latest_predictions(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    return crud.get_latest_predictions(db)


@app.get(
    "/predictions/{project_id}",
    response_model=list[PredictionResponse],
)
def get_prediction_history(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(db, project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return crud.get_predictions_for_project(
        db,
        project_id,
    )


# ========================= SIMULATION =========================

@app.post("/simulate", response_model=SimulationResponse)
def simulate_project(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    project = crud.get_project(
        db,
        payload.project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    feature_names = {
        "affected_families": "Affected_Families",
        "compensation_status": "Compensation_Status",
        "approval_days_pending": "Approval_Days_Pending",
        "legal_dispute": "Legal_Dispute",
        "possession_status": "Possession_Status",
        "rehabilitation_progress": "Rehabilitation_Progress",
        "stakeholder_score": "Stakeholder_Score",
        "district_historical_delay": "District_Historical_Delay",
    }
    scenario = project_features_from_record(project)
    for field, value in payload.model_dump(
        exclude={"project_id"},
        exclude_unset=True,
    ).items():
        if field == "compensation_status":
            value = model_compensation_status(value)
        scenario[feature_names[field]] = value

    baseline = _predict_project_data(project)
    result = _predict_features(scenario)

    return SimulationResponse(
        project_id=project.id,
        project_name=project.project_name,
        baseline_delay_probability=baseline["delay_probability"],
        delay_probability=result["delay_probability"],
        risk_score=result["risk_score"],
        risk_level=result["risk_category"],
        stage_risk=result["stage_risk"],
        highest_risk_stage=result["highest_risk_stage"],
    )


# ========================= ALERTS =========================

@app.post("/alerts", response_model=AlertResponse)
def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    project = crud.get_project(
        db,
        alert.project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return crud.create_alert(db, alert)


@app.get("/alerts", response_model=list[AlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    return crud.get_alerts(db)


# ========================= ADMINISTRATIVE ACTIONS =========================

@app.post(
    "/administrative-actions",
    response_model=AdministrativeActionResponse,
    status_code=201,
)
def create_administrative_action(
    action: AdministrativeActionCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    project = crud.get_project(
        db,
        action.project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return crud.create_administrative_action(
        db,
        action,
        current_user,
    )


@app.get(
    "/administrative-actions",
    response_model=list[AdministrativeActionResponse],
)
def get_administrative_actions(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    if project_id is not None:
        project = crud.get_project(db, project_id)

        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found",
            )

    return crud.get_administrative_actions(
        db,
        project_id,
    )


@app.patch(
    "/administrative-actions/{action_id}",
    response_model=AdministrativeActionResponse,
)
def update_administrative_action(
    action_id: int,
    update: AdministrativeActionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_admin),
):

    action = crud.get_administrative_action(
        db,
        action_id,
    )

    if action is None:
        raise HTTPException(
            status_code=404,
            detail="Administrative action not found",
        )

    return crud.update_administrative_action(
        db,
        action,
        update,
    )


# ========================= ANALYTICS =========================

@app.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):

    return crud.get_analytics(db)