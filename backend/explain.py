import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
import shap

MODEL_PATH = Path("models/model.pkl")

SAMPLE_PROJECT = {
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
}


def explain_prediction(model, project: dict, top_n: int = 10) -> pd.DataFrame:
    """Return the top_n features that pushed this one prediction's risk
    score up or down, ranked by absolute SHAP value.

    This is the function app.py should call for the "Delay Factors" chart -
    it's the real, per-project Explainable AI output the guide asks for,
    as opposed to the model's *global* feature_importances_ (which only
    tells you what matters on average across every project).
    """
    project_df = pd.DataFrame([project])

    preprocessor = model.named_steps["preprocessor"]
    classifier = model.named_steps["classifier"]
    X = preprocessor.transform(project_df)
    feature_names = preprocessor.get_feature_names_out()

    explainer = shap.TreeExplainer(classifier)
    shap_values = explainer.shap_values(X)

    # SHAP versions can return either a list (older API) or an ndarray (new API).
    if isinstance(shap_values, list):
        values = shap_values[1][0]
    else:
        arr = shap_values
        values = arr[0, :, 1] if arr.ndim == 3 else arr[0]

    explanation = pd.DataFrame({"feature": feature_names, "shap_value": values})
    explanation["abs_shap"] = explanation["shap_value"].abs()
    explanation = explanation.sort_values("abs_shap", ascending=False)

    # Strip the ColumnTransformer prefixes ("categorical__", "numerical__")
    # so labels are readable in a UI chart, e.g. "Legal_Dispute_Yes".
    explanation["feature"] = (
        explanation["feature"]
        .str.replace("categorical__", "", regex=False)
        .str.replace("numerical__", "", regex=False)
    )

    return explanation.head(top_n).reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, help="path to a JSON file with one project's fields")
    parser.add_argument("--model", type=Path, default=MODEL_PATH, help="path to model.pkl")
    parser.add_argument("--top", type=int, default=10, help="how many top factors to show/save")
    parser.add_argument(
        "--out", type=Path, default=Path("models/latest_shap_explanation.csv"),
        help="where to save the explanation CSV",
    )
    args = parser.parse_args()

    if not args.model.exists():
        raise SystemExit(f"{args.model} not found. Run train_model.py first.")

    model = joblib.load(args.model)
    project = json.loads(args.json.read_text()) if args.json else SAMPLE_PROJECT

    explanation = explain_prediction(model, project, top_n=args.top)

    print("Top SHAP factors for this project:")
    print(explanation.to_string(index=False))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    explanation.to_csv(args.out, index=False)
    print(f"\nSaved {args.out}")


if __name__ == "__main__":
    main()
