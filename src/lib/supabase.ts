import { createClient } from '@supabase/supabase-js'
import { authStorage } from '@/lib/auth-storage'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
})

import type { ProductVariant } from "@/lib/product-variants"

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compare_price: number | null
  category: string
  subcategory: string | null
  images: string[]
  sizes: string[]
  colors: string[]
  sku?: string | null
  stock: number
  featured: boolean
  new_arrival: boolean
  sale: boolean
  has_variants?: boolean
  brand_id?: string | null
  variants?: ProductVariant[]
  rating: number
  reviews_count: number
  created_at: string
}


export type UserRole = "customer" | "admin"

export type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: Record<string, string> | null
  role: UserRole
  notes?: string
  created_at: string
  updated_at?: string
}
