import json
import subprocess
import sys
from pathlib import Path

import joblib
import pandas as pd
import streamlit as st

from stage_risk import STAGES, stage_risk, risk_category
from explain import explain_prediction

st.set_page_config(
    page_title="Land Acquisition Delay Prediction",
    page_icon="🏗️",
    layout="wide",
)

MODEL_PATH = Path("models/model.pkl")
METRICS_PATH = Path("models/metrics.json")


@st.cache_resource
def load_model():
    return joblib.load(MODEL_PATH)


def load_metrics():
    if not METRICS_PATH.exists():
        return {}
    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))


st.title("🏗️ Land Acquisition Delay Prediction System")
st.caption("Random Forest + Explainable AI + Five-Stage Operational Risk")

if not MODEL_PATH.exists():
    st.error("models/model.pkl is missing. Run `python train_model.py` first.")
    st.stop()

model = load_model()
metrics = load_metrics()

# ---------- Inputs ----------
st.subheader("📋 Project Information")
c1, c2, c3 = st.columns(3)
with c1:
    project_type = st.selectbox("Project Type", ["Highway", "Railway", "Irrigation", "Power"])
with c2:
    state = st.selectbox("State", ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh"])
with c3:
    district = st.selectbox("District", ["Chennai", "Madurai", "Coimbatore", "Salem", "Trichy", "Tirunelveli", "Bengaluru", "Kochi"])

c1, c2 = st.columns(2)
with c1:
    land_area = st.number_input("Land Area (hectares)", min_value=0.0, max_value=10000.0, value=100.0)
    affected_families = st.number_input("Affected Families", min_value=0, max_value=100000, value=100)
with c2:
    compensation_status = st.selectbox("Compensation Status", ["Not Started", "In Progress", "Paid"])
    approval_days = st.number_input("Approval Days Pending", min_value=0, max_value=3650, value=60)

c1, c2 = st.columns(2)
with c1:
    legal_dispute = st.selectbox("Legal Dispute", ["No", "Yes"])
    rehabilitation_progress = st.slider("Rehabilitation Progress (%)", 0, 100, 50)
with c2:
    possession_status = st.selectbox("Possession Status", ["Not Taken", "Partial", "Full"])
    stakeholder_score = st.slider("Stakeholder Score", 1, 5, 3)

district_historical_delay = st.number_input("District Historical Delay (%)", min_value=0.0, max_value=100.0, value=20.0)

project = {
    "Project_Type": project_type,
    "State": state,
    "District": district,
    "Land_Area_Hectares": land_area,
    "Affected_Families": affected_families,
    "Compensation_Status": compensation_status,
    "Approval_Days_Pending": approval_days,
    "Legal_Dispute": legal_dispute,
    "Possession_Status": possession_status,
    "Rehabilitation_Progress": rehabilitation_progress,
    "Stakeholder_Score": stakeholder_score,
    "District_Historical_Delay": district_historical_delay,
}

if st.button("🔮 Predict Delay", type="primary", use_container_width=True):
    X_new = pd.DataFrame([project])
    prediction = int(model.predict(X_new)[0])
    probability = float(model.predict_proba(X_new)[0, 1])
    score = probability * 100
    # Same thresholds used everywhere else - imported, not re-typed.
    category = risk_category(score)

    st.divider()
    st.subheader("📊 Prediction Result")
    a, b, c = st.columns(3)
    with a:
        (st.error if prediction else st.success)("🔴 DELAYED" if prediction else "🟢 NOT DELAYED")
    with b:
        st.metric("Delay Probability", f"{score:.2f}%")
    with c:
        st.metric("Risk Score", f"{score:.2f}/100")
    st.info(f"Overall Risk Category: **{category}**")

    # ---------- Five-stage risk ----------
    st.subheader("📍 Five-Stage Risk Assessment")
    stages = stage_risk(project)
    stage_df = pd.DataFrame([
        {"Stage": stage, "Score": stages[stage]["score"], "Category": stages[stage]["category"]}
        for stage in STAGES
    ])
    st.dataframe(stage_df, use_container_width=True, hide_index=True)
    st.info(f"Highest operational stage risk: **{stages['highest_risk_stage']}**")

    # ---------- Explainable AI: per-prediction SHAP ----------
    # This replaces the old static rule-based text list + the *global*
    # feature-importance chart. SHAP explains THIS specific prediction,
    # which is what the guide's "Delay Factors" bar chart needs - the
    # global importance only tells you what matters on average.
    st.subheader("🔎 Why This Prediction? (SHAP Delay Factors)")
    with st.spinner("Computing SHAP explanation..."):
        explanation = explain_prediction(model, project, top_n=8)
    chart_df = explanation.set_index("feature")["shap_value"]
    st.bar_chart(chart_df)
    st.caption("Positive bars push the risk score up; negative bars push it down.")

# ---------- Continuous learning demo ----------
st.divider()
st.subheader("🔄 Continuous Learning")
st.caption("Retrains on the current data/projects.csv and refreshes the live model + metrics below.")

if st.button("Retrain Model"):
    with st.spinner("Retraining Random Forest on data/projects.csv..."):
        result = subprocess.run(
            [sys.executable, "train_model.py"], capture_output=True, text=True
        )
    if result.returncode == 0:
        st.success("Retraining complete - model.pkl and metrics.json refreshed.")
        load_model.clear()  # drop the cached model so the next run loads the fresh one
        metrics = load_metrics()
    else:
        st.error("Retraining failed - see details below.")
        st.code(result.stderr or result.stdout)

# ---------- Current model evaluation ----------
st.subheader("📈 Current Model Evaluation")
if metrics:
    e1, e2, e3, e4 = st.columns(4)
    e1.metric("Accuracy", f"{metrics.get('accuracy', 0) * 100:.2f}%")
    e2.metric("Precision", f"{metrics.get('precision', 0) * 100:.2f}%")
    e3.metric("Recall", f"{metrics.get('recall', 0) * 100:.2f}%")
    e4.metric("F1 Score", f"{metrics.get('f1', 0) * 100:.2f}%")
    cm = metrics.get("confusion_matrix")
    if cm:
        st.write("Confusion Matrix — rows: actual, columns: predicted")
        st.dataframe(
            pd.DataFrame(cm, index=["Actual Not Delayed", "Actual Delayed"], columns=["Pred Not Delayed", "Pred Delayed"]),
            use_container_width=True,
        )
else:
    st.info("No metrics yet - click Retrain Model or run `python train_model.py`.")
