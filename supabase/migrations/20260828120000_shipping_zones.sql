/*
  Manual shipping zones (location groups + flat fees) alongside Fez.
  Checkout can choose method: fez | manual.
*/

CREATE TABLE IF NOT EXISTS shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  fee numeric(12,2) NOT NULL CHECK (fee >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipping_zones_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS shipping_zones_is_active_idx ON shipping_zones (is_active);
CREATE INDEX IF NOT EXISTS shipping_zones_sort_order_idx ON shipping_zones (sort_order, name);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method text NOT NULL DEFAULT 'fez'
    CHECK (shipping_method IN ('fez', 'manual')),
  ADD COLUMN IF NOT EXISTS shipping_zone_id uuid REFERENCES shipping_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_zone_name text;

CREATE INDEX IF NOT EXISTS orders_shipping_method_idx ON orders (shipping_method);
CREATE INDEX IF NOT EXISTS orders_shipping_zone_id_idx ON orders (shipping_zone_id);

ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_shipping_zones" ON shipping_zones;
CREATE POLICY "admins_select_shipping_zones"
ON shipping_zones FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admins_insert_shipping_zones" ON shipping_zones;
CREATE POLICY "admins_insert_shipping_zones"
ON shipping_zones FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_update_shipping_zones" ON shipping_zones;
CREATE POLICY "admins_update_shipping_zones"
ON shipping_zones FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_delete_shipping_zones" ON shipping_zones;
CREATE POLICY "admins_delete_shipping_zones"
ON shipping_zones FOR DELETE
TO authenticated
USING (public.is_admin());

-- Public can read active zones for checkout (anon + authenticated).
DROP POLICY IF EXISTS "public_select_active_shipping_zones" ON shipping_zones;
CREATE POLICY "public_select_active_shipping_zones"
ON shipping_zones FOR SELECT
TO anon, authenticated
USING (is_active = true);

GRANT ALL ON TABLE public.shipping_zones TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_shipping_zones_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.name = trim(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shipping_zones_set_updated_at ON shipping_zones;
CREATE TRIGGER shipping_zones_set_updated_at
BEFORE INSERT OR UPDATE ON shipping_zones
FOR EACH ROW
EXECUTE FUNCTION public.set_shipping_zones_updated_at();
