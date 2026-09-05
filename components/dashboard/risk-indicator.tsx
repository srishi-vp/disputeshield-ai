import { cn } from "@/lib/utils"
import { riskLevel, type RiskLevel } from "@/lib/dashboard-data"

const levelStyles: Record<RiskLevel, { bar: string; text: string; chip: string; label: string }> = {
  low: {
    bar: "bg-risk-low",
    text: "text-risk-low",
    chip: "bg-risk-low/15 text-risk-low ring-1 ring-inset ring-risk-low/30",
    label: "Low",
  },
  medium: {
    bar: "bg-risk-med",
    text: "text-risk-med",
    chip: "bg-risk-med/15 text-risk-med ring-1 ring-inset ring-risk-med/30",
    label: "Medium",
  },
  high: {
    bar: "bg-risk-high",
    text: "text-risk-high",
    chip: "bg-risk-high/15 text-risk-high ring-1 ring-inset ring-risk-high/30",
    label: "High",
  },
}

export function RiskScoreMeter({ score }: { score: number }) {
  const level = riskLevel(score)
  const s = levelStyles[level]
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("w-7 text-sm font-semibold tabular-nums", s.text)}>{score}</span>
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk score ${score} out of 100`}
      >
        <div className={cn("h-full rounded-full", s.bar)} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function RiskLevelChip({ score }: { score: number }) {
  const level = riskLevel(score)
  const s = levelStyles[level]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.chip,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.bar)} aria-hidden="true" />
      {s.label}
    </span>
  )
}
