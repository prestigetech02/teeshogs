export type AdminOrder = {
  id: string
  order_number: string
  email: string
  phone: string
  customer_name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string | null
  subtotal: number
  shipping_fee: number
  discount_amount?: number
  coupon_id?: string | null
  coupon_code?: string | null
  total: number
  currency: string
  status: string
  paystack_reference: string | null
  payment_channel?: string | null
  payment_method?: string | null
  paystack_fees?: number | null
  paystack_status?: string | null
  paystack_paid_amount?: number | null
  fez_order_no: string | null
  fez_status: string | null
  shipping_method?: string | null
  shipping_zone_id?: string | null
  shipping_zone_name?: string | null
  paid_at: string | null
  created_at: string
}

export type AdminOrderItem = {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  name: string
  sku: string | null
  size: string | null
  color: string | null
  unit_price: number
  quantity: number
  line_total: number
}

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
}

/** Statuses that trigger a customer email when an admin changes them. */
export const CUSTOMER_NOTIFY_STATUSES: readonly OrderStatus[] = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value)
}

export function orderStatusLabel(status: string) {
  if (isOrderStatus(status)) return STATUS_LABELS[status]
  return status.replace(/_/g, " ")
}

export function shouldNotifyCustomerOnStatus(status: string) {
  return (CUSTOMER_NOTIFY_STATUSES as readonly string[]).includes(status)
}
