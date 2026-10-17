/*
  Product variants with per-variant price and stock
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text,
  size text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, size, color)
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
  ON product_variants (product_id);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_variants" ON product_variants;
CREATE POLICY "public_read_product_variants"
ON product_variants FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_product_variants" ON product_variants;
CREATE POLICY "admin_insert_product_variants"
ON product_variants FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_product_variants" ON product_variants;
CREATE POLICY "admin_update_product_variants"
ON product_variants FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_product_variants" ON product_variants;
CREATE POLICY "admin_delete_product_variants"
ON product_variants FOR DELETE TO authenticated USING (public.is_admin());
