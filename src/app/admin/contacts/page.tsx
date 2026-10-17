import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { ContactMessage } from "@/lib/contacts"
import { AdminContactsTable } from "@/components/admin/AdminContactsTable"

export const metadata: Metadata = {
  title: "Contacts | Teeshogs Admin",
}

export default async function AdminContactsPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)

  const messages = (data as ContactMessage[] | null) ?? []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Inbox</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Contacts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enquiries submitted through the storefront contact form.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load messages. Confirm the contact_messages migration is applied. (
          {error.message})
        </p>
      ) : (
        <AdminContactsTable messages={messages} />
      )}
    </div>
  )
}
