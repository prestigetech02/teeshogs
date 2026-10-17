import { z } from "zod"

export type CouponDiscountType = "percent" | "fixed"

export type Coupon = {
  id: string
  code: string
  description: string
  discount_type: CouponDiscountType
  discount_value: number
  min_subtotal: number
  max_discount: number | null
  usage_limit: number | null
  used_count: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CouponStats = {
  total: number
  active: number
  inactive: number
  expired: number
  redemptions: number
}

const emptyToNull = (value: unknown) =>
  value === "" || value === undefined || value === null ? null : value

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(40, "Code is too long")
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores"),
    description: z.string().trim().max(500).optional().nullable(),
    discount_type: z.enum(["percent", "fixed"]),
    discount_value: z.coerce.number<number>().positive("Discount must be greater than 0"),
    min_subtotal: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? 0 : value),
      z.coerce.number<number>().min(0, "Minimum cannot be negative")
    ),
    max_discount: z.preprocess(
      emptyToNull,
      z.coerce.number<number>().positive("Max discount must be greater than 0").nullable()
    ),
    usage_limit: z.preprocess(
      emptyToNull,
      z.coerce
        .number<number>()
        .int("Usage limit must be a whole number")
        .positive("Usage limit must be greater than 0")
        .nullable()
    ),
    starts_at: z.string().optional().nullable(),
    ends_at: z.string().optional().nullable(),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.discount_type === "percent" && values.discount_value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discount_value"],
        message: "Percent discount cannot exceed 100",
      })
    }
    if (values.starts_at && values.ends_at && values.starts_at > values.ends_at) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "End date must be after start date",
      })
    }
  })

export type CouponFormValues = z.infer<typeof couponFormSchema>

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase()
}

export function isCouponExpired(coupon: Pick<Coupon, "ends_at">, now = new Date()) {
  if (!coupon.ends_at) return false
  return new Date(coupon.ends_at).getTime() < now.getTime()
}

export function isCouponNotStarted(coupon: Pick<Coupon, "starts_at">, now = new Date()) {
  if (!coupon.starts_at) return false
  return new Date(coupon.starts_at).getTime() > now.getTime()
}

export function computeCouponStats(coupons: Coupon[]): CouponStats {
  const now = new Date()
  return {
    total: coupons.length,
    active: coupons.filter((coupon) => coupon.is_active && !isCouponExpired(coupon, now)).length,
    inactive: coupons.filter((coupon) => !coupon.is_active).length,
    expired: coupons.filter((coupon) => isCouponExpired(coupon, now)).length,
    redemptions: coupons.reduce((sum, coupon) => sum + (coupon.used_count || 0), 0),
  }
}

export function calculateCouponDiscount(
  coupon: Pick<
    Coupon,
    "discount_type" | "discount_value" | "max_discount" | "min_subtotal"
  >,
  subtotal: number
) {
  const cart = Math.max(0, Number(subtotal) || 0)
  if (cart < Number(coupon.min_subtotal || 0)) {
    return 0
  }

  let discount = 0
  if (coupon.discount_type === "percent") {
    discount = (cart * Number(coupon.discount_value)) / 100
    if (coupon.max_discount != null) {
      discount = Math.min(discount, Number(coupon.max_discount))
    }
  } else {
    discount = Number(coupon.discount_value)
  }

  discount = Math.min(discount, cart)
  return Math.round(discount * 100) / 100
}

export type CouponValidationResult =
  | {
      ok: true
      coupon: Coupon
      discountAmount: number
      message: string
    }
  | { ok: false; error: string }

export function validateCouponForSubtotal(
  coupon: Coupon | null | undefined,
  subtotal: number,
  now = new Date()
): CouponValidationResult {
  if (!coupon) {
    return { ok: false, error: "Coupon not found" }
  }
  if (!coupon.is_active) {
    return { ok: false, error: "This coupon is inactive" }
  }
  if (isCouponNotStarted(coupon, now)) {
    return { ok: false, error: "This coupon is not active yet" }
  }
  if (isCouponExpired(coupon, now)) {
    return { ok: false, error: "This coupon has expired" }
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { ok: false, error: "This coupon has reached its usage limit" }
  }
  if (subtotal < Number(coupon.min_subtotal || 0)) {
    return {
      ok: false,
      error: `Spend at least ₦${Number(coupon.min_subtotal).toLocaleString("en-NG")} to use this coupon`,
    }
  }

  const discountAmount = calculateCouponDiscount(coupon, subtotal)
  if (discountAmount <= 0) {
    return { ok: false, error: "This coupon does not apply to your cart" }
  }

  const label =
    coupon.discount_type === "percent"
      ? `${coupon.discount_value}% off`
      : `₦${Number(coupon.discount_value).toLocaleString("en-NG")} off`

  return {
    ok: true,
    coupon,
    discountAmount,
    message: `${coupon.code} applied · ${label}`,
  }
}

export function couponTypeLabel(type: CouponDiscountType) {
  return type === "percent" ? "Percent" : "Fixed amount"
}

export function couponValueLabel(coupon: Pick<Coupon, "discount_type" | "discount_value">) {
  if (coupon.discount_type === "percent") {
    return `${coupon.discount_value}%`
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(coupon.discount_value) || 0)
}

/** Convert datetime-local form value to ISO, or null. */
export function formDateToIso(value: string | null | undefined) {
  if (!value?.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/** ISO → value for `<input type="datetime-local">`. */
export function isoToDatetimeLocal(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
