"use client"

import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { reconcilePayment } from "@/app/admin/payments/actions"
import {
  paymentStatusLabel,
  paymentStatusVariant,
  type PaymentRow,
} from "@/lib/payments"
import { formatNGN } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function AdminPaymentDetail({ payment }: { payment: PaymentRow }) {
  const [pending, startTransition] = useTransition()

  const onReconcile = () => {
    startTransition(async () => {
      const result = await reconcilePayment(payment.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(result.message)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={paymentStatusVariant(payment.status)}>
            {paymentStatusLabel(payment.status)}
          </Badge>
          {payment.paystack_status ? (
            <Badge variant="outline" className="capitalize">
              Paystack: {payment.paystack_status}
            </Badge>
          ) : null}
        </div>
        <Button type="button" onClick={onReconcile} disabled={pending || !payment.paystack_reference}>
          <RefreshCw className={`mr-2 size-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Reconciling…" : "Verify with Paystack"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Transaction</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Order</dt>
              <dd>
                <Link
                  href={`/admin/orders/${payment.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {payment.order_number}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-mono text-xs">{payment.paystack_reference || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Channel</dt>
              <dd className="capitalize">{payment.payment_channel || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Method</dt>
              <dd className="capitalize">{payment.payment_method || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Paid at</dt>
              <dd>
                {payment.paid_at
                  ? new Date(payment.paid_at).toLocaleString("en-NG")
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(payment.created_at).toLocaleString("en-NG")}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 rounded-lg border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Amounts</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Order total</dt>
              <dd className="font-medium">{formatNGN(Number(payment.total))}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Paystack charged</dt>
              <dd>
                {payment.paystack_paid_amount != null
                  ? formatNGN(Number(payment.paystack_paid_amount))
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Paystack fees</dt>
              <dd>
                {payment.paystack_fees != null
                  ? formatNGN(Number(payment.paystack_fees))
                  : "—"}
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Customer</dt>
              <dd className="text-right">
                <p className="font-medium">{payment.customer_name}</p>
                <p className="text-xs text-muted-foreground">{payment.email}</p>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <p className="text-xs text-muted-foreground">
        “Verify with Paystack” re-checks the transaction, updates payment metadata, and fulfills
        the order if payment succeeded (stock, Fez, emails) without double-charging.
      </p>
    </div>
  )
}
