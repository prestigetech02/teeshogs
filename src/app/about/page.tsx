import type { Metadata } from "next"
import { AboutStory } from "@/components/about/AboutStory"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "About Teeshogs",
  description:
    "Teeshogs is a contemporary African fashion and lifestyle brand creating expressive pieces from prints inspired by our culture, heritage and everyday stories.",
  path: "/about",
})

export default function AboutPage() {
  return <AboutStory />
}
