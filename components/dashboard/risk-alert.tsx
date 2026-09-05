"use client"

import { TriangleAlert } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { highRiskCount } from "@/lib/dashboard-data"

export function RiskAlert() {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-risk/30 bg-risk/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-risk/20 text-risk"
          aria-hidden="true"
        >
          <TriangleAlert className="size-5" />
        </span>

        <div>
          <p className="text-base font-semibold text-navy-foreground">
            {highRiskCount} transactions require attention
          </p>

          <p className="mt-0.5 text-sm text-navy-muted">
           Risk activity detected in the latest transaction review. Review these transactions and
           take preventive action before settlement.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/risk-monitor")}
          className="rounded-lg bg-risk px-4 py-2 text-sm font-semibold text-risk-foreground transition-colors hover:bg-risk/90"
        >
          Review now
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg border border-navy-border px-4 py-2 text-sm font-medium text-navy-foreground transition-colors hover:bg-white/5"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}