import joblib
import numpy as np
import pandas as pd

from sklearn.datasets import fetch_california_housing
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# -----------------------------------
# Load Dataset
# -----------------------------------
print("Loading California Housing Dataset...")

housing = fetch_california_housing(as_frame=True)

df = housing.frame

# Rename target column to keep the rest of the code similar
df.rename(columns={"MedHouseVal": "SalePrice"}, inplace=True)

print(f"Dataset Shape: {df.shape}")

# -----------------------------------
# Features and Target
# -----------------------------------
X = df.drop(columns=["SalePrice"])
y = df["SalePrice"]

# -----------------------------------
# Train/Test Split
# -----------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# -----------------------------------
# Identify Column Types
# -----------------------------------
numeric_features = X.select_dtypes(include=["int64", "float64"]).columns
categorical_features = X.select_dtypes(include=["object"]).columns

# -----------------------------------
# Preprocessing
# -----------------------------------
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median"))
])

categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# -----------------------------------
# Model
# -----------------------------------
model = RandomForestRegressor(
    n_estimators=300,
    random_state=42,
    n_jobs=-1
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("model", model)
])

# -----------------------------------
# Train Model
# -----------------------------------
print("Training model...")
pipeline.fit(X_train, y_train)

# -----------------------------------
# Predict
# -----------------------------------
predictions = pipeline.predict(X_test)

# -----------------------------------
# Evaluate
# -----------------------------------
mse = mean_squared_error(y_test, predictions)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, predictions)

print("\n==============================")
print("Model Performance")
print("==============================")
print(f"MSE  : {mse:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")

# -----------------------------------
# Save Model
# -----------------------------------
joblib.dump(pipeline, "house_price_model.pkl")

print("\nModel saved as 'house_price_model.pkl'")

# -----------------------------------
# Example Prediction
# -----------------------------------
sample = X_test.iloc[[0]]
prediction = pipeline.predict(sample)[0]
actual = y_test.iloc[0]

print("\n==============================")
print("Example Prediction")
print("==============================")
print(f"Predicted Price : ${prediction * 100000:,.2f}")
print(f"Actual Price    : ${actual * 100000:,.2f}")

# -----------------------------------
# Feature Importance
# -----------------------------------
feature_names = pipeline.named_steps["preprocessor"].get_feature_names_out()
importances = pipeline.named_steps["model"].feature_importances_

importance_df = pd.DataFrame({
    "Feature": feature_names,
    "Importance": importances
}).sort_values(by="Importance", ascending=False)

print("\nTop 10 Most Important Features")
print(importance_df.head(10))

# -----------------------------------
# Save Feature Importance
# -----------------------------------
importance_df.to_csv("feature_importance.csv", index=False)

print("\nFeature importance saved as 'feature_importance.csv'")
