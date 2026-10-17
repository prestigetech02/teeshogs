import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { normalizeBrandRow, type Brand } from "@/lib/brands"
import { AdminBrandsManager } from "@/components/admin/AdminBrandsManager"

export const metadata: Metadata = {
  title: "Brands | Teeshogs Admin",
}

export default async function AdminBrandsPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("brands")
    .select("*, products(count)")
    .order("name", { ascending: true })

  const brands = ((data as Array<Brand & { products?: Array<{ count: number }> }> | null) ?? []).map(
    normalizeBrandRow
  )

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">
          Could not load brands. Run the brands migration in Supabase SQL editor, then refresh.
        </p>
      )}
      <AdminBrandsManager initialBrands={brands} />
    </div>
  )
}
