"use client"

import { useState } from "react"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [autoReview, setAutoReview] = useState(true)

  return (
    <main className="min-h-screen bg-navy px-6 py-8 text-navy-foreground">
      <a
        href="/dashboard"
        className="inline-block rounded-lg border border-navy-border px-4 py-2 text-sm text-navy-muted hover:text-navy-foreground"
      >
        ← Back to Dashboard
      </a>

      <div className="mt-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-navy-muted">
          Configure your DisputeShield protection preferences.
        </p>
      </div>

      <div className="mt-8 max-w-3xl space-y-5">
        <section className="rounded-xl border border-navy-border bg-navy-card">
          <div className="border-b border-navy-border px-5 py-4">
            <h2 className="text-sm font-semibold">Protection settings</h2>
            <p className="mt-1 text-xs text-navy-muted">
              Control how DisputeShield handles transaction risk.
            </p>
          </div>

          <div className="divide-y divide-navy-border">
            <div className="flex items-center justify-between gap-5 px-5 py-5">
              <div>
                <p className="text-sm font-medium">Automatic risk review</p>
                <p className="mt-1 text-xs text-navy-muted">
                  Automatically review transactions with elevated risk scores.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoReview(!autoReview)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  autoReview ? "bg-risk" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 size-4 rounded-full bg-white transition ${
                    autoReview ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-5 px-5 py-5">
              <div>
                <p className="text-sm font-medium">Risk notifications</p>
                <p className="mt-1 text-xs text-navy-muted">
                  Receive alerts when high-risk activity is detected.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  notifications ? "bg-risk" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 size-4 rounded-full bg-white transition ${
                    notifications ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-navy-border bg-navy-card">
          <div className="border-b border-navy-border px-5 py-4">
            <h2 className="text-sm font-semibold">Account</h2>
            <p className="mt-1 text-xs text-navy-muted">
              Basic merchant account information.
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div>
              <p className="text-xs text-navy-muted">Merchant</p>
              <p className="mt-1 text-sm font-medium">Retail Merchant</p>
            </div>

            <div>
              <p className="text-xs text-navy-muted">Environment</p>
              <p className="mt-1 text-sm font-medium">Production</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}