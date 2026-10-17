import type { Metadata } from "next"
import { InfoPage } from "@/components/layout/InfoPage"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Returns & Exchanges",
  description:
    "Return or exchange unworn Teeshogs items within 30 days with tags attached.",
  path: "/returns",
})

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Returns & Exchanges"
      description="Changed your mind? You have 30 days to return or exchange unworn items with tags attached. Reach out to our team to start a return."
    />
  )
}
