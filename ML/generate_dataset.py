import pandas as pd
import numpy as np
import os

# Make results reproducible
np.random.seed(42)

# Number of projects
n = 2000

# Possible values
project_types = [
    "Highway",
    "Railway",
    "Irrigation",
    "Power"
]

states = [
    "Tamil Nadu",
    "Kerala",
    "Karnataka",
    "Andhra Pradesh"
]

districts = [
    "Chennai",
    "Madurai",
    "Coimbatore",
    "Salem",
    "Trichy",
    "Tirunelveli",
    "Bengaluru",
    "Kochi"
]

compensation_status = [
    "Not Started",
    "In Progress",
    "Paid"
]

possession_status = [
    "Not Taken",
    "Partial",
    "Full"
]


# Create the dataset
df = pd.DataFrame({

    "Project_Type":
        np.random.choice(project_types, n),

    "State":
        np.random.choice(states, n),

    "District":
        np.random.choice(districts, n),

    "Land_Area_Hectares":
        np.round(np.random.uniform(2.5, 500, n), 2),

    "Affected_Families":
        np.random.randint(5, 2001, n),

    "Compensation_Status":
        np.random.choice(compensation_status, n),

    "Approval_Days_Pending":
        np.random.randint(0, 366, n),

    "Legal_Dispute":
        np.random.choice(
            ["Yes", "No"],
            n,
            p=[0.30, 0.70]
        ),

    "Possession_Status":
        np.random.choice(
            possession_status,
            n
        ),

    "Rehabilitation_Progress":
        np.random.randint(0, 101, n),

    "Stakeholder_Score":
        np.random.randint(1, 6, n),

    "District_Historical_Delay":
        np.random.randint(0, 101, n)
})


# Calculate a risk value
risk_score = (

    (df["Land_Area_Hectares"] > 250) * 10 +

    (df["Affected_Families"] > 500) * 15 +

    (df["Compensation_Status"] == "Not Started") * 20 +

    (df["Compensation_Status"] == "In Progress") * 10 +

    (df["Approval_Days_Pending"] > 120) * 20 +

    (df["Legal_Dispute"] == "Yes") * 25 +

    (df["Possession_Status"] == "Not Taken") * 15 +

    (df["Possession_Status"] == "Partial") * 8 +

    (df["Rehabilitation_Progress"] < 40) * 15 +

    (df["Stakeholder_Score"] <= 2) * 10 +

    (df["District_Historical_Delay"] > 60) * 15
)


# Add some randomness
risk_score += np.random.randint(-15, 16, n)


# Create a balanced delayed/not-delayed target
delay_probability = 1 / (1 + np.exp(-(risk_score - 50) / 15))

df["Delayed"] = np.where(
    np.random.random(n) < delay_probability,
    "Yes",
    "No"
)


# Create delay stage
def determine_stage(row):

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


df["Delay_Stage"] = df.apply(
    determine_stage,
    axis=1
)

os.makedirs("data", exist_ok=True)

# Save the dataset
df.to_csv(
    "data/projects.csv",
    index=False
)


# Show confirmation
print("================================")
print("DATASET CREATED SUCCESSFULLY!")
print("================================")

print("Number of records:", len(df))

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 5 records:")
print(df.head())