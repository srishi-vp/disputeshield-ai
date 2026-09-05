"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type Transaction = {
  id: number
  transaction_amount: number | null
  fraud_probability: number | null
  risk_score: number | null
  risk_level: string | null
}

type Dispute = {
  id: number
  status: string | null
  amount: number | null
}

type AuditLog = {
  id: number
  action: string | null
  entity_type: string | null
  entity_id: string | null
  actor: string | null
  created_at: string | null
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [transactionsResult, disputesResult, auditResult] =
          await Promise.all([
            supabase
              .from("transactions")
              .select(
                "id, transaction_amount, fraud_probability, risk_score, risk_level"
              )
              .order("id", { ascending: true }),

            supabase
              .from("disputes")
              .select("id, status, amount")
              .order("opened_at", { ascending: false }),

            supabase
              .from("audit_logs")
              .select(
                "id, action, entity_type, entity_id, actor, created_at"
              )
              .order("created_at", { ascending: false })
              .limit(10),
          ])

        console.log(
          "ANALYTICS TRANSACTIONS:",
          transactionsResult.data
        )

        console.log(
          "ANALYTICS TRANSACTION ERROR:",
          transactionsResult.error
        )

        console.log(
          "ANALYTICS DISPUTES:",
          disputesResult.data
        )

        console.log(
          "ANALYTICS DISPUTE ERROR:",
          disputesResult.error
        )

        console.log(
          "ANALYTICS AUDIT LOGS:",
          auditResult.data
        )

        console.log(
          "ANALYTICS AUDIT ERROR:",
          auditResult.error
        )

        if (!transactionsResult.error) {
          setTransactions(
            (transactionsResult.data ?? []) as Transaction[]
          )
        }

        if (!disputesResult.error) {
          setDisputes(
            (disputesResult.data ?? []) as Dispute[]
          )
        }

        if (!auditResult.error) {
          setAuditLogs(
            (auditResult.data ?? []) as AuditLog[]
          )
        }

        setLoading(false)
      } catch (error) {
        console.error("ANALYTICS FAILED:", error)
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  // -----------------------------------------
  // TRANSACTION ANALYTICS
  // -----------------------------------------

  const totalTransactions = transactions.length

  const highRisk = transactions.filter(
    (transaction) =>
      Number(transaction.risk_score ?? 0) >= 71
  ).length

  const mediumRisk = transactions.filter(
    (transaction) => {
      const score = Number(transaction.risk_score ?? 0)

      return score >= 31 && score <= 70
    }
  ).length

  const lowRisk = transactions.filter(
    (transaction) =>
      Number(transaction.risk_score ?? 0) <= 30
  ).length

  const totalAmount = transactions.reduce(
    (sum, transaction) =>
      sum +
      Number(transaction.transaction_amount ?? 0),
    0
  )

  const averageRisk =
    totalTransactions > 0
      ? transactions.reduce(
          (sum, transaction) =>
            sum +
            Number(transaction.risk_score ?? 0),
          0
        ) / totalTransactions
      : 0

  const averageFraudProbability =
    totalTransactions > 0
      ? transactions.reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.fraud_probability ?? 0
            ),
          0
        ) / totalTransactions
      : 0

  const lowPercentage =
    totalTransactions > 0
      ? (lowRisk / totalTransactions) * 100
      : 0

  const mediumPercentage =
    totalTransactions > 0
      ? (mediumRisk / totalTransactions) * 100
      : 0

  const highPercentage =
    totalTransactions > 0
      ? (highRisk / totalTransactions) * 100
      : 0

  // -----------------------------------------
  // DISPUTE OUTCOME ANALYTICS
  // -----------------------------------------

  const activeDisputes = disputes.filter(
    (dispute) => {
      const status =
        (dispute.status ?? "").toLowerCase()

      return (
        status === "evidence due" ||
        status === "submitted" ||
        status === "under review" ||
        status === "action required"
      )
    }
  ).length

  const wonDisputes = disputes.filter(
    (dispute) =>
      (dispute.status ?? "").toLowerCase() ===
      "won"
  ).length

  const lostDisputes = disputes.filter(
    (dispute) =>
      (dispute.status ?? "").toLowerCase() ===
      "lost"
  ).length

  const resolvedDisputes =
    wonDisputes + lostDisputes

  const disputeWinRate =
    resolvedDisputes > 0
      ? (wonDisputes / resolvedDisputes) * 100
      : 0

  const disputedAmount = disputes.reduce(
    (sum, dispute) =>
      sum + Number(dispute.amount ?? 0),
    0
  )

  // -----------------------------------------
  // HUMAN FEEDBACK / LEARNING ANALYTICS
  // -----------------------------------------

  const approvedDecisions = auditLogs.filter(
    (log) => {
      const action =
        (log.action ?? "").toLowerCase()

      return (
        action.includes("approved") ||
        action.includes("approval")
      )
    }
  ).length

  const rejectedDecisions = auditLogs.filter(
    (log) => {
      const action =
        (log.action ?? "").toLowerCase()

      return (
        action.includes("rejected") ||
        action.includes("reject")
      )
    }
  ).length

  return (
    <main className="min-h-screen bg-navy px-6 py-8 text-navy-foreground">
      <div className="mx-auto max-w-7xl">

        {/* BACK BUTTON */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex rounded-lg border border-navy-border px-3 py-2 text-sm text-navy-muted transition hover:bg-white/5 hover:text-navy-foreground"
        >
          ← Back to Dashboard
        </Link>

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-navy-muted">
            Transaction risk, dispute outcomes, and
            payment protection insights.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-navy-border bg-navy-card p-6 text-sm text-navy-muted">
            Loading analytics...
          </div>
        ) : (
          <>
            {/* ----------------------------------------- */}
            {/* SUMMARY CARDS */}
            {/* ----------------------------------------- */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

              {/* TOTAL */}
              <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                <p className="text-sm text-navy-muted">
                  Total transactions
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  {totalTransactions}
                </p>

                <p className="mt-1 text-xs text-navy-muted">
                  ML analyzed transactions
                </p>
              </div>

              {/* HIGH */}
              <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                <p className="text-sm text-navy-muted">
                  High risk
                </p>

                <p className="mt-3 text-3xl font-semibold text-risk-high">
                  {highRisk}
                </p>

                <p className="mt-1 text-xs text-navy-muted">
                  Score 71–100
                </p>
              </div>

              {/* MEDIUM */}
              <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                <p className="text-sm text-navy-muted">
                  Medium risk
                </p>

                <p className="mt-3 text-3xl font-semibold text-risk-med">
                  {mediumRisk}
                </p>

                <p className="mt-1 text-xs text-navy-muted">
                  Score 31–70
                </p>
              </div>

              {/* LOW */}
              <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                <p className="text-sm text-navy-muted">
                  Low risk
                </p>

                <p className="mt-3 text-3xl font-semibold text-risk-low">
                  {lowRisk}
                </p>

                <p className="mt-1 text-xs text-navy-muted">
                  Score 0–30
                </p>
              </div>

              {/* PROTECTED AMOUNT */}
              <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                <p className="text-sm text-navy-muted">
                  Protected amount
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  ₹
                  {totalAmount.toLocaleString(
                    "en-IN"
                  )}
                </p>

                <p className="mt-1 text-xs text-navy-muted">
                  Transaction value analyzed
                </p>
              </div>

            </div>

            {/* ----------------------------------------- */}
            {/* ML OVERVIEW */}
            {/* ----------------------------------------- */}

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* AVERAGE RISK */}
              <div className="rounded-xl border border-navy-border bg-navy-card p-5">

                <h2 className="text-sm font-semibold">
                  ML risk overview
                </h2>

                <p className="mt-1 text-xs text-navy-muted">
                  Average risk generated by the
                  fraud detection model.
                </p>

                <div className="mt-6 flex items-end gap-3">
                  <p className="text-4xl font-semibold">
                    {averageRisk.toFixed(1)}
                  </p>

                  <p className="mb-1 text-sm text-navy-muted">
                    / 100 average risk score
                  </p>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-risk"
                    style={{
                      width: `${Math.min(
                        averageRisk,
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

              {/* FRAUD PROBABILITY */}
              <div className="rounded-xl border border-navy-border bg-navy-card p-5">

                <h2 className="text-sm font-semibold">
                  Fraud probability
                </h2>

                <p className="mt-1 text-xs text-navy-muted">
                  Average fraud probability predicted
                  by the ML model.
                </p>

                <div className="mt-6 flex items-end gap-3">
                  <p className="text-4xl font-semibold">
                    {(
                      averageFraudProbability *
                      100
                    ).toFixed(1)}
                    %
                  </p>

                  <p className="mb-1 text-sm text-navy-muted">
                    average probability
                  </p>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-risk-high"
                    style={{
                      width: `${Math.min(
                        averageFraudProbability *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

            </div>

            {/* ----------------------------------------- */}
            {/* RISK DISTRIBUTION */}
            {/* ----------------------------------------- */}

            <div className="mt-6 rounded-xl border border-navy-border bg-navy-card p-5">

              <h2 className="text-sm font-semibold">
                Risk distribution
              </h2>

              <p className="mt-1 text-xs text-navy-muted">
                Current transactions grouped by ML
                risk score.
              </p>

              <div className="mt-6 space-y-5">

                {/* LOW */}
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-risk-low">
                      Low risk
                    </span>

                    <span className="text-navy-muted">
                      {lowRisk} transaction
                      {lowRisk !== 1 ? "s" : ""}{" "}
                      ({lowPercentage.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="h-2.5 rounded-full bg-white/5">
                    <div
                      className="h-2.5 rounded-full bg-risk-low transition-all"
                      style={{
                        width: `${lowPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                {/* MEDIUM */}
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-risk-med">
                      Medium risk
                    </span>

                    <span className="text-navy-muted">
                      {mediumRisk} transaction
                      {mediumRisk !== 1 ? "s" : ""}{" "}
                      ({mediumPercentage.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="h-2.5 rounded-full bg-white/5">
                    <div
                      className="h-2.5 rounded-full bg-risk-med transition-all"
                      style={{
                        width: `${mediumPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                {/* HIGH */}
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-risk-high">
                      High risk
                    </span>

                    <span className="text-navy-muted">
                      {highRisk} transaction
                      {highRisk !== 1 ? "s" : ""}{" "}
                      ({highPercentage.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="h-2.5 rounded-full bg-white/5">
                    <div
                      className="h-2.5 rounded-full bg-risk-high transition-all"
                      style={{
                        width: `${highPercentage}%`,
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ========================================= */}
            {/* LEARN / OUTCOME INSIGHTS */}
            {/* ========================================= */}

            <div className="mt-6">

              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  Learn & Outcome Insights
                </h2>

                <p className="mt-1 text-xs text-navy-muted">
                  Dispute outcomes and merchant decisions
                  provide feedback for continuous improvement.
                </p>
              </div>

              {/* DISPUTE OUTCOME CARDS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* ACTIVE */}
                <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                  <p className="text-sm text-navy-muted">
                    Active disputes
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-risk-med">
                    {activeDisputes}
                  </p>

                  <p className="mt-1 text-xs text-navy-muted">
                    Currently requiring action
                  </p>
                </div>

                {/* WON */}
                <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                  <p className="text-sm text-navy-muted">
                    Disputes won
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-risk-low">
                    {wonDisputes}
                  </p>

                  <p className="mt-1 text-xs text-navy-muted">
                    Successful outcomes
                  </p>
                </div>

                {/* LOST */}
                <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                  <p className="text-sm text-navy-muted">
                    Disputes lost
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-risk-high">
                    {lostDisputes}
                  </p>

                  <p className="mt-1 text-xs text-navy-muted">
                    Unsuccessful outcomes
                  </p>
                </div>

                {/* WIN RATE */}
                <div className="rounded-xl border border-navy-border bg-navy-card p-5">
                  <p className="text-sm text-navy-muted">
                    Dispute win rate
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {disputeWinRate.toFixed(0)}%
                  </p>

                  <p className="mt-1 text-xs text-navy-muted">
                    Based on resolved disputes
                  </p>
                </div>

              </div>

              {/* FEEDBACK */}

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="rounded-xl border border-navy-border bg-navy-card p-5">

                  <h3 className="text-sm font-semibold">
                    Human feedback
                  </h3>

                  <p className="mt-1 text-xs text-navy-muted">
                    Merchant decisions recorded in the
                    audit trail.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-lg border border-navy-border bg-white/[0.02] p-4">
                      <p className="text-xs text-navy-muted">
                        Approved
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-risk-low">
                        {approvedDecisions}
                      </p>

                      <p className="mt-1 text-[11px] text-navy-muted">
                        AI recommendations
                      </p>
                    </div>

                    <div className="rounded-lg border border-navy-border bg-white/[0.02] p-4">
                      <p className="text-xs text-navy-muted">
                        Rejected
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-risk-high">
                        {rejectedDecisions}
                      </p>

                      <p className="mt-1 text-[11px] text-navy-muted">
                        AI recommendations
                      </p>
                    </div>

                  </div>

                </div>

                {/* DISPUTED VALUE */}

                <div className="rounded-xl border border-navy-border bg-navy-card p-5">

                  <h3 className="text-sm font-semibold">
                    Dispute exposure
                  </h3>

                  <p className="mt-1 text-xs text-navy-muted">
                    Total value represented by recorded
                    disputes.
                  </p>

                  <p className="mt-6 text-4xl font-semibold">
                    ₹
                    {disputedAmount.toLocaleString(
                      "en-IN"
                    )}
                  </p>

                  <p className="mt-2 text-xs text-navy-muted">
                    Across {disputes.length} recorded
                    dispute
                    {disputes.length !== 1
                      ? "s"
                      : ""}
                  </p>

                </div>

              </div>

              {/* LEARNING EXPLANATION */}

              <div className="mt-4 rounded-xl border border-risk/20 bg-risk/[0.04] p-5">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-risk/15 text-risk">
                    ↗
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">
                      How DisputeShield learns
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-navy-muted">
                      DisputeShield records risk predictions,
                      prevention recommendations, merchant
                      approval decisions, and dispute outcomes.
                      These signals create an outcome trail that
                      can be used to evaluate which risk patterns
                      and actions are effective over time.
                    </p>
                  </div>

                </div>

              </div>

            </div>

            {/* ----------------------------------------- */}
            {/* AUDIT / RECENT LEARNING ACTIVITY */}
            {/* ----------------------------------------- */}

            <div className="mt-6 rounded-xl border border-navy-border bg-navy-card">

              <div className="border-b border-navy-border p-5">

                <h2 className="text-sm font-semibold">
                  Recent learning activity
                </h2>

                <p className="mt-1 text-xs text-navy-muted">
                  Recent system and merchant actions
                  recorded in the audit trail.
                </p>

              </div>

              {auditLogs.length === 0 ? (
                <div className="p-5 text-sm text-navy-muted">
                  No audit activity has been recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-navy-border">

                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div>
                        <p className="text-sm font-medium text-navy-foreground">
                          {log.action ??
                            "System activity"}
                        </p>

                        <p className="mt-1 text-xs text-navy-muted">
                          {log.entity_type
                            ? `${log.entity_type}${
                                log.entity_id
                                  ? ` #${log.entity_id}`
                                  : ""
                              }`
                            : "System event"}
                          {log.actor
                            ? ` · ${log.actor}`
                            : ""}
                        </p>
                      </div>

                      <p className="text-xs text-navy-muted">
                        {log.created_at
                          ? new Date(
                              log.created_at
                            ).toLocaleString(
                              "en-IN"
                            )
                          : "—"}
                      </p>

                    </div>
                  ))}

                </div>
              )}

            </div>

            {/* ----------------------------------------- */}
            {/* TRANSACTION ML RESULTS */}
            {/* ----------------------------------------- */}

            <div className="mt-6 rounded-xl border border-navy-border bg-navy-card">

              <div className="border-b border-navy-border p-5">

                <h2 className="text-sm font-semibold">
                  ML transaction analysis
                </h2>

                <p className="mt-1 text-xs text-navy-muted">
                  Fraud probability and risk scores
                  generated for each transaction.
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="border-b border-navy-border text-left text-xs text-navy-muted">

                      <th className="px-5 py-3">
                        Transaction
                      </th>

                      <th className="px-5 py-3">
                        Amount
                      </th>

                      <th className="px-5 py-3">
                        Fraud probability
                      </th>

                      <th className="px-5 py-3">
                        Risk score
                      </th>

                      <th className="px-5 py-3">
                        Risk level
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {transactions.map(
                      (transaction) => {

                        const score = Number(
                          transaction.risk_score ?? 0
                        )

                        const probability =
                          Number(
                            transaction.fraud_probability ??
                              0
                          ) * 100

                        return (
                          <tr
                            key={transaction.id}
                            className="border-b border-navy-border/60 last:border-0"
                          >

                            <td className="px-5 py-4 font-medium">
                              TXN-
                              {String(
                                transaction.id
                              ).padStart(3, "0")}
                            </td>

                            <td className="px-5 py-4">
                              ₹
                              {Number(
                                transaction.transaction_amount ??
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {probability.toFixed(
                                2
                              )}
                              %
                            </td>

                            <td className="px-5 py-4">
                              {score}
                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={
                                  score >= 71
                                    ? "text-risk-high"
                                    : score >= 31
                                      ? "text-risk-med"
                                      : "text-risk-low"
                                }
                              >
                                {transaction.risk_level ??
                                  (score >= 71
                                    ? "High"
                                    : score >= 31
                                      ? "Medium"
                                      : "Low")}
                              </span>

                            </td>

                          </tr>
                        )
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </>
        )}

      </div>
    </main>
  )
}