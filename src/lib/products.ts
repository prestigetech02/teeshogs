import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/supabase"
import type { ProductVariant } from "@/lib/product-variants"

export async function getProductBySlug(slug: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("slug", slug)
    .maybeSingle()

  if (error || !data) return null

  const row = data as Product & { product_variants?: ProductVariant[] }
  const variants = (row.product_variants ?? []).sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
  )

  const { product_variants: _ignored, ...product } = row
  return {
    ...product,
    has_variants: Boolean(product.has_variants),
    variants,
  } as Product
}

export async function getAllProductSlugs() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("slug, created_at")
    .order("created_at", { ascending: false })

  if (error || !data) return [] as Array<{ slug: string; lastModified: Date }>

  return data.map((row) => ({
    slug: row.slug as string,
    lastModified: new Date(row.created_at as string),
  }))
}
