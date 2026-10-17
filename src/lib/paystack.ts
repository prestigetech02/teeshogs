import { createHmac, timingSafeEqual } from "crypto"

type PaystackInitializeInput = {
  email: string
  amountKobo: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
  currency?: string
}

type PaystackInitializeResponse = {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export type PaystackVerifyData = {
  status: string
  reference: string
  amount: number
  currency: string
  channel?: string
  gateway_response?: string
  paid_at?: string
  fees?: number | null
  customer?: { email?: string }
  authorization?: {
    card_type?: string | null
    last4?: string | null
    bank?: string | null
    brand?: string | null
    channel?: string | null
  }
  metadata?: Record<string, unknown>
}

function getPaystackSecret() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim()
  if (!key) throw new Error("Missing PAYSTACK_SECRET_KEY")
  return key
}

export function isPaystackConfigured() {
  return Boolean(
    process.env.PAYSTACK_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim()
  )
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  const data = (await response.json()) as T & {
    status?: boolean
    message?: string
  }

  if (!response.ok || data.status === false) {
    throw new Error(data.message || `Paystack request failed (${response.status})`)
  }

  return data
}

export async function initializePaystackTransaction(input: PaystackInitializeInput) {
  const result = await paystackFetch<PaystackInitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: input.currency || "NGN",
      metadata: input.metadata,
    }),
  })

  return result.data
}

export async function verifyPaystackTransaction(reference: string) {
  const result = await paystackFetch<{ status: boolean; data: PaystackVerifyData }>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  )
  return result.data
}

export function paymentMethodFromVerification(data: PaystackVerifyData) {
  const auth = data.authorization
  if (auth?.brand || auth?.card_type || auth?.last4) {
    const brand = (auth.brand || auth.card_type || "card").toString()
    const last4 = auth.last4 ? `•••• ${auth.last4}` : ""
    return [brand, last4].filter(Boolean).join(" ").trim()
  }
  if (auth?.bank) return auth.bank
  return data.channel || null
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false
  const hash = createHmac("sha512", getPaystackSecret()).update(rawBody).digest("hex")
  try {
    const a = Buffer.from(hash)
    const b = Buffer.from(signature)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}
