"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Star, Minus, Plus, Heart, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useStore } from '@/context/StoreContext'
import { resolveProductImageSrc } from '@/lib/product-images'
import { findVariant } from '@/lib/product-variants'
import { formatNGN } from '@/lib/money'
import { ColorSwatchGroup } from '@/components/products/ColorSwatch'
import { useColorMap } from '@/hooks/use-color-map'

export function QuickView() {
  const { quickViewProduct: product, setQuickViewProduct, addToCart } = useStore()
  const colorMap = useColorMap()
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const handleOpen = (open: boolean) => {
    if (!open) {
      setQuickViewProduct(null)
      setSelectedSize('')
      setSelectedColor('')
      setQuantity(1)
    }
  }

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null

  return (
    <Dialog open={!!product} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto bg-muted">
            <img
              src={resolveProductImageSrc(product.images[0] || 'dress-1.webp')}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.new_arrival && (
              <Badge className="absolute top-4 left-4">New</Badge>
            )}
            {discount && (
              <Badge variant="destructive" className="absolute top-4 left-4 mt-8">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
            <div>
              <span className="text-xs tracking-widest uppercase text-muted-foreground">{product.category}</span>
              <h2 className="text-xl font-semibold mt-1">{product.name}</h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star
                      key={i}
                      className={cn("size-3.5", i <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{product.rating} ({product.reviews_count} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-2xl font-bold">{formatNGN(product.price)}</span>
                {product.compare_price && (
                  <span className="text-base text-muted-foreground line-through">{formatNGN(product.compare_price)}</span>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2">
                  Color: <span className="normal-case tracking-normal font-normal">{selectedColor || 'Select'}</span>
                </p>
                <ColorSwatchGroup
                  colors={product.colors}
                  selected={selectedColor}
                  onSelect={setSelectedColor}
                  colorMap={colorMap}
                />
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2">
                  Size: <span className="normal-case tracking-normal font-normal">{selectedSize || 'Select'}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "min-w-10 h-9 px-2.5 rounded-md border text-sm font-medium transition-colors",
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-foreground"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="w-full flex-1"
                size="lg"
                onClick={() => {
                  const sizeOption = selectedSize || product.sizes[0] || ""
                  const colorOption = selectedColor || product.colors[0] || ""
                  const variant = product.has_variants
                    ? findVariant(product.variants, sizeOption, colorOption)
                    : null
                  addToCart(
                    product,
                    sizeOption || "One Size",
                    colorOption || "Default",
                    quantity,
                    variant
                  )
                  setQuickViewProduct(null)
                }}
              >
                Add to Cart
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="size-4" />
              </Button>
            </div>

            <Link
              href={`/product/${product.slug}`}
              onClick={() => setQuickViewProduct(null)}
              className="text-xs text-center text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              View Full Details
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
