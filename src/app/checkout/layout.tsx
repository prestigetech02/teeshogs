import type { Metadata } from "next"
import type { ReactNode } from "react"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Checkout",
  description: "Complete your Teeshogs order.",
  path: "/checkout",
  noIndex: true,
})

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children
}
