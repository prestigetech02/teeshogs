import { NextResponse } from "next/server"
import { z } from "zod"
import { getFezDeliveryCost } from "@/lib/fez"
import { qualifiesForFreeShipping } from "@/lib/money"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const bodySchema = z.object({
  method: z.enum(["fez", "manual"]).default("fez"),
  state: z.string().trim().min(1).optional(),
  zoneId: z.string().uuid().optional().nullable(),
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

    const { method, state, zoneId, subtotal = 0, weight } = parsed.data

    if (qualifiesForFreeShipping(subtotal)) {
      return NextResponse.json({
        method,
        state: state ?? null,
        zoneId: zoneId ?? null,
        cost: 0,
        vat: 0,
        totalCost: 0,
        freeShipping: true,
      })
    }

    if (method === "manual") {
      if (!zoneId) {
        return NextResponse.json({ error: "Select a delivery zone" }, { status: 400 })
      }

      const admin = createSupabaseAdminClient()
      const { data: zone, error } = await admin
        .from("shipping_zones")
        .select("id, name, fee, is_active")
        .eq("id", zoneId)
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!zone || !zone.is_active) {
        return NextResponse.json({ error: "That delivery zone is unavailable" }, { status: 400 })
      }

      const fee = Number(zone.fee) || 0
      return NextResponse.json({
        method: "manual",
        zoneId: zone.id,
        zoneName: zone.name,
        cost: fee,
        vat: 0,
        totalCost: fee,
        freeShipping: false,
      })
    }

    if (!state) {
      return NextResponse.json({ error: "Select a state for Fez delivery" }, { status: 400 })
    }

    const quote = await getFezDeliveryCost(state, weight)
    return NextResponse.json({
      ...quote,
      method: "fez",
      state,
      freeShipping: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not quote shipping"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
