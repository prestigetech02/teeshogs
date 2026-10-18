export type NavItem = {
  label: string
  href: string
  children?: NavItem[]
}

export type NavSection = {
  label: string
  href?: string
  items: NavItem[]
}

export type NavCategory = {
  label: string
  slug: string
  children?: NavCategory[]
}

const shopUtilityItems: NavItem[] = [
  { label: "Shop All", href: "/shop" },
  { label: "New Arrivals", href: "/shop?filter=new" },
  { label: "Best Sellers", href: "/shop?filter=bestsellers" },
]

const staticSections: NavSection[] = [
  {
    label: "About Teeshogs",
    href: "/about",
    items: [],
  },
  {
    label: "Our Fabrics & Craft",
    href: "/fabrics",
    items: [],
  },
  {
    label: "Contact Us",
    href: "/contact",
    items: [
      { label: "FAQs", href: "/faqs" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "Shipping & Delivery", href: "/shipping" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
]

function categoryToNavItem(category: NavCategory): NavItem {
  return {
    label: category.label,
    href: `/shop?category=${encodeURIComponent(category.slug)}`,
    children: category.children?.map(categoryToNavItem),
  }
}

/** Build storefront nav. Shop dropdown uses active admin categories (with children). */
export function buildMainNav(categories: NavCategory[] = []): NavSection[] {
  return [
    {
      label: "Home",
      href: "/",
      items: [],
    },
    {
      label: "Shop",
      href: "/shop",
      items: [...shopUtilityItems, ...categories.map(categoryToNavItem)],
    },
    ...staticSections,
  ]
}

/** Static fallback when categories have not been loaded yet. */
export const mainNav = buildMainNav([])
