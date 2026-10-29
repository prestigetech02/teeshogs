import { NextResponse } from "next/server"
import { getOrderItems } from "@/lib/email/notifications"
import { fulfillPaidOrder } from "@/lib/orders"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference")?.trim()

  if (!reference) {
    return NextResponse.json({ error: "Missing payment reference" }, { status: 400 })
  }

  try {
    const order = await fulfillPaidOrder(reference)
    const items = await getOrderItems(order.id)
    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        subtotal: order.subtotal,
        discountAmount: order.discount_amount,
        couponCode: order.coupon_code,
        total: order.total,
        shippingFee: order.shipping_fee,
        shippingMethod: order.shipping_method,
        shippingZoneName: order.shipping_zone_name,
        fezOrderNo: order.fez_order_no,
        email: order.email,
        items: items.map((item) => ({
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          lineTotal: Number(item.line_total),
        })),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify payment"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
