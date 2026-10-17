import type { Metadata } from "next"
import { AdminComingSoon } from "@/components/admin/AdminComingSoon"

export const metadata: Metadata = {
  title: "Shipping | Teeshogs Admin",
}

export default function AdminShippingPage() {
  return (
    <AdminComingSoon
      eyebrow="Commerce"
      title="Shipping"
      description="Set shipping zones, rates, and delivery options."
      detail="Shipping rules will unlock with real checkout fulfillment."
    />
  )
}
