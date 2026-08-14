import os
import pandas as pd
import pickle
import time
import joblib
print("Starting UniGPU test script...")

# 1. Define Paths
# The agent will ALWAYS save your uploaded CSV to this exact path
INPUT_CSV = "/workspace/input/dataset.csv"
# Any files you want to be returned as "Artifacts" MUST be saved in this directory
OUTPUT_DIR = "/workspace/output"

os.makedirs(OUTPUT_DIR, exist_ok=True)
# 2. Read the Dataset
print(f"Looking for dataset at: {INPUT_CSV}")
if not os.path.exists(INPUT_CSV):
    print("❌ ERROR: Dataset not found! Did you upload it?")
    exit(1)
df = pd.read_csv(INPUT_CSV)
print("✅ Dataset loaded successfully!")
print(f"Dataset shape: {df.shape}")
print(df.head())
# Simulate some training time
print("\nTraining model...")
time.sleep(5)
print("✅ Training complete!")

# 3. Save Artifacts
model_path = os.path.join(OUTPUT_DIR, "trained_model.pkl")
dummy_model = {"weights": [0.1, 0.5, 0.9], "classes": [0, 1]}
with open(model_path, "wb") as f:
    pickle.dump(dummy_model, f)
print(f"✅ Saved model artifact to: {model_path}")

metrics_path = os.path.join(OUTPUT_DIR, "metrics.txt")
with open(metrics_path, "w") as f:
    f.write("Accuracy: 0.95\nLoss: 0.05\n")
print(f"✅ Saved metrics artifact to: {metrics_path}")
print("\nScript finished successfully! Check the Artifacts tab in the UI.")
