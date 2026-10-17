"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { CustomerProfile } from "@/lib/customers"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { useStore } from "@/context/StoreContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AccountProfileForm({ profile }: { profile: CustomerProfile }) {
  const router = useRouter()
  const { signOut } = useStore()
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [saving, setSaving] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: profile.email,
      })
      .eq("id", profile.id)

    if (error) {
      // Profile may be missing if migration/trigger not applied yet — upsert.
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: profile.id,
        email: profile.email,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role: "customer",
      })
      if (upsertError) {
        toast.error(upsertError.message)
        setSaving(false)
        return
      }
    }

    toast.success("Profile saved")
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-none border border-border p-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest">Profile</h2>
      <div className="space-y-2">
        <Label htmlFor="account-name">Full name</Label>
        <Input
          id="account-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" value={profile.email} readOnly className="bg-muted/40" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-phone">Phone</Label>
        <Input
          id="account-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="0801 234 5678"
        />
      </div>
      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await signOut()
            router.push("/")
          }}
        >
          Sign out
        </Button>
      </div>
    </form>
  )
}
