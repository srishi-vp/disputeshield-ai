"use client"

import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { DisputeShieldLogo } from "@/components/dispute-shield-logo"
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldAlert,
  Gavel,
  FolderLock,
  BarChart3,
  Settings,
  X,
} from "lucide-react"

const nav = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transactions", icon: ArrowLeftRight, href: "/transactions" },
  { label: "Risk Monitor", icon: ShieldAlert, href: "/risk-monitor" },
  { label: "Disputes", icon: Gavel, href: "/disputes", badge: 17 },
  { label: "Evidence Center", icon: FolderLock, href: "/evidence-center" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

const workflow = ["Predict", "Prevent", "Fight", "Learn"]

export function DashboardSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
    const pathname = usePathname()
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-navy-border bg-navy transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-navy-border px-5">
          <DisputeShieldLogo tone="light" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-navy-muted hover:text-navy-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                   ? "bg-risk/15 text-navy-foreground ring-1 ring-inset ring-risk/25"
                    : "text-navy-muted hover:bg-white/5 hover:text-navy-foreground"
                 )}
                 >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0",
                    pathname === item.href
                     ? "text-risk"
                     : "text-navy-muted group-hover:text-navy-foreground"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-risk/20 px-2 py-0.5 text-[11px] font-semibold text-risk">
                    {item.badge}
                  </span>
                ) : null}
              </a>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-navy-border p-4">
          <p className="mb-3 px-1 text-[11px] font-medium uppercase tracking-wider text-navy-muted">
            Protection workflow
          </p>
          <ol className="flex items-center gap-1.5">
            {workflow.map((step, i) => (
              <li key={step} className="flex items-center gap-1.5">
                <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-navy-foreground">
                  {step}
                </span>
                {i < workflow.length - 1 && (
                  <span className="text-navy-muted" aria-hidden="true">
                    ›
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </>
  )
}
