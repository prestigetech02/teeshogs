import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createFezDeliveryOrder } from "@/lib/fez"
import {
  paymentMethodFromVerification,
  verifyPaystackTransaction,
} from "@/lib/paystack"
import { fromKobo, toKobo } from "@/lib/money"
import {
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
} from "@/lib/email/notifications"

export type OrderRow = {
  id: string
  order_number: string
  email: string
  phone: string
  customer_name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string | null
  subtotal: number
  shipping_fee: number
  discount_amount: number
  coupon_id: string | null
  coupon_code: string | null
  total: number
  currency: string
  status: string
  paystack_reference: string | null
  payment_channel: string | null
  payment_method: string | null
  paystack_fees: number | null
  paystack_status: string | null
  paystack_paid_amount: number | null
  fez_order_no: string | null
  fez_batch_id: string | null
  fez_status: string | null
  shipping_method: "fez" | "manual" | string | null
  shipping_zone_id: string | null
  shipping_zone_name: string | null
  paid_at: string | null
}

export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `TSH-${stamp}-${rand}`
}

export function generatePaystackReference(orderNumber: string) {
  return `${orderNumber}-${Math.random().toString(36).slice(2, 8)}`.toLowerCase()
}

async function decrementStockForOrder(orderId: string) {
  const admin = createSupabaseAdminClient()
  const { data: items, error } = await admin
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", orderId)

  if (error) throw new Error(error.message)
  if (!items?.length) return

  for (const item of items) {
    const qty = Number(item.quantity)
    if (item.variant_id) {
      const { data: variant } = await admin
        .from("product_variants")
        .select("stock")
        .eq("id", item.variant_id)
        .maybeSingle()
      if (!variant) continue
      const next = Math.max(0, Number(variant.stock) - qty)
      await admin.from("product_variants").update({ stock: next }).eq("id", item.variant_id)
    } else if (item.product_id) {
      const { data: product } = await admin
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .maybeSingle()
      if (!product) continue
      const next = Math.max(0, Number(product.stock) - qty)
      await admin.from("products").update({ stock: next }).eq("id", item.product_id)
    }
  }
}

function usesManualShipping(order: Pick<OrderRow, "shipping_method">) {
  return order.shipping_method === "manual"
}

async function markManualOrderProcessing(order: OrderRow) {
  const admin = createSupabaseAdminClient()
  await admin
    .from("orders")
    .update({
      status: "processing",
      fez_status: "Manual",
    })
    .eq("id", order.id)
    .in("status", ["paid", "pending_payment", "processing"])
}

async function createFezShipmentForOrder(order: OrderRow) {
  if (usesManualShipping(order)) {
    await markManualOrderProcessing(order)
    return { orderNo: null as string | null, skipped: true as const }
  }

  if (order.fez_order_no) {
    return { orderNo: order.fez_order_no, skipped: true as const }
  }

  const batchId = order.fez_batch_id || order.order_number
  const address = [order.address_line1, order.address_line2, order.city]
    .filter(Boolean)
    .join(", ")

  const result = await createFezDeliveryOrder({
    recipientName: order.customer_name,
    recipientPhone: order.phone,
    recipientAddress: address,
    recipientState: order.state,
    uniqueID: order.order_number,
    BatchID: batchId,
    valueOfItem: String(Math.round(Number(order.subtotal))),
    description: `Teeshogs order ${order.order_number}`,
  })

  const admin = createSupabaseAdminClient()
  await admin
    .from("orders")
    .update({
      fez_order_no: result.orderNo,
      fez_batch_id: batchId,
      fez_status: result.orderNo ? "Created" : "Pending",
      status: "processing",
    })
    .eq("id", order.id)

  return { orderNo: result.orderNo, skipped: false as const }
}

/**
 * Idempotent: verify Paystack payment, mark paid, decrement stock, create Fez delivery.
 */
export async function fulfillPaidOrder(reference: string) {
  const admin = createSupabaseAdminClient()
  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("paystack_reference", reference)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!order) throw new Error("Order not found for this payment reference")

  const typed = order as OrderRow

  if (typed.status === "paid" || typed.status === "processing" || typed.status === "shipped" || typed.status === "delivered") {
    // Still try Fez if missing (manual zones skip Fez).
    if (!usesManualShipping(typed) && !typed.fez_order_no) {
      try {
        await createFezShipmentForOrder(typed)
      } catch {
        // Payment already succeeded; Fez can be retried later.
      }
    } else if (usesManualShipping(typed) && typed.status === "paid") {
      try {
        await markManualOrderProcessing(typed)
      } catch {
        // Payment already succeeded; admin can update status later.
      }
    }
    const { data: refreshed } = await admin
      .from("orders")
      .select("*")
      .eq("id", typed.id)
      .single()
    return refreshed as OrderRow
  }

  const verification = await verifyPaystackTransaction(reference)
  const paymentMeta = {
    paystack_status: verification.status,
    payment_channel: verification.channel || null,
    payment_method: paymentMethodFromVerification(verification),
    paystack_fees:
      verification.fees == null ? null : fromKobo(Number(verification.fees)),
    paystack_paid_amount: fromKobo(Number(verification.amount)),
  }

  if (verification.status !== "success") {
    await admin
      .from("orders")
      .update({ status: "failed", ...paymentMeta })
      .eq("id", typed.id)
    throw new Error("Payment was not successful")
  }

  const expectedKobo = toKobo(Number(typed.total))
  if (Number(verification.amount) !== expectedKobo) {
    throw new Error(
      `Payment amount mismatch (expected ${expectedKobo} kobo, got ${verification.amount})`
    )
  }

  if (verification.currency && verification.currency !== "NGN") {
    throw new Error(`Unexpected payment currency: ${verification.currency}`)
  }

  // Mark paid before stock/Fez so retries are safe.
  const { data: paidOrder, error: payError } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: verification.paid_at || new Date().toISOString(),
      ...paymentMeta,
    })
    .eq("id", typed.id)
    .eq("status", "pending_payment")
    .select("*")
    .maybeSingle()

  // If another worker already moved it, reload
  if (payError) throw new Error(payError.message)

  const current = (paidOrder || typed) as OrderRow
  if (paidOrder) {
    await decrementStockForOrder(typed.id)
    if (paidOrder.coupon_id) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("used_count")
        .eq("id", paidOrder.coupon_id)
        .maybeSingle()
      if (coupon) {
        await admin
          .from("coupons")
          .update({ used_count: Number(coupon.used_count || 0) + 1 })
          .eq("id", paidOrder.coupon_id)
      }
    }
  }

  try {
    await createFezShipmentForOrder({
      ...current,
      status: "paid",
      paid_at: current.paid_at,
    })
  } catch (fezError) {
    // Keep paid; admin can retry shipping.
    console.error("Fez shipment failed:", fezError)
  }

  const { data: finalOrder } = await admin.from("orders").select("*").eq("id", typed.id).single()
  const result = finalOrder as OrderRow

  // Only email on the first successful payment transition (avoid webhook + verify duplicates).
  if (paidOrder) {
    await Promise.all([
      sendOrderConfirmationEmail(result),
      sendAdminNewOrderEmail(result),
    ])
  }

  return result
}

export function assertAmountMatchesKobo(totalNgn: number, amountKobo: number) {
  return toKobo(totalNgn) === amountKobo
}

export { fromKobo }
