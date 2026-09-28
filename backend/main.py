from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pathlib import Path

import crud
import models
import joblib
import pandas as pd
from predict import predict_project
from database import engine, Base, get_db
from schemas import (
    ProjectCreate, ProjectResponse,
    UserCreate, UserLogin, TokenResponse,
    PredictionCreate, PredictionResponse,
    AlertCreate, AlertResponse,
    AnalyticsResponse,
    SimulationRequest, SimulationResponse,
)
from auth import create_token, verify_token

app = FastAPI(title="Bhoomi Insight API")
MODEL_PATH = Path(__file__).parent / "models" / "model.pkl"
model = joblib.load(MODEL_PATH)

Base.metadata.create_all(bind=engine)

# Lets the frontend (running on a different origin, e.g. localhost:3000)
# actually call this API from the browser. Tighten allow_origins to your
# real frontend URL(s) before deploying.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    username = verify_token(credentials.credentials)
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return username


# ========================= HOME =========================

@app.get("/")
def home():
    return {"message": "Bhoomi Insight Backend is running!"}


# ========================= AUTH =========================

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = crud.create_user(db, user)
    return {"message": "User registered successfully", "username": new_user.username}


@app.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    authenticated = crud.authenticate_user(db, user.username, user.password)
    if not authenticated:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_token(authenticated.username)
    return TokenResponse(access_token=token)


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
    return crud.get_projects(db, skip=skip, limit=limit)


@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ========================= PREDICTIONS =========================
@app.post("/predict")
def predict(
    prediction: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(db, prediction.project_id)

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    project_data = {
    "Project_Type": project.project_type,
    "State": project.state,
    "District": project.district,
    "Land_Area_Hectares": project.land_required,
    "Affected_Families": project.affected_families,
    "Compensation_Status": project.compensation_status,
    "Approval_Days_Pending": project.approval_days_pending,
    "Legal_Dispute": project.legal_dispute,
    "Possession_Status": project.possession_status,
    "Rehabilitation_Progress": project.rehabilitation_progress,
    "Stakeholder_Score": project.stakeholder_score,
    "District_Historical_Delay": project.district_historical_delay,
}

    result = predict_project(model, project_data)

    delay_probability = result["delay_probability"]
    risk_level = result["risk_category"]

    new_prediction = crud.create_prediction(
        db,
        project.id,
        delay_probability,
        risk_level
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

# ========================= SIMULATE (WHAT-IF) =========================

@app.post("/simulate", response_model=SimulationResponse)
def simulate_project(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(db, payload.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    # Placeholder rule-based scoring until Member 2's real model is wired in.
    risk_score = 0
    if payload.affected_families > 100:
        risk_score += 40
    elif payload.affected_families > 50:
        risk_score += 20

    if payload.estimated_cost > 500_000_000:
        risk_score += 40
    elif payload.estimated_cost > 100_000_000:
        risk_score += 20

    if risk_score >= 60:
        risk_level = "High"
    elif risk_score >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return SimulationResponse(
        project_id=project.id,
        project_name=project.project_name,
        simulated_affected_families=payload.affected_families,
        simulated_estimated_cost=payload.estimated_cost,
        risk_score=risk_score,
        risk_level=risk_level,
    )


# ========================= ALERTS =========================

@app.post("/alerts", response_model=AlertResponse)
def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(db, alert.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.create_alert(db, alert)


@app.get("/alerts", response_model=list[AlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    return crud.get_alerts(db)


# ========================= ANALYTICS =========================

@app.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    return crud.get_analytics(db)


@app.get("/predictions/{project_id}", response_model=list[PredictionResponse])
def get_prediction_history(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    project = crud.get_project(db, project_id)

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return crud.get_predictions_for_project(db, project_id)