"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HeroSlide } from "@/lib/site-settings"
import { resolveSiteImageSrc } from "@/lib/site-assets"
import { cn } from "@/lib/utils"

const AUTO_MS = 6500

type HeroSliderProps = {
  slides: HeroSlide[]
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const active = slides[index] ?? slides[0]

  useEffect(() => {
    setIndex(0)
  }, [slides])

  useEffect(() => {
    if (slides.length < 2 || paused) return

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, AUTO_MS)

    return () => window.clearInterval(id)
  }, [slides.length, paused])

  if (!active) return null

  return (
    <section
      className="relative flex h-[70vh] min-h-[500px] items-center overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== index}
        >
          <img
            src={resolveSiteImageSrc(slide.image)}
            alt=""
            className={cn(
              "h-full w-full object-cover transition-transform duration-[6500ms] ease-out",
              i === index ? "scale-105" : "scale-100"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        </div>
      ))}

      <div className="relative container mx-auto px-4 text-white">
        <div
          key={active.id}
          className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-700"
        >
          <p className="mb-4 text-sm uppercase tracking-[0.3em] opacity-90">
            {active.eyebrow}
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
            {active.title}
            {active.titleLine2 ? (
              <>
                <br />
                {active.titleLine2}
              </>
            ) : null}
          </h1>
          <p className="mb-8 max-w-md text-lg opacity-90">{active.description}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={active.primaryCta.href}>
                {active.primaryCta.label} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link href={active.secondaryCta.href}>{active.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 md:bottom-8 md:left-auto md:right-8 md:translate-x-0">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Show slide ${i + 1}: ${slide.eyebrow}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index
                ? "w-8 bg-white"
                : "w-1.5 bg-white/45 hover:bg-white/70"
            )}
          />
        ))}
      </div>

      <span className="sr-only" aria-live="polite">
        Slide {index + 1} of {slides.length}: {active.title}
        {active.titleLine2 ? ` ${active.titleLine2}` : ""}
      </span>
    </section>
  )
}
