import { NextResponse } from "next/server"
import { z } from "zod"
import { sendWelcomeEmail } from "@/lib/email/notifications"

const bodySchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid welcome email payload" }, { status: 400 })
    }

    await sendWelcomeEmail(parsed.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send welcome email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
