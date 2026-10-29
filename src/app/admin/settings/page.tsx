import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchHeroSlidesSetting } from "@/lib/site-settings"
import { AdminHeroSettings } from "@/components/admin/AdminHeroSettings"

export const metadata: Metadata = {
  title: "Settings | Teeshogs Admin",
}

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient()
  const { slides, error } = await fetchHeroSlidesSetting(supabase)

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">
          Could not load site settings. Run the site_settings migration in the Supabase SQL editor,
          then refresh.
        </p>
      )}
      <AdminHeroSettings initialSlides={slides} />
    </div>
  )
}
