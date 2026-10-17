import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AdminComingSoonProps = {
  eyebrow?: string
  title: string
  description: string
  detail?: string
}

export function AdminComingSoon({
  eyebrow = "Admin",
  title,
  description,
  detail = "This section will unlock in a later phase.",
}: AdminComingSoonProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>{detail}</CardDescription>
        </CardHeader>
      </Card>

      <Button asChild variant="outline">
        <Link href="/admin">Back to dashboard</Link>
      </Button>
    </div>
  )
}
