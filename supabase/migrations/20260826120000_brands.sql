/*
  Brand management for catalog

  - brands table
  - optional products.brand_id link for product counts
  - public read, admin write
*/

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  logo text,
  website text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brands_slug_idx ON brands (slug);
CREATE INDEX IF NOT EXISTS brands_is_active_idx ON brands (is_active);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_brand_id_idx ON products (brand_id);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_brands" ON brands;
CREATE POLICY "public_read_brands"
ON brands FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_insert_brands" ON brands;
CREATE POLICY "admin_insert_brands"
ON brands FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_brands" ON brands;
CREATE POLICY "admin_update_brands"
ON brands FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_brands" ON brands;
CREATE POLICY "admin_delete_brands"
ON brands FOR DELETE
TO authenticated
USING (public.is_admin());

GRANT ALL ON TABLE public.brands TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_brands_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS brands_set_updated_at ON brands;
CREATE TRIGGER brands_set_updated_at
BEFORE UPDATE ON brands
FOR EACH ROW
EXECUTE FUNCTION public.set_brands_updated_at();

INSERT INTO brands (name, slug, description, is_active)
VALUES (
  'Teeshogs',
  'teeshogs',
  'Contemporary African fashion and lifestyle brand.',
  true
)
ON CONFLICT (slug) DO NOTHING;
