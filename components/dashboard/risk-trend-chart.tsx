"use client"

import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { supabase } from "@/lib/supabase"

interface RiskData {
  day: string
  avgRisk: number
}

export function RiskTrendChart() {
  const [riskData, setRiskData] = useState<RiskData[]>([])

  useEffect(() => {
    async function loadRiskTrend() {
      const { data, error } = await supabase
        .from("transactions")
        .select("transaction_time, risk_score")
        .order("transaction_time", { ascending: true })

      console.log("RISK TREND DATA:", data)
      console.log("RISK TREND ERROR:", error)

      if (error || !data) {
        setRiskData([])
        return
      }

      const formattedData = data.map((transaction) => ({
        day: new Date(transaction.transaction_time).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
          }
        ),
        avgRisk: Number(transaction.risk_score),
      }))

      setRiskData(formattedData)
    }

    loadRiskTrend()
  }, [])

  return (
    <div className="rounded-xl border border-navy-border bg-navy-card p-5">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-navy-foreground">
            Risk trend
          </h2>

          <p className="text-xs text-navy-muted">
            Transaction risk history
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-navy-muted">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full bg-risk"
              aria-hidden="true"
            />
            Avg risk
          </span>
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        {riskData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-navy-muted">
            No risk data found.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={riskData}
              margin={{
                top: 8,
                right: 8,
                left: -18,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="riskFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--risk)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--risk)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--navy-border)"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                tick={{
                  fill: "var(--navy-muted)",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                domain={[0, 100]}
                tick={{
                  fill: "var(--navy-muted)",
                  fontSize: 11,
                }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="avgRisk"
                stroke="var(--risk)"
                strokeWidth={2}
                fill="url(#riskFill)"
                dot={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}