import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Dashboard — DisputeShield AI",
  description:
    "Merchant dashboard for payment risk and dispute management. Predict, prevent, fight, and learn from disputes.",
}

export default function DashboardPage() {
  return <DashboardShell />
}
