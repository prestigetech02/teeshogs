import { z } from "zod"

export type ShippingMethod = "fez" | "manual"

export type ShippingZone = {
  id: string
  name: string
  fee: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export const shippingZoneFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter at least one location or group name")
    .max(200, "Name is too long"),
  fee: z.coerce.number<number>().min(0, "Fee cannot be negative"),
  sort_order: z.coerce.number<number>().int().min(0).catch(0),
  is_active: z.boolean(),
})

export type ShippingZoneFormValues = z.output<typeof shippingZoneFormSchema>
export type ShippingZoneFormInput = z.input<typeof shippingZoneFormSchema>

export function formatZoneFee(fee: number) {
  return Number(fee) || 0
}

export function computeShippingZoneStats(zones: ShippingZone[]) {
  return {
    total: zones.length,
    active: zones.filter((zone) => zone.is_active).length,
    inactive: zones.filter((zone) => !zone.is_active).length,
  }
}

export function shippingMethodLabel(method: string | null | undefined) {
  if (method === "manual") return "Manual zone"
  if (method === "fez") return "Fez"
  return method || "—"
}
