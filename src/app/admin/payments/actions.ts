"use server"

import { revalidatePath } from "next/cache"
import { fulfillPaidOrder } from "@/lib/orders"
import {
  paymentMethodFromVerification,
  verifyPaystackTransaction,
} from "@/lib/paystack"
import { fromKobo } from "@/lib/money"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Not authorized" }
  }

  return { ok: true as const, supabase }
}

export type ReconcilePaymentResult =
  | {
      ok: true
      status: string
      message: string
      paystackStatus?: string
    }
  | { ok: false; error: string }

/** Re-verify with Paystack and fulfill the order if payment succeeded. */
export async function reconcilePayment(
  orderId: string
): Promise<ReconcilePaymentResult> {
  if (!orderId?.trim()) return { ok: false, error: "Missing order id" }

  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { data: order, error } = await auth.supabase
    .from("orders")
    .select("id, status, paystack_reference, order_number")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !order) return { ok: false, error: "Order not found" }
  if (!order.paystack_reference) {
    return { ok: false, error: "This order has no Paystack reference" }
  }

  try {
    const verification = await verifyPaystackTransaction(order.paystack_reference)
    const admin = createSupabaseAdminClient()

    // Always refresh payment metadata from Paystack.
    await admin
      .from("orders")
      .update({
        paystack_status: verification.status,
        payment_channel: verification.channel || null,
        payment_method: paymentMethodFromVerification(verification),
        paystack_fees:
          verification.fees == null ? null : fromKobo(Number(verification.fees)),
        paystack_paid_amount: fromKobo(Number(verification.amount)),
      })
      .eq("id", order.id)

    if (verification.status === "success") {
      const fulfilled = await fulfillPaidOrder(order.paystack_reference)
      revalidatePath("/admin/payments")
      revalidatePath(`/admin/payments/${order.id}`)
      revalidatePath("/admin/orders")
      revalidatePath(`/admin/orders/${order.id}`)
      return {
        ok: true,
        status: fulfilled.status,
        paystackStatus: verification.status,
        message:
          fulfilled.status === order.status
            ? `Paystack confirmed success. Order remains ${fulfilled.status}.`
            : `Payment reconciled. Order is now ${fulfilled.status}.`,
      }
    }

    if (order.status === "pending_payment") {
      await admin.from("orders").update({ status: "failed" }).eq("id", order.id)
    }

    revalidatePath("/admin/payments")
    revalidatePath(`/admin/payments/${order.id}`)
    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${order.id}`)

    return {
      ok: true,
      status: "failed",
      paystackStatus: verification.status,
      message: `Paystack status is “${verification.status}”. Order marked failed if it was still pending.`,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reconcile payment",
    }
  }
}
