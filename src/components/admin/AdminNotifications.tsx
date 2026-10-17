"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { contactSubjectLabel } from "@/lib/contacts"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

type ContactNotice = {
  id: string
  name: string
  subject: string
  status: string
  created_at: string
}

function sortNotices(items: ContactNotice[]) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)
}

export function AdminNotifications() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ContactNotice[]>([])
  const [live, setLive] = useState(false)

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase
      .from("contact_messages")
      .select("id, name, subject, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8)

    setItems((data as ContactNotice[] | null) ?? [])
  }, [])

  useEffect(() => {
    void load()

    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel("admin-contact-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as ContactNotice
            setItems((current) =>
              sortNotices([row, ...current.filter((item) => item.id !== row.id)])
            )
            toast.message("New contact enquiry", {
              description: `${row.name} · ${contactSubjectLabel(row.subject)}`,
              action: {
                label: "Open",
                onClick: () => {
                  window.location.href = `/admin/contacts/${row.id}`
                },
              },
            })
            return
          }

          if (payload.eventType === "UPDATE") {
            const row = payload.new as ContactNotice
            setItems((current) =>
              sortNotices(
                current.map((item) => (item.id === row.id ? { ...item, ...row } : item))
              )
            )
            return
          }

          if (payload.eventType === "DELETE") {
            const row = payload.old as Partial<ContactNotice>
            if (!row.id) return
            setItems((current) => current.filter((item) => item.id !== row.id))
          }
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED")
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [load])

  const unread = items.filter((item) => item.status === "new").length

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) void load()
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="border-b border-border px-3 py-2.5">
          <PopoverTitle className="flex items-center justify-between gap-2">
            <span>Notifications</span>
            <span
              className={`text-[10px] font-normal uppercase tracking-wider ${
                live ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {live ? "Live" : "Connecting…"}
            </span>
          </PopoverTitle>
          <PopoverDescription>
            {unread > 0
              ? `${unread} new contact message${unread === 1 ? "" : "s"}`
              : "You're up to date"}
          </PopoverDescription>
        </PopoverHeader>
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/contacts/${item.id}`}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {contactSubjectLabel(item.subject)}
                    </span>
                    {item.status === "new" && (
                      <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.name} · {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border px-3 py-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-center">
            <Link href="/admin/contacts" onClick={() => setOpen(false)}>
              View all contacts
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
