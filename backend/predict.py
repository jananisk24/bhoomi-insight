import argparse
import json
import math
from pathlib import Path

import joblib
import pandas as pd

from stage_risk import stage_risk, risk_category

MODEL_PATH = Path(__file__).parent / "models" / "model.pkl"

COMPENSATION_TO_MODEL = {
    "Disbursed (100%)": "Paid",
    "Paid": "Paid",
    "Pending (<25%)": "Not Started",
    "Pending": "Not Started",
    "Not Started": "Not Started",
    "Partially Disbursed (50-75%)": "In Progress",
    "Under Dispute": "In Progress",
    "In Progress": "In Progress",
}


def model_compensation_status(status: str) -> str:
    try:
        return COMPENSATION_TO_MODEL[status]
    except KeyError as exc:
        raise ValueError(f"Unsupported compensation status: {status!r}") from exc


def project_features_from_record(project) -> dict:
    """Map persisted project fields to the trained model's feature schema."""
    return {
        "Project_Type": project.project_type,
        "State": project.state,
        "District": project.district,
        "Land_Area_Hectares": project.land_required,
        "Affected_Families": project.affected_families,
        "Compensation_Status": model_compensation_status(
            project.compensation_status
        ),
        "Approval_Days_Pending": project.approval_days_pending,
        "Legal_Dispute": project.legal_dispute,
        "Possession_Status": project.possession_status,
        "Rehabilitation_Progress": project.rehabilitation_progress,
        "Stakeholder_Score": project.stakeholder_score,
        "District_Historical_Delay": project.district_historical_delay,
    }

SAMPLE_PROJECT = {
    "Project_Type": "Highway",
    "State": "Tamil Nadu",
    "District": "Chennai",
    "Land_Area_Hectares": 250,
    "Affected_Families": 500,
    "Compensation_Status": "In Progress",
    "Approval_Days_Pending": 150,
    "Legal_Dispute": "Yes",
    "Possession_Status": "Partial",
    "Rehabilitation_Progress": 30,
    "Stakeholder_Score": 2,
    "District_Historical_Delay": 3,
}


def predict_project(model, project: dict) -> dict:
    """Run one project through the pipeline and return the full response
    contract documented in MODEL_HANDOFF.md, ready to hand to the backend."""
    X_new = pd.DataFrame([project])

    classes = list(model.named_steps["classifier"].classes_)
    try:
        delayed_class_index = classes.index(1)
    except ValueError as exc:
        raise ValueError("The trained model has no delayed class (1).") from exc

    delayed = bool(model.predict(X_new)[0] == 1)
    delay_probability = float(
        model.predict_proba(X_new)[0, delayed_class_index]
    )
    if not math.isfinite(delay_probability) or not 0 <= delay_probability <= 1:
        raise ValueError("The model returned an invalid delay probability.")

    risk_score = round(delay_probability * 100, 2)

    stages = stage_risk(project)
    highest_risk_stage = stages.pop("highest_risk_stage")

    return {
        "delayed": delayed,
        "delay_probability": round(delay_probability, 4),
        "risk_score": risk_score,
        # Reuses stage_risk.risk_category so thresholds live in one place
        # instead of being re-typed (and possibly drifting) in every script.
        "risk_category": risk_category(risk_score),
        "stage_risk": stages,
        "highest_risk_stage": highest_risk_stage,
    }


def _print_result(project: dict, result: dict) -> None:
    print("Project:", project.get("Project_Type"), "-", project.get("District"))
    print("Prediction:", "DELAYED" if result["delayed"] else "NOT DELAYED")
    print(f"Delay Probability: {result['delay_probability'] * 100:.2f}%")
    print(f"Risk Score: {result['risk_score']:.2f}/100")
    print("Risk Category:", result["risk_category"])
    print("\nFive-stage risk:")
    for stage, item in result["stage_risk"].items():
        print(f"- {stage}: {item['score']:.1f}/100 ({item['category']})")
    print("Likely highest-risk stage:", result["highest_risk_stage"])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, help="path to a JSON file with one project's fields")
    parser.add_argument("--model", type=Path, default=MODEL_PATH, help="path to model.pkl")
    args = parser.parse_args()

    if not args.model.exists():
        raise SystemExit(f"{args.model} not found. Run train_model.py first.")

    model = joblib.load(args.model)
    project = json.loads(args.json.read_text()) if args.json else SAMPLE_PROJECT

    result = predict_project(model, project)
    _print_result(project, result)


if __name__ == "__main__":
    main()
