import Link from "next/link"
import { Button } from "@/components/ui/button"

type InfoPageProps = {
  eyebrow: string
  title: string
  description: string
}

export function InfoPage({ eyebrow, title, description }: InfoPageProps) {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{description}</p>
      <Button asChild className="mt-8">
        <Link href="/shop">Shop the collection</Link>
      </Button>
    </div>
  )
}
