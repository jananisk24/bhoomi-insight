"""SHAP explanation for one project prediction."""

import joblib
import pandas as pd
import shap

MODEL_PATH = "models/model.pkl"
model = joblib.load(MODEL_PATH)

project = pd.DataFrame([{
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
    "District_Historical_Delay": 70,
}])

preprocessor = model.named_steps["preprocessor"]
classifier = model.named_steps["classifier"]
X = preprocessor.transform(project)
feature_names = preprocessor.get_feature_names_out()

explainer = shap.TreeExplainer(classifier)
shap_values = explainer.shap_values(X)

# SHAP versions can return either a list (older API) or an ndarray (new API).
if isinstance(shap_values, list):
    values = shap_values[1][0]
else:
    arr = shap_values
    if arr.ndim == 3:
        values = arr[0, :, 1]
    else:
        values = arr[0]

explanation = pd.DataFrame({
    "feature": feature_names,
    "shap_value": values,
})
explanation["abs_shap"] = explanation["shap_value"].abs()
explanation = explanation.sort_values("abs_shap", ascending=False)

print("Top SHAP factors for this project:")
print(explanation.head(10).to_string(index=False))

explanation.to_csv("models/latest_shap_explanation.csv", index=False)
print("\nSaved models/latest_shap_explanation.csv")
