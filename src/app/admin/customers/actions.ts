"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, error: "Not authenticated", supabase, user: null }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Not authorized", supabase, user: null }
  }

  return { ok: true as const, supabase, user }
}

const updateSchema = z.object({
  customerId: z.string().uuid(),
  full_name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  role: z.enum(["customer", "admin"]).optional(),
})

export type UpdateCustomerResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateCustomerProfile(
  input: z.infer<typeof updateSchema>
): Promise<UpdateCustomerResult> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid customer update" }
  }

  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { customerId, full_name, phone, notes, role } = parsed.data

  if (role && customerId === auth.user.id && role !== "admin") {
    return { ok: false, error: "You cannot remove your own admin access" }
  }

  const patch: Record<string, unknown> = {}
  if (full_name !== undefined) patch.full_name = full_name
  if (phone !== undefined) patch.phone = phone?.trim() || null
  if (notes !== undefined) patch.notes = notes?.trim() || ""
  if (role !== undefined) patch.role = role

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Nothing to update" }
  }

  const { error } = await auth.supabase.from("profiles").update(patch).eq("id", customerId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/customers")
  revalidatePath(`/admin/customers/${customerId}`)
  return { ok: true }
}
