"use server"

import { contactFormSchema, type ContactFormValues } from "@/lib/contact"
import { sendContactEmails } from "@/lib/email/notifications"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type SubmitContactResult =
  | { ok: true }
  | { ok: false; error: string }

export async function submitContactMessage(
  input: ContactFormValues
): Promise<SubmitContactResult> {
  const parsed = contactFormSchema.safeParse(input)

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid form data"
    return { ok: false, error: first }
  }

  const values = parsed.data

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from("contact_messages").insert({
      name: values.name,
      email: values.email,
      subject: values.subject,
      order_number: values.orderNumber?.trim() || null,
      message: values.message,
    })

    if (error) {
      console.error("contact_messages insert failed", error.message)
      return {
        ok: false,
        error:
          "Could not send your message. Please email hello@teeshogs.com or try again.",
      }
    }

    await sendContactEmails({
      name: values.name,
      email: values.email,
      subject: values.subject,
      orderNumber: values.orderNumber?.trim() || null,
      message: values.message,
    })

    return { ok: true }
  } catch (error) {
    console.error("submitContactMessage failed", error)
    return {
      ok: false,
      error:
        "Could not send your message. Please email hello@teeshogs.com or try again.",
    }
  }
}
