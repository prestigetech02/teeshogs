import type { Metadata } from "next"
import { InfoPage } from "@/components/layout/InfoPage"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Help",
  description:
    "Browse Teeshogs FAQs, size guidance, shipping details, and returns — or reach out for personal order help.",
  path: "/help",
})

export default function HelpPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="How can we help?"
      description="Browse FAQs, size guidance, shipping details, and returns — or reach out if you need a personal assist with your order."
    />
  )
}
