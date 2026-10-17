type EmailAddress = {
  address: string
  name?: string
}

type SendEmailInput = {
  to: EmailAddress | EmailAddress[]
  subject: string
  html: string
  text?: string
  replyTo?: EmailAddress
  clientReference?: string
}

function getZeptoConfig() {
  const apiKey = process.env.ZEPTOMAIL_SEND_TOKEN?.trim()
  const fromAddress = process.env.ZEPTOMAIL_FROM_EMAIL?.trim()
  const fromName = process.env.ZEPTOMAIL_FROM_NAME?.trim() || "Teeshogs"
  const apiUrl = (
    process.env.ZEPTOMAIL_API_URL?.trim() || "https://api.zeptomail.com/v1.1/email"
  ).replace(/\/$/, "")

  if (!apiKey) throw new Error("Missing ZEPTOMAIL_SEND_TOKEN")
  if (!fromAddress) throw new Error("Missing ZEPTOMAIL_FROM_EMAIL")

  return { apiKey, fromAddress, fromName, apiUrl }
}

function asRecipientList(to: EmailAddress | EmailAddress[]) {
  const list = Array.isArray(to) ? to : [to]
  return list.map((item) => ({
    email_address: {
      address: item.address,
      ...(item.name ? { name: item.name } : {}),
    },
  }))
}

export async function sendZeptoMail(input: SendEmailInput) {
  const { apiKey, fromAddress, fromName, apiUrl } = getZeptoConfig()

  const body: Record<string, unknown> = {
    from: { address: fromAddress, name: fromName },
    to: asRecipientList(input.to),
    subject: input.subject,
    htmlbody: input.html,
  }

  if (input.text) body.textbody = input.text
  if (input.clientReference) body.client_reference = input.clientReference
  if (input.replyTo) {
    body.reply_to = [
      {
        address: input.replyTo.address,
        ...(input.replyTo.name ? { name: input.replyTo.name } : {}),
      },
    ]
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Zoho-enczapikey ${apiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string
    data?: { message?: string; error_code?: string }
  }

  if (!response.ok) {
    const detail =
      payload.data?.message || payload.message || `ZeptoMail error (${response.status})`
    throw new Error(detail)
  }

  return payload
}

export function getAdminNotifyEmail() {
  return (
    process.env.ORDER_NOTIFY_EMAIL?.trim() ||
    process.env.ZEPTOMAIL_FROM_EMAIL?.trim() ||
    null
  )
}

export function isEmailConfigured() {
  return Boolean(
    process.env.ZEPTOMAIL_SEND_TOKEN?.trim() && process.env.ZEPTOMAIL_FROM_EMAIL?.trim()
  )
}

/** Fire-and-forget helper that never throws to callers. */
export async function sendEmailSafe(input: SendEmailInput, label: string) {
  if (!isEmailConfigured()) {
    console.warn(`[email] Skipped ${label}: ZeptoMail is not configured`)
    return { skipped: true as const }
  }
  try {
    await sendZeptoMail(input)
    return { ok: true as const }
  } catch (error) {
    console.error(`[email] ${label} failed:`, error)
    return { ok: false as const, error }
  }
}
