"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import {
  Bell,
  ChevronDown,
  Contact,
  CreditCard,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  ShoppingBag,
  TicketPercent,
  Truck,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { AdminHeaderSearch } from "@/components/admin/AdminHeaderSearch"
import { AdminNotifications } from "@/components/admin/AdminNotifications"
import { AdminUserMenu } from "@/components/admin/AdminUserMenu"
import {
  adminNav,
  isProductCatalogListPath,
  type AdminNavChild,
  type AdminNavItem,
} from "@/lib/admin-nav"
import { cn } from "@/lib/utils"

const icons = {
  Dashboard: LayoutDashboard,
  Products: Package,
  Coupons: TicketPercent,
  Newsletters: Mail,
  Contacts: Contact,
  Notifications: Bell,
  Shipping: Truck,
  Payments: CreditCard,
  Orders: ShoppingBag,
  Customers: Users,
} as const

type AdminShellProps = {
  email: string | null
  name: string | null
  children: ReactNode
}

function isChildActive(pathname: string, child: AdminNavChild) {
  if (child.href === "/admin/products") {
    return isProductCatalogListPath(pathname)
  }
  return pathname === child.href || pathname.startsWith(`${child.href}/`)
}

function isItemActive(pathname: string, item: AdminNavItem) {
  if (item.children?.length) {
    return item.children.some((child) => isChildActive(pathname, child))
  }
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const productsOpenByDefault = pathname.startsWith("/admin/products")
  const [productsOpen, setProductsOpen] = useState(productsOpenByDefault)

  useEffect(() => {
    if (productsOpenByDefault) setProductsOpen(true)
  }, [productsOpenByDefault])

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {adminNav.map((item) => {
        const Icon = icons[item.label as keyof typeof icons]
        const active = isItemActive(pathname, item)
        const badge = item.badge ?? null
        const children = item.children

        if (children?.length) {
          return (
            <Collapsible
              key={item.href}
              open={productsOpen}
              onOpenChange={setProductsOpen}
              className="space-y-1"
            >
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  {Icon ? <Icon className="size-4" /> : null}
                  {item.label}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 transition-transform",
                    productsOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 pl-3">
                {children.map((child) => {
                  const childActive = isChildActive(pathname, child)
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-md px-3 py-1.5 text-sm transition-colors",
                        childActive
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      {child.label}
                    </Link>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              {Icon ? <Icon className="size-4" /> : null}
              {item.label}
            </span>
            {badge && (
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  active ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminShell({ email, name, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="h-svh overflow-hidden bg-muted/30">
      <div className="mx-auto flex h-full max-w-7xl">
        <aside className="hidden h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-background md:flex">
          <div className="flex h-14 shrink-0 items-center px-4">
            <Link href="/admin" className="text-sm font-semibold tracking-wide">
              Teeshogs Admin
            </Link>
          </div>
          <Separator />
          <div className="p-4">
            <NavLinks />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3 md:px-6">
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open admin menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="border-b border-border px-4 py-3 text-left">
                    <SheetTitle>Teeshogs Admin</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <NavLinks onNavigate={() => setMobileOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <AdminHeaderSearch />

            <div className="ml-auto flex items-center gap-1">
              <AdminNotifications />
              <AdminUserMenu email={email} name={name} />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
