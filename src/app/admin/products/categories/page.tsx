import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { attachCategoryProductCounts, type Category } from "@/lib/categories"
import { AdminCategoriesManager } from "@/components/admin/AdminCategoriesManager"

export const metadata: Metadata = {
  title: "Categories | Teeshogs Admin",
}

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient()
  const [{ data, error }, { data: productRows }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name"),
    supabase.from("products").select("category"),
  ])

  const categories = attachCategoryProductCounts(
    ((data as Category[] | null) ?? []).map((category) => ({
      ...category,
      parent_id: category.parent_id ?? null,
    })),
    (productRows ?? []).map((row) => row.category as string)
  )

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">
          Could not load categories. Run the categories migration in Supabase SQL editor, then refresh.
        </p>
      )}
      <AdminCategoriesManager initialCategories={categories} />
    </div>
  )
}
