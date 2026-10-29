"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  HERO_SLIDES_SETTING_KEY,
  heroSlidesPayloadSchema,
  type HeroSlide,
} from "@/lib/site-settings"

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, error: "Not authenticated", supabase }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Not authorized", supabase }
  }

  return { ok: true as const, supabase }
}

export type SaveHeroSlidesResult = { ok: true } | { ok: false; error: string }

export async function saveHeroSlides(slides: HeroSlide[]): Promise<SaveHeroSlidesResult> {
  const parsed = heroSlidesPayloadSchema.safeParse({
    slides: slides.map((slide) => ({
      ...slide,
      titleLine2: slide.titleLine2?.trim() || "",
    })),
  })

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "Invalid hero slides" }
  }

  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const payload = {
    slides: parsed.data.slides.map((slide) => ({
      ...slide,
      titleLine2: slide.titleLine2?.trim() || "",
    })),
  }

  const { error } = await auth.supabase.from("site_settings").upsert(
    {
      key: HERO_SLIDES_SETTING_KEY,
      value: payload,
    },
    { onConflict: "key" }
  )

  if (error) return { ok: false, error: error.message }

  revalidatePath("/")
  revalidatePath("/admin/settings")
  return { ok: true }
}
