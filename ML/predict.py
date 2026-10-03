"""Command-line prediction using the standard model.pkl handoff artifact."""

import joblib
import pandas as pd

from stage_risk import stage_risk

MODEL_PATH = "models/model.pkl"
model = joblib.load(MODEL_PATH)

new_project = pd.DataFrame([{
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
}])

prediction = int(model.predict(new_project)[0])
delay_probability = float(model.predict_proba(new_project)[0, 1])
risk_score = delay_probability * 100

if risk_score < 40:
    risk_category = "Low"
elif risk_score < 70:
    risk_category = "Medium"
else:
    risk_category = "High"

stages = stage_risk(new_project.iloc[0].to_dict())

print("Prediction:", "DELAYED" if prediction else "NOT DELAYED")
print(f"Delay Probability: {delay_probability * 100:.2f}%")
print(f"Risk Score: {risk_score:.2f}/100")
print("Risk Category:", risk_category)
print("\nFive-stage risk:")
for stage in ["Planning", "Approval", "Compensation", "Rehabilitation", "Possession"]:
    item = stages[stage]
    print(f"- {stage}: {item['score']:.1f}/100 ({item['category']})")
print("Likely highest-risk stage:", stages["highest_risk_stage"])
