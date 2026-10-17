import type { Metadata } from "next"
import Link from "next/link"
import {
  AlertTriangle,
  Package,
  Sparkles,
  Tag,
  PackageX,
  Star,
} from "lucide-react"
import { AdminProtected } from "@/components/admin/AdminProtected"
import { requireAdminSession } from "@/lib/admin"
import { getAdminDashboardStats } from "@/lib/admin-stats"
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Admin Dashboard | Teeshogs",
}

export default function AdminDashboardPage() {
  return (
    <AdminProtected>
      <AdminDashboardContent />
    </AdminProtected>
  )
}

async function AdminDashboardContent() {
  const [session, stats] = await Promise.all([
    requireAdminSession(),
    getAdminDashboardStats(),
  ])

  const cards = [
    {
      title: "Total products",
      value: stats.totalProducts,
      description: "Items in the catalog",
      icon: Package,
    },
    {
      title: "Low stock",
      value: stats.lowStock,
      description: `Stock at or below ${LOW_STOCK_THRESHOLD}`,
      icon: AlertTriangle,
    },
    {
      title: "Out of stock",
      value: stats.outOfStock,
      description: "Needs restocking",
      icon: PackageX,
    },
    {
      title: "Featured",
      value: stats.featured,
      description: "Shown on homepage featured",
      icon: Star,
    },
    {
      title: "New arrivals",
      value: stats.newArrivals,
      description: "Marked as new",
      icon: Sparkles,
    },
    {
      title: "On sale",
      value: stats.onSale,
      description: "Active sale flags",
      icon: Tag,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome back{session?.email ? `, ${session.email}` : ""}. Catalog health at a glance.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products">Manage products</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-2 text-3xl tabular-nums">{card.value}</CardTitle>
              </div>
              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                <card.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next up</CardTitle>
          <CardDescription>
            Phase 3 adds full product create/edit, image management, and catalog search.
            Orders are live via Paystack + Fez. Customers unlock next.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/products">Open products</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">View storefront</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
