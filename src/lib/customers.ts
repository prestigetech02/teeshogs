import type { UserRole } from "@/lib/supabase"

export type CustomerProfile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  notes: string
  created_at: string
  updated_at?: string
}

export type CustomerOrderSummary = {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  paid_at: string | null
}

export type CustomerListItem = {
  key: string
  kind: "registered" | "guest"
  id: string | null
  full_name: string
  email: string
  phone: string | null
  role: UserRole | "guest"
  notes: string
  created_at: string
  order_count: number
  total_spent: number
  last_order_at: string | null
}

export type CustomerStats = {
  total: number
  registered: number
  guests: number
  admins: number
  withOrders: number
}

export type CustomerOrderRow = {
  id: string
  order_number?: string
  user_id: string | null
  email: string
  phone: string | null
  customer_name: string
  status: string
  total: number
  created_at: string
  paid_at: string | null
}

const PAID_STATUSES = new Set(["paid", "processing", "shipped", "delivered"])

export function isPaidOrderStatus(status: string) {
  return PAID_STATUSES.has(status)
}

export function computeCustomerStats(customers: CustomerListItem[]): CustomerStats {
  return {
    total: customers.length,
    registered: customers.filter((item) => item.kind === "registered").length,
    guests: customers.filter((item) => item.kind === "guest").length,
    admins: customers.filter((item) => item.role === "admin").length,
    withOrders: customers.filter((item) => item.order_count > 0).length,
  }
}

function summarizeOrders(orders: CustomerOrderRow[]) {
  let order_count = 0
  let total_spent = 0
  let last_order_at: string | null = null
  let phone: string | null = null
  let name = ""

  for (const order of orders) {
    order_count += 1
    if (isPaidOrderStatus(order.status)) {
      total_spent += Number(order.total) || 0
    }
    if (!last_order_at || order.created_at > last_order_at) {
      last_order_at = order.created_at
    }
    if (!phone && order.phone) phone = order.phone
    if (!name && order.customer_name) name = order.customer_name
  }

  return { order_count, total_spent, last_order_at, phone, name }
}

/** Merge profiles + guest checkout emails into one admin list. */
export function buildCustomerList(
  profiles: CustomerProfile[],
  orders: CustomerOrderRow[]
): CustomerListItem[] {
  const profileEmails = new Set(
    profiles.map((profile) => profile.email.trim().toLowerCase()).filter(Boolean)
  )
  const profileIds = new Set(profiles.map((profile) => profile.id))

  const ordersByUser = new Map<string, CustomerOrderRow[]>()
  const ordersByEmail = new Map<string, CustomerOrderRow[]>()

  for (const order of orders) {
    if (order.user_id) {
      const list = ordersByUser.get(order.user_id) ?? []
      list.push(order)
      ordersByUser.set(order.user_id, list)
    }
    const email = order.email.trim().toLowerCase()
    if (email) {
      const list = ordersByEmail.get(email) ?? []
      list.push(order)
      ordersByEmail.set(email, list)
    }
  }

  const registered: CustomerListItem[] = profiles.map((profile) => {
    const email = profile.email.trim().toLowerCase()
    const merged = new Map<string, CustomerOrderRow>()
    for (const order of ordersByUser.get(profile.id) ?? []) {
      merged.set(order.id, order)
    }
    for (const order of email ? ordersByEmail.get(email) ?? [] : []) {
      merged.set(order.id, order)
    }
    const summary = summarizeOrders([...merged.values()])

    return {
      key: `user:${profile.id}`,
      kind: "registered",
      id: profile.id,
      full_name: profile.full_name || summary.name || "—",
      email: profile.email,
      phone: profile.phone || summary.phone || null,
      role: profile.role,
      notes: profile.notes || "",
      created_at: profile.created_at,
      order_count: summary.order_count,
      total_spent: summary.total_spent,
      last_order_at: summary.last_order_at,
    }
  })

  const guests: CustomerListItem[] = []
  for (const [email, emailOrders] of ordersByEmail) {
    if (profileEmails.has(email)) continue
    // Skip if every order is already tied to a known registered user
    const onlyLinked = emailOrders.every(
      (order) => order.user_id && profileIds.has(order.user_id)
    )
    if (onlyLinked) continue

    const guestOrders = emailOrders.filter(
      (order) => !order.user_id || !profileIds.has(order.user_id)
    )
    if (guestOrders.length === 0) continue

    const summary = summarizeOrders(guestOrders)
    guests.push({
      key: `guest:${email}`,
      kind: "guest",
      id: null,
      full_name: summary.name || "Guest",
      email,
      phone: summary.phone,
      role: "guest",
      notes: "",
      created_at: summary.last_order_at || new Date(0).toISOString(),
      order_count: summary.order_count,
      total_spent: summary.total_spent,
      last_order_at: summary.last_order_at,
    })
  }

  return [...registered, ...guests].sort((a, b) => {
    const aTime = a.last_order_at || a.created_at
    const bTime = b.last_order_at || b.created_at
    return bTime.localeCompare(aTime)
  })
}

export function guestCustomerHref(email: string) {
  return `/admin/customers/guest/${encodeURIComponent(email.trim().toLowerCase())}`
}

export function customerHref(item: Pick<CustomerListItem, "kind" | "id" | "email">) {
  if (item.kind === "registered" && item.id) {
    return `/admin/customers/${item.id}`
  }
  return guestCustomerHref(item.email)
}

export function ordersForCustomer(
  orders: CustomerOrderRow[],
  opts: { userId?: string | null; email: string }
) {
  const email = opts.email.trim().toLowerCase()
  const merged = new Map<string, CustomerOrderRow>()
  for (const order of orders) {
    const matchesUser = Boolean(opts.userId && order.user_id === opts.userId)
    const matchesEmail = order.email.trim().toLowerCase() === email
    if (matchesUser || matchesEmail) {
      merged.set(order.id, order)
    }
  }
  return [...merged.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}
