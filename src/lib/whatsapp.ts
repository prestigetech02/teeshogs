export function getWhatsAppNumber() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? ""
  return raw.replace(/[^\d]/g, "")
}

export function getWhatsAppHref(message?: string) {
  const number = getWhatsAppNumber()
  if (!number) return null

  const url = new URL(`https://wa.me/${number}`)
  if (message?.trim()) {
    url.searchParams.set("text", message.trim())
  }
  return url.toString()
}

export const defaultWhatsAppMessage =
  "Hi Teeshogs! I'd like to know more about your collection."
