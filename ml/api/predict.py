from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import shap
from pathlib import Path
from ml.api.prevent import generate_prevention_actions


app = FastAPI(title="DisputeShield ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# LOAD MODEL
# =========================================================

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "disputeshield_model.joblib"
)

model = joblib.load(MODEL_PATH)


# =========================================================
# FIND MODEL COMPONENTS
# =========================================================

preprocessor = None
classifier = None

if hasattr(model, "named_steps"):
    for name, step in model.named_steps.items():

        if hasattr(step, "transform") and hasattr(
            step, "get_feature_names_out"
        ):
            preprocessor = step

        if hasattr(step, "predict_proba"):
            classifier = step


# If the saved object itself is a classifier
if classifier is None and hasattr(model, "predict_proba"):
    classifier = model


# =========================================================
# INPUT MODEL
# =========================================================

class Transaction(BaseModel):

    customer_id: str | int | None = None
    merchant_id: str | int | None = None

    account_age_days: int | None = 0
    credit_score_band: int | None = 0
    kyc_level: int | None = 0

    avg_monthly_spend: float | None = 0
    merchant_risk_score: float | None = 0
    transaction_amount: float | None = 0

    payment_channel: str | None = "unknown"
    device_type: str | None = "unknown"

    is_international: bool | int | None = False

    ip_risk_score: float | None = 0

    txn_count_1h: int | None = 0
    txn_count_24h: int | None = 0
    failed_txn_count_24h: int | None = 0

    geo_distance_from_last_txn: float | None = 0

    amount_deviation_from_user_mean: float | None = 0


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "DisputeShield ML API is running"
    }


# =========================================================
# PREPARE INPUT
# =========================================================

def prepare_transaction(transaction: Transaction):

    data = transaction.model_dump()

    # -----------------------------
    # IDs
    # -----------------------------

    data["customer_id"] = pd.to_numeric(
        data["customer_id"],
        errors="coerce"
    )

    data["merchant_id"] = pd.to_numeric(
        data["merchant_id"],
        errors="coerce"
    )

    if pd.isna(data["customer_id"]):
        data["customer_id"] = 0

    if pd.isna(data["merchant_id"]):
        data["merchant_id"] = 0

    # -----------------------------
    # Numeric fields
    # -----------------------------

    numeric_fields = [
        "account_age_days",
        "credit_score_band",
        "kyc_level",
        "avg_monthly_spend",
        "merchant_risk_score",
        "transaction_amount",
        "ip_risk_score",
        "txn_count_1h",
        "txn_count_24h",
        "failed_txn_count_24h",
        "geo_distance_from_last_txn",
        "amount_deviation_from_user_mean",
    ]

    for field in numeric_fields:

        value = pd.to_numeric(
            data.get(field),
            errors="coerce"
        )

        if pd.isna(value):
            value = 0

        data[field] = value

    # -----------------------------
    # Boolean
    # -----------------------------

    data["is_international"] = bool(
        data.get("is_international", False)
    )

    # -----------------------------
    # Categorical
    # -----------------------------

    data["payment_channel"] = (
        data.get("payment_channel")
        or "unknown"
    )

    data["device_type"] = (
        data.get("device_type")
        or "unknown"
    )

    return pd.DataFrame([data])


# =========================================================
# READABLE FEATURE NAMES
# =========================================================

