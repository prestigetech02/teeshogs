import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Coupon } from "@/lib/coupons"
import { AdminCouponsManager } from "@/components/admin/AdminCouponsManager"

export const metadata: Metadata = {
  title: "Coupons | Teeshogs Admin",
}

export default async function AdminCouponsPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false })

  const coupons = (data as Coupon[] | null) ?? []

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">
          Could not load coupons. Run the coupons migration in Supabase SQL editor, then refresh.
        </p>
      )}
      <AdminCouponsManager initialCoupons={coupons} />
    </div>
  )
}
