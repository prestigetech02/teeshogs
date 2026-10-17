import { getShopTaxonomy } from "@/lib/catalog-taxonomy"
import { buildMainNav, type NavSection } from "@/lib/navigation"

/** Server-only: Shop menu categories come from active rows in `categories`. */
export async function getMainNav(): Promise<NavSection[]> {
  const { categoryTree } = await getShopTaxonomy()
  return buildMainNav(
    categoryTree.map((category) => ({
      label: category.label,
      slug: category.value,
      children: (category.children ?? []).map((child) => ({
        label: child.label,
        slug: child.value,
      })),
    }))
  )
}
