import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ShippingZone } from "@/lib/shipping-zones"
import { AdminShippingZonesManager } from "@/components/admin/AdminShippingZonesManager"

export const metadata: Metadata = {
  title: "Shipping | Teeshogs Admin",
}

export default async function AdminShippingPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("shipping_zones")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  const zones = (data as ShippingZone[] | null) ?? []

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">
          Could not load shipping zones. Run the shipping_zones migration in Supabase SQL editor,
          then refresh.
        </p>
      )}
      <AdminShippingZonesManager initialZones={zones} />
    </div>
  )
}
