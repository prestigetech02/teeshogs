import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getFezDeliveryCost } from "@/lib/fez"
import { initializePaystackTransaction } from "@/lib/paystack"
import {
  generateOrderNumber,
  generatePaystackReference,
} from "@/lib/orders"
import {
  normalizeCouponCode,
  validateCouponForSubtotal,
  type Coupon,
} from "@/lib/coupons"
import { qualifiesForFreeShipping, toKobo } from "@/lib/money"
import { absoluteUrl } from "@/lib/seo"

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  size: z.string().trim().default(""),
  color: z.string().trim().default(""),
  quantity: z.number().int().positive().max(50),
})

const bodySchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(20),
  addressLine1: z.string().trim().min(3).max(240),
  addressLine2: z.string().trim().max(240).optional().nullable(),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(20).optional().nullable(),
  couponCode: z.string().trim().max(40).optional().nullable(),
  items: z.array(cartItemSchema).min(1).max(50),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check your checkout details.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const input = parsed.data
    const admin = createSupabaseAdminClient()
    const server = await createSupabaseServerClient()
    const {
      data: { user },
    } = await server.auth.getUser()

    const lineRows: Array<{
      product_id: string
      variant_id: string | null
      name: string
      sku: string | null
      size: string
      color: string
      unit_price: number
      quantity: number
      line_total: number
    }> = []

    let subtotal = 0

    for (const item of input.items) {
      const { data: product, error: productError } = await admin
        .from("products")
        .select("id, name, price, stock, sku, has_variants")
        .eq("id", item.productId)
        .maybeSingle()

      if (productError || !product) {
        return NextResponse.json({ error: "A product in your cart is no longer available." }, { status: 400 })
      }

      let unitPrice = Number(product.price)
      let stock = Number(product.stock)
      let sku = (product.sku as string | null) || null
      let variantId: string | null = null

      if (product.has_variants || item.variantId) {
        if (!item.variantId) {
          return NextResponse.json(
            { error: `Select options for ${product.name}.` },
            { status: 400 }
          )
        }

        const { data: variant, error: variantError } = await admin
          .from("product_variants")
          .select("id, price, stock, sku, size, color")
          .eq("id", item.variantId)
          .eq("product_id", product.id)
          .maybeSingle()

        if (variantError || !variant) {
          return NextResponse.json(
            { error: `An option for ${product.name} is unavailable.` },
            { status: 400 }
          )
        }

        unitPrice = Number(variant.price)
        stock = Number(variant.stock)
        sku = variant.sku || sku
        variantId = variant.id
      }

      if (stock < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${product.name}.` },
          { status: 400 }
        )
      }

      const lineTotal = unitPrice * item.quantity
      subtotal += lineTotal
      lineRows.push({
        product_id: product.id,
        variant_id: variantId,
        name: product.name,
        sku,
        size: item.size,
        color: item.color,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
      })
    }

    let shippingFee = 0
    let shippingQuotedAt: string | null = null

    if (!qualifiesForFreeShipping(subtotal)) {
      const quote = await getFezDeliveryCost(input.state)
      shippingFee = quote.totalCost
      shippingQuotedAt = new Date().toISOString()
    }

    let couponId: string | null = null
    let couponCode: string | null = null
    let discountAmount = 0

    if (input.couponCode?.trim()) {
      const code = normalizeCouponCode(input.couponCode)
      const { data: couponRow, error: couponError } = await admin
        .from("coupons")
        .select("*")
        .eq("code", code)
        .maybeSingle()

      if (couponError) {
        return NextResponse.json({ error: couponError.message }, { status: 500 })
      }

      const validated = validateCouponForSubtotal(couponRow as Coupon | null, subtotal)
      if (!validated.ok) {
        return NextResponse.json({ error: validated.error }, { status: 400 })
      }

      couponId = validated.coupon.id
      couponCode = validated.coupon.code
      discountAmount = validated.discountAmount
    }

    const total = Math.max(0, subtotal - discountAmount) + shippingFee
    const orderNumber = generateOrderNumber()
    const paystackReference = generatePaystackReference(orderNumber)

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user?.id ?? null,
        email: input.email.toLowerCase(),
        phone: input.phone,
        customer_name: input.customerName,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2 || null,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode || null,
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        coupon_id: couponId,
        coupon_code: couponCode,
        total,
        currency: "NGN",
        status: "pending_payment",
        paystack_reference: paystackReference,
        fez_batch_id: orderNumber,
        shipping_quoted_at: shippingQuotedAt,
      })
      .select("id, order_number, paystack_reference, total")
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message || "Could not create order." },
        { status: 500 }
      )
    }

    const { error: itemsError } = await admin.from("order_items").insert(
      lineRows.map((row) => ({
        ...row,
        order_id: order.id,
      }))
    )

    if (itemsError) {
      await admin.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    const paystack = await initializePaystackTransaction({
      email: input.email.toLowerCase(),
      amountKobo: toKobo(total),
      reference: paystackReference,
      callbackUrl: absoluteUrl(`/checkout/success?reference=${encodeURIComponent(paystackReference)}`),
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
    })

    await admin
      .from("orders")
      .update({ paystack_access_code: paystack.access_code })
      .eq("id", order.id)

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      reference: paystack.reference,
      authorizationUrl: paystack.authorization_url,
      subtotal,
      shippingFee,
      discountAmount,
      couponCode,
      total,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
