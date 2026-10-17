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
import styles from "./about.module.css"

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

const categories = [
  {
    title: "Intimates",
    description: "Pieces designed to make everyday confidence feel beautiful.",
    href: "/shop?category=intimates",
  },
  {
    title: "Swim & Vacay",
    description: "African-inspired swim and beach pieces made for wherever the sun takes you.",
    href: "/shop?category=swim-and-beachwear",
  },
  {
    title: "Lounge & Sleep",
    description: "Comfortable pieces for slow mornings, soft nights and everything in between.",
    href: "/shop?category=lounge-and-sleepwear",
  },
  {
    title: "Accessories",
    description: "Bonnets, scrunchies, eye masks and thoughtful everyday Teeshogs pieces.",
    href: "/shop?category=accessories",
  },
]

export function AboutStory() {
  return (
    <div
      className={cn(
        styles.aboutPage,
        sans.className,
        "bg-[var(--about-sand)] text-[var(--about-ink)]"
      )}
    >
      {/* 1 — Simple page header */}
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
                <BreadcrumbPage className="text-white">About Us</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1
            className={cn(
              display.className,
              "mt-4 text-4xl tracking-tight text-white sm:text-5xl"
            )}
          >
            About Us
          </h1>
        </div>
      </section>

      {/* 2 — Brand story */}
      <section className="border-b border-[var(--about-line)]">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-20">
          <div>
            <h2 className={cn(display.className, "text-3xl tracking-tight sm:text-4xl")}>
              Wear Your Story.
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-[var(--about-ink)]/80 sm:text-lg">
              <p>
                Teeshogs is a contemporary African fashion and lifestyle brand creating
                expressive pieces from prints inspired by our culture, heritage and everyday stories.
              </p>
              <p>
                From intimates and swimwear to loungewear and accessories, we create pieces that feel
                personal, beautiful and unmistakably African. We translate Adire, Kampala and African
                visual traditions into contemporary pieces made to be worn, loved and remembered.
              </p>
              <p>
                Storytelling sits at the heart of Teeshogs. Our prints and collections are developed
                around heritage, femininity, confidence, home, freedom and self-expression. Rooted in
                Africa, worn everywhere. A little piece of home, wherever you are.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="mt-8 rounded-none bg-[var(--about-ink)] px-8 text-[var(--about-sand)] hover:opacity-90"
            >
              <Link href="/shop">Shop Teeshogs</Link>
            </Button>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--about-cream)]">
            <img
              src="/dress-1.webp"
              alt="Teeshogs product"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 3 — Categories + close */}
      <section className="bg-white dark:bg-[var(--about-cream)]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className={cn(display.className, "text-3xl tracking-tight sm:text-4xl")}>
            Made for More Than One Moment
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {categories.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group border border-[var(--about-line)] bg-[var(--about-cream)] p-6 transition-colors hover:border-[var(--about-ink)]/35 hover:bg-[var(--about-sand)] sm:p-7 dark:bg-[var(--about-sand)]"
              >
                <h3 className="text-xs font-semibold uppercase tracking-[0.28em]">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[var(--about-ink)]/75">
                  {item.description}
                </p>
                <span className="mt-5 inline-block text-sm font-medium tracking-wide text-[var(--about-ink)]/55 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--about-ink)]">
                  Shop →
                </span>
              </Link>
            ))}
          </div>
          <p
            className={cn(
              display.className,
              "mt-12 text-2xl tracking-tight sm:text-3xl"
            )}
          >
            Your Body Talks. Let It Say Something.
          </p>
          <p className="mt-4 text-base text-[var(--about-ink)]/75 sm:text-lg">
            This is Teeshogs.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="mt-8 rounded-none border-[var(--about-ink)] bg-transparent px-8 text-[var(--about-ink)] hover:bg-[var(--about-ink)] hover:text-[var(--about-sand)]"
          >
            <Link href="/shop">Shop The Collection</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
