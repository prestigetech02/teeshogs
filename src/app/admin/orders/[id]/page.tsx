import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AdminOrder, AdminOrderItem } from "@/lib/admin-orders"
import { orderStatusLabel } from "@/lib/admin-orders"
import { formatNGN } from "@/lib/money"
import { shippingMethodLabel } from "@/lib/shipping-zones"
import { AdminOrderStatusForm } from "@/components/admin/AdminOrderStatusForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Order ${id.slice(0, 8)} | Teeshogs Admin`,
  }
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: order, error }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
  ])

  if (error || !order) notFound()

  const typed = order as AdminOrder
  const lineItems = (items || []) as AdminOrderItem[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href="/admin/orders">
              <ArrowLeft className="mr-1 size-4" />
              Orders
            </Link>
          </Button>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Order</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{typed.order_number}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="capitalize">{orderStatusLabel(typed.status)}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(typed.created_at).toLocaleString("en-NG")}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{formatNGN(Number(typed.total))}</p>
        </div>
      </div>

      <AdminOrderStatusForm orderId={typed.id} currentStatus={typed.status} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Customer</h2>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{typed.customer_name}</p>
            <p className="text-muted-foreground">{typed.email}</p>
            <p className="text-muted-foreground">{typed.phone}</p>
          </div>
          <Separator />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Shipping address
          </h3>
          <div className="text-sm leading-relaxed">
            <p>{typed.address_line1}</p>
            {typed.address_line2 && <p>{typed.address_line2}</p>}
            <p>
              {typed.city}, {typed.state}
              {typed.postal_code ? ` ${typed.postal_code}` : ""}
            </p>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest">Payment & delivery</h2>
            {typed.paystack_reference ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/payments/${typed.id}`}>Open payment</Link>
              </Button>
            ) : null}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Paystack ref</dt>
              <dd className="font-mono text-xs">{typed.paystack_reference || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Channel</dt>
              <dd className="capitalize">
                {typed.payment_channel || typed.payment_method || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Paid at</dt>
              <dd>
                {typed.paid_at ? new Date(typed.paid_at).toLocaleString("en-NG") : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>
                {shippingMethodLabel(typed.shipping_method)}
                {typed.shipping_zone_name ? ` · ${typed.shipping_zone_name}` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping fee</dt>
              <dd>{formatNGN(Number(typed.shipping_fee))}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Fez order</dt>
              <dd>{typed.fez_order_no || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Fez status</dt>
              <dd>{typed.fez_status || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatNGN(Number(typed.subtotal))}</dd>
            </div>
            {Number(typed.discount_amount || 0) > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Discount{typed.coupon_code ? ` (${typed.coupon_code})` : ""}
                </dt>
                <dd className="text-emerald-700 dark:text-emerald-400">
                  −{formatNGN(Number(typed.discount_amount || 0))}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{formatNGN(Number(typed.shipping_fee))}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border">
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Items</h2>
        </div>
        <ul className="divide-y">
          {lineItems.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[item.size, item.color, item.sku].filter(Boolean).join(" · ") || "—"}
                  {" · "}Qty {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatNGN(Number(item.line_total))}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNGN(Number(item.unit_price))} each
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
