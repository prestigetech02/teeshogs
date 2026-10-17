"use client"

import Link from "next/link"
import { Instrument_Serif, Manrope } from "next/font/google"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import styles from "@/components/about/about.module.css"

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
})

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const craftCards = [
  {
    title: "Adire",
    description:
      "Indigo dyed patterns and resist techniques that carry memory, meaning and a deep sense of home into contemporary silhouettes.",
  },
  {
    title: "Kampala",
    description:
      "Bold wax print energy, reimagined for intimates, lounge, swim and everyday accessories you actually live in.",
  },
  {
    title: "Soft Essentials",
    description:
      "Gentle knits, smooth stretch and breathable blends chosen for pieces that sit closest to the body.",
  },
  {
    title: "Made with Care",
    description:
      "Every Teeshogs piece is finished with attention to comfort, fit and longevity, so it feels as good as it looks.",
  },
]

export function FabricsCraft() {
  return (
    <div
      className={cn(
        styles.aboutPage,
        sans.className,
        "bg-[var(--about-sand)] text-[var(--about-ink)]"
      )}
    >
      <section className="border-b border-[var(--about-line)] bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <Breadcrumb>
            <BreadcrumbList className="text-white/60">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-white/60 hover:text-white">
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-white/60 hover:text-white">
                  <Link href="/about">Our Story</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Our Fabrics & Craft</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1
            className={cn(
              display.className,
              "mt-4 text-4xl tracking-tight text-white sm:text-5xl"
            )}
          >
            Our Fabrics & Craft
          </h1>
        </div>
      </section>

      <section className="border-b border-[var(--about-line)]">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-20">
          <div>
            <h2 className={cn(display.className, "text-3xl tracking-tight sm:text-4xl")}>
              Materials with Meaning
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-[var(--about-ink)]/80 sm:text-lg">
              <p>
                Teeshogs fabrics are chosen to honour African print traditions while staying soft,
                wearable and true to modern life.
              </p>
              <p>
                From Adire and Kampala inspired surfaces to quiet everyday knits, we look for
                textiles that feel personal against the skin and still speak of heritage, colour and
                story.
              </p>
              <p>
                The craft sits in the details. Thoughtful cuts, considered finishes and pieces made
                to be lived in, packed, gifted and returned to again.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="mt-8 rounded-none bg-[var(--about-ink)] px-8 text-[var(--about-sand)] hover:opacity-90"
            >
              <Link href="/shop">Shop The Collection</Link>
            </Button>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--about-cream)]">
            <img
              src="/dress-2.webp"
              alt="Teeshogs fabric and print detail"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[var(--about-cream)]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className={cn(display.className, "text-3xl tracking-tight sm:text-4xl")}>
            How Teeshogs Is Made
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {craftCards.map((item) => (
              <div
                key={item.title}
                className="border border-[var(--about-line)] bg-[var(--about-cream)] p-6 sm:p-7 dark:bg-[var(--about-sand)]"
              >
                <h3 className="text-xs font-semibold uppercase tracking-[0.28em]">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[var(--about-ink)]/75">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <p
            className={cn(
              display.className,
              "mt-12 text-2xl tracking-tight sm:text-3xl"
            )}
          >
            Feel it. Wear it. Make it yours.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="mt-8 rounded-none border-[var(--about-ink)] bg-transparent px-8 text-[var(--about-ink)] hover:bg-[var(--about-ink)] hover:text-[var(--about-sand)]"
          >
            <Link href="/shop?filter=collections">Explore Our Collections</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
