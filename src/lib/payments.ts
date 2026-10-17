import { isPaidOrderStatus } from "@/lib/customers"
import { orderStatusLabel } from "@/lib/admin-orders"

export type PaymentRow = {
  id: string
  order_number: string
  email: string
  customer_name: string
  total: number
  currency: string
  status: string
  paystack_reference: string | null
  paystack_access_code?: string | null
  paid_at: string | null
  created_at: string
  payment_channel: string | null
  payment_method: string | null
  paystack_fees: number | null
  paystack_status: string | null
  paystack_paid_amount: number | null
  discount_amount?: number
}

export type PaymentStats = {
  totalPayments: number
  successful: number
  pending: number
  failed: number
  volumeNgn: number
  feesNgn: number
  todayVolumeNgn: number
}

export function paymentStatusLabel(status: string) {
  if (status === "pending_payment") return "Pending"
  if (status === "failed") return "Failed"
  if (status === "cancelled") return "Cancelled"
  if (isPaidOrderStatus(status)) return "Successful"
  return orderStatusLabel(status)
}

export function paymentStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  if (isPaidOrderStatus(status)) return "default"
  if (status === "failed" || status === "cancelled") return "destructive"
  if (status === "pending_payment") return "outline"
  return "secondary"
}

export function computePaymentStats(payments: PaymentRow[]): PaymentStats {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayIso = startOfToday.toISOString()

  let successful = 0
  let pending = 0
  let failed = 0
  let volumeNgn = 0
  let feesNgn = 0
  let todayVolumeNgn = 0

  for (const payment of payments) {
    if (isPaidOrderStatus(payment.status)) {
      successful += 1
      const amount = Number(payment.paystack_paid_amount ?? payment.total) || 0
      volumeNgn += amount
      feesNgn += Number(payment.paystack_fees || 0)
      const paidAt = payment.paid_at || payment.created_at
      if (paidAt >= todayIso) todayVolumeNgn += amount
    } else if (payment.status === "pending_payment") {
      pending += 1
    } else if (payment.status === "failed" || payment.status === "cancelled") {
      failed += 1
    }
  }

  return {
    totalPayments: payments.length,
    successful,
    pending,
    failed,
    volumeNgn,
    feesNgn,
    todayVolumeNgn,
  }
}

export function getPaystackPublicKeyPreview() {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || ""
  if (!key) return null
  if (key.length <= 12) return key
  return `${key.slice(0, 10)}…${key.slice(-4)}`
}

export function isPaystackTestMode() {
  const key =
    process.env.PAYSTACK_SECRET_KEY?.trim() ||
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ||
    ""
  return key.startsWith("sk_test") || key.startsWith("pk_test")
}
