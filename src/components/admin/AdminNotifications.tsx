"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { useAdminAlerts } from "@/components/admin/AdminAlertsProvider"
import { contactSubjectLabel } from "@/lib/contacts"
import { formatNGN } from "@/lib/money"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

export function AdminNotifications() {
  const [open, setOpen] = useState(false)
  const {
    live,
    newContacts,
    actionableOrders,
    bellCount,
    bellCountLabel,
    recentContacts,
    recentOrders,
    refresh,
  } = useAdminAlerts()

  const hasItems = recentOrders.length > 0 || recentContacts.length > 0

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) void refresh()
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {bellCountLabel ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {bellCountLabel}
            </span>
          ) : null}
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
            {bellCount > 0
              ? [
                  actionableOrders > 0
                    ? `${actionableOrders} paid order${actionableOrders === 1 ? "" : "s"}`
                    : null,
                  newContacts > 0
                    ? `${newContacts} new contact${newContacts === 1 ? "" : "s"}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "You're up to date"}
          </PopoverDescription>
        </PopoverHeader>

        {!hasItems ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto py-1">
            {recentOrders.length > 0 ? (
              <div>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Orders
                </p>
                <ul>
                  {recentOrders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-muted"
                        onClick={() => setOpen(false)}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{order.order_number}</span>
                          <span className="shrink-0 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Paid
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.customer_name} · {formatNGN(Number(order.total))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {recentContacts.length > 0 ? (
              <div>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Contacts
                </p>
                <ul>
                  {recentContacts.map((item) => (
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
                          {item.status === "new" ? (
                            <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.name} · {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 border-t border-border px-2 py-2">
          <Button asChild variant="ghost" size="sm" className="justify-center">
            <Link href="/admin/orders" onClick={() => setOpen(false)}>
              Orders
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="justify-center">
            <Link href="/admin/notifications" onClick={() => setOpen(false)}>
              All alerts
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
