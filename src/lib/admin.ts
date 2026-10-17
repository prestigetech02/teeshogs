import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Profile, UserRole } from "@/lib/supabase"

export type AdminSession = {
  userId: string
  email: string | null
  profile: Profile
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || (profile.role as UserRole) !== "admin") {
    return null
  }

  return {
    userId: user.id,
    email: user.email ?? profile.email ?? null,
    profile: profile as Profile,
  }
}

export async function requireAdminSession() {
  return getAdminSession()
}
