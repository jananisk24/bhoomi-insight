import json
from pathlib import Path

import joblib
import pandas as pd
import streamlit as st

from stage_risk import STAGES, stage_risk

st.set_page_config(
    page_title="Land Acquisition Delay Prediction",
    page_icon="🏗️",
    layout="wide",
)

MODEL_PATH = Path("models/model.pkl")
METRICS_PATH = Path("models/metrics.json")
FI_PATH = Path("models/feature_importance.csv")
SHAP_PATH = Path("models/latest_shap_explanation.csv")

@st.cache_resource

def load_model():
    return joblib.load(MODEL_PATH)

@st.cache_data

def load_metrics():
    if not METRICS_PATH.exists():
        return {}
    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))

@st.cache_data

def load_feature_importance():
    if not FI_PATH.exists():
        return pd.DataFrame()
    return pd.read_csv(FI_PATH)

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
    category = "Low" if score < 40 else "Medium" if score < 70 else "High"

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

    # ---------- Rule-based factor summary ----------
    st.subheader("⚠️ Immediate Delay Factors")
    factors = []
    if legal_dispute == "Yes": factors.append("Legal dispute is active")
    if approval_days >= 120: factors.append("Approval has been pending for 120+ days")
    if compensation_status != "Paid": factors.append("Compensation is not fully paid")
    if rehabilitation_progress < 40: factors.append("Rehabilitation progress is below 40%")
    if possession_status != "Full": factors.append("Land possession is incomplete")
    if district_historical_delay >= 60: factors.append("District historical delay is high")
    if factors:
        for factor in factors:
            st.warning(factor)
    else:
        st.success("No rule-based high-impact delay factor detected.")

    # ---------- Global feature importance ----------
    fi = load_feature_importance()
    if not fi.empty:
        st.subheader("🔎 Global Model Feature Importance")
        top = fi.head(10).copy()
        top["feature"] = top["feature"].str.replace("categorical__", "", regex=False).str.replace("numerical__", "", regex=False)
        st.bar_chart(top.set_index("feature")["importance"])

    # ---------- Dynamic evaluation ----------
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
            st.dataframe(pd.DataFrame(cm, index=["Actual Not Delayed", "Actual Delayed"], columns=["Pred Not Delayed", "Pred Delayed"]), use_container_width=True)
