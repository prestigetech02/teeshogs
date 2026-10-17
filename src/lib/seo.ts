import type { Metadata } from "next"
import type { Product } from "@/lib/supabase"
import { resolveProductImageSrc } from "@/lib/product-images"
import { shopCategories } from "@/lib/shop-filters"

export const siteConfig = {
  name: "Teeshogs",
  tagline: "Body Talks",
  description:
    "Body Talks. Curated fashion that celebrates every curve, every story, every you.",
  keywords: [
    "Teeshogs",
    "Body Talks",
    "fashion",
    "women's clothing",
    "intimates",
    "loungewear",
    "dresses",
    "African fashion",
  ],
  ogImage: "/hero-bg.webp",
  locale: "en_US",
} as const

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, "")

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`

  return "http://localhost:3000"
}

export function absoluteUrl(pathOrUrl = "/") {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl
  }
  const base = getSiteUrl()
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`
  return `${base}${path}`
}

export function absoluteProductImage(image?: string | null) {
  return absoluteUrl(resolveProductImageSrc(image || "dress-1.webp"))
}

export function truncateMeta(value: string, max = 155) {
  const clean = value.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

type PageSeoInput = {
  title: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
  /** Skip the root title template (use exact title string). */
  absoluteTitle?: boolean
}

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image = siteConfig.ogImage,
  noIndex = false,
  absoluteTitle = false,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path)
  const ogImage = absoluteUrl(image)
  const fullDescription = truncateMeta(description)

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: fullDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title,
      description: fullDescription,
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: fullDescription,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
  }
}

export function createProductMetadata(product: Product): Metadata {
  const description = truncateMeta(product.description || siteConfig.description)
  const image = absoluteProductImage(product.images[0])
  const url = absoluteUrl(`/product/${product.slug}`)
  const title = product.name

  return {
    title: { absolute: title },
    description,
    keywords: [product.name, product.category, siteConfig.name, "fashion"],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [
        {
          url: image,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

export function shopPageTitle(searchParams: {
  category?: string | null
  filter?: string | null
  collection?: string | null
  set?: string | null
  q?: string | null
}) {
  if (searchParams.q) return `Search: ${searchParams.q}`
  if (searchParams.collection) {
    return searchParams.collection
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }
  if (searchParams.set) {
    return searchParams.set
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }
  if (searchParams.filter === "new") return "New Arrivals"
  if (searchParams.filter === "bestsellers") return "Best Sellers"
  if (searchParams.filter === "sale") return "Sale"
  if (searchParams.filter === "collections") return "Collections"
  if (searchParams.filter === "sets") return "Sets"
  if (searchParams.category) {
    const match = shopCategories.find((item) => item.value === searchParams.category)
    if (match) return match.label
  }
  return "Shop"
}

export function shopPageDescription(title: string) {
  if (title === "Shop") {
    return "Shop Teeshogs — dresses, intimates, loungewear, swim, and accessories designed to celebrate every silhouette."
  }
  return `Explore ${title} at Teeshogs. Curated fashion that celebrates every curve, every story, every you.`
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: getSiteUrl(),
    description: siteConfig.description,
    logo: absoluteUrl("/teeshogs-logo-black.png"),
    sameAs: [] as string[],
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: getSiteUrl(),
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function productJsonLd(product: Product) {
  const images = (product.images.length ? product.images : ["dress-1.webp"]).map((image) =>
    absoluteProductImage(image)
  )

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images,
    sku: product.id,
    url: absoluteUrl(`/product/${product.slug}`),
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "NGN",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviews_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews_count,
          },
        }
      : {}),
  }
}

export const staticPublicRoutes = [
  "/",
  "/shop",
  "/about",
  "/fabrics",
  "/help",
  "/faqs",
  "/size-guide",
  "/shipping",
  "/returns",
  "/contact",
] as const
