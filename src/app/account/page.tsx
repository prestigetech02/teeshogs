import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  ordersForCustomer,
  type CustomerOrderRow,
  type CustomerProfile,
} from "@/lib/customers"
import { AccountOrders } from "@/components/account/AccountOrders"
import { AccountProfileForm } from "@/components/account/AccountProfileForm"

export const metadata: Metadata = {
  title: "My Account | Teeshogs",
  description: "Manage your Teeshogs profile and view order history.",
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const [{ data: profile }, { data: byUser }, { data: byEmail }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, notes, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select(
        "id, order_number, user_id, email, phone, customer_name, status, total, created_at, paid_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    user.email
      ? supabase
          .from("orders")
          .select(
            "id, order_number, user_id, email, phone, customer_name, status, total, created_at, paid_at"
          )
          .ilike("email", user.email)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as CustomerOrderRow[] }),
  ])

  const typedProfile: CustomerProfile = {
    id: user.id,
    full_name: (profile as CustomerProfile | null)?.full_name || "",
    email: (profile as CustomerProfile | null)?.email || user.email || "",
    phone: (profile as CustomerProfile | null)?.phone || null,
    role: (profile as CustomerProfile | null)?.role || "customer",
    notes: "",
    created_at: (profile as CustomerProfile | null)?.created_at || new Date().toISOString(),
  }

  const orders = ordersForCustomer(
    [
      ...((byUser as CustomerOrderRow[] | null) ?? []),
      ...((byEmail as CustomerOrderRow[] | null) ?? []),
    ],
    { userId: user.id, email: typedProfile.email }
  )

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">My account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update your details and track orders.{" "}
          <Link href="/shop" className="underline underline-offset-4 hover:text-foreground">
            Continue shopping
          </Link>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <AccountProfileForm profile={typedProfile} />
        <AccountOrders orders={orders} />
      </div>
    </div>
  )
}
