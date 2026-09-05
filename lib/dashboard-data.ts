// DEMO DATA ONLY — not real transactions.
// This module returns clearly-labeled mock data for the DisputeShield AI dashboard.
// It will be replaced by Supabase queries + an ML risk-prediction API later.

export type RiskLevel = "low" | "medium" | "high"

export type FlagReason =
  | "Unusual transaction amount"
  | "High transaction velocity"
  | "IP risk"
  | "Geo-distance anomaly"
  | "Previous dispute history"

export type TransactionStatus = "Cleared" | "Under review" | "Flagged" | "Disputed"

export interface Transaction {
  id: string
  time: string
  amount: number
  currency: string
  method: string
  riskScore: number // 0-100
  reasons: FlagReason[]
  status: TransactionStatus
}

export interface Dispute {
  id: string
  txnId: string
  reason: string
  amount: number
  currency: string
  opened: string
  stage: "Evidence due" | "Submitted" | "Won" | "Lost"
  dueInDays?: number
}

export interface Stat {
  key: string
  label: string
  value: string
  sublabel: string
  trend: number // percentage, positive or negative
  trendGood: boolean
}

export function riskLevel(score: number): RiskLevel {
  if (score <= 30) return "low"
  if (score <= 70) return "medium"
  return "high"
}

// Deterministic demo dataset (no randomness so SSR/CSR match).
export const transactions: Transaction[] = [
  {
    id: "txn_9F2A7C41",
    time: "12:04:22",
    amount: 248900,
    currency: "INR",
    method: "UPI",
    riskScore: 92,
    reasons: ["Unusual transaction amount", "High transaction velocity", "IP risk"],
    status: "Flagged",
  },
  {
    id: "txn_7B1D3E88",
    time: "12:01:57",
    amount: 15400,
    currency: "INR",
    method: "Visa •• 4821",
    riskScore: 84,
    reasons: ["Geo-distance anomaly", "Previous dispute history"],
    status: "Under review",
  },
  {
    id: "txn_5C0928AA",
    time: "11:58:10",
    amount: 3299,
    currency: "INR",
    method: "Mastercard •• 1190",
    riskScore: 74,
    reasons: ["High transaction velocity", "IP risk"],
    status: "Flagged",
  },
  {
    id: "txn_44E7B210",
    time: "11:52:41",
    amount: 8990,
    currency: "INR",
    method: "Net Banking",
    riskScore: 58,
    reasons: ["Geo-distance anomaly"],
    status: "Under review",
  },
  {
    id: "txn_31A6FD09",
    time: "11:49:03",
    amount: 1299,
    currency: "INR",
    method: "UPI",
    riskScore: 41,
    reasons: ["High transaction velocity"],
    status: "Cleared",
  },
  {
    id: "txn_2F88C7B3",
    time: "11:45:20",
    amount: 62000,
    currency: "INR",
    method: "RuPay •• 3302",
    riskScore: 67,
    reasons: ["Unusual transaction amount", "Previous dispute history"],
    status: "Disputed",
  },
  {
    id: "txn_1D5590E2",
    time: "11:41:58",
    amount: 499,
    currency: "INR",
    method: "UPI",
    riskScore: 12,
    reasons: [],
    status: "Cleared",
  },
  {
    id: "txn_0A2211BC",
    time: "11:38:44",
    amount: 24990,
    currency: "INR",
    method: "Amex •• 7781",
    riskScore: 29,
    reasons: [],
    status: "Cleared",
  },
]

export const stats: Stat[] = [
  {
    key: "payments",
    label: "Total Payments",
    value: "₹48.2L",
    sublabel: "6,412 transactions · last 30d",
    trend: 8.4,
    trendGood: true,
  },
  {
    key: "high-risk",
    label: "High-Risk Transactions",
    value: "132",
    sublabel: "2.1% of total volume",
    trend: 3.2,
    trendGood: false,
  },
  {
    key: "disputes",
    label: "Active Disputes",
    value: "17",
    sublabel: "₹1.9L at stake",
    trend: -11.5,
    trendGood: true,
  },
  {
    key: "win-rate",
    label: "Dispute Win Rate",
    value: "73%",
    sublabel: "Rolling 90-day average",
    trend: 5.6,
    trendGood: true,
  },
]

export const disputes: Dispute[] = [
  {
    id: "dsp_A81F",
    txnId: "txn_2F88C7B3",
    reason: "Product not received",
    amount: 62000,
    currency: "INR",
    opened: "2h ago",
    stage: "Evidence due",
    dueInDays: 2,
  },
  {
    id: "dsp_C40B",
    txnId: "txn_7B1D3E88",
    reason: "Fraudulent transaction",
    amount: 15400,
    currency: "INR",
    opened: "1d ago",
    stage: "Submitted",
  },
  {
    id: "dsp_D19E",
    txnId: "txn_991002AA",
    reason: "Duplicate charge",
    amount: 4599,
    currency: "INR",
    opened: "3d ago",
    stage: "Won",
  },
  {
    id: "dsp_E22A",
    txnId: "txn_770021BC",
    reason: "Subscription cancelled",
    amount: 999,
    currency: "INR",
    opened: "4d ago",
    stage: "Lost",
  },
]

// 14-day risk trend — average risk score + flagged count per day.
export const riskTrend: { day: string; avgRisk: number; flagged: number }[] = [
  { day: "Aug 21", avgRisk: 34, flagged: 6 },
  { day: "Aug 22", avgRisk: 38, flagged: 8 },
  { day: "Aug 23", avgRisk: 31, flagged: 5 },
  { day: "Aug 24", avgRisk: 42, flagged: 11 },
  { day: "Aug 25", avgRisk: 47, flagged: 13 },
  { day: "Aug 26", avgRisk: 39, flagged: 9 },
  { day: "Aug 27", avgRisk: 44, flagged: 12 },
  { day: "Aug 28", avgRisk: 52, flagged: 16 },
  { day: "Aug 29", avgRisk: 49, flagged: 14 },
  { day: "Aug 30", avgRisk: 58, flagged: 19 },
  { day: "Aug 31", avgRisk: 54, flagged: 17 },
  { day: "Sep 01", avgRisk: 61, flagged: 22 },
  { day: "Sep 02", avgRisk: 57, flagged: 18 },
  { day: "Sep 03", avgRisk: 63, flagged: 24 },
]

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const highRiskCount = transactions.filter((t) => t.riskScore > 70).length
