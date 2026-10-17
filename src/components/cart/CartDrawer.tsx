"use client"

import { useRouter } from 'next/navigation'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore } from '@/context/StoreContext'
import { getCartItemUnitPrice } from '@/lib/product-variants'
import { resolveProductImageSrc } from '@/lib/product-images'
import { formatNGN, getFreeShippingThresholdNgn } from '@/lib/money'

export function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, cartCount } = useStore()
  const router = useRouter()
  const freeShippingAt = getFreeShippingThresholdNgn()
  const remainingForFreeShipping = Math.max(0, freeShippingAt - cartTotal)

  const handleCheckout = () => {
    setIsCartOpen(false)
    router.push('/checkout')
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Your Cart
            {cartCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({cartCount} items)</span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
            <ShoppingBag className="size-16 text-muted-foreground/30" />
            <div className="text-center">
              <p className="font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add some beautiful pieces to get started</p>
            </div>
            <Button onClick={() => { setIsCartOpen(false); router.push('/shop') }}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="flex flex-col divide-y">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4">
                    <div className="w-20 h-24 rounded-md overflow-hidden bg-muted shrink-0">
                      <img
                        src={resolveProductImageSrc(item.product.images[0] || 'dress-1.webp')}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-snug line-clamp-2">{item.product.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.size} · {item.color}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatNGN(getCartItemUnitPrice(item) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t p-4 space-y-4">
              {/* Free shipping bar */}
              {remainingForFreeShipping > 0 && (
                <div className="text-xs text-center text-muted-foreground">
                  Add <span className="font-semibold text-foreground">{formatNGN(remainingForFreeShipping)}</span> more for free shipping
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all rounded-full"
                      style={{ width: `${Math.min(100, (cartTotal / freeShippingAt) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {remainingForFreeShipping <= 0 && (
                <p className="text-xs text-center text-emerald-600 font-medium">You've earned free shipping!</p>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatNGN(cartTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping calculated at checkout</p>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Checkout · {formatNGN(cartTotal)}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setIsCartOpen(false); router.push('/shop') }}>
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
