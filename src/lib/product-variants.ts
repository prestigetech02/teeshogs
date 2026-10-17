export type ProductVariant = {
  id: string
  product_id: string
  sku: string | null
  size: string
  color: string
  price: number
  compare_price: number | null
  stock: number
  image: string | null
  sort_order: number
  created_at: string
}

export type VariantDraft = {
  clientId: string
  id?: string
  size: string
  color: string
  price: number
  compare_price: number | null
  stock: number
  sku: string
  /** Optional product image path/url shown when this variant is selected. */
  image: string | null
}

export function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function variantLabel(size: string, color: string) {
  const parts = [size, color].map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 ? parts.join(" / ") : "Default"
}

export function findVariant(
  variants: ProductVariant[] | undefined,
  size: string,
  color: string
) {
  if (!variants?.length) return null
  return (
    variants.find(
      (variant) =>
        (variant.size || "") === (size || "") && (variant.color || "") === (color || "")
    ) ?? null
  )
}

export function getProductDisplayPrice(product: {
  price: number
  has_variants?: boolean
  variants?: ProductVariant[]
}) {
  if (!product.has_variants || !product.variants?.length) {
    return { price: Number(product.price), from: false }
  }
  const prices = product.variants.map((variant) => Number(variant.price))
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return { price: min, from: min !== max }
}

export function getCartItemUnitPrice(item: {
  product: { price: number }
  variant?: ProductVariant | null
}) {
  return item.variant ? Number(item.variant.price) : Number(item.product.price)
}

export function generateVariantDrafts(input: {
  sizes: string[]
  colors: string[]
  basePrice: number
  baseStock?: number
  existing?: VariantDraft[]
}) {
  const sizes = input.sizes.length > 0 ? input.sizes : [""]
  const colors = input.colors.length > 0 ? input.colors : [""]
  const existingMap = new Map(
    (input.existing ?? []).map((item) => [`${item.size}::${item.color}`, item])
  )

  const drafts: VariantDraft[] = []
  for (const size of sizes) {
    for (const color of colors) {
      const key = `${size}::${color}`
      const previous = existingMap.get(key)
      if (previous) {
        drafts.push({ ...previous, size, color, image: previous.image ?? null })
      } else {
        drafts.push({
          clientId: createClientId(),
          size,
          color,
          price: input.basePrice > 0 ? input.basePrice : 1,
          compare_price: null,
          stock: input.baseStock ?? 0,
          sku: "",
          image: null,
        })
      }
    }
  }
  return drafts
}

export function draftsFromVariants(variants: ProductVariant[]): VariantDraft[] {
  return variants.map((variant) => ({
    clientId: variant.id,
    id: variant.id,
    size: variant.size || "",
    color: variant.color || "",
    price: Number(variant.price),
    compare_price:
      variant.compare_price === null || variant.compare_price === undefined
        ? null
        : Number(variant.compare_price),
    stock: variant.stock,
    sku: variant.sku || "",
    image: variant.image || null,
  }))
}

/** Prefer a matching color+size variant image, then any variant for that color. */
export function findVariantImage(
  variants: ProductVariant[] | undefined,
  size: string,
  color: string
) {
  if (!variants?.length) return null
  const exact = findVariant(variants, size, color)
  if (exact?.image) return exact.image
  const byColor = variants.find(
    (variant) => (variant.color || "") === (color || "") && Boolean(variant.image)
  )
  return byColor?.image ?? null
}
