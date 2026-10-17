"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { CartDrawer } from "@/components/cart/CartDrawer"
import { QuickView } from "@/components/products/QuickView"
import { AuthModal } from "@/components/auth/AuthModal"
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat"
import type { NavSection } from "@/lib/navigation"

export function StoreShell({
  children,
  nav,
}: {
  children: ReactNode
  nav: NavSection[]
}) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <>
      <Header nav={nav} />
      <main className="flex-1">{children}</main>
      <Footer nav={nav} />
      <CartDrawer />
      <QuickView />
      <AuthModal />
      <WhatsAppFloat />
    </>
  )
}
