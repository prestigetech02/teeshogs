import { NextResponse } from "next/server"
import { z } from "zod"
import { getFezDeliveryCost } from "@/lib/fez"
import { qualifiesForFreeShipping } from "@/lib/money"

const bodySchema = z.object({
  state: z.string().trim().min(1),
  subtotal: z.number().nonnegative().optional(),
  weight: z.number().positive().optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid shipping quote request" }, { status: 400 })
    }

    const { state, subtotal = 0, weight } = parsed.data

    if (qualifiesForFreeShipping(subtotal)) {
      return NextResponse.json({
        state,
        cost: 0,
        vat: 0,
        totalCost: 0,
        freeShipping: true,
      })
    }

    const quote = await getFezDeliveryCost(state, weight)
    return NextResponse.json({
      ...quote,
      freeShipping: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not quote shipping"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
