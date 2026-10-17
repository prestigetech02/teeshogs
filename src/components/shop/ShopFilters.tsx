"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  PRICE_MAX,
  PRICE_MIN,
  shopCategories,
  shopColors,
  shopSizes,
  shopStatusFilters,
} from "@/lib/shop-filters"
import type { TaxonomyOption } from "@/lib/catalog-taxonomy"
import { formatNGN } from "@/lib/money"
import { cn } from "@/lib/utils"

function parseList(value: string | null) {
  if (!value) return [] as string[]
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

function flattenCategoryTree(options: TaxonomyOption[]): TaxonomyOption[] {
  const flat: TaxonomyOption[] = []
  for (const item of options) {
    flat.push({ ...item, depth: item.depth ?? 0, children: undefined })
    for (const child of item.children ?? []) {
      flat.push({ ...child, depth: 1, children: undefined })
    }
  }
  return flat
}

type ShopFiltersProps = {
  className?: string
  onNavigate?: () => void
  categories?: TaxonomyOption[]
  categoryTree?: TaxonomyOption[]
  sizes?: string[]
  colors?: string[]
}

export function ShopFilters({
  className,
  onNavigate,
  categories: categoryOptions,
  categoryTree,
  sizes: sizeOptions,
  colors: colorOptions,
}: ShopFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const categories =
    categoryTree && categoryTree.length > 0
      ? flattenCategoryTree(categoryTree)
      : categoryOptions && categoryOptions.length > 0
        ? categoryOptions
        : shopCategories.map((item) => ({ label: item.label, value: item.value, depth: 0 }))
  const sizes = sizeOptions && sizeOptions.length > 0 ? sizeOptions : [...shopSizes]
  const colors = colorOptions && colorOptions.length > 0 ? colorOptions : [...shopColors]

  const category = searchParams.get("category") ?? ""
  const filter = searchParams.get("filter") ?? ""
  const selectedSizes = parseList(searchParams.get("size"))
  const selectedColors = parseList(searchParams.get("color"))
  const minPrice = Number(searchParams.get("min") ?? PRICE_MIN)
  const maxPrice = Number(searchParams.get("max") ?? PRICE_MAX)
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice])

  useEffect(() => {
    setPriceRange([minPrice, maxPrice])
  }, [minPrice, maxPrice])

  const updateParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    const query = params.toString()
    router.push(query ? `/shop?${query}` : "/shop")
    onNavigate?.()
  }

  const toggleListValue = (key: "size" | "color", value: string, checked: boolean) => {
    updateParams((params) => {
      const current = parseList(params.get(key))
      const next = checked
        ? Array.from(new Set([...current, value]))
        : current.filter((item) => item !== value)

      if (next.length === 0) params.delete(key)
      else params.set(key, next.join(","))
    })
  }

  const clearFilters = () => {
    router.push("/shop")
    onNavigate?.()
  }

  const hasActiveFilters =
    Boolean(category) ||
    Boolean(filter) ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    minPrice > PRICE_MIN ||
    maxPrice < PRICE_MAX ||
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("collection")) ||
    Boolean(searchParams.get("set"))

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-auto px-0 text-xs" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Category
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() =>
              updateParams((params) => {
                params.delete("category")
              })
            }
            className={cn(
              "block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
              !category && "bg-muted font-medium"
            )}
          >
            All categories
          </button>
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                updateParams((params) => {
                  params.set("category", item.value)
                })
              }
              className={cn(
                "block w-full rounded-md py-1.5 text-left text-sm transition-colors hover:bg-muted",
                (item.depth ?? 0) > 0 ? "px-5 text-muted-foreground" : "px-2",
                category === item.value && "bg-muted font-medium text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Status
        </h3>
        <div className="space-y-2">
          {shopStatusFilters.map((item) => {
            const checked = filter === item.value
            return (
              <label key={item.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) =>
                    updateParams((params) => {
                      if (value === true) params.set("filter", item.value)
                      else if (params.get("filter") === item.value) params.delete("filter")
                    })
                  }
                />
                {item.label}
              </label>
            )
          })}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Size
        </h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const active = selectedSizes.includes(size)
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleListValue("size", size, !active)}
                className={cn(
                  "min-w-10 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground"
                )}
              >
                {size}
              </button>
            )
          })}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Color
        </h3>
        <div className="space-y-2">
          {colors.map((color) => {
            const checked = selectedColors.includes(color)
            return (
              <label key={color} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggleListValue("color", color, value === true)}
                />
                <span
                  className="size-3.5 rounded-full border border-border"
                  style={{ backgroundColor: colorToHex(color) }}
                  aria-hidden
                />
                {color}
              </label>
            )
          })}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Price
          </h3>
          <Label className="text-xs font-normal text-muted-foreground">
            {formatNGN(priceRange[0], { compact: true })} – {formatNGN(priceRange[1], { compact: true })}
          </Label>
        </div>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={1000}
          value={priceRange}
          onValueChange={(value) => setPriceRange([value[0] ?? PRICE_MIN, value[1] ?? PRICE_MAX])}
          onValueCommit={(value) => {
            const nextMin = value[0] ?? PRICE_MIN
            const nextMax = value[1] ?? PRICE_MAX
            updateParams((params) => {
              if (nextMin <= PRICE_MIN) params.delete("min")
              else params.set("min", String(nextMin))
              if (nextMax >= PRICE_MAX) params.delete("max")
              else params.set("max", String(nextMax))
            })
          }}
        />
      </section>
    </aside>
  )
}

function colorToHex(colorName: string): string {
  const map: Record<string, string> = {
    Black: "#1a1a1a",
    White: "#f5f5f5",
    Ivory: "#fffff0",
    Cream: "#fffdd0",
    Camel: "#c19a6b",
    Navy: "#000080",
    Charcoal: "#36454f",
    Olive: "#808000",
    "Sage Green": "#8f9779",
    Terracotta: "#e2725b",
    "Dusty Rose": "#c8a2a2",
    Blush: "#ffb6c1",
    Burgundy: "#800020",
    Emerald: "#50c878",
    Midnight: "#0a0a2e",
  }
  return map[colorName] || "#d4d4d4"
}
