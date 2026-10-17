import { createSupabaseServerClient } from "@/lib/supabase/server"
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-nav"

export type AdminDashboardStats = {
  totalProducts: number
  lowStock: number
  outOfStock: number
  featured: number
  newArrivals: number
  onSale: number
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("stock, featured, new_arrival, sale")

  if (error || !data) {
    return {
      totalProducts: 0,
      lowStock: 0,
      outOfStock: 0,
      featured: 0,
      newArrivals: 0,
      onSale: 0,
    }
  }

  return {
    totalProducts: data.length,
    lowStock: data.filter(
      (product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD
    ).length,
    outOfStock: data.filter((product) => product.stock <= 0).length,
    featured: data.filter((product) => product.featured).length,
    newArrivals: data.filter((product) => product.new_arrival).length,
    onSale: data.filter((product) => product.sale).length,
  }
}
