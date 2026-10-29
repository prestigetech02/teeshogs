/** Orders that still need admin attention (paid, not yet processing/shipped). */
export const ACTIONABLE_ORDER_STATUSES = ["paid"] as const

export type AdminOrderNotice = {
  id: string
  order_number: string
  customer_name: string
  status: string
  total: number
  created_at: string
  paid_at: string | null
}

export type AdminContactNotice = {
  id: string
  name: string
  subject: string
  status: string
  created_at: string
}

export function isActionableOrderStatus(status: string) {
  return (ACTIONABLE_ORDER_STATUSES as readonly string[]).includes(status)
}

export function formatAlertCount(count: number) {
  if (count <= 0) return null
  if (count > 99) return "99+"
  return String(count)
}
