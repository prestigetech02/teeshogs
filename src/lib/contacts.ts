import { contactSubjects } from "@/lib/contact"

export const CONTACT_STATUSES = ["new", "read", "replied", "archived"] as const

export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export type ContactMessage = {
  id: string
  name: string
  email: string
  subject: string
  order_number: string | null
  message: string
  status: ContactStatus | string
  created_at: string
}

export type ContactStats = {
  total: number
  newCount: number
  read: number
  replied: number
  archived: number
}

const STATUS_LABELS: Record<ContactStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
}

export function isContactStatus(value: string): value is ContactStatus {
  return (CONTACT_STATUSES as readonly string[]).includes(value)
}

export function contactStatusLabel(status: string) {
  if (isContactStatus(status)) return STATUS_LABELS[status]
  return status
}

export function contactStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "new") return "destructive"
  if (status === "replied") return "default"
  if (status === "archived") return "secondary"
  return "outline"
}

export function contactSubjectLabel(subject: string) {
  return contactSubjects.find((item) => item.value === subject)?.label ?? subject
}

export function computeContactStats(messages: ContactMessage[]): ContactStats {
  return {
    total: messages.length,
    newCount: messages.filter((item) => item.status === "new").length,
    read: messages.filter((item) => item.status === "read").length,
    replied: messages.filter((item) => item.status === "replied").length,
    archived: messages.filter((item) => item.status === "archived").length,
  }
}

export function mailtoForContact(message: Pick<ContactMessage, "email" | "name" | "subject">) {
  const subjectLabel = contactSubjectLabel(message.subject)
  const params = new URLSearchParams({
    subject: `Re: ${subjectLabel} — Teeshogs`,
    body: `Hi ${message.name.split(/\s+/)[0] || "there"},\n\n`,
  })
  return `mailto:${message.email}?${params.toString()}`
}
