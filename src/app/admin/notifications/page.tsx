import type { Metadata } from "next"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ContactMessage } from "@/lib/contacts"
import { AdminContactsTable } from "@/components/admin/AdminContactsTable"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Notifications | Teeshogs Admin",
}

export default async function AdminNotificationsPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  const messages = (data as ContactMessage[] | null) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Inbox</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live contact enquiries. Paid orders and new messages also appear on the header bell and
            sidebar badges in real time.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/contacts">Open contacts</Link>
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load notifications. ({error.message})
        </p>
      ) : (
        <AdminContactsTable messages={messages} />
      )}
    </div>
  )
}
