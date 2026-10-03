import pandas as pd

# Load the dataset
df = pd.read_csv("data/projects.csv")

print("========== DATASET SHAPE ==========")
print(df.shape)

print("\n========== COLUMNS ==========")
print(df.columns.tolist())

print("\n========== FIRST 5 ROWS ==========")
print(df.head())

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())

print("\n========== DUPLICATES ==========")
print(df.duplicated().sum())

print("\n========== DELAY DISTRIBUTION ==========")
print(df["Delayed"].value_counts())

print("\n========== DELAY PERCENTAGE ==========")
print(df["Delayed"].value_counts(normalize=True) * 100)

# ==========================================
# VISUALIZATION
# ==========================================

import matplotlib.pyplot as plt

# 1. Delayed vs Not Delayed
df["Delayed"].value_counts().plot(kind="bar")

plt.title("Delayed vs Not Delayed Projects")
plt.xlabel("Delayed")
plt.ylabel("Number of Projects")
plt.xticks(rotation=0)

plt.show()

# 2. Compensation Status vs Delay

delay_by_compensation = pd.crosstab(
    df["Compensation_Status"],
    df["Delayed"]
)

delay_by_compensation.plot(kind="bar")

plt.title("Delay Distribution by Compensation Status")
plt.xlabel("Compensation Status")
plt.ylabel("Number of Projects")
plt.xticks(rotation=0)

plt.legend(title="Delayed")
plt.tight_layout()
plt.show()

# 3. Legal Dispute vs Delay

delay_by_legal = pd.crosstab(
    df["Legal_Dispute"],
    df["Delayed"]
)

delay_by_legal.plot(kind="bar")

plt.title("Delay Distribution by Legal Dispute")
plt.xlabel("Legal Dispute")
plt.ylabel("Number of Projects")
plt.xticks(rotation=0)

plt.legend(title="Delayed")
plt.tight_layout()
plt.show()

# 4. Possession Status vs Delay

delay_by_possession = pd.crosstab(
    df["Possession_Status"],
    df["Delayed"]
)

delay_by_possession.plot(kind="bar")

plt.title("Delay Distribution by Possession Status")
plt.xlabel("Possession Status")
plt.ylabel("Number of Projects")
plt.xticks(rotation=0)

plt.legend(title="Delayed")
plt.tight_layout()
plt.show()

# 5. Approval Days vs Delay

df.boxplot(
    column="Approval_Days_Pending",
    by="Delayed"
)

plt.title("Approval Days Pending vs Delay")
plt.suptitle("")
plt.xlabel("Delayed")
plt.ylabel("Approval Days Pending")

plt.tight_layout()
plt.show()

# 6. Rehabilitation Progress vs Delay

df.boxplot(
    column="Rehabilitation_Progress",
    by="Delayed"
)

plt.title("Rehabilitation Progress vs Delay")
plt.suptitle("")
plt.xlabel("Delayed")
plt.ylabel("Rehabilitation Progress (%)")

plt.tight_layout()
plt.show()

# 7. District Historical Delay vs Delay

df.boxplot(
    column="District_Historical_Delay",
    by="Delayed"
)

plt.title("District Historical Delay vs Project Delay")
plt.suptitle("")
plt.xlabel("Delayed")
plt.ylabel("District Historical Delay")

plt.tight_layout()
plt.show()