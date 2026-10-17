import type { Metadata } from "next"
import { ContactPageContent } from "@/components/contact/ContactPageContent"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Contact Us",
  description:
    "Contact Teeshogs for styling advice, order questions, and Body Talks support at hello@teeshogs.com.",
  path: "/contact",
})

export default function ContactPage() {
  return <ContactPageContent />
}
