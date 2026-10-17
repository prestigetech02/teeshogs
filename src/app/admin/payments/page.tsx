import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  getPaystackPublicKeyPreview,
  isPaystackTestMode,
  type PaymentRow,
} from "@/lib/payments"
import { isPaystackConfigured } from "@/lib/paystack"
import { absoluteUrl } from "@/lib/seo"
import { AdminPaymentsTable } from "@/components/admin/AdminPaymentsTable"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Payments | Teeshogs Admin",
}

export default async function AdminPaymentsPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, customer_name, total, currency, status, paystack_reference, paid_at, created_at, payment_channel, payment_method, paystack_fees, paystack_status, paystack_paid_amount, discount_amount"
    )
    .not("paystack_reference", "is", null)
    .order("created_at", { ascending: false })
    .limit(300)

  const payments = (data as PaymentRow[] | null) ?? []
  const configured = isPaystackConfigured()
  const webhookUrl = absoluteUrl("/api/paystack/webhook")
  const publicKey = getPaystackPublicKeyPreview()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Commerce</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paystack checkout transactions linked to Teeshogs orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={configured ? "outline" : "destructive"}>
            {configured ? "Paystack connected" : "Paystack not configured"}
          </Badge>
          {configured ? (
            <Badge variant="secondary">
              {isPaystackTestMode() ? "Test mode" : "Live mode"}
            </Badge>
          ) : null}
        </div>
      </div>

      <section className="rounded-lg border p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Gateway
        </h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Public key</dt>
            <dd className="font-mono text-xs">{publicKey || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Webhook URL</dt>
            <dd className="break-all font-mono text-xs">{webhookUrl}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Register the webhook in Paystack → Settings → API Keys & Webhooks for
          charge.success events.
        </p>
      </section>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load payments. Run the payments migration if columns are missing. (
          {error.message})
        </p>
      ) : (
        <AdminPaymentsTable payments={payments} />
      )}
    </div>
  )
}
