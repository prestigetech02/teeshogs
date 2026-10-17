import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  ordersForCustomer,
  type CustomerOrderRow,
} from "@/lib/customers"
import { AdminCustomerDetail } from "@/components/admin/AdminCustomerDetail"
import { Button } from "@/components/ui/button"

type PageProps = {
  params: Promise<{ email: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { email } = await params
  const decoded = decodeURIComponent(email)
  return { title: `Guest ${decoded} | Teeshogs Admin` }
}

export default async function AdminGuestCustomerPage({ params }: PageProps) {
  const { email: raw } = await params
  const email = decodeURIComponent(raw).trim().toLowerCase()
  if (!email || !email.includes("@")) notFound()

  const supabase = await createSupabaseServerClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle()

  if (profile?.id) {
    redirect(`/admin/customers/${profile.id}`)
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, user_id, email, phone, customer_name, status, total, created_at, paid_at"
    )
    .ilike("email", email)
    .order("created_at", { ascending: false })

  const customerOrders = ordersForCustomer((orders as CustomerOrderRow[] | null) ?? [], {
    email,
  })

  if (customerOrders.length === 0) notFound()

  const displayName = customerOrders[0]?.customer_name || "Guest"

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/customers">
            <ArrowLeft className="mr-1 size-4" />
            Customers
          </Link>
        </Button>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Guest</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{displayName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{email}</p>
      </div>

      <AdminCustomerDetail profile={null} email={email} orders={customerOrders} />
    </div>
  )
}
