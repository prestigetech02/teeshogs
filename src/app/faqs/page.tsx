import type { Metadata } from "next"
import { InfoPage } from "@/components/layout/InfoPage"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "FAQs",
  description:
    "Find quick answers about Teeshogs sizing, orders, fabrics, and care.",
  path: "/faqs",
})

export default function FaqsPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="FAQs"
      description="Find quick answers about sizing, orders, fabrics, and care. More detailed guides are coming soon."
    />
  )
}
