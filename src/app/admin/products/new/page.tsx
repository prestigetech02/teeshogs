import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProductForm } from "@/components/admin/ProductForm"
import { getAdminCatalogOptions } from "@/lib/admin-catalog-options"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "New Product | Teeshogs Admin",
}

export default async function AdminNewProductPage() {
  const { categories, brands, sizes, colors, colorHexByName } = await getAdminCatalogOptions()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <Link href="/admin/products">
              <ArrowLeft className="size-4" />
              Back to products
            </Link>
          </Button>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Add product</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create a catalog item with pricing, category, brand, images, and optional size/color
            variations.
          </p>
        </div>
      </div>

      <ProductForm
        mode="create"
        categories={categories}
        brands={brands}
        sizes={sizes}
        colors={colors}
        colorHexByName={colorHexByName}
      />
    </div>
  )
}
