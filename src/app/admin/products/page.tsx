import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Plus } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/supabase"
import type { ProductVariant } from "@/lib/product-variants"
import { AdminProductsTable } from "@/components/admin/AdminProductsTable"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Products | Teeshogs Admin",
}

export default async function AdminProductsPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .order("created_at", { ascending: false })

  const products = ((data as Array<Product & { product_variants?: ProductVariant[] }> | null) ?? []).map(
    (row) => {
      const { product_variants, ...product } = row
      return {
        ...product,
        has_variants: Boolean(product.has_variants),
        variants: product_variants ?? [],
      }
    }
  )

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Products</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, edit, and manage SKU and stock for the storefront.
          </p>
          {error && (
            <p className="mt-2 text-sm text-destructive">
              Could not load products. Confirm the catalog migrations are applied and you are signed in as
              admin.
            </p>
          )}
        </div>
        <Button asChild className="shrink-0 self-start sm:self-auto">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Add product
          </Link>
        </Button>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading catalog…</p>}>
        <AdminProductsTable initialProducts={products} />
      </Suspense>
    </div>
  )
}
