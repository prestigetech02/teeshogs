import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { normalizeAttributeRow, type ProductAttribute } from "@/lib/attributes"
import { AdminAttributesManager } from "@/components/admin/AdminAttributesManager"

export const metadata: Metadata = {
  title: "Attributes | Teeshogs Admin",
}

export default async function AdminAttributesPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("attributes")
    .select("*, attribute_terms(*)")
    .order("name", { ascending: true })

  const attributes = (
    (data as Array<
      Omit<ProductAttribute, "terms"> & {
        attribute_terms?: ProductAttribute["terms"] | null
      }
    > | null) ?? []
  ).map(normalizeAttributeRow)

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">
          Could not load attributes. Run the attributes migration in Supabase SQL editor, then
          refresh.
        </p>
      )}
      <AdminAttributesManager initialAttributes={attributes} />
    </div>
  )
}
