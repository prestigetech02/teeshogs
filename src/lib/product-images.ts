import type { SupabaseClient } from "@supabase/supabase-js"

export const PRODUCT_IMAGES_BUCKET = "product-images"
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/gif"

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
])

/** True when value is a path inside the product-images bucket (not a legacy public file or absolute URL). */
export function isStorageObjectPath(image: string) {
  if (!image) return false
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return false
  }
  return image.includes("/")
}

export function resolveProductImageSrc(image: string) {
  if (!image) return "/dress-1.webp"
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image
  }
  if (isStorageObjectPath(image)) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!base) return "/dress-1.webp"
    return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${image}`
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

export function buildProductImagePath(fileName: string) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `catalog/${id}-${sanitizeFileName(fileName)}`
}

export function validateProductImageFile(file: File) {
  if (!ALLOWED_MIME.has(file.type)) {
    return "Use JPEG, PNG, WebP, or GIF"
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return "Each image must be 5MB or smaller"
  }
  return null
}

export async function uploadProductImageFiles(
  supabase: SupabaseClient,
  files: File[]
) {
  const uploaded: string[] = []

  for (const file of files) {
    const validationError = validateProductImageFile(file)
    if (validationError) {
      throw new Error(`${file.name}: ${validationError}`)
    }

    const path = buildProductImagePath(file.name)
    const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

    if (error) {
      throw new Error(error.message)
    }

    uploaded.push(path)
  }

  return uploaded
}

export async function deleteProductImageObject(
  supabase: SupabaseClient,
  image: string
) {
  if (!isStorageObjectPath(image)) return
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([image])
  if (error) {
    throw new Error(error.message)
  }
}
