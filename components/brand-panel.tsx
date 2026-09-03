import { DisputeShieldLogo } from "@/components/dispute-shield-logo"

const stats = [
  { value: "99.2%", label: "Fraud caught pre-settlement" },
  { value: "3.5x", label: "Faster dispute responses" },
  { value: "₹40Cr+", label: "Merchant volume protected" },
]

const capabilities = [
  "Real-time risk scoring on every transaction",
  "Auto-drafted, evidence-backed dispute responses",
  "Chargeback alerts before they become losses",
]

export function BrandPanel() {
  return (
    <section className="relative flex flex-col justify-between overflow-hidden bg-navy p-10 text-navy-foreground lg:p-14">
      {/* subtle grid + glow, purposeful security texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-risk/20 blur-3xl"
      />

      <div className="relative flex items-center justify-between">
        <DisputeShieldLogo tone="light" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-border px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-navy-muted">
          <span className="size-1.5 rounded-full bg-risk" />
          Risk engine live
        </span>
      </div>

      <div className="relative max-w-md py-14">
        <h1 className="text-balance text-3xl font-semibold leading-[1.15] tracking-tight lg:text-[2.6rem]">
          Protect every payment.
          <br />
          <span className="text-risk">Resolve</span> every dispute.
        </h1>
        <p className="mt-5 text-pretty text-[15px] leading-relaxed text-navy-muted">
          DisputeShield AI detects risky transactions in real time and helps merchants respond to payment disputes with
          evidence-backed, automated replies — so you recover more revenue and lose less to fraud.
        </p>

        <ul className="mt-8 space-y-3">
          {capabilities.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-navy-foreground/90">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-risk/15 text-risk">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <dl className="relative grid grid-cols-3 gap-6 border-t border-navy-border pt-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <span className="block text-xl font-semibold tracking-tight lg:text-2xl">{stat.value}</span>
              <span className="mt-1 block text-xs leading-snug text-navy-muted">{stat.label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
