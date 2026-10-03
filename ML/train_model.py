"""Train and evaluate the land-acquisition delay model.

Artifacts written to models/:
- model.pkl: complete preprocessing + Random Forest pipeline (backend handoff)
- preprocessor.pkl: preprocessing-only artifact (backward compatibility)
- metrics.json: evaluation metrics for the Streamlit UI
- feature_importance.csv: global Random Forest feature importance
- test_data.pkl: held-out test set used for dynamic evaluation display
"""

from pathlib import Path
import json

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

RANDOM_STATE = 42
TEST_SIZE = 0.20
DATA_PATH = Path("data/projects.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

# ---------- Load ----------
df = pd.read_csv(DATA_PATH)
required = {
    "Project_Type", "State", "District", "Land_Area_Hectares",
    "Affected_Families", "Compensation_Status", "Approval_Days_Pending",
    "Legal_Dispute", "Possession_Status", "Rehabilitation_Progress",
    "Stakeholder_Score", "District_Historical_Delay", "Delayed",
    "Delay_Stage",
}
missing = required - set(df.columns)
if missing:
    raise ValueError(f"Missing required columns: {sorted(missing)}")

# Delay_Stage is intentionally excluded from the binary delay model because it is
# an outcome/explanation field and using it would leak target information.
X = df.drop(columns=["Delayed", "Delay_Stage"])
y = df["Delayed"].map({"No": 0, "Yes": 1})
if y.isna().any():
    raise ValueError("Delayed contains values other than Yes/No.")

categorical = X.select_dtypes(include=["object", "category"]).columns.tolist()
numerical = X.select_dtypes(exclude=["object", "category"]).columns.tolist()

# Missing-value handling is part of the fitted pipeline, so the exact same
# transformations are applied during prediction.
categorical_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])
numerical_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
])

preprocessor = ColumnTransformer([
    ("categorical", categorical_pipe, categorical),
    ("numerical", numerical_pipe, numerical),
])

classifier = RandomForestClassifier(
    n_estimators=300,
    random_state=RANDOM_STATE,
    class_weight="balanced",
    n_jobs=-1,
    min_samples_leaf=2,
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", classifier),
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y,
)

print(f"Dataset: {len(df)} rows")
print(f"Train: {len(X_train)} | Test: {len(X_test)}")
print(f"Categorical: {categorical}")
print(f"Numerical: {numerical}")
print("Training Random Forest...")
pipeline.fit(X_train, y_train)

# ---------- Evaluation ----------
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

metrics = {
    "model": "Random Forest",
    "random_state": RANDOM_STATE,
    "n_estimators": classifier.n_estimators,
    "train_records": len(X_train),
    "test_records": len(X_test),
    "accuracy": accuracy_score(y_test, y_pred),
    "precision": precision_score(y_test, y_pred, zero_division=0),
    "recall": recall_score(y_test, y_pred, zero_division=0),
    "f1": f1_score(y_test, y_pred, zero_division=0),
    "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    "classes": ["Not Delayed", "Delayed"],
}

with open(MODEL_DIR / "metrics.json", "w", encoding="utf-8") as f:
    json.dump(metrics, f, indent=2)

# Save held-out data so the UI can show the exact current model evaluation.
joblib.dump({"X_test": X_test, "y_test": y_test}, MODEL_DIR / "test_data.pkl")

# Global feature importance after one-hot encoding.
feature_names = pipeline.named_steps["preprocessor"].get_feature_names_out()
importance = pipeline.named_steps["classifier"].feature_importances_
fi = pd.DataFrame({"feature": feature_names, "importance": importance})
fi = fi.sort_values("importance", ascending=False)
fi.to_csv(MODEL_DIR / "feature_importance.csv", index=False)

# Standard handoff artifact: one file contains preprocessing + model.
joblib.dump(pipeline, MODEL_DIR / "model.pkl")
# Keep a preprocessing-only artifact for existing teammates/integration code.
joblib.dump(pipeline.named_steps["preprocessor"], MODEL_DIR / "preprocessor.pkl")

print("\n========== RANDOM FOREST EVALUATION ==========")
print(classification_report(y_test, y_pred, target_names=["Not Delayed", "Delayed"], zero_division=0))
print("Confusion matrix:")
print(confusion_matrix(y_test, y_pred))
print("\nSaved:")
for name in ["model.pkl", "preprocessor.pkl", "metrics.json", "feature_importance.csv", "test_data.pkl"]:
    print(f"- models/{name}")
