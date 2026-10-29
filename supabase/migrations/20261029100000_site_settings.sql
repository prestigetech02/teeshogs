/*
  Site settings (admin-configurable storefront content).

  - Key/value jsonb table for homepage hero and future settings
  - Public read; admin write
  - Public storage bucket for hero / site images
*/

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_key_not_blank CHECK (length(trim(key)) > 0)
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_site_settings" ON site_settings;
CREATE POLICY "public_select_site_settings"
ON site_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admins_insert_site_settings" ON site_settings;
CREATE POLICY "admins_insert_site_settings"
ON site_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_update_site_settings" ON site_settings;
CREATE POLICY "admins_update_site_settings"
ON site_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_delete_site_settings" ON site_settings;
CREATE POLICY "admins_delete_site_settings"
ON site_settings FOR DELETE
TO authenticated
USING (public.is_admin());

GRANT ALL ON TABLE public.site_settings TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_site_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.key = trim(NEW.key);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON site_settings;
CREATE TRIGGER site_settings_set_updated_at
BEFORE INSERT OR UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_site_settings_updated_at();

INSERT INTO site_settings (key, value)
VALUES (
  'hero_slides',
  '{
    "slides": [
      {
        "id": "default-1",
        "eyebrow": "Fall / Winter 2026",
        "title": "Let Your Body",
        "titleLine2": "Do the Talking",
        "description": "Discover pieces designed to celebrate every silhouette. Fashion that speaks confidence.",
        "image": "/hero-bg.webp",
        "imageAlt": "Teeshogs fashion campaign",
        "primaryCta": { "label": "Shop Collection", "href": "/shop" },
        "secondaryCta": { "label": "New Arrivals", "href": "/shop?filter=new" }
      },
      {
        "id": "default-2",
        "eyebrow": "New Season Dresses",
        "title": "Made to Move",
        "titleLine2": "With You",
        "description": "Fluid silhouettes and elevated everyday dresses for wherever the day takes you.",
        "image": "/dress-1.webp",
        "imageAlt": "Teeshogs dress edit",
        "primaryCta": { "label": "Shop Dresses", "href": "/shop?category=dresses" },
        "secondaryCta": { "label": "View All", "href": "/shop" }
      },
      {
        "id": "default-3",
        "eyebrow": "Layered Essentials",
        "title": "Outerwear",
        "titleLine2": "That Anchors",
        "description": "Structured jackets and soft layers to finish every look with intention.",
        "image": "/jacket-1.webp",
        "imageAlt": "Teeshogs outerwear edit",
        "primaryCta": { "label": "Shop Outerwear", "href": "/shop?category=outerwear" },
        "secondaryCta": { "label": "Shop Sale", "href": "/shop?filter=sale" }
      }
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read site assets" ON storage.objects;
CREATE POLICY "Public read site assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Admins upload site assets" ON storage.objects;
CREATE POLICY "Admins upload site assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update site assets" ON storage.objects;
CREATE POLICY "Admins update site assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets' AND public.is_admin())
WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete site assets" ON storage.objects;
CREATE POLICY "Admins delete site assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets' AND public.is_admin());
