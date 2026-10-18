import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { ShippingZone } from "@/lib/shipping-zones"

export async function GET() {
  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from("shipping_zones")
      .select("id, name, fee, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const zones = ((data as ShippingZone[] | null) ?? []).map((zone) => ({
      id: zone.id,
      name: zone.name,
      fee: Number(zone.fee),
      sort_order: Number(zone.sort_order) || 0,
    }))

    return NextResponse.json({ zones })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load shipping zones"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
