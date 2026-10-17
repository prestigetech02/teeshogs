import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireAdminSession } from "@/lib/admin"
import { AdminProfileForm } from "@/components/admin/AdminProfileForm"

export const metadata: Metadata = {
  title: "Profile | Teeshogs Admin",
}

export default async function AdminProfilePage() {
  const session = await requireAdminSession()
  if (!session) redirect("/admin/login")

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your admin identity for Teeshogs catalog operations.
        </p>
      </div>
      <AdminProfileForm profile={session.profile} />
    </div>
  )
}
