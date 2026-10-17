"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ExternalLink, Trash2 } from "lucide-react"
import {
  deleteContactMessage,
  updateContactStatus,
} from "@/app/admin/contacts/actions"
import {
  CONTACT_STATUSES,
  contactStatusLabel,
  contactStatusVariant,
  contactSubjectLabel,
  mailtoForContact,
  type ContactMessage,
  type ContactStatus,
} from "@/lib/contacts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function AdminContactDetail({ message }: { message: ContactMessage }) {
  const router = useRouter()
  const [status, setStatus] = useState(message.status)
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const onStatusChange = (next: string) => {
    setStatus(next)
    startTransition(async () => {
      const result = await updateContactStatus(message.id, next)
      if (!result.ok) {
        setStatus(message.status)
        toast.error(result.error)
        return
      }
      toast.success(`Marked as ${contactStatusLabel(next)}`)
      router.refresh()
    })
  }

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteContactMessage(message.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Message deleted")
      router.push("/admin/contacts")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={contactStatusVariant(status)}>
            {contactStatusLabel(status)}
          </Badge>
          <Badge variant="outline">{contactSubjectLabel(message.subject)}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={mailtoForContact(message)}>
              <ExternalLink className="mr-2 size-4" />
              Reply by email
            </a>
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <section className="space-y-4 rounded-lg border p-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest">Message</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
          </div>
        </section>

        <aside className="space-y-4 rounded-lg border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest">Details</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">From</dt>
              <dd className="mt-0.5 font-medium">{message.name}</dd>
              <dd>
                <a
                  href={`mailto:${message.email}`}
                  className="text-xs underline-offset-4 hover:underline"
                >
                  {message.email}
                </a>
              </dd>
            </div>
            {message.order_number ? (
              <div>
                <dt className="text-muted-foreground">Order number</dt>
                <dd className="mt-0.5 font-mono text-xs">{message.order_number}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Received</dt>
              <dd className="mt-0.5">
                {new Date(message.created_at).toLocaleString("en-NG")}
              </dd>
            </div>
          </dl>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="contact-status">Status</Label>
            <Select value={status} onValueChange={onStatusChange} disabled={pending}>
              <SelectTrigger id="contact-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_STATUSES.map((value: ContactStatus) => (
                  <SelectItem key={value} value={value}>
                    {contactStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </aside>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the enquiry from {message.name}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault()
                onDelete()
              }}
            >
              {pending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
