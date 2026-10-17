import type { Metadata } from "next"
import { InfoPage } from "@/components/layout/InfoPage"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Size Guide",
  description:
    "Find your best Teeshogs fit across intimates, sets, lounge, and ready-to-wear.",
  path: "/size-guide",
})

export default function SizeGuidePage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Size Guide"
      description="Use our size guide to find your best fit across intimates, sets, lounge, and ready-to-wear. When in doubt, size up for comfort."
    />
  )
}
