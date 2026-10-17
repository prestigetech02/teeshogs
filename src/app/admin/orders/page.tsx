import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AdminOrder } from "@/lib/admin-orders"
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable"

export const metadata: Metadata = {
  title: "Orders | Teeshogs Admin",
}

export default async function AdminOrdersPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, phone, customer_name, address_line1, address_line2, city, state, postal_code, subtotal, shipping_fee, total, currency, status, paystack_reference, fez_order_no, fez_status, paid_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100)

  const orders = (data || []) as AdminOrder[]

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Commerce</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paystack payments and Fez deliveries for Teeshogs checkout.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load orders. Apply the orders migration, then refresh. ({error.message})
        </p>
      ) : (
        <AdminOrdersTable orders={orders} />
      )}
    </div>
  )
}



