"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Transaction = {
  id: number
  transaction_amount: number | null
  fraud_probability: number | null
  risk_score: number | null
  risk_level: string | null
}

type Dispute = {
  transaction_id: string
  dispute_type: string | null
  amount: number | null
  status: string | null
  opened_at: string | null
  due_date: string | null
}

export function StatCards() {
  const [totalPayments, setTotalPayments] = useState(0)
  const [highRiskTransactions, setHighRiskTransactions] = useState(0)
  const [activeDisputes, setActiveDisputes] = useState(0)
  const [disputeWinRate, setDisputeWinRate] = useState(0)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        // =========================================
        // TRANSACTIONS
        // =========================================

        const {
          data: transactionData,
          error: transactionError,
        } = await supabase
          .from("transactions")
          .select(`
            id,
            transaction_amount,
            fraud_probability,
            risk_score,
            risk_level
          `)

        console.log(
          "STAT CARDS TRANSACTIONS:",
          transactionData
        )

        console.log(
          "STAT CARDS TRANSACTION ERROR:",
          transactionError
        )

        if (transactionError) {
          console.error(
            "FAILED TO LOAD TRANSACTIONS:",
            transactionError
          )
        }

        const transactions =
          (transactionData ?? []) as Transaction[]

        // =========================================
        // TOTAL PAYMENTS
        // =========================================

        const total = transactions.reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.transaction_amount ?? 0
            ),
          0
        )

        // =========================================
        // HIGH-RISK TRANSACTIONS
        // =========================================

        const highRisk =
          transactions.filter(
            (transaction) =>
              Number(
                transaction.risk_score ?? 0
              ) >= 71
          ).length

        console.log(
          "SAVED HIGH-RISK TRANSACTIONS:",
          highRisk
        )

        // =========================================
        // DISPUTES
        // =========================================

        const {
          data: disputeData,
          error: disputeError,
        } = await supabase
          .from("disputes")
          .select(`
            transaction_id,
            dispute_type,
            amount,
            status,
            opened_at,
            due_date
          `)

        console.log(
          "STAT CARDS DISPUTES:",
          disputeData
        )

        console.log(
          "STAT CARDS DISPUTE ERROR:",
          disputeError
        )

        if (disputeError) {
          console.error(
            "FAILED TO LOAD DISPUTES:",
            disputeError
          )
        }

        const disputes =
          (disputeData ?? []) as Dispute[]

        // =========================================
        // ACTIVE DISPUTES
        // =========================================
        //
        // Active = Evidence due + Submitted
        //
        // Won and Lost are completed.
        // =========================================

        const activeCount =
          disputes.filter((dispute) => {
            const status =
              dispute.status
                ?.toLowerCase()
                .trim()

            return (
              status === "evidence due" ||
              status === "submitted" ||
              status === "under review" ||
              status === "action required"
            )
          }).length

        // =========================================
        // DISPUTE WIN RATE
        // =========================================
        //
        // Win Rate =
        // Won / (Won + Lost)
        //
        // We don't include active disputes
        // in the calculation.
        // =========================================

        const wonCount =
          disputes.filter(
            (dispute) =>
              dispute.status
                ?.toLowerCase()
                .trim() === "won"
          ).length

        const lostCount =
          disputes.filter(
            (dispute) =>
              dispute.status
                ?.toLowerCase()
                .trim() === "lost"
          ).length

        const completedDisputes =
          wonCount + lostCount

        const winRate =
          completedDisputes > 0
            ? Math.round(
                (wonCount /
                  completedDisputes) *
                  100
              )
            : 0

        console.log(
          "DISPUTE STATISTICS:",
          {
            activeCount,
            wonCount,
            lostCount,
            completedDisputes,
            winRate,
          }
        )

        // =========================================
        // UPDATE DASHBOARD
        // =========================================

        setTotalPayments(total)
        setHighRiskTransactions(highRisk)
        setActiveDisputes(activeCount)
        setDisputeWinRate(winRate)

        setLoading(false)
      } catch (error) {
        console.error(
          "STAT CARDS FAILED:",
          error
        )

        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const stats = [
    {
      key: "total-payments",
      label: "Total Payments",
      value: loading
        ? "Loading..."
        : `₹${totalPayments.toLocaleString(
            "en-IN"
          )}`,
      sublabel: loading
        ? "Loading"
        : totalPayments > 0
          ? "Real transaction data"
          : "No transactions",
    },

    {
      key: "high-risk",
      label: "High-Risk Transactions",
      value: loading
        ? "Loading..."
        : highRiskTransactions.toString(),
      sublabel: "ML risk score 71–100",
    },

    {
      key: "active-disputes",
      label: "Active Disputes",
      value: loading
        ? "Loading..."
        : activeDisputes.toString(),
      sublabel:
        activeDisputes === 1
          ? "1 dispute needs attention"
          : `${activeDisputes} disputes need attention`,
    },

    {
      key: "dispute-win-rate",
      label: "Dispute Win Rate",
      value: loading
        ? "Loading..."
        : `${disputeWinRate}%`,
      sublabel: "Won vs. lost disputes",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className="rounded-xl border border-navy-border bg-navy-card p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-navy-muted">
              {stat.label}
            </p>

            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                "bg-risk-low/15 text-risk-low"
              )}
            >
              <ArrowUpRight className="size-3" />
              Live
            </span>
          </div>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-navy-foreground">
            {stat.value}
          </p>

          <p className="mt-1.5 text-xs text-navy-muted">
            {stat.sublabel}
          </p>
        </div>
      ))}
    </div>
  )
}