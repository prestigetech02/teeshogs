import type { Metadata } from "next"
import { FabricsCraft } from "@/components/about/FabricsCraft"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Our Fabrics & Craft",
  description:
    "Discover Teeshogs fabrics and craft, from Adire and Kampala inspired prints to soft everyday textiles made to feel as good as they look.",
  path: "/fabrics",
})

export default function FabricsPage() {
  return <FabricsCraft />
}
