/** Storefront currency is NGN. Product prices are stored as Naira major units. */

export const CURRENCY = "NGN" as const

export function getFreeShippingThresholdNgn() {
  const raw = process.env.NEXT_PUBLIC_FREE_SHIPPING_NGN?.trim()
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 150_000
}

export function formatNGN(amount: number, options?: { compact?: boolean }) {
  const value = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: options?.compact ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Paystack expects amounts in kobo (NGN * 100). */
export function toKobo(amountNgn: number) {
  return Math.round(Number(amountNgn) * 100)
}

export function fromKobo(amountKobo: number) {
  return Number(amountKobo) / 100
}

export function qualifiesForFreeShipping(subtotalNgn: number) {
  return subtotalNgn >= getFreeShippingThresholdNgn()
}
