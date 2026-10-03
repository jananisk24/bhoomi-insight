import pandas as pd

# Load our dataset
df = pd.read_csv("data/projects.csv")

print("================================")
print("DATASET CHECK")
print("================================")

# Show number of rows and columns
print("\n1. Dataset shape:")
print(df.shape)

# Show column names
print("\n2. Columns:")
print(df.columns.tolist())

# Check missing values
print("\n3. Missing values:")
print(df.isnull().sum())

# Check duplicate rows
print("\n4. Duplicate rows:")
print(df.duplicated().sum())

# Show data types
print("\n5. Data types:")
print(df.dtypes)

# Show delayed distribution
print("\n6. Delayed distribution:")
print(df["Delayed"].value_counts())

# Show delay stage distribution
print("\n7. Delay stage distribution:")
print(df["Delay_Stage"].value_counts())

print("\n================================")
print("CHECK COMPLETED")
print("================================")