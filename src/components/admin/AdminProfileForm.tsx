"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Profile } from "@/lib/supabase"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name ?? "")
  const [saving, setSaving] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", profile.id)

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    toast.success("Profile updated")
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-name">Name</Label>
        <Input
          id="admin-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input id="admin-email" value={profile.email} readOnly className="bg-muted/50" />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Input value={profile.role} readOnly className="bg-muted/50 capitalize" />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}
