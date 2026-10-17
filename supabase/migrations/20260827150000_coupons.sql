/*
  Coupons + order discount fields.
  - percent | fixed discounts on cart subtotal (not shipping)
  - admin write, public validate via service role / API
*/

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
  min_subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  max_discount numeric(12,2) CHECK (max_discount IS NULL OR max_discount > 0),
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_code_upper CHECK (code = upper(code)),
  CONSTRAINT coupons_percent_range CHECK (
    discount_type <> 'percent' OR (discount_value > 0 AND discount_value <= 100)
  ),
  CONSTRAINT coupons_dates_ok CHECK (
    starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_uidx ON coupons (code);
CREATE INDEX IF NOT EXISTS coupons_is_active_idx ON coupons (is_active);
CREATE INDEX IF NOT EXISTS coupons_ends_at_idx ON coupons (ends_at);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) NOT NULL DEFAULT 0
    CHECK (discount_amount >= 0);

CREATE INDEX IF NOT EXISTS orders_coupon_id_idx ON orders (coupon_id);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_coupons" ON coupons;
CREATE POLICY "admins_select_coupons"
ON coupons FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admins_insert_coupons" ON coupons;
CREATE POLICY "admins_insert_coupons"
ON coupons FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_update_coupons" ON coupons;
CREATE POLICY "admins_update_coupons"
ON coupons FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_delete_coupons" ON coupons;
CREATE POLICY "admins_delete_coupons"
ON coupons FOR DELETE
TO authenticated
USING (public.is_admin());

GRANT ALL ON TABLE public.coupons TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_coupons_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.code = upper(trim(NEW.code));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS coupons_set_updated_at ON coupons;
CREATE TRIGGER coupons_set_updated_at
BEFORE INSERT OR UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION public.set_coupons_updated_at();
