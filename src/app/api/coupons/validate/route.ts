import { NextResponse } from "next/server"
import { z } from "zod"
import {
  normalizeCouponCode,
  validateCouponForSubtotal,
  type Coupon,
} from "@/lib/coupons"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const bodySchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().nonnegative(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid coupon request" }, { status: 400 })
    }

    const code = normalizeCouponCode(parsed.data.code)
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from("coupons")
      .select("*")
      .eq("code", code)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = validateCouponForSubtotal(data as Coupon | null, parsed.data.subtotal)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      code: result.coupon.code,
      couponId: result.coupon.id,
      discountType: result.coupon.discount_type,
      discountValue: result.coupon.discount_value,
      discountAmount: result.discountAmount,
      message: result.message,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not validate coupon"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
