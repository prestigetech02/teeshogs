import { NextResponse } from "next/server"
import { createSupabasePublicClient } from "@/lib/supabase/public"
import type { ShippingZone } from "@/lib/shipping-zones"

export async function GET() {
  try {
    // Active zones are readable by anon via RLS — no service role needed.
    const supabase = createSupabasePublicClient()
    const { data, error } = await supabase
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
