"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingBag,
  Search,
  User,
  Heart,
  Menu,
  X,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { BrandLogo } from "@/components/layout/BrandLogo"
import { ModeToggle } from "@/components/mode-toggle"
import { useStore } from "@/context/StoreContext"
import type { NavItem, NavSection } from "@/lib/navigation"
import { formatNGN, getFreeShippingThresholdNgn } from "@/lib/money"
import { cn } from "@/lib/utils"

function hasDropdown(section: NavSection) {
  return section.label !== "Contact Us" && section.items.length > 0
}

function MobileNavItems({
  items,
  onNavigate,
}: {
  items: NavItem[]
  onNavigate: () => void
}) {
  return (
    <ul className="flex flex-col gap-0.5 border-l border-border pl-3">
      {items.map((item) => (
        <li key={item.href + item.label}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className="block rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
          {item.children && item.children.length > 0 ? (
            <ul className="mt-0.5 flex flex-col gap-0.5 border-l border-border/70 pl-3">
              {item.children.map((child) => (
                <li key={child.href + child.label}>
                  <Link
                    href={child.href}
                    onClick={onNavigate}
                    className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function DesktopNavItems({ items }: { items: NavItem[] }) {
  return (
    <ul className="grid w-[18rem] gap-0.5 p-2">
      {items.map((item) => (
        <li key={item.href + item.label}>
          <NavigationMenuLink asChild>
            <Link
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              {item.label}
            </Link>
          </NavigationMenuLink>
          {item.children && item.children.length > 0 ? (
            <ul className="mb-1 ml-2 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
              {item.children.map((child) => (
                <li key={child.href + child.label}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={child.href}
                      className="block rounded-md px-2 py-1.5 text-sm leading-none text-muted-foreground no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      {child.label}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function Header({ nav }: { nav: NavSection[] }) {
  const { cartCount, setIsCartOpen, setIsAuthOpen, user, compareList, setIsCompareOpen } =
    useStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const freeShippingAt = getFreeShippingThresholdNgn()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-center gap-3 px-4 py-2">
          <p className="min-w-0 text-center text-[10px] uppercase tracking-widest sm:text-xs">
            Free shipping on orders over {formatNGN(freeShippingAt, { compact: true })}
            &nbsp;·&nbsp; Use code TEESHOGS10 for 10% off your first order
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Left: menu */}
          <div className="flex min-w-0 items-center justify-start">
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(100%,20rem)] overflow-y-auto">
                  <div className="flex flex-col gap-6 pt-6">
                    <BrandLogo />
                    <nav className="flex flex-col gap-1">
                      {nav.map((section) =>
                        hasDropdown(section) ? (
                          <Collapsible
                            key={section.label}
                            open={!!openSections[section.label]}
                            onOpenChange={() => toggleSection(section.label)}
                          >
                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium hover:bg-muted">
                              {section.label}
                              <ChevronDown
                                className={cn(
                                  "size-4 text-muted-foreground transition-transform",
                                  openSections[section.label] && "rotate-180"
                                )}
                              />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pb-2 pl-2">
                              <MobileNavItems
                                items={section.items}
                                onNavigate={() => setMobileOpen(false)}
                              />
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <Link
                            key={section.label}
                            href={section.href || "/"}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                          >
                            {section.label}
                          </Link>
                        )
                      )}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <NavigationMenu className="hidden lg:flex" viewport={false}>
              <NavigationMenuList className="gap-0">
                {nav.map((section) =>
                  hasDropdown(section) ? (
                    <NavigationMenuItem key={section.label}>
                      <NavigationMenuTrigger className="bg-transparent px-2.5 text-sm font-medium tracking-wide hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent xl:px-3">
                        {section.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <DesktopNavItems items={section.items} />
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    <NavigationMenuItem key={section.label}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={section.href || "/"}
                          className="inline-flex h-9 items-center px-2.5 text-sm font-medium tracking-wide transition-colors hover:text-foreground/80 xl:px-3"
                        >
                          {section.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Center: logo */}
          <BrandLogo priority className="shrink-0 justify-self-center" />

          {/* Right: actions */}
          <div className="flex items-center justify-end gap-1">
            <ModeToggle />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="size-5" />
            </Button>

            {compareList.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsCompareOpen(true)}
              >
                <SlidersHorizontal className="size-5" />
                <Badge className="absolute -top-1 -right-1 flex size-4 items-center justify-center p-0 text-[10px]">
                  {compareList.length}
                </Badge>
              </Button>
            )}

            <Button variant="ghost" size="icon" aria-label="Wishlist" className="hidden sm:flex">
              <Heart className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label={user ? "Account" : "Sign in"}
              onClick={() => setIsAuthOpen(true)}
            >
              <User className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Cart"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 flex size-4 items-center justify-center p-0 text-[10px]">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-border py-3">
            <form onSubmit={handleSearch} className="relative mx-auto max-w-xl">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for styles, fabrics, occasions..."
                className="pr-10 pl-10"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-2 -translate-y-1/2"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery("")
                }}
              >
                <X className="size-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
