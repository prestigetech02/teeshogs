"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, Lock, MapPin, ShoppingBag, Truck, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/context/StoreContext"
import { resolveProductImageSrc } from "@/lib/product-images"
import { getCartItemUnitPrice } from "@/lib/product-variants"
import { formatNGN, getFreeShippingThresholdNgn } from "@/lib/money"
import { NIGERIA_STATES } from "@/lib/nigeria-states"
import type { ShippingMethod } from "@/lib/shipping-zones"

type QuoteState = {
  loading: boolean
  totalCost: number | null
  freeShipping: boolean
  error: string | null
}

type CheckoutZone = {
  id: string
  name: string
  fee: number
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id?: string
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className ?? "space-y-2"}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function CheckoutForm() {
  const { cart, cartTotal, cartCount, user } = useStore()
  const freeShippingAt = getFreeShippingThresholdNgn()
  const remainingForFreeShipping = Math.max(0, freeShippingAt - cartTotal)
  const freeShippingProgress = Math.min(100, (cartTotal / freeShippingAt) * 100)

  const [customerName, setCustomerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [states, setStates] = useState<string[]>([...NIGERIA_STATES])
  const [zones, setZones] = useState<CheckoutZone[]>([])
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("fez")
  const [shippingZoneId, setShippingZoneId] = useState("")
  const [zoneModalOpen, setZoneModalOpen] = useState(false)
  const [pendingZoneId, setPendingZoneId] = useState("")
  const [quote, setQuote] = useState<QuoteState>({
    loading: false,
    totalCost: null,
    freeShipping: false,
    error: null,
  })
  const [couponInput, setCouponInput] = useState("")
  const [couponApplying, setCouponApplying] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
    message: string
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === shippingZoneId) ?? null,
    [zones, shippingZoneId]
  )
  const hasManualZones = zones.length > 0

  useEffect(() => {
    if (user?.email) setEmail(user.email)
    const metaName =
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined)
    if (metaName) setCustomerName(metaName)
  }, [user])

  useEffect(() => {
    let cancelled = false
    fetch("/api/shipping/states")
      .then((res) => res.json())
      .then((data: { states?: string[] }) => {
        if (!cancelled && data.states?.length) setStates(data.states)
      })
      .catch(() => {
        /* keep fallback */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/shipping/zones")
      .then((res) => res.json())
      .then((data: { zones?: CheckoutZone[] }) => {
        if (cancelled || !data.zones?.length) return
        setZones(
          data.zones.map((zone) => ({
            id: zone.id,
            name: zone.name,
            fee: Number(zone.fee),
          }))
        )
      })
      .catch(() => {
        /* Fez-only checkout still works */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasManualZones && shippingMethod === "manual") {
      setShippingMethod("fez")
      setShippingZoneId("")
    }
  }, [hasManualZones, shippingMethod])

  useEffect(() => {
    const needsFezState = shippingMethod === "fez"
    const needsZone = shippingMethod === "manual"

    if ((needsFezState && !state) || (needsZone && !shippingZoneId)) {
      setQuote({ loading: false, totalCost: null, freeShipping: false, error: null })
      return
    }

    let cancelled = false
    setQuote((prev) => ({ ...prev, loading: true, error: null }))

    ;(async () => {
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: shippingMethod,
            state: state || undefined,
            zoneId: shippingZoneId || null,
            subtotal: cartTotal,
          }),
        })
        const data = (await res.json()) as {
          totalCost?: number
          freeShipping?: boolean
          error?: string
        }
        if (cancelled) return
        if (!res.ok) throw new Error(data.error || "Could not quote shipping")
        setQuote({
          loading: false,
          totalCost: Number(data.totalCost ?? 0),
          freeShipping: Boolean(data.freeShipping),
          error: null,
        })
      } catch (error) {
        if (cancelled) return
        setQuote({
          loading: false,
          totalCost: null,
          freeShipping: false,
          error: error instanceof Error ? error.message : "Could not quote shipping",
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [shippingMethod, state, shippingZoneId, cartTotal])

  const appliedCouponCode = appliedCoupon?.code ?? null

  useEffect(() => {
    if (!appliedCouponCode) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: appliedCouponCode, subtotal: cartTotal }),
        })
        const data = (await res.json()) as {
          discountAmount?: number
          message?: string
          error?: string
        }
        if (cancelled) return
        if (!res.ok) {
          setAppliedCoupon(null)
          toast.error(data.error || "Coupon no longer applies to this cart")
          return
        }
        setAppliedCoupon({
          code: appliedCouponCode,
          discountAmount: Number(data.discountAmount ?? 0),
          message: data.message || "Coupon applied",
        })
      } catch {
        if (!cancelled) {
          setAppliedCoupon(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cartTotal, appliedCouponCode])

  const shippingFee = quote.totalCost
  const discountAmount = appliedCoupon?.discountAmount ?? 0
  const total =
    shippingFee === null
      ? null
      : Math.max(0, cartTotal - discountAmount) +
        (Number.isFinite(shippingFee) ? shippingFee : 0)

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code) {
      toast.error("Enter a coupon code")
      return
    }
    setCouponApplying(true)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: cartTotal }),
      })
      const data = (await res.json()) as {
        code?: string
        discountAmount?: number
        message?: string
        error?: string
      }
      if (!res.ok) throw new Error(data.error || "Invalid coupon")
      setAppliedCoupon({
        code: data.code || code.toUpperCase(),
        discountAmount: Number(data.discountAmount ?? 0),
        message: data.message || "Coupon applied",
      })
      setCouponInput("")
      toast.success(data.message || "Coupon applied")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply coupon")
    } finally {
      setCouponApplying(false)
    }
  }

  const canPay = useMemo(() => {
    const shippingReady =
      shippingMethod === "fez"
        ? Boolean(state.trim())
        : Boolean(shippingZoneId)
    return (
      Boolean(
        customerName.trim() &&
          email.trim() &&
          phone.trim() &&
          addressLine1.trim() &&
          city.trim() &&
          state.trim()
      ) &&
      shippingReady &&
      shippingFee !== null &&
      !quote.loading &&
      !quote.error &&
      cart.length > 0 &&
      !submitting
    )
  }, [
    customerName,
    email,
    phone,
    addressLine1,
    city,
    state,
    shippingMethod,
    shippingZoneId,
    shippingFee,
    quote.loading,
    quote.error,
    cart.length,
    submitting,
  ])

  async function onPay() {
    if (!canPay) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || null,
          city: city.trim(),
          state,
          postalCode: postalCode.trim() || null,
          shippingMethod,
          shippingZoneId: shippingMethod === "manual" ? shippingZoneId : null,
          couponCode: appliedCoupon?.code ?? null,
          items: cart.map((item) => ({
            productId: item.product.id,
            variantId: item.variant?.id ?? null,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        }),
      })
      const data = (await res.json()) as {
        authorizationUrl?: string
        error?: string
      }
      if (!res.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Could not start payment")
      }
      window.location.href = data.authorizationUrl
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed")
      setSubmitting(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-7 text-muted-foreground" />
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a few pieces from the shop, then come back to checkout.
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-12">
      <div className="space-y-5">
        <section className="rounded-none border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-none bg-foreground text-background">
              <UserRound className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Contact</h2>
              <p className="text-xs text-muted-foreground">We’ll use this for order updates</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="customerName" label="Full name" className="space-y-2 sm:col-span-2">
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
                placeholder="Ada Okonkwo"
                className="h-11"
                required
              />
            </Field>
            <Field id="email" label="Email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@email.com"
                className="h-11"
                required
              />
            </Field>
            <Field id="phone" label="Phone">
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0801 234 5678"
                autoComplete="tel"
                className="h-11"
                required
              />
            </Field>
          </div>
        </section>

        <section className="rounded-none border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-none bg-foreground text-background">
              <MapPin className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Delivery address</h2>
              <p className="text-xs text-muted-foreground">Nationwide delivery across Nigeria</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="addressLine1" label="Street address" className="space-y-2 sm:col-span-2">
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                autoComplete="address-line1"
                placeholder="12 Admiralty Way"
                className="h-11"
                required
              />
            </Field>
            <Field
              id="addressLine2"
              label="Landmark / apartment (optional)"
              className="space-y-2 sm:col-span-2"
            >
              <Input
                id="addressLine2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                autoComplete="address-line2"
                placeholder="Near the plaza, Block B"
                className="h-11"
              />
            </Field>
            <Field id="city" label="City">
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                placeholder="Lekki"
                className="h-11"
                required
              />
            </Field>
            <Field label="State">
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="postalCode" label="Postal code (optional)" className="space-y-2 sm:col-span-2">
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                autoComplete="postal-code"
                placeholder="100001"
                className="h-11 max-w-xs"
              />
            </Field>
          </div>

        </section>

        <section className="rounded-none border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-none bg-foreground text-background">
              <Truck className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Delivery method</h2>
              <p className="text-xs text-muted-foreground">
                {hasManualZones
                  ? "Choose a local zone or Fez nationwide shipping"
                  : "Nationwide delivery with Fez"}
              </p>
            </div>
          </div>

          {hasManualZones ? (
            <RadioGroup
              value={shippingMethod}
              onValueChange={(value) => {
                const next = value as ShippingMethod
                setShippingMethod(next)
                if (next === "fez") {
                  setShippingZoneId("")
                  setPendingZoneId("")
                  setZoneModalOpen(false)
                  return
                }
                setPendingZoneId(shippingZoneId)
                setZoneModalOpen(true)
              }}
              className="gap-3"
            >
              <label
                htmlFor="shipping-manual"
                className="flex cursor-pointer items-start gap-3 rounded-none border border-border px-3.5 py-3 has-[[data-state=checked]]:border-foreground"
              >
                <RadioGroupItem value="manual" id="shipping-manual" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Local delivery zones</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Flat rates for grouped areas (e.g. Ikeja / Ogba / Ojota)
                  </p>
                  {shippingMethod === "manual" && selectedZone ? (
                    <p className="mt-2 text-xs font-medium text-foreground">
                      {selectedZone.name} — {formatNGN(selectedZone.fee)}
                    </p>
                  ) : null}
                </div>
                {shippingMethod === "manual" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={(event) => {
                      event.preventDefault()
                      setPendingZoneId(shippingZoneId)
                      setZoneModalOpen(true)
                    }}
                  >
                    {selectedZone ? "Change" : "Choose"}
                  </Button>
                ) : null}
              </label>
              <label
                htmlFor="shipping-fez"
                className="flex cursor-pointer items-start gap-3 rounded-none border border-border px-3.5 py-3 has-[[data-state=checked]]:border-foreground"
              >
                <RadioGroupItem value="fez" id="shipping-fez" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Fez nationwide</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Rate based on your selected state
                  </p>
                </div>
              </label>
            </RadioGroup>
          ) : null}

          <Dialog
            open={zoneModalOpen}
            onOpenChange={(open) => {
              setZoneModalOpen(open)
              if (!open) setPendingZoneId(shippingZoneId)
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Choose delivery zone</DialogTitle>
                <DialogDescription>
                  Pick the location group that covers your address.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[50vh] space-y-2 overflow-y-auto py-1">
                {zones.map((zone) => {
                  const selected = pendingZoneId === zone.id
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setPendingZoneId(zone.id)}
                      className={`flex w-full items-center gap-3 border px-3.5 py-3 text-left transition-colors ${
                        selected
                          ? "border-foreground bg-muted/50"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{zone.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {formatNGN(zone.fee)}
                        </span>
                      </span>
                      {selected ? <Check className="size-4 shrink-0" /> : null}
                    </button>
                  )
                })}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!shippingZoneId) setShippingMethod("fez")
                    setZoneModalOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!pendingZoneId}
                  onClick={() => {
                    setShippingZoneId(pendingZoneId)
                    setShippingMethod("manual")
                    setZoneModalOpen(false)
                  }}
                >
                  Confirm zone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="mt-5 flex items-start gap-3 rounded-none bg-muted/60 px-3.5 py-3">
            <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 text-sm">
              {shippingMethod === "fez" && !state && (
                <p className="text-muted-foreground">Select a state above to calculate Fez shipping.</p>
              )}
              {shippingMethod === "manual" && !shippingZoneId && (
                <p className="text-muted-foreground">Select a delivery zone to see the fee.</p>
              )}
              {quote.loading && (
                <p className="text-muted-foreground">Calculating shipping…</p>
              )}
              {!quote.loading && quote.error && (
                <p className="text-destructive">{quote.error}</p>
              )}
              {!quote.loading && !quote.error && shippingFee !== null && (
                <p>
                  <span className="font-medium text-foreground">
                    {quote.freeShipping ? "Free delivery" : formatNGN(shippingFee)}
                  </span>
                  <span className="text-muted-foreground">
                    {shippingMethod === "manual" && selectedZone
                      ? ` · ${selectedZone.name}`
                      : state
                        ? ` · Fez to ${state}`
                        : ""}
                  </span>
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-none border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight">Order summary</h2>
              <span className="rounded-none bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          <div className="max-h-[20rem] space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            {cart.map((item) => (
              <div
                key={`${item.product.id}-${item.size}-${item.color}`}
                className="flex gap-3.5"
              >
                <div className="relative shrink-0">
                  <div className="size-[4.5rem] overflow-hidden rounded-none bg-muted">
                    <img
                      src={resolveProductImageSrc(item.product.images[0] || "dress-1.webp")}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-medium leading-snug">{item.product.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[item.size, item.color].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatNGN(getCartItemUnitPrice(item) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {remainingForFreeShipping > 0 ? (
            <div className="border-t border-border px-5 py-3.5 sm:px-6">
              <p className="text-xs text-muted-foreground">
                Add{" "}
                <span className="font-semibold text-foreground">
                  {formatNGN(remainingForFreeShipping)}
                </span>{" "}
                more for free shipping
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="border-t border-border px-5 py-3 sm:px-6">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                You’ve unlocked free shipping
              </p>
            </div>
          )}

          <div className="space-y-3 border-t border-border px-5 py-4 sm:px-6">
            <Label htmlFor="coupon-code" className="text-xs font-medium text-muted-foreground">
              Coupon code
            </Label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3 rounded-none border border-border bg-muted/40 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold tracking-wide">
                    {appliedCoupon.code}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{appliedCoupon.message}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setAppliedCoupon(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="coupon-code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="h-10 font-mono uppercase"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={couponApplying || !couponInput.trim()}
                  onClick={() => void applyCoupon()}
                >
                  {couponApplying ? "…" : "Apply"}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2.5 border-t border-border px-5 py-4 text-sm sm:px-6">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatNGN(cartTotal)}</span>
            </div>
            {discountAmount > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  −{formatNGN(discountAmount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {quote.loading
                  ? "Calculating…"
                  : shippingFee === null
                    ? shippingMethod === "manual"
                      ? "Choose zone"
                      : "Enter address"
                    : quote.freeShipping
                      ? "Free"
                      : formatNGN(shippingFee)}
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex items-baseline justify-between gap-4 pt-1">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-semibold tracking-tight">
                {total === null ? "—" : formatNGN(total)}
              </span>
            </div>
          </div>

          <div className="border-t border-border px-5 py-4 sm:px-6">
            <Button
              className="h-12 w-full text-sm font-semibold"
              size="lg"
              disabled={!canPay}
              onClick={onPay}
            >
              {submitting ? (
                "Redirecting…"
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Lock className="size-3.5" />
                  {total === null ? "Complete order" : `Pay ${formatNGN(total)}`}
                </span>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}
