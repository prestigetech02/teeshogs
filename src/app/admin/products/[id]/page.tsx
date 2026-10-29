import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/supabase"
import type { ProductVariant } from "@/lib/product-variants"
import { getAdminCatalogOptions } from "@/lib/admin-catalog-options"
import { ProductForm } from "@/components/admin/ProductForm"
import { Button } from "@/components/ui/button"

type EditProductPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Edit product | Teeshogs Admin`,
    description: `Editing product ${id}`,
  }
}

export default async function AdminEditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const [
    { data, error },
    { categories, brands, sizes, colors, colorHexByName, colorAttributeId },
  ] = await Promise.all([
    supabase.from("products").select("*, product_variants(*)").eq("id", id).maybeSingle(),
    getAdminCatalogOptions(),
  ])

  if (error || !data) {
    notFound()
  }

  const row = data as Product & { product_variants?: ProductVariant[] }
  const variants = (row.product_variants ?? []).sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
  )
  const { product_variants: _ignored, ...rest } = row
  const product = {
    ...rest,
    has_variants: Boolean(rest.has_variants),
    variants,
  } as Product

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
          <Link href="/admin/products">
            <ArrowLeft className="size-4" />
            Back to products
          </Link>
        </Button>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit product</h1>
        <p className="mt-2 text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm
        mode="edit"
        product={product}
        categories={categories}
        brands={brands}
        sizes={sizes}
        colors={colors}
        colorHexByName={colorHexByName}
        colorAttributeId={colorAttributeId}
      />
    </div>
  )
}
