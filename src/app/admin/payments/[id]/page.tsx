import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { PaymentRow } from "@/lib/payments"
import { AdminPaymentDetail } from "@/components/admin/AdminPaymentDetail"
import { Button } from "@/components/ui/button"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Payment ${id.slice(0, 8)} | Teeshogs Admin` }
}

export default async function AdminPaymentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, customer_name, total, currency, status, paystack_reference, paystack_access_code, paid_at, created_at, payment_channel, payment_method, paystack_fees, paystack_status, paystack_paid_amount, discount_amount"
    )
    .eq("id", id)
    .maybeSingle()

  if (error || !data) notFound()

  const payment = data as PaymentRow

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/payments">
            <ArrowLeft className="mr-1 size-4" />
            Payments
          </Link>
        </Button>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Payment</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{payment.order_number}</h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          {payment.paystack_reference || "No Paystack reference"}
        </p>
      </div>

      <AdminPaymentDetail payment={payment} />
    </div>
  )
}
