"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { contactSubjectLabel } from "@/lib/contacts"
import { formatNGN } from "@/lib/money"
import {
  formatAlertCount,
  isActionableOrderStatus,
  type AdminContactNotice,
  type AdminOrderNotice,
} from "@/lib/admin-alerts"

type AdminAlertsContextValue = {
  live: boolean
  newContacts: number
  actionableOrders: number
  bellCount: number
  bellCountLabel: string | null
  ordersCountLabel: string | null
  notificationsCountLabel: string | null
  recentContacts: AdminContactNotice[]
  recentOrders: AdminOrderNotice[]
  refresh: () => Promise<void>
}

const AdminAlertsContext = createContext<AdminAlertsContextValue | null>(null)

function sortByCreatedAt<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)
}

export function AdminAlertsProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState(false)
  const [contacts, setContacts] = useState<AdminContactNotice[]>([])
  const [orders, setOrders] = useState<AdminOrderNotice[]>([])
  const [actionableOrders, setActionableOrders] = useState(0)

  const refresh = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const [contactsRes, recentOrdersRes, actionableRes] = await Promise.all([
      supabase
        .from("contact_messages")
        .select("id, name, subject, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("orders")
        .select("id, order_number, customer_name, status, total, created_at, paid_at")
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(8),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid"),
    ])

    setContacts((contactsRes.data as AdminContactNotice[] | null) ?? [])
    setOrders((recentOrdersRes.data as AdminOrderNotice[] | null) ?? [])
    setActionableOrders(actionableRes.count ?? 0)
  }, [])

  useEffect(() => {
    void refresh()

    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel("admin-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as AdminContactNotice
            setContacts((current) =>
              sortByCreatedAt([row, ...current.filter((item) => item.id !== row.id)])
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
            const row = payload.new as AdminContactNotice
            setContacts((current) =>
              sortByCreatedAt(
                current.map((item) => (item.id === row.id ? { ...item, ...row } : item))
              )
            )
            return
          }

          if (payload.eventType === "DELETE") {
            const row = payload.old as Partial<AdminContactNotice>
            if (!row.id) return
            setContacts((current) => current.filter((item) => item.id !== row.id))
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as AdminOrderNotice
            if (!isActionableOrderStatus(row.status)) return
            setOrders((current) =>
              sortByCreatedAt([row, ...current.filter((item) => item.id !== row.id)])
            )
            setActionableOrders((count) => count + 1)
            toast.message("New paid order", {
              description: `${row.order_number} · ${formatNGN(Number(row.total))}`,
              action: {
                label: "Open",
                onClick: () => {
                  window.location.href = `/admin/orders/${row.id}`
                },
              },
            })
            return
          }

          if (payload.eventType === "UPDATE") {
            const row = payload.new as AdminOrderNotice
            const prev = payload.old as Partial<AdminOrderNotice>
            const wasActionable = isActionableOrderStatus(String(prev.status ?? ""))
            const isActionable = isActionableOrderStatus(row.status)

            setOrders((current) => {
              const without = current.filter((item) => item.id !== row.id)
              if (!isActionable) return without
              return sortByCreatedAt([row, ...without])
            })

            if (!wasActionable && isActionable) {
              setActionableOrders((count) => count + 1)
              toast.message("New paid order", {
                description: `${row.order_number} · ${formatNGN(Number(row.total))}`,
                action: {
                  label: "Open",
                  onClick: () => {
                    window.location.href = `/admin/orders/${row.id}`
                  },
                },
              })
            } else if (wasActionable && !isActionable) {
              setActionableOrders((count) => Math.max(0, count - 1))
            } else if (isActionable) {
              // Keep count stable; refresh list fields only.
            }
            return
          }

          if (payload.eventType === "DELETE") {
            const row = payload.old as Partial<AdminOrderNotice>
            if (!row.id) return
            const wasActionable = isActionableOrderStatus(String(row.status ?? ""))
            setOrders((current) => current.filter((item) => item.id !== row.id))
            if (wasActionable) {
              setActionableOrders((count) => Math.max(0, count - 1))
            }
          }
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED")
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refresh])

  const newContacts = useMemo(
    () => contacts.filter((item) => item.status === "new").length,
    [contacts]
  )

  const value = useMemo<AdminAlertsContextValue>(() => {
    const bellCount = newContacts + actionableOrders
    return {
      live,
      newContacts,
      actionableOrders,
      bellCount,
      bellCountLabel: formatAlertCount(bellCount),
      ordersCountLabel: formatAlertCount(actionableOrders),
      // Notifications hub surfaces both contacts + orders.
      notificationsCountLabel: formatAlertCount(bellCount),
      recentContacts: contacts,
      recentOrders: orders,
      refresh,
    }
  }, [live, newContacts, actionableOrders, contacts, orders, refresh])

  return (
    <AdminAlertsContext.Provider value={value}>{children}</AdminAlertsContext.Provider>
  )
}

export function useAdminAlerts() {
  const context = useContext(AdminAlertsContext)
  if (!context) {
    throw new Error("useAdminAlerts must be used within AdminAlertsProvider")
  }
  return context
}
