import type { Metadata } from "next"
import { AdminComingSoon } from "@/components/admin/AdminComingSoon"

export const metadata: Metadata = {
  title: "Newsletters | Teeshogs Admin",
}

export default function AdminNewslettersPage() {
  return (
    <AdminComingSoon
      eyebrow="Marketing"
      title="Newsletters"
      description="Manage email campaigns and subscriber lists."
      detail="Newsletter drafts and sends will land with the marketing phase."
    />
  )
}
