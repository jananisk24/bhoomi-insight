import os
import json
from pathlib import Path
 
import joblib
import pandas as pd
 
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
 
DATA_PATH = "data/projects.csv"
MODEL_DIR = "models"
 
FEATURES = [
    "Project_Type",
    "State",
    "District",
    "Land_Area_Hectares",
    "Affected_Families",
    "Compensation_Status",
    "Approval_Days_Pending",
    "Legal_Dispute",
    "Possession_Status",
    "Rehabilitation_Progress",
    "Stakeholder_Score",
    "District_Historical_Delay",
]
 
CATEGORICAL_FEATURES = [
    "Project_Type",
    "State",
    "District",
    "Compensation_Status",
    "Legal_Dispute",
    "Possession_Status",
]
 
NUMERICAL_FEATURES = [
    "Land_Area_Hectares",
    "Affected_Families",
    "Approval_Days_Pending",
    "Rehabilitation_Progress",
    "Stakeholder_Score",
    "District_Historical_Delay",
]
 
 
# ---------- Load + validate ----------
df = pd.read_csv(DATA_PATH)
 
missing_columns = set(FEATURES + ["Delayed"]) - set(df.columns)
if missing_columns:
    # Fail loudly with a clear message instead of a cryptic ColumnTransformer
    # KeyError three levels down inside sklearn.
    raise ValueError(f"data/projects.csv is missing required columns: {sorted(missing_columns)}")
 
X = df[FEATURES]
 
# Encode the target to 0/1 explicitly rather than relying on pos_label="Yes"
# everywhere. This keeps metrics, predict_proba()[:, 1], and SHAP's
# "class 1" all referring to the same thing without ambiguity.
y = df["Delayed"].map({"No": 0, "Yes": 1})
if y.isna().any():
    raise ValueError("Delayed column contains values other than Yes/No.")
 
 
# ---------- Preprocessing ----------
# Both branches now impute missing values before transforming, so a NaN in
# the input CSV no longer crashes .fit()/.predict() - the original script's
# "passthrough" for numerical columns had no such protection.
categorical_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])
numerical_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
])
 
preprocessor = ColumnTransformer(transformers=[
    ("categorical", categorical_pipe, CATEGORICAL_FEATURES),
    ("numerical", numerical_pipe, NUMERICAL_FEATURES),
])
 
 
# ---------- Model ----------
classifier = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1,          # use all CPU cores - noticeably faster to train
    min_samples_leaf=2, # a little regularization against overfitting
)
 
# Step named "classifier" (not "model") on purpose: explain.py and any
# SHAP code access it via pipeline.named_steps["classifier"].
pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", classifier),
])
 
 
# ---------- Train / test split ----------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)
 
print(f"Dataset: {len(df)} rows | Train: {len(X_train)} | Test: {len(X_test)}")
print("Training Random Forest...")
pipeline.fit(X_train, y_train)
 
 
# ---------- Evaluate ----------
y_pred = pipeline.predict(X_test)
 
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
cm = confusion_matrix(y_test, y_pred)
 
 
# ---------- Save artifacts ----------
os.makedirs(MODEL_DIR, exist_ok=True)
 
model_path = os.path.join(MODEL_DIR, "model.pkl")
joblib.dump(pipeline, model_path)
 
metrics = {
    "accuracy": round(accuracy, 4),
    "precision": round(precision, 4),
    "recall": round(recall, 4),
    "f1": round(f1, 4),
    "confusion_matrix": cm.tolist(),
    "classes": ["Not Delayed", "Delayed"],
    "train_records": len(X_train),
    "test_records": len(X_test),
}
with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
    json.dump(metrics, f, indent=4)
 
# Held-out test set, so a UI can show live evaluation later without
# re-splitting the dataset from scratch.
joblib.dump({"X_test": X_test, "y_test": y_test}, os.path.join(MODEL_DIR, "test_data.pkl"))
 
# Global feature importance - this is *why* the guide recommends Random
# Forest: feature_importances_ powers the Explainable AI chart for free.
feature_names = pipeline.named_steps["preprocessor"].get_feature_names_out()
importances = pipeline.named_steps["classifier"].feature_importances_
fi = pd.DataFrame({"feature": feature_names, "importance": importances})
fi = fi.sort_values("importance", ascending=False)
fi.to_csv(os.path.join(MODEL_DIR, "feature_importance.csv"), index=False)
 
 
print("================================")
print("MODEL TRAINED SUCCESSFULLY!")
print("================================")
print("Accuracy :", round(accuracy * 100, 2), "%")
print("Precision:", round(precision * 100, 2), "%")
print("Recall   :", round(recall * 100, 2), "%")
print("F1 Score :", round(f1 * 100, 2), "%")
print("\nConfusion matrix (rows=actual, cols=predicted):")
print(cm)
print("\nSaved:")
for name in ["model.pkl", "metrics.json", "feature_importance.csv", "test_data.pkl"]:
    print(f"- {MODEL_DIR}/{name}")
 