# DisputeShield AI

### AI-Powered Payment Risk & Dispute Intelligence for Merchants

DisputeShield AI is a merchant-facing AI platform designed to help merchants detect risky transactions early, prevent potential payment losses, investigate disputes, organize evidence, and learn from transaction and dispute outcomes.

## 🚀 Predict → Prevent → Fight → Learn

### 🔍 Predict
Machine learning analyzes transaction and behavioral signals to generate:
- Fraud probability
- Risk score
- Risk level
- Explainable risk signals using SHAP

### 🛡️ Prevent
The system converts risk predictions into AI-generated prevention recommendations such as:
- Transaction review
- Transaction velocity checks
- Location and international-payment verification
- Additional customer verification for higher-risk cases

### ⚔️ Fight
When a dispute occurs, DisputeShield AI:
- Investigates the dispute using Gemini AI
- Summarizes the case
- Assesses risk and available facts
- Identifies missing evidence
- Recommends an action
- Generates a draft dispute response
- Organizes supporting evidence

Consequential actions require **human approval** before submission.

### 📈 Learn
Dispute outcomes and human decisions are recorded through audit logs and analytics to provide insight into:
- Active disputes
- Won and lost disputes
- Win rate
- Human approvals and rejections
- Transaction risk distribution
- Recent learning activity

## 🧠 Machine Learning

A Random Forest classification model is used for transaction fraud-risk prediction.

The model was evaluated on a **held-out test set**.

| Metric | Result |
|---|---:|
| Accuracy | 97.00% |
| Precision | 31.03% |
| Recall | 41.96% |
| F1 Score | 35.68% |
| Operating Threshold | 0.20 |

Multiple classification thresholds were evaluated to balance fraud detection recall with false-positive impact.

### Explainability

SHAP is used to identify the transaction features contributing most strongly to each prediction, allowing merchants to understand why a transaction was flagged.

## 🏗️ Architecture


  Transaction
       ↓
Next.js Merchant Dashboard
       ↓
FastAPI Prediction API
       ↓
Random Forest ML Model
     ├── Fraud Probability
     ├── Risk Score
     └── SHAP Explanation
             ↓
      Prevention Engine
             ↓
          Supabase
             ↓
     ┌───────┴────────┐
     ↓                ↓
Risk Monitoring    Disputes
                       ↓
                  Gemini AI
                       ↓
              Evidence Center
                       ↓
               Human Approval
                       ↓
                Razorpay API
                       ↓
                  Webhooks
                       ↓
               Audit & Learning


💳 Razorpay Integration

DisputeShield AI includes Razorpay integration for:

Razorpay Test Mode API authentication
Payment dispute webhook handling
Dispute lifecycle updates
Contest API integration
Human-approved dispute submission workflow

The application uses a public HTTPS Vercel deployment for webhook handling.

Real dispute contest submission requires a valid Razorpay dispute ID and Razorpay evidence document ID. The application does not fabricate successful Razorpay responses.

🛠️ Tech Stack

Frontend

Next.js
React
TypeScript
Tailwind CSS

Backend

FastAPI
Python

AI / ML

Scikit-learn
Random Forest
SHAP
Gemini AI

Database & Storage

Supabase
Supabase Storage

Payments

Razorpay APIs
Razorpay Webhooks

Deployment
Vercel


📂 Project Structure
DisputeShield-v0/
├── app/
│   ├── dashboard/
│   ├── transactions/
│   ├── risk-monitor/
│   ├── disputes/
│   ├── evidence-center/
│   ├── analytics/
│   ├── settings/
│   └── api/
├── components/
├── lib/
├── ml/
│   ├── api/
│   ├── transactions_train.csv
│   ├── transactions_test.csv
│   └── ml_predictions.csv
├── public/
├── package.json
└── README.md


🔐 Security
API keys and secrets are stored as environment variables and are not committed to the repository.

Required environment variables include:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET

Never commit .env.local or secret API credentials to the repository.

🌐 Demo

Live Demo:
https://disputeshield-ai-omega.vercel.app

GitHub Repository:
https://github.com/srishi-vp/disputeshield-ai

🎯 Vision

DisputeShield AI aims to move merchant payment protection beyond simple fraud detection by connecting transaction risk prediction, prevention, dispute intelligence, evidence management, human decision-making, and outcome learning into one workflow.

Predict early. Prevent intelligently. Fight disputes. Learn continuously.

