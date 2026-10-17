"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Product } from '@/lib/supabase'
import type { ProductVariant } from '@/lib/product-variants'
import { getCartItemUnitPrice } from '@/lib/product-variants'
import { toast } from 'sonner'

export type CartItem = {
  product: Product
  variant?: ProductVariant | null
  size: string
  color: string
  quantity: number
}

type StoreContextType = {
  cart: CartItem[]
  addToCart: (
    product: Product,
    size: string,
    color: string,
    quantity?: number,
    variant?: ProductVariant | null
  ) => void
  removeFromCart: (productId: string, size: string, color: string) => void
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  compareList: Product[]
  addToCompare: (product: Product) => void
  removeFromCompare: (productId: string) => void
  isCompareOpen: boolean
  setIsCompareOpen: (open: boolean) => void
  user: User | null
  isAuthOpen: boolean
  setIsAuthOpen: (open: boolean) => void
  signOut: () => Promise<void>
  quickViewProduct: Product | null
  setQuickViewProduct: (product: Product | null) => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartReady, setCartReady] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [compareList, setCompareList] = useState<Product[]>([])
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('teeshogs_cart') || '[]') as CartItem[]
      setCart(stored)
    } catch {
      setCart([])
    }
    setCartReady(true)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!cartReady) return
    localStorage.setItem('teeshogs_cart', JSON.stringify(cart))
  }, [cart, cartReady])

  const addToCart = (
    product: Product,
    size: string,
    color: string,
    quantity = 1,
    variant: ProductVariant | null = null
  ) => {
    setCart(prev => {
      const existing = prev.find(
        item =>
          item.product.id === product.id &&
          item.size === size &&
          item.color === color &&
          (item.variant?.id ?? null) === (variant?.id ?? null)
      )
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id &&
          item.size === size &&
          item.color === color &&
          (item.variant?.id ?? null) === (variant?.id ?? null)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { product, variant, size, color, quantity }]
    })
    toast.success(`${product.name} added to cart`)
    setIsCartOpen(true)
  }

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart(prev => prev.filter(
      item => !(item.product.id === productId && item.size === size && item.color === color)
    ))
  }

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color)
      return
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId && item.size === size && item.color === color
        ? { ...item, quantity }
        : item
    ))
  }

  const clearCart = () => setCart([])

  const cartTotal = cart.reduce(
    (sum, item) => sum + getCartItemUnitPrice(item) * item.quantity,
    0
  )
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToCompare = (product: Product) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) {
        toast.info('Already in compare list')
        return prev
      }
      if (prev.length >= 4) {
        toast.error('Maximum 4 products can be compared')
        return prev
      }
      toast.success(`${product.name} added to compare`)
      return [...prev, product]
    })
    setIsCompareOpen(true)
  }

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId))
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
  }

  return (
    <StoreContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartCount,
      isCartOpen, setIsCartOpen,
      compareList, addToCompare, removeFromCompare,
      isCompareOpen, setIsCompareOpen,
      user, isAuthOpen, setIsAuthOpen, signOut,
      quickViewProduct, setQuickViewProduct,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
