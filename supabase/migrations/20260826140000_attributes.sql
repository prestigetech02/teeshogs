/*
  Product attributes + terms (WooCommerce-style taxonomy options)
*/

CREATE TABLE IF NOT EXISTS attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'text'
    CHECK (type IN ('text', 'select', 'color')),
  order_by text NOT NULL DEFAULT 'custom'
    CHECK (order_by IN ('custom', 'name', 'name_numeric', 'id')),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attribute_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attribute_id, slug)
);

CREATE INDEX IF NOT EXISTS attributes_slug_idx ON attributes (slug);
CREATE INDEX IF NOT EXISTS attribute_terms_attribute_id_idx ON attribute_terms (attribute_id);
CREATE INDEX IF NOT EXISTS attribute_terms_sort_order_idx ON attribute_terms (attribute_id, sort_order);

ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_attributes" ON attributes;
CREATE POLICY "public_read_attributes"
ON attributes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_attributes" ON attributes;
CREATE POLICY "admin_insert_attributes"
ON attributes FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_attributes" ON attributes;
CREATE POLICY "admin_update_attributes"
ON attributes FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_attributes" ON attributes;
CREATE POLICY "admin_delete_attributes"
ON attributes FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "public_read_attribute_terms" ON attribute_terms;
CREATE POLICY "public_read_attribute_terms"
ON attribute_terms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_attribute_terms" ON attribute_terms;
CREATE POLICY "admin_insert_attribute_terms"
ON attribute_terms FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_attribute_terms" ON attribute_terms;
CREATE POLICY "admin_update_attribute_terms"
ON attribute_terms FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_attribute_terms" ON attribute_terms;
CREATE POLICY "admin_delete_attribute_terms"
ON attribute_terms FOR DELETE TO authenticated USING (public.is_admin());

GRANT ALL ON TABLE public.attributes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.attribute_terms TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_attributes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attributes_set_updated_at ON attributes;
CREATE TRIGGER attributes_set_updated_at
BEFORE UPDATE ON attributes
FOR EACH ROW
EXECUTE FUNCTION public.set_attributes_updated_at();

INSERT INTO attributes (name, slug, type, order_by) VALUES
  ('color', 'color', 'text', 'custom'),
  ('size', 'size', 'text', 'custom')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO attribute_terms (attribute_id, name, slug, sort_order)
SELECT a.id, t.name, t.slug, t.sort_order
FROM attributes a
JOIN (
  VALUES
    ('color', 'Black', 'black', 10),
    ('color', 'White', 'white', 20),
    ('color', 'Ivory', 'ivory', 30),
    ('color', 'Cream', 'cream', 40),
    ('color', 'Camel', 'camel', 50),
    ('color', 'Navy', 'navy', 60),
    ('color', 'Charcoal', 'charcoal', 70),
    ('color', 'Olive', 'olive', 80),
    ('color', 'Sage Green', 'sage-green', 90),
    ('color', 'Terracotta', 'terracotta', 100),
    ('color', 'Dusty Rose', 'dusty-rose', 110),
    ('color', 'Blush', 'blush', 120),
    ('color', 'Burgundy', 'burgundy', 130),
    ('color', 'Emerald', 'emerald', 140),
    ('color', 'Midnight', 'midnight', 150),
    ('size', 'XS', 'xs', 10),
    ('size', 'S', 's', 20),
    ('size', 'M', 'm', 30),
    ('size', 'L', 'l', 40),
    ('size', 'XL', 'xl', 50),
    ('size', 'XXL', 'xxl', 60)
) AS t(attr_slug, name, slug, sort_order)
  ON a.slug = t.attr_slug
ON CONFLICT (attribute_id, slug) DO NOTHING;
