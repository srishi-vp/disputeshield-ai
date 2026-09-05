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

  fraud_probability: number | null

  customer_id: string | number | null
  merchant_id: string | number | null

  account_age_days: number | null
  credit_score_band: number | null
  kyc_level: number | null
  avg_monthly_spend: number | null
  merchant_risk_score: number | null

  payment_channel: string | null
  device_type: string | null

  is_international: boolean | number | null

  ip_risk_score: number | null
  txn_count_1h: number | null
  txn_count_24h: number | null
  failed_txn_count_24h: number | null

  geo_distance_from_last_txn: number | null
  amount_deviation_from_user_mean: number | null

  is_fraud: boolean | null
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select(`
            id,
            transaction_id,
            transaction_time,
            transaction_amount,
            risk_score,
            risk_level,
            risk_reasons,
            fraud_probability,
            customer_id,
            merchant_id,
            account_age_days,
            credit_score_band,
            kyc_level,
            avg_monthly_spend,
            merchant_risk_score,
            payment_channel,
            device_type,
            is_international,
            ip_risk_score,
            txn_count_1h,
            txn_count_24h,
            failed_txn_count_24h,
            geo_distance_from_last_txn,
            amount_deviation_from_user_mean,
            is_fraud
          `)
          .order("transaction_time", { ascending: false })

        console.log("TRANSACTIONS PAGE DATA:", data)
        console.log("TRANSACTIONS PAGE ERROR:", error)

        if (error || !data) {
          console.error(
            "FAILED TO LOAD TRANSACTIONS:",
            error
          )

          setTransactions([])
          setLoading(false)
          return
        }

        // -----------------------------------------
        // USE SAVED ML RESULTS FROM SUPABASE
        // -----------------------------------------

        const storedTransactions =
          data as Transaction[]

        storedTransactions.forEach((transaction) => {
          console.log("TRANSACTION STORED ML:", {
            transactionId:
              transaction.transaction_id,
            fraud_probability:
              transaction.fraud_probability,
            risk_score:
              transaction.risk_score,
            risk_level:
              transaction.risk_level,
          })
        })

        setTransactions(storedTransactions)
        setLoading(false)
      } catch (error) {
        console.error(
          "TRANSACTIONS PAGE FAILED:",
          error
        )

        setTransactions([])
        setLoading(false)
      }
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

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-navy-foreground">
            Transactions
          </h1>

          <span className="rounded-full bg-risk-low/15 px-2.5 py-1 text-xs font-medium text-risk-low">
            ML Stored
          </span>
        </div>

        <p className="mt-1 text-sm text-navy-muted">
          Monitor payment transactions and their ML-based fraud risk.
        </p>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-navy-border bg-navy-card">

        <div className="border-b border-navy-border p-4">
          <h2 className="text-sm font-semibold text-navy-foreground">
            All Transactions
          </h2>
        </div>

        {loading ? (

          <div className="p-6 text-sm text-navy-muted">
            Loading transactions...
          </div>

        ) : transactions.length === 0 ? (

          <div className="p-6 text-sm text-navy-muted">
            No transactions found.
          </div>

        ) : (

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
                    ML PROBABILITY
                  </th>

                  <th className="px-5 py-4">
                    ML SCORE
                  </th>

                  <th className="px-5 py-4">
                    ML LEVEL
                  </th>

                </tr>
              </thead>

              <tbody>

                {transactions.map((transaction) => {

                  const score =
                    Number(
                      transaction.risk_score ?? 0
                    )

                  const probability =
                    transaction.fraud_probability

                  const level =
                    transaction.risk_level ??
                    (
                      score >= 71
                        ? "High"
                        : score >= 31
                          ? "Medium"
                          : "Low"
                    )

                  return (

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

                      {/* ML PROBABILITY */}
                      <td className="px-5 py-4 text-sm font-semibold text-navy-foreground">

                        {probability !== null &&
                        probability !== undefined
                          ? `${(
                              Number(probability) * 100
                            ).toFixed(2)}%`
                          : "—"}

                      </td>

                      {/* ML SCORE */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">

                            <div
                              className={
                                score >= 71
                                  ? "h-full rounded-full bg-risk-high"
                                  : score >= 31
                                    ? "h-full rounded-full bg-risk-med"
                                    : "h-full rounded-full bg-risk-low"
                              }
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    score,
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            />

                          </div>

                          <span className="text-sm font-semibold tabular-nums text-navy-foreground">
                            {score}
                          </span>

                        </div>

                      </td>

                      {/* ML LEVEL */}
                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            level === "High"
                              ? "bg-risk-high/15 text-risk-high"
                              : level === "Medium"
                                ? "bg-risk-med/15 text-risk-med"
                                : "bg-risk-low/15 text-risk-low"
                          }`}
                        >
                          {level}
                        </span>

                      </td>

                    </tr>

                  )
                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </main>
  )
}