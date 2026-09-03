import { cn } from "@/lib/utils"

interface DisputeShieldLogoProps {
  className?: string
  /** visual tone: 'light' for dark backgrounds, 'dark' for light backgrounds */
  tone?: "light" | "dark"
}

export function DisputeShieldLogo({ className, tone = "dark" }: DisputeShieldLogoProps) {
  const isLight = tone === "light"
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          isLight ? "bg-risk/15 text-risk" : "bg-primary text-primary-foreground",
        )}
        aria-hidden="true"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </span>
      <span
        className={cn(
          "text-[17px] font-semibold leading-none tracking-tight",
          isLight ? "text-navy-foreground" : "text-foreground",
        )}
      >
        DisputeShield
        <span className="text-risk"> AI</span>
      </span>
    </div>
  )
}
