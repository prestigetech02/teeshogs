"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import type { Product } from "@/lib/supabase"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { getProductSku } from "@/lib/admin-products"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SearchHit = Pick<Product, "id" | "name" | "slug" | "sku">

export function AdminHeaderSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const wrapRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener("pointerdown", onPointerDown)
    return () => window.removeEventListener("pointerdown", onPointerDown)
  }, [])

  useEffect(() => {
    const safe = query.replace(/[%(),]/g, "").trim()
    if (safe.length < 2) {
      setHits([])
      return
    }

    const timer = window.setTimeout(async () => {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, sku")
        .or(`name.ilike.%${safe}%,slug.ilike.%${safe}%,sku.ilike.%${safe}%`)
        .order("name")
        .limit(8)

      setHits((data as SearchHit[] | null) ?? [])
      setOpen(true)
    }, 220)

    return () => window.clearTimeout(timer)
  }, [query])

  const goToProducts = () => {
    const value = query.trim()
    router.push(value ? `/admin/products?q=${encodeURIComponent(value)}` : "/admin/products")
    setOpen(false)
  }

  return (
    <form
      ref={wrapRef}
      className="relative w-full max-w-xl"
      onSubmit={(event) => {
        event.preventDefault()
        goToProducts()
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        placeholder="Search products, SKU, slug..."
        className="h-9 bg-muted/40 pl-9"
        aria-label="Search admin catalog"
      />
      {open && hits.length > 0 && (
        <div
          className={cn(
            "absolute top-[calc(100%+0.4rem)] right-0 left-0 z-50 overflow-hidden rounded-md border border-border bg-popover shadow-md"
          )}
        >
          <ul className="max-h-72 overflow-y-auto py-1">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    router.push(`/admin/products/${hit.id}`)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <span className="font-medium">{hit.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getProductSku(hit as Product)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