def readable_feature_name(feature_name: str):

    name = feature_name.lower()

    # One-hot encoded categorical features
    if "payment_channel" in name:
        if "upi" in name:
            return "UPI payment channel"

        if "card" in name:
            return "Card payment channel"

        if "wallet" in name:
            return "Wallet payment channel"

        if "netbanking" in name:
            return "Net banking payment channel"

        return "Payment channel"

    if "device_type" in name:
        if "mobile" in name:
            return "Mobile device"

        if "desktop" in name:
            return "Desktop device"

        if "tablet" in name:
            return "Tablet device"

        return "Device type"

    # Numerical features
    mapping = {
        "transaction_amount":
            "Unusual transaction amount",

        "amount_deviation_from_user_mean":
            "Large deviation from usual spending",

        "ip_risk_score":
            "Elevated IP risk",

        "txn_count_1h":
            "High transaction velocity",

        "txn_count_24h":
            "High 24-hour transaction activity",

        "failed_txn_count_24h":
            "Multiple failed transactions",

        "geo_distance_from_last_txn":
            "Large geographic distance",

        "merchant_risk_score":
            "Elevated merchant risk",

        "account_age_days":
            "Newer customer account",

        "credit_score_band":
            "Lower credit score band",

        "kyc_level":
            "Lower KYC level",

        "avg_monthly_spend":
            "Unusual monthly spending pattern",

        "is_international":
            "International transaction",

        "customer_id":
            "Customer profile",

        "merchant_id":
            "Merchant profile",
    }

    for key, readable in mapping.items():

        if key in name:
            return readable

    return feature_name.replace("_", " ").title()


# =========================================================
# GENERATE SHAP REASONS
# =========================================================

def generate_shap_reasons(df, risk_level):

    try:

        if preprocessor is None:
            print("SHAP: Preprocessor not found")
            return []

        if classifier is None:
            print("SHAP: Classifier not found")
            return []

        # Transform exactly like the trained pipeline
        transformed = preprocessor.transform(df)

        # SHAP works more reliably with dense arrays here
        if hasattr(transformed, "toarray"):
            transformed = transformed.toarray()

        # Create explainer for Random Forest
        explainer = shap.TreeExplainer(
            classifier
        )

        shap_values = explainer.shap_values(
            transformed
        )

        # Handle SHAP output formats
        if isinstance(shap_values, list):

            if len(shap_values) > 1:
                values = shap_values[1][0]
            else:
                values = shap_values[0][0]

        else:

            values = shap_values

            if len(values.shape) == 3:
                values = values[0, :, 1]

            elif len(values.shape) == 2:
                values = values[0]

        # Feature names after preprocessing
        try:
            feature_names = (
                preprocessor
                .get_feature_names_out()
            )
        except Exception:
            feature_names = [
                f"Feature {i + 1}"
                for i in range(len(values))
            ]

        # Sort by absolute SHAP contribution
        ranked = sorted(
            zip(feature_names, values),
            key=lambda item: abs(float(item[1])),
            reverse=True
        )

        reasons = []

        for feature, contribution in ranked:

            contribution = float(contribution)

            # Ignore extremely tiny contributions
            if abs(contribution) < 0.01:
                continue

            readable = readable_feature_name(
                feature
            )

            # Avoid duplicate readable reasons
            if readable in reasons:
                continue

            if contribution > 0:
                reasons.append(readable)

            if len(reasons) >= 4:
                break

        # If no strong reason was found
        if not reasons:

            if risk_level == "High":
                reasons.append(
                    "Multiple risk signals detected"
                )

            elif risk_level == "Medium":
                reasons.append(
                    "Moderate risk signals detected"
                )

            else:
                reasons.append(
                    "No major risk signals detected"
                )

        return reasons

    except Exception as error:

        print(
            "SHAP ERROR:",
            repr(error)
        )

        return [
            "Risk factors could not be generated"
        ]


# =========================================================
# PREDICT
# =========================================================

@app.post("/predict")
def predict(transaction: Transaction):

    df = prepare_transaction(
        transaction
    )

    # -----------------------------
    # ML prediction
    # -----------------------------

    probability = float(
        model.predict_proba(df)[0][1]
    )

    risk_score = round(
        probability * 100
    )

    # -----------------------------
    # Risk level
    # -----------------------------

    if risk_score <= 30:

        risk_level = "Low"

    elif risk_score <= 70:

        risk_level = "Medium"

    else:

        risk_level = "High"

    # -----------------------------
    # SHAP explanation
    # -----------------------------

    risk_reasons = generate_shap_reasons(
        df,
        risk_level
    )

    prevention_actions = generate_prevention_actions(
    risk_score,
    risk_level,
    risk_reasons
    )

    result = {
        "fraud_probability":
            round(probability, 4),

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "risk_reasons":
            risk_reasons,

        "prevention_actions": prevention_actions,
    }

    print(
        "PREDICTION:",
        result
    )

    return result