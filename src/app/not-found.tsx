import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-4 text-muted-foreground">
        That page is not in the Teeshogs catalog. Try the shop instead.
      </p>
      <Button asChild className="mt-8">
        <Link href="/shop">Shop the collection</Link>
      </Button>
    </div>
  )
}
