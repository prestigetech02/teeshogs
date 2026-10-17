import { z } from "zod"
import { slugifyProductName } from "@/lib/admin-products"

export const attributeTypes = [
  { label: "Text", value: "text" },
  { label: "Select", value: "select" },
  { label: "Color", value: "color" },
] as const

export const attributeOrderByOptions = [
  { label: "Custom ordering", value: "custom" },
  { label: "Name", value: "name" },
  { label: "Name (numeric)", value: "name_numeric" },
  { label: "Term ID", value: "id" },
] as const

export type AttributeType = (typeof attributeTypes)[number]["value"]
export type AttributeOrderBy = (typeof attributeOrderByOptions)[number]["value"]

export type AttributeTerm = {
  id: string
  attribute_id: string
  name: string
  slug: string
  sort_order: number
  hex?: string | null
  created_at: string
}

export type ProductAttribute = {
  id: string
  name: string
  slug: string
  type: AttributeType
  order_by: AttributeOrderBy
  description: string
  created_at: string
  updated_at: string
  terms: AttributeTerm[]
}

export const attributeFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  type: z.enum(["text", "select", "color"]),
  order_by: z.enum(["custom", "name", "name_numeric", "id"]),
  description: z.string().trim().optional().nullable(),
})

export type AttributeFormValues = z.infer<typeof attributeFormSchema>

export function slugifyAttributeName(value: string) {
  return slugifyProductName(value)
}

export function attributeTypeLabel(value: string) {
  return attributeTypes.find((item) => item.value === value)?.label ?? value
}

export function attributeOrderByLabel(value: string) {
  return attributeOrderByOptions.find((item) => item.value === value)?.label ?? value
}

export function sortAttributeTerms(
  terms: AttributeTerm[],
  orderBy: AttributeOrderBy
): AttributeTerm[] {
  const copy = [...terms]
  switch (orderBy) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    case "name_numeric":
      return copy.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      )
    case "id":
      return copy.sort((a, b) => a.id.localeCompare(b.id))
    case "custom":
    default:
      return copy.sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
      )
  }
}

export function normalizeAttributeRow(
  row: Omit<ProductAttribute, "terms"> & {
    attribute_terms?: AttributeTerm[] | null
  }
): ProductAttribute {
  const { attribute_terms, ...attribute } = row
  return {
    ...attribute,
    terms: attribute_terms ?? [],
  }
}
