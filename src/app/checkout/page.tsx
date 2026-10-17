import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { CheckoutForm } from "@/components/checkout/CheckoutForm"

export default function CheckoutPage() {
  return (
    <div className="min-h-[calc(100svh-8rem)] bg-background">
      <div className="border-b border-border/80 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            Continue shopping
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Checkout</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Add your details and delivery address to complete your order.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <CheckoutForm />
      </div>
    </div>
  )
}
