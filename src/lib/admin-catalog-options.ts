import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  getShopTaxonomy,
  type ColorOption,
  type TaxonomyOption,
} from "@/lib/catalog-taxonomy"
import type { ColorHexMap } from "@/lib/colors"

export type CatalogOption = TaxonomyOption

export async function getAdminCatalogOptions() {
  const supabase = await createSupabaseServerClient()

  const [{ categories, sizes, colors, colorTerms, colorHexByName }, { data: brandRows }] =
    await Promise.all([
      getShopTaxonomy(supabase),
      supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ])

  const brands: CatalogOption[] = (brandRows ?? []).map((row) => ({
    label: row.name as string,
    value: row.id as string,
  }))

  return {
    categories,
    brands,
    sizes,
    colors,
    colorTerms: colorTerms as ColorOption[],
    colorHexByName: colorHexByName as ColorHexMap,
  }
}
