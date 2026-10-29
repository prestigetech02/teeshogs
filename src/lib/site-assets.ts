import type { SupabaseClient } from "@supabase/supabase-js"

export const SITE_ASSETS_BUCKET = "site-assets"
export const SITE_ASSET_MAX_BYTES = 5 * 1024 * 1024
export const SITE_ASSET_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/gif"

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
])

/** True when value is a path inside the site-assets bucket. */
export function isSiteAssetPath(image: string) {
  if (!image) return false
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return false
  }
  return image.includes("/")
}

export function resolveSiteImageSrc(image: string) {
  if (!image) return "/hero-bg.webp"
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image
  }
  if (isSiteAssetPath(image)) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!base) return "/hero-bg.webp"
    return `${base}/storage/v1/object/public/${SITE_ASSETS_BUCKET}/${image}`
  }
  return `/${image}`
}

function sanitizeFileName(name: string) {
  const trimmed = name.trim().toLowerCase()
  const dot = trimmed.lastIndexOf(".")
  const base = (dot > 0 ? trimmed.slice(0, dot) : trimmed).replace(/[^a-z0-9]+/g, "-")
  const ext = dot > 0 ? trimmed.slice(dot + 1).replace(/[^a-z0-9]/g, "") : "webp"
  return `${base.replace(/(^-|-$)/g, "") || "image"}.${ext || "webp"}`
}

export function buildSiteAssetPath(fileName: string, folder = "hero") {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${folder}/${id}-${sanitizeFileName(fileName)}`
}

export function validateSiteAssetFile(file: File) {
  if (!ALLOWED_MIME.has(file.type)) {
    return "Use JPEG, PNG, WebP, or GIF"
  }
  if (file.size > SITE_ASSET_MAX_BYTES) {
    return "Each image must be 5MB or smaller"
  }
  return null
}

export async function uploadSiteAssetFile(supabase: SupabaseClient, file: File, folder = "hero") {
  const validationError = validateSiteAssetFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const path = buildSiteAssetPath(file.name, folder)
  const { error } = await supabase.storage.from(SITE_ASSETS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  })

  if (error) {
    throw new Error(error.message)
  }

  return path
}

export async function deleteSiteAssetObject(supabase: SupabaseClient, image: string) {
  if (!isSiteAssetPath(image)) return
  const { error } = await supabase.storage.from(SITE_ASSETS_BUCKET).remove([image])
  if (error) {
    throw new Error(error.message)
  }
}
