"use server"

import { revalidatePath } from "next/cache"
import {
  isOrderStatus,
  shouldNotifyCustomerOnStatus,
  type OrderStatus,
} from "@/lib/admin-orders"
import { sendOrderStatusEmail } from "@/lib/email/notifications"
import type { OrderRow } from "@/lib/orders"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type UpdateOrderStatusResult =
  | { ok: true; status: OrderStatus }
  | { ok: false; error: string }

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<UpdateOrderStatusResult> {
  if (!orderId?.trim()) {
    return { ok: false, error: "Missing order id" }
  }
  if (!isOrderStatus(status)) {
    return { ok: false, error: "Invalid status" }
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: "Not authenticated" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.role !== "admin") {
      return { ok: false, error: "Not authorized" }
    }

    const { data: existing, error: loadError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle()

    if (loadError || !existing) {
      return { ok: false, error: "Order not found" }
    }

    const previous = existing as OrderRow
    if (previous.status === status) {
      return { ok: true, status }
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("*")
      .single()

    if (updateError || !updated) {
      return { ok: false, error: updateError?.message || "Could not update status" }
    }

    const order = updated as OrderRow

    if (shouldNotifyCustomerOnStatus(status)) {
      await sendOrderStatusEmail(order)
    }

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)

    return { ok: true, status }
  } catch (error) {
    console.error("updateOrderStatus failed", error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update status",
    }
  }
}
