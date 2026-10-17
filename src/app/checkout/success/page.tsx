import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { CheckoutSuccessContent } from "@/components/checkout/CheckoutSuccessContent"

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center px-4 py-20">
      <Suspense
        fallback={
          <div className="flex flex-col items-center text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          </div>
        }
      >
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  )
}
