"use client"

import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Dispute = {
  id: number
  transaction_id: string
  dispute_type: string
  amount: number
  status: string
  opened_at: string
  due_date: string | null
}

function formatCurrency(amount: number) {
  return `₹${Number(amount).toLocaleString("en-IN")}`
}

const stageStyles: Record<string, string> = {
  "Evidence due": "bg-risk-high/15 text-risk-high",
  Submitted: "bg-risk-med/15 text-risk-med",
  Won: "bg-risk-low/15 text-risk-low",
  Lost: "bg-white/10 text-navy-muted",
}

export function RecentDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDisputes() {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .order("opened_at", { ascending: false })

      console.log("RECENT DISPUTES DATA:", data)
      console.log("RECENT DISPUTES ERROR:", error)

      setDisputes(data ?? [])
      setLoading(false)
    }

    loadDisputes()
  }, [])

  return (
    <div className="flex h-full flex-col rounded-xl border border-navy-border bg-navy-card p-5">
      
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-navy-foreground">
            Recent disputes
          </h2>

          <p className="text-xs text-navy-muted">
            Fight &amp; resolve chargebacks
          </p>
        </div>

        <a
          href="#"
          className="text-xs font-medium text-risk hover:underline"
        >
          View all
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-navy-muted">
          Loading disputes...
        </p>
      ) : disputes.length === 0 ? (
        <p className="text-sm text-navy-muted">
          No disputes found.
        </p>
      ) : (
        <ul className="flex-1 space-y-3">
          {disputes.map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-navy-border bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-foreground">
                    {d.dispute_type}
                  </p>

                  <p className="mt-0.5 font-mono text-[11px] text-navy-muted">
                    {d.transaction_id}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    stageStyles[d.status] ||
                    "bg-white/10 text-navy-muted"
                  }`}
                >
                  {d.status}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">

                <span className="text-sm font-semibold tabular-nums text-navy-foreground">
                  {formatCurrency(d.amount)}
                </span>

                {d.status === "Evidence due" ? (
                  <span className="text-[11px] font-medium text-risk-high">
                    Evidence due
                  </span>
                ) : (
                  <span className="text-[11px] text-navy-muted">
                    {d.opened_at
                      ? new Date(d.opened_at).toLocaleDateString("en-IN")
                      : ""}
                  </span>
                )}

              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-navy-border py-2.5 text-sm font-medium text-navy-foreground transition-colors hover:border-risk/40 hover:bg-white/5"
      >
        <FileText className="size-4 text-risk" />
        Open Evidence Center
      </button>
    </div>
  )
}