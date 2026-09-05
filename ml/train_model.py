import pandas as pd
import numpy as np
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

# --------------------------------------------------
# 1. LOAD DATA
# --------------------------------------------------

train_df = pd.read_csv("ml/transactions_train.csv")
test_df = pd.read_csv("ml/transactions_test.csv")

print("Training shape:", train_df.shape)
print("Testing shape:", test_df.shape)

print("\nColumns:")
print(train_df.columns.tolist())

# --------------------------------------------------
# 2. TARGET
# --------------------------------------------------

target = "is_fraud"

# Columns that should NOT be used as model inputs
drop_columns = [
    "is_fraud",
    "transaction_id",
    "transaction_time",
    "post_auth_risk_score",
    "risk_score",
    "risk_level",
    "risk_reasons",
]

drop_columns = [
    column for column in drop_columns
    if column in train_df.columns
]

X_train = train_df.drop(columns=drop_columns)
y_train = train_df[target]

X_test = test_df.drop(columns=drop_columns)
y_test = test_df[target]

print("\nFraud distribution:")
print(y_train.value_counts())

# --------------------------------------------------
# 3. IDENTIFY FEATURES
# --------------------------------------------------

categorical_features = X_train.select_dtypes(
    include=["object", "category", "bool"]
).columns.tolist()

numerical_features = X_train.select_dtypes(
    include=["int64", "float64", "int32", "float32"]
).columns.tolist()

print("\nCategorical features:")
print(categorical_features)

print("\nNumerical features:")
print(numerical_features)

# --------------------------------------------------
# 4. PREPROCESSING
# --------------------------------------------------

numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median"))
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numerical_features),
    ("categorical", categorical_pipeline, categorical_features),
])

# --------------------------------------------------
# 5. RANDOM FOREST MODEL
# --------------------------------------------------

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight={0: 1, 1: 8},
    max_depth=18,
    min_samples_leaf=2,
    n_jobs=-1,
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("model", model),
])

# --------------------------------------------------
# 6. TRAIN
# --------------------------------------------------

print("\nTraining model...")

pipeline.fit(X_train, y_train)

print("Model training completed!")
joblib.dump(pipeline, "ml/disputeshield_model.joblib")

print("Trained model saved to:")
print("ml/disputeshield_model.joblib")

# --------------------------------------------------
# 7. PREDICTION
# --------------------------------------------------

fraud_probability = pipeline.predict_proba(X_test)[:, 1]

FRAUD_THRESHOLD = 0.20

y_pred = (fraud_probability >= FRAUD_THRESHOLD).astype(int)

# --------------------------------------------------
# 8. EVALUATION
# --------------------------------------------------

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)

print("\n==============================")
print("MODEL PERFORMANCE")
print("==============================")

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# --------------------------------------------------
# 9. GENERATE RISK SCORE
# --------------------------------------------------

risk_score = (fraud_probability * 100).round().astype(int)


def get_risk_level(score):
    if score <= 30:
        return "Low"
    elif score <= 70:
        return "Medium"
    else:
        return "High"


results = test_df.copy()

results["ml_fraud_probability"] = fraud_probability
results["ml_risk_score"] = risk_score
results["ml_risk_level"] = results["ml_risk_score"].apply(
    get_risk_level
)

# --------------------------------------------------
# 10. SAVE PREDICTIONS
# --------------------------------------------------

results.to_csv(
    "ml_predictions.csv",
    index=False
)

print("\nPredictions saved to:")
print("ml/ml_predictions.csv")

print("\nSample predictions:")

print(
    results[
        [
            "is_fraud",
            "ml_fraud_probability",
            "ml_risk_score",
            "ml_risk_level",
        ]
    ].head(10)
)