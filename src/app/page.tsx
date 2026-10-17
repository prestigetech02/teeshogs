import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Award, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryCarousel } from "@/components/home/CategoryCarousel"
import { ProductCard } from "@/components/products/ProductCard"
import { JsonLd } from "@/components/seo/JsonLd"
import { supabase, type Product } from "@/lib/supabase"
import {
  createPageMetadata,
  organizationJsonLd,
  siteConfig,
  websiteJsonLd,
} from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
})

const categories = [
  { name: "Dresses", slug: "dresses", image: "category-dresses.webp" },
  { name: "Tops", slug: "tops", image: "category-tops.webp" },
  { name: "Bottoms", slug: "bottoms", image: "category-bottoms.webp" },
  { name: "Outerwear", slug: "outerwear", image: "category-outerwear.webp" },
  { name: "Intimates", slug: "intimates", image: "bodysuit-1.webp" },
  {
    name: "Lounge & Sleepwear",
    slug: "lounge-and-sleepwear",
    image: "sweater-1.webp",
  },
  {
    name: "Swim & Beachwear",
    slug: "swim-and-beachwear",
    image: "dress-3.webp",
  },
  {
    name: "Bonnets & Hair",
    slug: "bonnets-and-hair-accessories",
    image: "category-tops.webp",
  },
  { name: "Accessories", slug: "accessories", image: "skirt-1.webp" },
]

const perks = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over ₦150,000" },
  { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "Protected checkout" },
  { icon: Award, title: "Quality First", desc: "Premium fabrics" },
]

async function getHomeProducts() {
  const [{ data: featured }, { data: arrivals }] = await Promise.all([
    supabase.from("products").select("*, product_variants(*)").eq("featured", true).limit(4),
    supabase.from("products").select("*, product_variants(*)").eq("new_arrival", true).limit(4),
  ])

  const mapProducts = (rows: Array<Product & { product_variants?: Product["variants"] }> | null) =>
    (rows ?? []).map((row) => {
      const { product_variants, ...product } = row
      return {
        ...product,
        has_variants: Boolean(product.has_variants),
        variants: product_variants ?? [],
      }
    })

  return {
    featured: mapProducts(featured as Array<Product & { product_variants?: Product["variants"] }> | null),
    arrivals: mapProducts(arrivals as Array<Product & { product_variants?: Product["variants"] }> | null),
  }
}

export default async function HomePage() {
  const { featured, arrivals } = await getHomeProducts()

  return (
    <div>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <section className="relative flex h-[70vh] min-h-[500px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/hero-bg.webp"
            alt="Teeshogs fashion campaign"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 text-white">
          <div className="max-w-xl">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] opacity-90">Fall / Winter 2026</p>
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
              Let Your Body
              <br />
              Do the Talking
            </h1>
            <p className="mb-8 max-w-md text-lg opacity-90">
              Discover pieces designed to celebrate every silhouette. Fashion that speaks confidence.
            </p>
            <div className="flex gap-3">
              <Button size="lg" asChild>
                <Link href="/shop">
                  Shop Collection <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                asChild
              >
                <Link href="/shop?filter=new">New Arrivals</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {perks.map((perk) => (
              <div key={perk.title} className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <perk.icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{perk.title}</p>
                  <p className="text-xs text-muted-foreground">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Shop by Category</h2>
          <p className="mt-2 text-muted-foreground">Find your perfect look</p>
        </div>
        <CategoryCarousel categories={categories} />
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Featured Pieces</h2>
            <p className="mt-2 text-muted-foreground">Our handpicked favorites</p>
          </div>
          <Button variant="link" asChild className="hidden sm:flex">
            <Link href="/shop">
              View All <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Featured pieces will appear here once products are in the catalog.</p>
        )}
      </section>

      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] opacity-80">Limited Time</p>
          <h2 className="mb-4 text-3xl font-bold md:text-5xl">Mid-Season Sale</h2>
          <p className="mx-auto mb-8 max-w-xl text-lg opacity-90">
            Up to 40% off selected styles. Refresh your wardrobe with our seasonal edits.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/shop?filter=sale">Shop Sale</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">New Arrivals</h2>
            <p className="mt-2 text-muted-foreground">Just landed this week</p>
          </div>
          <Button variant="link" asChild className="hidden sm:flex">
            <Link href="/shop?filter=new">
              View All <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {arrivals.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {arrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">New arrivals will appear here once products are in the catalog.</p>
        )}
      </section>
    </div>
  )
}
