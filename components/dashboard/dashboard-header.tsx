"use client"

import { useState } from "react"
import { Bell, Search, ChevronDown, Menu } from "lucide-react"

export function DashboardHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-navy-border bg-navy/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-navy/80 lg:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        className="rounded-md p-1.5 text-navy-muted hover:bg-white/5 hover:text-navy-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="hidden items-center md:flex">
        <h1 className="text-sm font-medium text-navy-foreground">Overview</h1>
        <span className="ml-3 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-navy-muted">
          Demo workspace
        </span>
      </div>

      {/* Search */}
      <div className="relative ml-auto hidden w-full max-w-xs items-center sm:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-navy-muted" />
        <input
          type="search"
          placeholder="Search transactions, disputes…"
          className="h-9 w-full rounded-lg border border-navy-border bg-white/5 pl-9 pr-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-risk/50 focus:outline-none focus:ring-2 focus:ring-risk/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:ml-3">
        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-navy-muted transition-colors hover:bg-white/5 hover:text-navy-foreground"
          aria-label="Notifications, 3 unread"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-risk/70" />
            <span className="relative inline-flex size-2 rounded-full bg-risk" />
          </span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-white/5"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span
              className="flex size-8 items-center justify-center rounded-full bg-risk/20 text-sm font-semibold text-risk"
              aria-hidden="true"
            >
              NV
            </span>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-sm font-medium text-navy-foreground">Nova Retail</span>
              <span className="block text-[11px] text-navy-muted">Merchant account</span>
            </span>
            <ChevronDown className="hidden size-4 text-navy-muted md:block" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-navy-border bg-navy-elevated shadow-xl"
            >
              <div className="border-b border-navy-border px-4 py-3">
                <p className="text-sm font-medium text-navy-foreground">Nova Retail Pvt Ltd</p>
                <p className="truncate text-xs text-navy-muted">ops@novaretail.demo</p>
              </div>
              {["Account settings", "Team & roles", "API keys", "Sign out"].map((item) => (
                <button
                  key={item}
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-2 text-left text-sm text-navy-muted transition-colors hover:bg-white/5 hover:text-navy-foreground"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
