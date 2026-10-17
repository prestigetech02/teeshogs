import { z } from "zod"
import { slugifyProductName } from "@/lib/admin-products"

export type Brand = {
  id: string
  name: string
  slug: string
  description: string
  logo: string | null
  website: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  product_count?: number
}

export type BrandStats = {
  total: number
  active: number
  inactive: number
  productsLinked: number
}

export const brandFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  description: z.string().trim().optional().nullable(),
  logo: z.string().trim().optional().nullable(),
  website: z
    .union([
      z.literal(""),
      z.null(),
      z.string().trim().url("Enter a valid URL"),
    ])
    .optional(),
  is_active: z.boolean(),
})

export type BrandFormValues = z.infer<typeof brandFormSchema>

export function slugifyBrandName(value: string) {
  return slugifyProductName(value)
}

export function computeBrandStats(brands: Brand[]): BrandStats {
  return {
    total: brands.length,
    active: brands.filter((brand) => brand.is_active).length,
    inactive: brands.filter((brand) => !brand.is_active).length,
    productsLinked: brands.reduce((sum, brand) => sum + (brand.product_count ?? 0), 0),
  }
}

export function normalizeBrandRow(
  row: Brand & { products?: Array<{ count: number }> | { count: number } }
): Brand {
  const countField = row.products
  let product_count = 0
  if (Array.isArray(countField)) {
    product_count = Number(countField[0]?.count ?? 0)
  } else if (countField && typeof countField === "object") {
    product_count = Number(countField.count ?? 0)
  }

  const { products: _ignored, ...brand } = row
  return {
    ...brand,
    product_count,
  }
}
