import type { ReactNode } from "react"
import { AdminProtected } from "@/components/admin/AdminProtected"

export default function AdminProductsLayout({ children }: { children: ReactNode }) {
  return <AdminProtected>{children}</AdminProtected>
}
