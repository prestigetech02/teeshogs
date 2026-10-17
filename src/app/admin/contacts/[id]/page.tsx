import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  contactSubjectLabel,
  type ContactMessage,
} from "@/lib/contacts"
import { AdminContactDetail } from "@/components/admin/AdminContactDetail"
import { Button } from "@/components/ui/button"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Contact ${id.slice(0, 8)} | Teeshogs Admin` }
}

export default async function AdminContactDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) notFound()

  const message = data as ContactMessage

  // Opening a message marks it read (unless already further along).
  if (message.status === "new") {
    await supabase.from("contact_messages").update({ status: "read" }).eq("id", id)
    message.status = "read"
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/contacts">
            <ArrowLeft className="mr-1 size-4" />
            Contacts
          </Link>
        </Button>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Enquiry</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {contactSubjectLabel(message.subject)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          From {message.name} · {message.email}
        </p>
      </div>

      <AdminContactDetail message={message} />
    </div>
  )
}
