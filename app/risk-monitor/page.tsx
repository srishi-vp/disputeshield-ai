"use client"

import Link from "next/link"
import { RiskMonitorTable } from "@/components/dashboard/risk-monitor-table"

export default function RiskMonitorPage() {
  return (
    <main className="min-h-screen bg-navy px-6 py-8 text-navy-foreground">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex rounded-lg border border-navy-border px-3 py-2 text-sm text-navy-muted transition-colors hover:bg-white/5 hover:text-navy-foreground"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Risk Monitor</h1>
          <p className="mt-1 text-sm text-navy-muted">
            Monitor payment transactions and identify high-risk activity.
          </p>
        </div>

        <RiskMonitorTable />
      </div>
    </main>
  )
}