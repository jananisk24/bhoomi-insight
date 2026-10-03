"""Five-stage, interpretable risk scoring for a project.

This is intentionally separate from the binary ML classifier. It provides
stage-level operational risk for Planning, Approval, Compensation,
Rehabilitation and Possession.
"""

STAGES = ["Planning", "Approval", "Compensation", "Rehabilitation", "Possession"]


def _category(score: float) -> str:
    # Explicit inclusive boundaries: 0-39 Low, 40-69 Medium, 70-100 High.
    if score < 40:
        return "Low"
    if score < 70:
        return "Medium"
    return "High"


def stage_risk(project: dict) -> dict:
    """Return score/category for all five stages plus the highest-risk stage."""
    approval_days = float(project["Approval_Days_Pending"])
    rehab = float(project["Rehabilitation_Progress"])
    families = float(project["Affected_Families"])
    stakeholder = float(project["Stakeholder_Score"])
    historical = float(project["District_Historical_Delay"])

    # Planning: broad project complexity + stakeholder responsiveness + history.
    planning = min(100.0, (
        min(families / 20.0, 40.0)
        + (6.0 - stakeholder) * 8.0
        + historical * 0.35
    ))

    # Approval: 0 days = low; 180+ days = very high.
    approval = min(100.0, approval_days / 1.8)

    # Compensation: status is the strongest operational signal.
    compensation_map = {"Paid": 15.0, "In Progress": 60.0, "Not Started": 90.0}
    compensation = compensation_map.get(project["Compensation_Status"], 60.0)

    # Rehabilitation: low completion = high risk.
    rehabilitation = max(0.0, min(100.0, 100.0 - rehab))

    # Possession: status maps directly to operational risk.
    possession_map = {"Full": 15.0, "Partial": 60.0, "Not Taken": 90.0}
    possession = possession_map.get(project["Possession_Status"], 60.0)

    scores = {
        "Planning": round(planning, 2),
        "Approval": round(approval, 2),
        "Compensation": round(compensation, 2),
        "Rehabilitation": round(rehabilitation, 2),
        "Possession": round(possession, 2),
    }

    result = {
        stage: {"score": score, "category": _category(score)}
        for stage, score in scores.items()
    }
    highest_stage = max(scores, key=scores.get)
    result["highest_risk_stage"] = highest_stage
    return result
