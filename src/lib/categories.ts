import { z } from "zod"
import { slugifyProductName } from "@/lib/admin-products"

export type Category = {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  is_active: boolean
  sort_order: number
  parent_id: string | null
  created_at: string
  updated_at: string
  product_count?: number
}

export type CategoryStats = {
  total: number
  active: number
  inactive: number
  productsLinked: number
}

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  description: z.string().trim().optional().nullable(),
  image: z.string().trim().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.coerce.number<number>().int().min(0, "Sort order cannot be negative"),
  is_active: z.boolean(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export function slugifyCategoryName(value: string) {
  return slugifyProductName(value)
}

export function computeCategoryStats(categories: Category[]): CategoryStats {
  return {
    total: categories.length,
    active: categories.filter((category) => category.is_active).length,
    inactive: categories.filter((category) => !category.is_active).length,
    productsLinked: categories.reduce(
      (sum, category) => sum + (category.product_count ?? 0),
      0
    ),
  }
}

export function attachCategoryProductCounts(
  categories: Category[],
  productCategories: Array<string | null | undefined>
): Category[] {
  const counts = new Map<string, number>()
  for (const value of productCategories) {
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return categories.map((category) => ({
    ...category,
    product_count: counts.get(category.slug) ?? 0,
  }))
}

/** Top-level categories only (eligible as parents). */
export function getRootCategories(categories: Category[], excludeId?: string) {
  return categories
    .filter((category) => !category.parent_id && category.id !== excludeId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
}

export function getChildCategories(categories: Category[], parentId: string) {
  return categories
    .filter((category) => category.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
}

export function categoryHasChildren(categories: Category[], categoryId: string) {
  return categories.some((category) => category.parent_id === categoryId)
}

/** Flat list: roots first, each followed by its children (for admin table). */
export function flattenCategoriesForDisplay(categories: Category[]): Category[] {
  const roots = getRootCategories(categories)
  const result: Category[] = []
  const seen = new Set<string>()

  for (const root of roots) {
    result.push(root)
    seen.add(root.id)
    for (const child of getChildCategories(categories, root.id)) {
      result.push(child)
      seen.add(child.id)
    }
  }

  // Orphans / unexpected rows (e.g. parent missing)
  for (const category of categories) {
    if (!seen.has(category.id)) result.push(category)
  }

  return result
}

export function parentNameFor(
  categories: Category[],
  category: Category
): string | null {
  if (!category.parent_id) return null
  return categories.find((item) => item.id === category.parent_id)?.name ?? null
}
