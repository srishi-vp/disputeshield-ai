"use client"

import { useState } from "react"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { StatCards } from "./stat-cards"
import { RiskAlert } from "./risk-alert"
import { RiskTrendChart } from "./risk-trend-chart"
import { RiskMonitorTable } from "./risk-monitor-table"
import { RecentDisputes } from "./recent-disputes"

export function DashboardShell() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-navy text-navy-foreground">
      <DashboardSidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onOpenNav={() => setNavOpen(true)} />

        <main className="flex-1 space-y-6 px-4 py-6 lg:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-foreground">
              Payment risk overview
            </h1>
            <p className="mt-1 text-sm text-navy-muted">
              Predict, prevent, and fight disputes across your payment flow.{" "}
              <span className="text-navy-muted/80">
              Figures are based on live transaction and ML risk data.
              </span>
            </p>
          </div>

          <RiskAlert />

          <StatCards />

          <RiskTrendChart />

          {/* Monitor + disputes */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <RiskMonitorTable />
            </div>
            <div className="xl:col-span-1">
              <RecentDisputes />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
