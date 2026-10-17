export type TaxonomyOption = {
  label: string
  value: string
  /** Present when this option is a subcategory. */
  parentValue?: string | null
  children?: TaxonomyOption[]
  /** Indent hint for flat lists (0 = root, 1 = child). */
  depth?: number
}

export type ColorOption = {
  name: string
  hex: string | null
}

/** When filtering by a parent slug, include that slug and all child slugs. */
export function resolveCategoryFilterSlugs(
  categoryFilterMap: Record<string, string[]> | undefined,
  category: string
) {
  if (!category) return []
  return categoryFilterMap?.[category] ?? [category]
}
