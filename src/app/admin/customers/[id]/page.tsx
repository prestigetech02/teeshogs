import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  ordersForCustomer,
  type CustomerOrderRow,
  type CustomerProfile,
} from "@/lib/customers"
import { AdminCustomerDetail } from "@/components/admin/AdminCustomerDetail"
import { Button } from "@/components/ui/button"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Customer ${id.slice(0, 8)} | Teeshogs Admin` }
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile, error }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, notes, created_at, updated_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select(
        "id, order_number, user_id, email, phone, customer_name, status, total, created_at, paid_at"
      )
      .order("created_at", { ascending: false })
      .limit(2000),
  ])

  if (error || !profile) notFound()

  const typed: CustomerProfile = {
    ...(profile as CustomerProfile),
    notes: (profile as CustomerProfile).notes ?? "",
  }

  const customerOrders = ordersForCustomer((orders as CustomerOrderRow[] | null) ?? [], {
    userId: typed.id,
    email: typed.email,
  })

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/customers">
            <ArrowLeft className="mr-1 size-4" />
            Customers
          </Link>
        </Button>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Customer</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {typed.full_name || typed.email}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{typed.email}</p>
      </div>

      <AdminCustomerDetail
        profile={typed}
        email={typed.email}
        orders={customerOrders}
        isSelf={user?.id === typed.id}
      />
    </div>
  )
}
