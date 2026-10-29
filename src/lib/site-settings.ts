import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveSiteImageSrc } from "@/lib/site-assets"

export const HERO_SLIDES_SETTING_KEY = "hero_slides"
export const HERO_SLIDES_MIN = 1
export const HERO_SLIDES_MAX = 6

export const heroCtaSchema = z.object({
  label: z.string().trim().min(1, "CTA label is required").max(40),
  href: z
    .string()
    .trim()
    .min(1, "CTA link is required")
    .max(200)
    .refine((value) => value.startsWith("/") || value.startsWith("http"), {
      message: "Use a path like /shop or a full URL",
    }),
})

export const heroSlideSchema = z.object({
  id: z.string().trim().min(1).max(64),
  eyebrow: z.string().trim().min(1, "Eyebrow is required").max(80),
  title: z.string().trim().min(1, "Title is required").max(80),
  titleLine2: z.string().trim().max(80).optional(),
  description: z.string().trim().min(1, "Description is required").max(280),
  image: z.string().trim().min(1, "Image is required").max(500),
  imageAlt: z.string().trim().min(1, "Image alt text is required").max(160),
  primaryCta: heroCtaSchema,
  secondaryCta: heroCtaSchema,
})

export const heroSlidesPayloadSchema = z.object({
  slides: z
    .array(heroSlideSchema)
    .min(HERO_SLIDES_MIN, `Add at least ${HERO_SLIDES_MIN} slide`)
    .max(HERO_SLIDES_MAX, `At most ${HERO_SLIDES_MAX} slides`),
})

export type HeroSlide = z.infer<typeof heroSlideSchema>
export type HeroSlidesPayload = z.infer<typeof heroSlidesPayloadSchema>

export const defaultHeroSlides: HeroSlide[] = [
  {
    id: "default-1",
    eyebrow: "Fall / Winter 2026",
    title: "Let Your Body",
    titleLine2: "Do the Talking",
    description:
      "Discover pieces designed to celebrate every silhouette. Fashion that speaks confidence.",
    image: "/hero-bg.webp",
    imageAlt: "Teeshogs fashion campaign",
    primaryCta: { label: "Shop Collection", href: "/shop" },
    secondaryCta: { label: "New Arrivals", href: "/shop?filter=new" },
  },
  {
    id: "default-2",
    eyebrow: "New Season Dresses",
    title: "Made to Move",
    titleLine2: "With You",
    description:
      "Fluid silhouettes and elevated everyday dresses for wherever the day takes you.",
    image: "/dress-1.webp",
    imageAlt: "Teeshogs dress edit",
    primaryCta: { label: "Shop Dresses", href: "/shop?category=dresses" },
    secondaryCta: { label: "View All", href: "/shop" },
  },
  {
    id: "default-3",
    eyebrow: "Layered Essentials",
    title: "Outerwear",
    titleLine2: "That Anchors",
    description:
      "Structured jackets and soft layers to finish every look with intention.",
    image: "/jacket-1.webp",
    imageAlt: "Teeshogs outerwear edit",
    primaryCta: { label: "Shop Outerwear", href: "/shop?category=outerwear" },
    secondaryCta: { label: "Shop Sale", href: "/shop?filter=sale" },
  },
]

export function emptyHeroSlide(): HeroSlide {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `slide-${Date.now()}`

  return {
    id,
    eyebrow: "",
    title: "",
    titleLine2: "",
    description: "",
    image: "",
    imageAlt: "",
    primaryCta: { label: "Shop Collection", href: "/shop" },
    secondaryCta: { label: "New Arrivals", href: "/shop?filter=new" },
  }
}

export function normalizeHeroSlides(raw: unknown): HeroSlide[] {
  const parsed = heroSlidesPayloadSchema.safeParse(raw)
  if (parsed.success) {
    return parsed.data.slides.map((slide) => ({
      ...slide,
      titleLine2: slide.titleLine2?.trim() || "",
    }))
  }

  if (raw && typeof raw === "object" && Array.isArray((raw as { slides?: unknown }).slides)) {
    const slides: HeroSlide[] = []

    for (const [index, item] of (raw as { slides: unknown[] }).slides.entries()) {
      if (!item || typeof item !== "object") continue
      const slide = item as Record<string, unknown>
      const title = String(slide.title ?? "").trim()
      const image = String(slide.image ?? "").trim()
      if (!title || !image) continue

      const primary =
        slide.primaryCta && typeof slide.primaryCta === "object"
          ? (slide.primaryCta as Record<string, unknown>)
          : {}
      const secondary =
        slide.secondaryCta && typeof slide.secondaryCta === "object"
          ? (slide.secondaryCta as Record<string, unknown>)
          : {}

      slides.push({
        id: String(slide.id ?? `legacy-${index + 1}`),
        eyebrow: String(slide.eyebrow ?? ""),
        title,
        titleLine2: String(slide.titleLine2 ?? ""),
        description: String(slide.description ?? ""),
        image,
        imageAlt: String(slide.imageAlt ?? ""),
        primaryCta: {
          label: String(primary.label ?? "Shop Collection"),
          href: String(primary.href ?? "/shop"),
        },
        secondaryCta: {
          label: String(secondary.label ?? "New Arrivals"),
          href: String(secondary.href ?? "/shop?filter=new"),
        },
      })
    }

    if (slides.length > 0) return slides.slice(0, HERO_SLIDES_MAX)
  }

  return defaultHeroSlides
}

export function toDisplayHeroSlides(slides: HeroSlide[]): HeroSlide[] {
  return slides.map((slide) => ({
    ...slide,
    image: resolveSiteImageSrc(slide.image),
    titleLine2: slide.titleLine2?.trim() || undefined,
  }))
}

export async function fetchHeroSlidesSetting(client: SupabaseClient) {
  const { data, error } = await client
    .from("site_settings")
    .select("value")
    .eq("key", HERO_SLIDES_SETTING_KEY)
    .maybeSingle()

  if (error) {
    return { slides: defaultHeroSlides, error: error.message }
  }

  return {
    slides: normalizeHeroSlides(data?.value ?? { slides: defaultHeroSlides }),
    error: null as string | null,
  }
}
