import { NextResponse } from "next/server"
import { verifyPaystackWebhookSignature } from "@/lib/paystack"
import { fulfillPaidOrder } from "@/lib/orders"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { event?: string; data?: { reference?: string } }
  try {
    event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (event.event === "charge.success") {
    const reference = event.data?.reference
    if (reference) {
      try {
        await fulfillPaidOrder(reference)
      } catch (error) {
        console.error("Paystack webhook fulfill error:", error)
        // Acknowledge to avoid endless retries on permanent failures;
        // verify endpoint / admin can reconcile.
      }
    }
  }

  return NextResponse.json({ received: true })
}
