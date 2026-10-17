import { z } from "zod"
import type { Product } from "@/lib/supabase"
import { shopCategories, shopColors, shopSizes } from "@/lib/shop-filters"

export const productCategoryValues = shopCategories.map((item) => item.value) as [
  string,
  ...string[],
]

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(10, "Add a short description"),
  price: z.coerce.number<number>().positive("Price must be greater than 0"),
  compare_price: z.union([z.coerce.number<number>().positive(), z.literal(""), z.null()]).optional(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().trim().optional().nullable(),
  brand_id: z.union([z.string().uuid(), z.literal(""), z.null()]).optional(),
  images: z.array(z.string().trim().min(1)),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
  sku: z.string().trim().optional().nullable(),
  stock: z.coerce.number<number>().int().min(0, "Stock cannot be negative"),
  featured: z.boolean(),
  new_arrival: z.boolean(),
  sale: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export function slugifyProductName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function normalizeComparePrice(value: ProductFormValues["compare_price"]) {
  if (value === "" || value === null || value === undefined) return null
  if (typeof value === "number" && Number.isNaN(value)) return null
  return value
}

export { resolveProductImageSrc as resolveAdminImageSrc } from "@/lib/product-images"

export { shopCategories, shopColors, shopSizes }

export function getProductSku(product: Product) {
  const own = product.sku?.trim()
  if (own) return own
  const variantSku = product.variants?.find((variant) => variant.sku?.trim())?.sku?.trim()
  return variantSku || "—"
}

export function isProductInStock(product: Product) {
  if (product.variants?.length) {
    return product.variants.some((variant) => variant.stock > 0)
  }
  return product.stock > 0
}
