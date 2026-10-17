"use server"

import { revalidatePath } from "next/cache"
import { isContactStatus } from "@/lib/contacts"
import { createSupabaseServerClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Not authenticated", supabase }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Not authorized", supabase }
  }

  return { ok: true as const, supabase }
}

export type ContactActionResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateContactStatus(
  id: string,
  status: string
): Promise<ContactActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing message id" }
  if (!isContactStatus(status)) return { ok: false, error: "Invalid status" }

  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { error } = await auth.supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/contacts")
  revalidatePath(`/admin/contacts/${id}`)
  return { ok: true }
}

export async function deleteContactMessage(id: string): Promise<ContactActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing message id" }

  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { error } = await auth.supabase.from("contact_messages").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/contacts")
  return { ok: true }
}
