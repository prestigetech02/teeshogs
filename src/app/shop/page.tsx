import type { Metadata } from "next"
import { Suspense } from "react"
import { ShopCatalog } from "@/components/shop/ShopCatalog"
import { getShopTaxonomy } from "@/lib/catalog-taxonomy"
import {
  createPageMetadata,
  shopPageDescription,
  shopPageTitle,
} from "@/lib/seo"

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export async function generateMetadata({
  searchParams,
}: ShopPageProps): Promise<Metadata> {
  const params = await searchParams
  const title = shopPageTitle({
    category: firstParam(params.category),
    filter: firstParam(params.filter),
    collection: firstParam(params.collection),
    set: firstParam(params.set),
    q: firstParam(params.q),
  })

  const query = new URLSearchParams()
  for (const key of ["category", "filter", "collection", "set", "q"] as const) {
    const value = firstParam(params[key])
    if (value) query.set(key, value)
  }
  const path = query.size > 0 ? `/shop?${query.toString()}` : "/shop"

  return createPageMetadata({
    title,
    description: shopPageDescription(title),
    path,
  })
}

export default async function ShopPage() {
  const { categories, categoryTree, categoryFilterMap, sizes, colors } =
    await getShopTaxonomy()

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-sm text-muted-foreground">
          Loading the collection...
        </div>
      }
    >
      <ShopCatalog
        categories={categories}
        categoryTree={categoryTree}
        categoryFilterMap={categoryFilterMap}
        sizes={sizes}
        colors={colors}
      />
    </Suspense>
  )
}
