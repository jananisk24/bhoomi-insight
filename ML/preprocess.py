import pandas as pd

# ==========================================
# 1. LOAD DATASET
# ==========================================

df = pd.read_csv("data/projects.csv")

print("Dataset loaded successfully!")
print("Shape:", df.shape)


# ==========================================
# 2. REMOVE UNNECESSARY COLUMN
# ==========================================

# Delay_Stage will NOT be used as an input feature.
# It is the stage/reason we want to analyze separately.

df = df.drop("Delay_Stage", axis=1)

print("\nAfter removing Delay_Stage:")
print(df.shape)


# ==========================================
# 3. SEPARATE FEATURES AND TARGET
# ==========================================

X = df.drop("Delayed", axis=1)

y = df["Delayed"]

print("\nFeatures:")
print(X.columns.tolist())

print("\nTarget:")
print(y.name)


# ==========================================
# 4. CONVERT TARGET INTO NUMBERS
# ==========================================

y = y.map({
    "No": 0,
    "Yes": 1
})

print("\nTarget after conversion:")
print(y.value_counts())


# ==========================================
# 5. IDENTIFY CATEGORICAL COLUMNS
# ==========================================

categorical_columns = X.select_dtypes(
    include=["object"]
).columns.tolist()

print("\nCategorical columns:")
print(categorical_columns)


# ==========================================
# 6. IDENTIFY NUMERICAL COLUMNS
# ==========================================

numerical_columns = X.select_dtypes(
    exclude=["object"]
).columns.tolist()

print("\nNumerical columns:")
print(numerical_columns)