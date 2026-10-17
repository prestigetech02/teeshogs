"use client"

import { useEffect, useMemo, useState } from "react"
import { Minus, Plus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductGallery } from "@/components/products/ProductGallery"
import { ColorSwatchGroup } from "@/components/products/ColorSwatch"
import { ProductShareBar } from "@/components/products/ProductShareBar"
import { useStore } from "@/context/StoreContext"
import type { Product } from "@/lib/supabase"
import { findVariant, findVariantImage } from "@/lib/product-variants"
import { formatNGN } from "@/lib/money"
import type { ColorHexMap } from "@/lib/colors"
import { cn } from "@/lib/utils"

export function ProductDetail({
  product,
  colorMap,
}: {
  product: Product
  colorMap?: ColorHexMap | null
}) {
  const { addToCart } = useStore()
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "")
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "")
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = useMemo(
    () =>
      product.has_variants
        ? findVariant(product.variants, selectedSize, selectedColor)
        : null,
    [product.has_variants, product.variants, selectedSize, selectedColor]
  )

  const displayPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.price)
  const displayCompare = selectedVariant
    ? selectedVariant.compare_price
    : product.compare_price
  const displayStock = selectedVariant
    ? selectedVariant.stock
    : product.stock

  const maxQty = Math.max(1, displayStock || 1)
  const canAdd =
    (!product.has_variants ||
      (Boolean(selectedVariant) && (selectedVariant?.stock ?? 0) > 0)) &&
    displayStock > 0

  useEffect(() => {
    setQuantity((current) => Math.min(current, maxQty))
  }, [maxQty])

  const featuredImage = useMemo(
    () =>
      findVariantImage(
        product.variants,
        selectedSize,
        selectedColor
      ) || selectedVariant?.image || null,
    [product.variants, selectedSize, selectedColor, selectedVariant]
  )

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:px-8 lg:py-12">
      <ProductGallery
        images={product.images}
        alt={product.name}
        featuredImage={featuredImage}
      />

      <div className="flex flex-col gap-5 lg:pt-2">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{product.category}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3.5",
                    i <= Math.round(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {product.rating} ({product.reviews_count} reviews)
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold">{formatNGN(displayPrice)}</span>
            {displayCompare && (
              <span className="text-muted-foreground line-through">
                {formatNGN(Number(displayCompare))}
              </span>
            )}
            {product.new_arrival && <Badge>New</Badge>}
          </div>
          {product.has_variants && (
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedVariant
                ? displayStock > 0
                  ? `${displayStock} in stock for this option`
                  : "Out of stock for this option"
                : "Select available options"}
            </p>
          )}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

        {product.colors.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest">
              Color:{" "}
              <span className="font-normal normal-case tracking-normal">
                {selectedColor || "Select"}
              </span>
            </p>
            <ColorSwatchGroup
              colors={product.colors}
              selected={selectedColor}
              onSelect={setSelectedColor}
              colorMap={colorMap}
              size="sm"
            />
          </div>
        )}

        {product.sizes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest">
              Size:{" "}
              <span className="font-normal normal-case tracking-normal">
                {selectedSize || "Select"}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <Button
                  key={size}
                  type="button"
                  variant={selectedSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest">Quantity</p>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center border border-border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-10 text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="Increase quantity"
                disabled={quantity >= maxQty}
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {!product.has_variants && (
              <span className="text-xs text-muted-foreground">{displayStock} in stock</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full"
            disabled={!canAdd}
            onClick={() =>
              addToCart(
                product,
                selectedSize || product.sizes[0] || "One Size",
                selectedColor || product.colors[0] || "Default",
                quantity,
                selectedVariant
              )
            }
          >
            {displayStock <= 0 ? "Out of stock" : "Add to cart"}
          </Button>
          <ProductShareBar product={product} />
        </div>
      </div>
    </div>
  )
}
