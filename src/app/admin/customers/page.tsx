import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  buildCustomerList,
  type CustomerOrderRow,
  type CustomerProfile,
} from "@/lib/customers"
import { AdminCustomersTable } from "@/components/admin/AdminCustomersTable"

export const metadata: Metadata = {
  title: "Customers | Teeshogs Admin",
}

export default async function AdminCustomersPage() {
  const supabase = await createSupabaseServerClient()

  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, notes, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select(
          "id, user_id, email, phone, customer_name, status, total, created_at, paid_at"
        )
        .order("created_at", { ascending: false })
        .limit(2000),
    ])

  const customers = buildCustomerList(
    ((profiles as CustomerProfile[] | null) ?? []).map((profile) => ({
      ...profile,
      notes: profile.notes ?? "",
    })),
    (orders as CustomerOrderRow[] | null) ?? []
  )

  const error = profilesError || ordersError

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">People</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registered accounts and guest checkout shoppers, with order history.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load customers. Run the customers migration in Supabase, then refresh. (
          {error.message})
        </p>
      ) : (
        <AdminCustomersTable customers={customers} />
      )}
    </div>
  )
}
