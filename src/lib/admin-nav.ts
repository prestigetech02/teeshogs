export type AdminNavChild = {
  label: string
  href: string
  exact?: boolean
}

export type AdminNavItem = {
  label: string
  href: string
  exact?: boolean
  badge?: string
  children?: AdminNavChild[]
}

const productMetaRoutes = new Set(["brands", "categories", "attributes"])

/** Product list / create / edit — not brands/categories/attributes. */
export function isProductCatalogListPath(pathname: string) {
  if (pathname === "/admin/products" || pathname.startsWith("/admin/products/new")) {
    return true
  }
  const match = pathname.match(/^\/admin\/products\/([^/]+)/)
  if (!match) return false
  return !productMetaRoutes.has(match[1])
}

export const adminNav: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    exact: true,
  },
  {
    label: "Products",
    href: "/admin/products",
    children: [
      { label: "All Products", href: "/admin/products", exact: true },
      { label: "Brands", href: "/admin/products/brands" },
      { label: "Categories", href: "/admin/products/categories" },
      { label: "Attributes", href: "/admin/products/attributes" },
    ],
  },
  {
    label: "Coupons",
    href: "/admin/coupons",
  },
  {
    label: "Newsletters",
    href: "/admin/newsletters",
    badge: "Soon",
  },
  {
    label: "Contacts",
    href: "/admin/contacts",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
  },
  {
    label: "Shipping",
    href: "/admin/shipping",
  },
  {
    label: "Payments",
    href: "/admin/payments",
  },
  {
    label: "Orders",
    href: "/admin/orders",
  },
  {
    label: "Customers",
    href: "/admin/customers",
  },
  {
    label: "Settings",
    href: "/admin/settings",
  },
]

export const LOW_STOCK_THRESHOLD = 10
