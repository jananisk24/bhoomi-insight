# Member 2 → Member 3 ML Model Handoff

## Standard artifact
Use **`models/model.pkl`**. It is the complete scikit-learn Pipeline containing:
1. missing-value imputation,
2. one-hot encoding,
3. Random Forest classifier.

The backend does **not** need to separately transform inputs.

## Input schema
Send one JSON object containing exactly these fields:

- `Project_Type`: Highway | Railway | Irrigation | Power
- `State`: Tamil Nadu | Kerala | Karnataka | Andhra Pradesh
- `District`: Chennai | Madurai | Coimbatore | Salem | Trichy | Tirunelveli | Bengaluru | Kochi
- `Land_Area_Hectares`: number
- `Affected_Families`: integer
- `Compensation_Status`: Not Started | In Progress | Paid
- `Approval_Days_Pending`: number
- `Legal_Dispute`: Yes | No
- `Possession_Status`: Not Taken | Partial | Full
- `Rehabilitation_Progress`: 0–100
- `Stakeholder_Score`: 1–5
- `District_Historical_Delay`: 0–100

## Output contract
Recommended API response:

```json
{
  "delayed": true,
  "delay_probability": 0.915,
  "risk_score": 91.5,
  "risk_category": "High",
  "stage_risk": {
    "Planning": {"score": 55.0, "category": "Medium"},
    "Approval": {"score": 83.3, "category": "High"},
    "Compensation": {"score": 60.0, "category": "Medium"},
    "Rehabilitation": {"score": 70.0, "category": "High"},
    "Possession": {"score": 60.0, "category": "Medium"}
  },
  "highest_risk_stage": "Approval"
}
```

## Risk thresholds
- 0–39.99 → Low
- 40–69.99 → Medium
- 70–100 → High

## Retraining
Run:

```bash
python retrain.py
```

This retrains from `data/projects.csv` and refreshes `models/model.pkl`, metrics, feature importance and the test set.
