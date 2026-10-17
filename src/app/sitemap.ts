import type { MetadataRoute } from "next"
import { getAllProductSlugs } from "@/lib/products"
import { absoluteUrl, staticPublicRoutes } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = staticPublicRoutes.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" || path === "/shop" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.6,
  }))

  const products = await getAllProductSlugs()
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/product/${product.slug}`),
    lastModified: product.lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  return [...staticEntries, ...productEntries]
}
