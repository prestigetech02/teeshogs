import Link from "next/link"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CheckoutFailedPage() {
  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <XCircle className="size-10 text-destructive" />
      <h1 className="mt-4 text-2xl font-semibold">Payment cancelled</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your payment was not completed. Your cart is still available if you want to try again.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/checkout">Return to checkout</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </div>
  )
}
