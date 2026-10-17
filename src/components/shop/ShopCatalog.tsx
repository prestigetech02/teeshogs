"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { ProductCard } from "@/components/products/ProductCard"
import { ShopFilters } from "@/components/shop/ShopFilters"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { supabase, type Product } from "@/lib/supabase"
import { PRICE_MAX, PRICE_MIN, shopSortOptions } from "@/lib/shop-filters"
import {
  resolveCategoryFilterSlugs,
  type TaxonomyOption,
} from "@/lib/catalog-taxonomy-shared"

function parseList(value: string | null) {
  if (!value) return [] as string[]
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

type ShopCatalogProps = {
  categories?: TaxonomyOption[]
  categoryTree?: TaxonomyOption[]
  categoryFilterMap?: Record<string, string[]>
  sizes?: string[]
  colors?: string[]
}

export function ShopCatalog({
  categories,
  categoryTree,
  categoryFilterMap,
  sizes,
  colors,
}: ShopCatalogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filter = searchParams.get("filter")
  const category = searchParams.get("category")
  const collection = searchParams.get("collection")
  const set = searchParams.get("set")
  const query = searchParams.get("q")
  const selectedSizes = parseList(searchParams.get("size"))
  const selectedColors = parseList(searchParams.get("color"))
  const minPrice = Number(searchParams.get("min") ?? PRICE_MIN)
  const maxPrice = Number(searchParams.get("max") ?? PRICE_MAX)
  const sort = searchParams.get("sort") ?? "newest"

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoading(true)
      let request = supabase.from("products").select("*, product_variants(*)")

      if (category) {
        const slugs = resolveCategoryFilterSlugs(categoryFilterMap, category)
        request =
          slugs.length === 1
            ? request.eq("category", slugs[0])
            : request.in("category", slugs)
      }
      if (filter === "new") {
        request = request.eq("new_arrival", true)
      }
      if (filter === "sale") {
        request = request.eq("sale", true)
      }
      if (filter === "bestsellers") {
        request = request.eq("featured", true)
      }
      if (query) {
        request = request.ilike("name", `%${query}%`)
      }

      const { data } = await request.order("created_at", { ascending: false })
      if (active) {
        const rows = (data as Array<Product & { product_variants?: Product["variants"] }> | null) ?? []
        setProducts(
          rows.map((row) => {
            const { product_variants, ...product } = row
            return {
              ...product,
              has_variants: Boolean(product.has_variants),
              variants: product_variants ?? [],
            }
          })
        )
        setLoading(false)
      }
    }

    void loadProducts()
    return () => {
      active = false
    }
  }, [category, categoryFilterMap, filter, query])

  const filteredProducts = useMemo(() => {
    let next = [...products]

    if (selectedSizes.length > 0) {
      next = next.filter((product) =>
        selectedSizes.some((size) => product.sizes.includes(size))
      )
    }

    if (selectedColors.length > 0) {
      next = next.filter((product) =>
        selectedColors.some((color) => product.colors.includes(color))
      )
    }

    next = next.filter(
      (product) => product.price >= minPrice && product.price <= maxPrice
    )

    switch (sort) {
      case "price-asc":
        next.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        next.sort((a, b) => b.price - a.price)
        break
      case "rating":
        next.sort((a, b) => b.rating - a.rating)
        break
      default:
        next.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }

    return next
  }, [maxPrice, minPrice, products, selectedColors, selectedSizes, sort])

  const heading = useMemo(() => {
    if (query) return `Results for “${query}”`
    if (filter === "new") return "New Arrivals"
    if (filter === "bestsellers") return "Best Sellers"
    if (filter === "sale") return "Sale"
    if (filter === "collections") return "Collections"
    if (filter === "sets") return "Sets"
    if (collection) {
      return collection
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    }
    if (set) {
      return set
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    }
    if (category) {
      return category
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    }
    return "Shop"
  }, [category, collection, filter, query, set])

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "newest") params.delete("sort")
    else params.set("sort", value)
    const next = params.toString()
    router.push(next ? `/shop?${next}` : "/shop")
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Collection
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{heading}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100%,20rem)] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
                <ShopFilters
                  categories={categories}
                  categoryTree={categoryTree}
                  sizes={sizes}
                  colors={colors}
                  onNavigate={() => setFiltersOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sort} onValueChange={updateSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {shopSortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <div className="sticky top-28 rounded-lg border border-border p-5">
            <ShopFilters
              categories={categories}
              categoryTree={categoryTree}
              sizes={sizes}
              colors={colors}
            />
          </div>
        </div>

        <div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading pieces...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products match these filters. Try clearing a few options.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
