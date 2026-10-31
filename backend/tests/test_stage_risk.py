import pytest

from predict import MODEL_PATH, predict_project
from stage_risk import STAGES, risk_category, stage_risk
import joblib


PROJECT = {
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


def test_risk_category_thresholds():
    assert risk_category(39.99) == "Low"
    assert risk_category(40) == "Medium"
    assert risk_category(69.99) == "Medium"
    assert risk_category(70) == "High"


def test_stage_risk_returns_five_valid_scores_and_highest_stage():
    result = stage_risk(PROJECT)
    scores = {stage: result[stage]["score"] for stage in STAGES}

    assert set(scores) == set(STAGES)
    assert all(0 <= score <= 100 for score in scores.values())
    assert result["highest_risk_stage"] == max(scores, key=scores.get)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("Approval_Days_Pending", -1),
        ("Rehabilitation_Progress", 101),
        ("Stakeholder_Score", 0),
        ("District_Historical_Delay", float("nan")),
        ("Possession_Status", "Unknown"),
    ],
)
def test_stage_risk_rejects_invalid_inputs(field, value):
    invalid_project = {**PROJECT, field: value}
    with pytest.raises(ValueError):
        stage_risk(invalid_project)


def test_model_probability_matches_delay_class_and_expected_schema():
    model = joblib.load(MODEL_PATH)
    result = predict_project(model, PROJECT)

    assert 0 <= result["delay_probability"] <= 1
    assert result["risk_score"] == round(result["delay_probability"] * 100, 2)
    assert result["risk_category"] == risk_category(result["risk_score"])
    assert result["highest_risk_stage"] in STAGES
    assert set(result["stage_risk"]) == set(STAGES)
