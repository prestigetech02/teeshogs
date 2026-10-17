import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/products/ProductDetail"
import { JsonLd } from "@/components/seo/JsonLd"
import { getColorHexMap } from "@/lib/catalog-taxonomy"
import { getProductBySlug } from "@/lib/products"
import { createProductMetadata, productJsonLd } from "@/lib/seo"

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: true },
    }
  }

  return createProductMetadata(product)
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const [product, colorMap] = await Promise.all([
    getProductBySlug(slug),
    getColorHexMap(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <ProductDetail product={product} colorMap={colorMap} />
    </>
  )
}
