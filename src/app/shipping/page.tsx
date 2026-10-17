import type { Metadata } from "next"
import { InfoPage } from "@/components/layout/InfoPage"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Shipping & Delivery",
  description:
    "Free shipping on Teeshogs orders over ₦150,000. Most orders process within 1–2 business days with tracked Fez delivery across Nigeria.",
  path: "/shipping",
})

export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Shipping & Delivery"
      description="We offer free shipping on orders over ₦150,000. Most orders are processed within 1–2 business days and delivered nationwide with Fez tracked shipping."
    />
  )
}
