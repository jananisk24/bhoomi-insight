import argparse 
import os 
 
import numpy as np 
import pandas as pd 
 
PROJECT_TYPES = ["Highway", "Railway", "Irrigation", "Power"] 
STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh"] 
DISTRICTS = [ 
    "Chennai", "Madurai", "Coimbatore", "Salem", 
    "Trichy", "Tirunelveli", "Bengaluru", "Kochi", 
] 
COMPENSATION_STATUS = ["Not Started", "In Progress", "Paid"] 
POSSESSION_STATUS = ["Not Taken", "Partial", "Full"] 
 
 
def _determine_stage(row: pd.Series) -> str: 
    if row["Legal_Dispute"] == "Yes": 
        return "Legal" 
    if row["Approval_Days_Pending"] > 120: 
        return "Approval" 
    if row["Compensation_Status"] != "Paid": 
        return "Compensation" 
    if row["Rehabilitation_Progress"] < 40: 
        return "Rehabilitation" 
    if row["Possession_Status"] != "Full": 
        return "Possession" 
    return "Planning" 
 
 
def generate_dataset(n: int = 2000, seed: int = 42) -> pd.DataFrame: 
    """Build n synthetic project rows with a believable Delayed target. 
 
    Uses the legacy `np.random.seed` global-state API (rather than the 
    newer `np.random.default_rng`) on purpose: it reproduces byte-for-byte 
    the same dataset the original script produced for n=2000, seed=42, so 
    re-running this won't silently invalidate the already-trained model.pkl. 
    """ 
    np.random.seed(seed) 
 
    df = pd.DataFrame({ 
        "Project_Type": np.random.choice(PROJECT_TYPES, n), 
        "State": np.random.choice(STATES, n), 
        "District": np.random.choice(DISTRICTS, n), 
        "Land_Area_Hectares": np.round(np.random.uniform(2.5, 500, n), 2), 
        "Affected_Families": np.random.randint(5, 2001, n), 
        "Compensation_Status": np.random.choice(COMPENSATION_STATUS, n), 
        "Approval_Days_Pending": np.random.randint(0, 366, n), 
        "Legal_Dispute": np.random.choice(["Yes", "No"], n, p=[0.30, 0.70]), 
        "Possession_Status": np.random.choice(POSSESSION_STATUS, n), 
        "Rehabilitation_Progress": np.random.randint(0, 101, n), 
        "Stakeholder_Score": np.random.randint(1, 6, n), 
        "District_Historical_Delay": np.random.randint(0, 101, n), 
    }) 
 
    risk_score = ( 
        (df["Land_Area_Hectares"] > 250) * 10 
        + (df["Affected_Families"] > 500) * 15 
        + (df["Compensation_Status"] == "Not Started") * 20 
        + (df["Compensation_Status"] == "In Progress") * 10 
        + (df["Approval_Days_Pending"] > 120) * 20 
        + (df["Legal_Dispute"] == "Yes") * 25 
        + (df["Possession_Status"] == "Not Taken") * 15 
        + (df["Possession_Status"] == "Partial") * 8 
        + (df["Rehabilitation_Progress"] < 40) * 15 
        + (df["Stakeholder_Score"] <= 2) * 10 
        + (df["District_Historical_Delay"] > 60) * 15 
    ) 
    risk_score = risk_score + np.random.randint(-15, 16, n) 
 
    delay_probability = 1 / (1 + np.exp(-(risk_score - 50) / 15)) 
    df["Delayed"] = np.where(np.random.random(n) < delay_probability, "Yes", "No") 
    df["Delay_Stage"] = df.apply(_determine_stage, axis=1) 
 
    return df 
 
 
def main() -> None: 
    parser = argparse.ArgumentParser(description=__doc__) 
    parser.add_argument("--rows", type=int, default=2000, help="number of rows to generate") 
    parser.add_argument("--seed", type=int, default=42, help="random seed for reproducibility") 
    parser.add_argument("--out", default="data/projects.csv", help="output CSV path") 
    args = parser.parse_args() 
 
    df = generate_dataset(n=args.rows, seed=args.seed) 
 
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True) 
    df.to_csv(args.out, index=False) 
 
    print("================================") 
    print("DATASET CREATED SUCCESSFULLY!") 
    print("================================") 
    print("Number of records:", len(df)) 
    print("\nColumns:") 
    print(df.columns.tolist()) 
    print("\nFirst 5 records:") 
    print(df.head()) 
 
 
if __name__ == "__main__": 
    main() 