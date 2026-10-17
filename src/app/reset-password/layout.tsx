import type { Metadata } from "next"
import type { ReactNode } from "react"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Reset password",
  description: "Set a new Teeshogs account password.",
  path: "/reset-password",
  noIndex: true,
})

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children
}
