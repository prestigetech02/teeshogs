import { NextResponse } from "next/server"
import { fulfillPaidOrder } from "@/lib/orders"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference")?.trim()

  if (!reference) {
    return NextResponse.json({ error: "Missing payment reference" }, { status: 400 })
  }

  try {
    const order = await fulfillPaidOrder(reference)
    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        total: order.total,
        shippingFee: order.shipping_fee,
        fezOrderNo: order.fez_order_no,
        email: order.email,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify payment"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
