"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/StoreContext"
import { formatNGN } from "@/lib/money"

type VerifyResult = {
  ok?: boolean
  error?: string
  order?: {
    orderNumber: string
    status: string
    total: number
    shippingFee: number
    shippingMethod?: string | null
    shippingZoneName?: string | null
    fezOrderNo: string | null
    email: string
  }
}

export function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const { clearCart } = useStore()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerifyResult | null>(null)

  useEffect(() => {
    if (!reference) {
      setResult({ error: "Missing payment reference." })
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/checkout/verify?reference=${encodeURIComponent(reference)}`)
        const data = (await res.json()) as VerifyResult
        if (cancelled) return
        if (!res.ok) {
          setResult({ error: data.error || "Payment verification failed." })
        } else {
          setResult(data)
          clearCart()
        }
      } catch {
        if (!cancelled) setResult({ error: "Could not verify payment." })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // clearCart is intentionally omitted — StoreContext recreates it each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference])

  if (loading) {
    return (
      <div className="flex flex-col items-center text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Confirming your Paystack payment…</p>
      </div>
    )
  }

  if (!result?.ok || !result.order) {
    return (
      <div className="flex flex-col items-center text-center">
        <XCircle className="size-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Payment not confirmed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result?.error || "We could not confirm this payment."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/checkout">Back to checkout</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </div>
    )
  }

  const order = result.order

  return (
    <div className="flex flex-col items-center text-center">
      <CheckCircle2 className="size-10 text-emerald-600" />
      <h1 className="mt-4 text-2xl font-semibold">Thank you for your order</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Order <span className="font-medium text-foreground">{order.orderNumber}</span> is confirmed.
        A receipt will be associated with {order.email}.
      </p>
      <div className="mt-6 w-full space-y-2 rounded-none border p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="capitalize">{order.status.replace("_", " ")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total paid</span>
          <span className="font-medium">{formatNGN(Number(order.total))}</span>
        </div>
        {order.shippingZoneName && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Delivery zone</span>
            <span className="font-medium">{order.shippingZoneName}</span>
          </div>
        )}
        {order.fezOrderNo && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Fez tracking</span>
            <span className="font-medium">{order.fezOrderNo}</span>
          </div>
        )}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  )
}
