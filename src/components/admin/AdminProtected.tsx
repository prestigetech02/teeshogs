import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { requireAdminSession } from "@/lib/admin"
import { AdminShell } from "@/components/admin/AdminShell"

export async function AdminProtected({ children }: { children: ReactNode }) {
  const session = await requireAdminSession()

  if (!session) {
    redirect("/admin/login")
  }

  return <AdminShell email={session.email} name={session.profile.full_name}>{children}</AdminShell>
}
