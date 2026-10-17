"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Eye, SlidersHorizontal, ShoppingBag, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useStore } from '@/context/StoreContext'
import type { Product } from '@/lib/supabase'
import { resolveProductImageSrc } from '@/lib/product-images'
import { findVariant, getProductDisplayPrice } from '@/lib/product-variants'
import { formatNGN } from '@/lib/money'
import { resolveColorHex } from '@/lib/colors'
import { useColorMap } from '@/hooks/use-color-map'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  const { addToCart, addToCompare, setQuickViewProduct } = useStore()
  const colorMap = useColorMap()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null

  const display = getProductDisplayPrice(product)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    const sizeOption = product.sizes[0] || ""
    const colorOption = hoveredColor || product.colors[0] || ""
    const size = sizeOption || "One Size"
    const color = colorOption || "Default"
    const variant = product.has_variants
      ? findVariant(product.variants, sizeOption, colorOption)
      : null
    addToCart(product, size, color, 1, variant)
  }

  return (
    <div className="group relative flex flex-col">
      {/* Image container */}
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[3/4]">
        <Link href={`/product/${product.slug}`}>
          <img
            src={resolveProductImageSrc(product.images[0] || 'dress-1.webp')}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.new_arrival && (
            <Badge className="text-[10px] px-2 py-0.5">New</Badge>
          )}
          {discount && (
            <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          <Heart className={cn("size-4", isWishlisted && "fill-destructive text-destructive")} />
        </Button>

        {/* Action buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="size-3.5" />
            Add to Cart
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={(e) => { e.preventDefault(); setQuickViewProduct(product) }}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={(e) => { e.preventDefault(); addToCompare(product) }}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Product info */}
      <div className="mt-3 flex flex-col gap-1.5">
        {/* Color swatches */}
        {product.colors.length > 0 && (
          <div className="flex gap-1.5">
            {product.colors.slice(0, 5).map(color => (
              <button
                key={color}
                title={color}
                className={cn(
                  "w-4 h-4 rounded-full border border-border transition-transform hover:scale-110",
                  hoveredColor === color && "ring-2 ring-offset-1 ring-foreground"
                )}
                style={{ backgroundColor: resolveColorHex(color, colorMap) }}
                onMouseEnter={() => setHoveredColor(color)}
                onMouseLeave={() => setHoveredColor(null)}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-muted-foreground self-center">+{product.colors.length - 5}</span>
            )}
          </div>
        )}

        <Link href={`/product/${product.slug}`} className="hover:underline underline-offset-2">
          <h3 className="text-sm font-medium leading-snug line-clamp-2">{product.name}</h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                className={cn("size-3", i <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews_count})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {display.from ? "From " : ""}{formatNGN(display.price)}
          </span>
          {product.compare_price && (
            <span className="text-xs text-muted-foreground line-through">{formatNGN(product.compare_price)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
