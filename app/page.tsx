import { BrandPanel } from "@/components/brand-panel"
import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <main className="grid min-h-svh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <div className="hidden lg:block">
        <BrandPanel />
      </div>
      <LoginForm />
    </main>
  )
}
