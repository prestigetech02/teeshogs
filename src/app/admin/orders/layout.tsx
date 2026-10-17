import type { ReactNode } from "react"
import { AdminProtected } from "@/components/admin/AdminProtected"

export default function AdminOrdersLayout({ children }: { children: ReactNode }) {
  return <AdminProtected>{children}</AdminProtected>
}
