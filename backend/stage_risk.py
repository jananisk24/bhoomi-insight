import math

STAGES = ["Planning", "Approval", "Compensation", "Rehabilitation", "Possession"]


def risk_category(score: float) -> str:
    """Single source of truth for the Low/Medium/High thresholds.

    Import this everywhere a score needs a category (predict.py, app.py,
    the backend) instead of re-writing the same if/elif in each file -
    that's how thresholds drift out of sync between files over time.
    """
    # Explicit inclusive boundaries: 0-39 Low, 40-69 Medium, 70-100 High.
    if not math.isfinite(score):
        raise ValueError("Risk score must be a finite number.")
    if score < 40:
        return "Low"
    if score < 70:
        return "Medium"
    return "High"


# Backward-compatible alias for any existing internal callers.
_category = risk_category


def stage_risk(project: dict) -> dict:
    """Return score/category for all five stages plus the highest-risk stage."""
    def numeric_value(name: str) -> float:
        try:
            value = float(project[name])
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError(f"{name} must be a finite number.") from exc
        if not math.isfinite(value):
            raise ValueError(f"{name} must be a finite number.")
        return value

    approval_days = numeric_value("Approval_Days_Pending")
    rehab = numeric_value("Rehabilitation_Progress")
    families = numeric_value("Affected_Families")
    stakeholder = numeric_value("Stakeholder_Score")
    historical = numeric_value("District_Historical_Delay")
    if approval_days < 0 or families < 0:
        raise ValueError("Approval days and affected families cannot be negative.")
    if not 0 <= rehab <= 100:
        raise ValueError("Rehabilitation progress must be between 0 and 100.")
    if not 1 <= stakeholder <= 5:
        raise ValueError("Stakeholder score must be between 1 and 5.")
    if not 0 <= historical <= 100:
        raise ValueError("District historical delay must be between 0 and 100.")

    # Planning: broad project complexity + stakeholder responsiveness + history.
    planning = max(0.0, min(100.0, (
        min(families / 20.0, 40.0)
        + (6.0 - stakeholder) * 8.0
        + historical * 0.35
    )))

    # Approval: 0 days = low; 180+ days = very high.
    approval = max(0.0, min(100.0, approval_days / 1.8))

    # Compensation: status is the strongest operational signal.
    compensation_map = {"Paid": 15.0, "In Progress": 60.0, "Not Started": 90.0}
    try:
        compensation = compensation_map[project["Compensation_Status"]]
    except KeyError as exc:
        raise ValueError("Unsupported compensation status for stage risk.") from exc

    # Rehabilitation: low completion = high risk.
    rehabilitation = max(0.0, min(100.0, 100.0 - rehab))

    # Possession: status maps directly to operational risk.
    possession_map = {"Full": 15.0, "Partial": 60.0, "Not Taken": 90.0}
    try:
        possession = possession_map[project["Possession_Status"]]
    except KeyError as exc:
        raise ValueError("Unsupported possession status for stage risk.") from exc

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
