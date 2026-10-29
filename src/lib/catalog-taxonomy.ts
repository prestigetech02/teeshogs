import type { SupabaseClient } from "@supabase/supabase-js"
import {
  sortAttributeTerms,
  type AttributeOrderBy,
  type AttributeTerm,
} from "@/lib/attributes"
import {
  type ColorOption,
  type TaxonomyOption,
} from "@/lib/catalog-taxonomy-shared"
import { buildColorHexMap, type ColorHexMap } from "@/lib/colors"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  shopCategories,
  shopColors,
  shopSizes,
} from "@/lib/shop-filters"

export type { ColorOption, TaxonomyOption } from "@/lib/catalog-taxonomy-shared"
export { resolveCategoryFilterSlugs } from "@/lib/catalog-taxonomy-shared"

type CategoryRow = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
}

async function getAttributeTermNames(
  supabase: SupabaseClient,
  slug: string,
  fallback: readonly string[]
) {
  const { data } = await supabase
    .from("attributes")
    .select("order_by, attribute_terms(id, attribute_id, name, slug, sort_order, hex, created_at)")
    .eq("slug", slug)
    .maybeSingle()

  const terms = (data?.attribute_terms as AttributeTerm[] | null) ?? []
  if (terms.length === 0) return [...fallback]

  return sortAttributeTerms(
    terms,
    ((data?.order_by as AttributeOrderBy) || "custom")
  ).map((term) => term.name)
}

async function getColorAttribute(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("attributes")
    .select(
      "id, order_by, attribute_terms(id, attribute_id, name, slug, sort_order, hex, created_at)"
    )
    .eq("slug", "color")
    .maybeSingle()

  const terms = (data?.attribute_terms as AttributeTerm[] | null) ?? []
  const colorTerms: ColorOption[] =
    terms.length === 0
      ? shopColors.map((name) => ({ name, hex: null }))
      : sortAttributeTerms(
          terms,
          ((data?.order_by as AttributeOrderBy) || "custom")
        ).map((term) => ({
          name: term.name,
          hex: term.hex ?? null,
        }))

  return {
    colorAttributeId: (data?.id as string | undefined) ?? null,
    colorTerms,
  }
}

async function getColorTerms(supabase: SupabaseClient): Promise<ColorOption[]> {
  const { colorTerms } = await getColorAttribute(supabase)
  return colorTerms
}

export async function getColorHexMap(
  supabaseClient?: SupabaseClient
): Promise<ColorHexMap> {
  const supabase = supabaseClient ?? (await createSupabaseServerClient())
  const terms = await getColorTerms(supabase)
  return buildColorHexMap(terms)
}

function buildCategoryTaxonomy(rows: CategoryRow[]) {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const childrenByParent = new Map<string, CategoryRow[]>()

  for (const row of rows) {
    if (!row.parent_id) continue
    const list = childrenByParent.get(row.parent_id) ?? []
    list.push(row)
    childrenByParent.set(row.parent_id, list)
  }

  const sortRows = (list: CategoryRow[]) =>
    [...list].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

  // Treat as root when parent is missing/inactive so nested items never disappear.
  const roots = sortRows(
    rows.filter((row) => !row.parent_id || !byId.has(row.parent_id))
  )
  const rootIds = new Set(roots.map((row) => row.id))

  const categoryTree: TaxonomyOption[] = roots.map((root) => {
    const children =
      root.parent_id && !rootIds.has(root.parent_id)
        ? []
        : sortRows(childrenByParent.get(root.id) ?? []).map((child) => ({
            label: child.name,
            value: child.slug,
            parentValue: root.slug,
            depth: 1,
          }))
    return {
      label: root.name,
      value: root.slug,
      parentValue: null,
      depth: 0,
      children,
    }
  })

  /** Flat list for selects: roots then children with “Parent › Child” labels. */
  const categories: TaxonomyOption[] = []
  for (const root of categoryTree) {
    categories.push({
      label: root.label,
      value: root.value,
      parentValue: null,
      depth: 0,
    })
    for (const child of root.children ?? []) {
      categories.push({
        label: `${root.label} › ${child.label}`,
        value: child.value,
        parentValue: root.value,
        depth: 1,
      })
    }
  }

  /** When filtering by a parent slug, include that slug and all child slugs. */
  const categoryFilterMap: Record<string, string[]> = {}
  for (const root of categoryTree) {
    const childSlugs = (root.children ?? []).map((child) => child.value)
    categoryFilterMap[root.value] = [root.value, ...childSlugs]
    for (const child of root.children ?? []) {
      categoryFilterMap[child.value] = [child.value]
    }
  }

  return { categories, categoryTree, categoryFilterMap }
}

export async function getShopTaxonomy(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? (await createSupabaseServerClient())

  const [{ data: categoryRows }, sizes, colorAttribute] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    getAttributeTermNames(supabase, "size", shopSizes),
    getColorAttribute(supabase),
  ])

  const fallbackTree = shopCategories.map((item) => ({
    label: item.label,
    value: item.value,
    parentValue: null as string | null,
    depth: 0,
    children: [] as TaxonomyOption[],
  }))

  const built =
    categoryRows && categoryRows.length > 0
      ? buildCategoryTaxonomy(categoryRows as CategoryRow[])
      : {
          categories: fallbackTree.map((item) => ({
            label: item.label,
            value: item.value,
            parentValue: null,
            depth: 0,
          })),
          categoryTree: fallbackTree,
          categoryFilterMap: Object.fromEntries(
            fallbackTree.map((item) => [item.value, [item.value]])
          ),
        }

  const { colorAttributeId, colorTerms } = colorAttribute
  const colors = colorTerms.map((term) => term.name)
  const colorHexByName = buildColorHexMap(colorTerms)

  return {
    categories: built.categories,
    categoryTree: built.categoryTree,
    categoryFilterMap: built.categoryFilterMap,
    sizes,
    colors,
    colorTerms,
    colorHexByName,
    colorAttributeId,
  }
}
