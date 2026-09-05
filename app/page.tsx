"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Transaction = {
  id: number
  transaction_id: string
  transaction_time: string
  transaction_amount: number

  risk_score: number | null
  risk_level: string | null
  risk_reasons: string[] | null

  customer_id: string | null
  merchant_id: string | null
  account_age_days: number | null
  credit_score_band: number | null
  kyc_level: number | null
  avg_monthly_spend: number | null
  merchant_risk_score: number | null
  payment_channel: string | null
  device_type: string | null
  is_international: boolean | null
  ip_risk_score: number | null
  txn_count_1h: number | null
  txn_count_24h: number | null
  failed_txn_count_24h: number | null
  geo_distance_from_last_txn: number | null
  amount_deviation_from_user_mean: number | null

  ml_fraud_probability?: number
  ml_risk_score?: number
  ml_risk_level?: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      // -----------------------------------------
      // 1. GET TRANSACTIONS FROM SUPABASE
      // -----------------------------------------

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_time", { ascending: false })

      console.log("TRANSACTIONS PAGE DATA:", data)
      console.log("TRANSACTIONS PAGE ERROR:", error)

      if (error || !data) {
        setTransactions([])
        setLoading(false)
        return
      }

      // -----------------------------------------
      // 2. SEND EACH TRANSACTION TO ML API
      // -----------------------------------------

      const transactionsWithML = await Promise.all(
        data.map(async (transaction) => {
          try {
            const response = await fetch(
              "http://127.0.0.1:8001/predict",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  customer_id: String(
                    transaction.customer_id ?? "0"
                  ),

                  merchant_id: String(
                    transaction.merchant_id ?? "0"
                  ),

                  account_age_days: Number(
                    transaction.account_age_days ?? 0
                  ),

                  credit_score_band: Number(
                    transaction.credit_score_band ?? 0
                  ),

                  kyc_level: Number(
                    transaction.kyc_level ?? 0
                  ),

                  avg_monthly_spend: Number(
                    transaction.avg_monthly_spend ?? 0
                  ),

                  merchant_risk_score: Number(
                    transaction.merchant_risk_score ?? 0
                  ),

                  transaction_amount: Number(
                    transaction.transaction_amount ?? 0
                  ),

                  payment_channel:
                    transaction.payment_channel ?? "unknown",

                  device_type:
                    transaction.device_type ?? "unknown",

                  // Supabase = boolean
                  // ML API = integer
                  is_international:
                    transaction.is_international ? 1 : 0,

                  ip_risk_score: Number(
                    transaction.ip_risk_score ?? 0
                  ),

                  txn_count_1h: Number(
                    transaction.txn_count_1h ?? 0
                  ),

                  txn_count_24h: Number(
                    transaction.txn_count_24h ?? 0
                  ),

                  failed_txn_count_24h: Number(
                    transaction.failed_txn_count_24h ?? 0
                  ),

                  geo_distance_from_last_txn: Number(
                    transaction.geo_distance_from_last_txn ?? 0
                  ),

                  amount_deviation_from_user_mean: Number(
                    transaction.amount_deviation_from_user_mean ?? 0
                  ),
                }),
              }
            )

            // -----------------------------------------
            // 3. CHECK ML API RESPONSE
            // -----------------------------------------

            if (!response.ok) {
              const errorText = await response.text()

              console.error(
                "ML API ERROR:",
                errorText
              )

              return transaction
            }

            const ml = await response.json()

            console.log(
              "ML PREDICTION:",
              transaction.transaction_id,
              ml
            )

            // -----------------------------------------
            // 4. ADD ML RESULT TO TRANSACTION
            // -----------------------------------------

            return {
              ...transaction,

              ml_fraud_probability:
                ml.fraud_probability,

              ml_risk_score:
                ml.risk_score,

              ml_risk_level:
                ml.risk_level,
            }
          } catch (error) {
            console.error(
              "ML REQUEST FAILED:",
              error
            )

            return transaction
          }
        })
      )

      // -----------------------------------------
      // 5. UPDATE PAGE
      // -----------------------------------------

      setTransactions(transactionsWithML)
      setLoading(false)
    }

    loadTransactions()
  }, [])

  return (
    <main className="min-h-screen bg-navy-background p-6">

      {/* BACK BUTTON */}

      <a
        href="/dashboard"
        className="mb-6 inline-flex items-center rounded-lg border border-navy-border px-3 py-2 text-sm text-navy-foreground hover:bg-white/5"
      >
        ← Back to Dashboard
      </a>

      {/* PAGE HEADER */}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-navy-foreground">
          Transactions
        </h1>

        <p className="mt-1 text-sm text-navy-muted">
          Monitor payment transactions and their ML-based risk scores.
        </p>
      </div>

      {/* TRANSACTIONS CARD */}

      <div className="rounded-xl border border-navy-border bg-navy-card">

        <div className="border-b border-navy-border p-4">
          <h2 className="text-sm font-semibold text-navy-foreground">
            All Transactions
          </h2>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="p-6 text-sm text-navy-muted">
            Loading transactions and ML risk predictions...
          </div>

        ) : transactions.length === 0 ? (

          /* EMPTY */

          <div className="p-6 text-sm text-navy-muted">
            No transactions found.
          </div>

        ) : (

          /* TABLE */

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-navy-border text-xs text-navy-muted">

                  <th className="px-5 py-4">
                    TRANSACTION
                  </th>

                  <th className="px-5 py-4">
                    TIME
                  </th>

                  <th className="px-5 py-4">
                    AMOUNT
                  </th>

                  <th className="px-5 py-4">
                    ML RISK SCORE
                  </th>

                  <th className="px-5 py-4">
                    ML LEVEL
                  </th>

                  <th className="px-5 py-4">
                    RISK REASONS
                  </th>

                </tr>
              </thead>

              <tbody>

                {transactions.map((transaction) => (

                  <tr
                    key={transaction.id}
                    className="border-b border-navy-border last:border-0 hover:bg-white/[0.02]"
                  >

                    {/* TRANSACTION ID */}

                    <td className="px-5 py-4 font-mono text-sm text-navy-foreground">
                      {transaction.transaction_id}
                    </td>

                    {/* TIME */}

                    <td className="px-5 py-4 text-sm text-navy-muted">
                      {new Date(
                        transaction.transaction_time
                      ).toLocaleString("en-IN")}
                    </td>

                    {/* AMOUNT */}

                    <td className="px-5 py-4 text-sm font-semibold text-navy-foreground">
                      ₹
                      {Number(
                        transaction.transaction_amount
                      ).toLocaleString("en-IN")}
                    </td>

                    {/* ML SCORE */}

                    <td className="px-5 py-4 text-sm font-semibold text-navy-foreground">

                      {transaction.ml_risk_score !== undefined
                        ? transaction.ml_risk_score
                        : "—"}

                    </td>

                    {/* ML LEVEL */}

                    <td className="px-5 py-4">

                      {transaction.ml_risk_level ? (

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            transaction.ml_risk_level === "High"
                              ? "bg-risk-high/15 text-risk-high"
                              : transaction.ml_risk_level === "Medium"
                                ? "bg-risk-med/15 text-risk-med"
                                : "bg-risk-low/15 text-risk-low"
                          }`}
                        >
                          {transaction.ml_risk_level}
                        </span>

                      ) : (
                        <span className="text-xs text-navy-muted">
                          —
                        </span>
                      )}

                    </td>

                    {/* RISK REASONS */}

                    <td className="px-5 py-4 text-xs text-navy-muted">

                      {transaction.risk_reasons?.length
                        ? transaction.risk_reasons.join(", ")
                        : "No risk reasons"}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </main>
  )
}