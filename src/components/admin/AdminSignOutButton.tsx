"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export async function signOutAdmin(onDone?: () => void) {
  const supabase = createSupabaseBrowserClient()
  await supabase.auth.signOut()
  toast.success("Signed out")
  onDone?.()
}

export function AdminSignOutButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      className="w-full text-left"
      onClick={async () => {
        await signOutAdmin(() => {
          router.replace("/admin/login")
          router.refresh()
        })
      }}
    >
      Sign out
    </button>
  )
}
