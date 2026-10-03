"""Continuous-learning demonstration: retrain from the current dataset."""

import subprocess
import sys

print("Starting model retraining from data/projects.csv ...")
result = subprocess.run([sys.executable, "train_model.py"], check=False)
if result.returncode != 0:
    raise SystemExit(result.returncode)
print("Retraining completed. models/model.pkl has been refreshed.")
