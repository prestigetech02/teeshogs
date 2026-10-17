import { Suspense } from "react"
import type { Metadata } from "next"
import { AdminLoginForm } from "@/components/admin/AdminLoginForm"

export const metadata: Metadata = {
  title: "Admin Sign In | Teeshogs",
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Loading admin sign in...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
