/*
  Category management for catalog

  - categories table (slug aligns with products.category text)
  - public read, admin write
  - seeded from existing shop taxonomy
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  image text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE INDEX IF NOT EXISTS categories_is_active_idx ON categories (is_active);
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON categories (sort_order);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories"
ON categories FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories"
ON categories FOR DELETE
TO authenticated
USING (public.is_admin());

GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS categories_set_updated_at ON categories;
CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION public.set_categories_updated_at();

INSERT INTO categories (name, slug, description, image, is_active, sort_order) VALUES
  ('Dresses', 'dresses', 'Dresses for every silhouette.', 'category-dresses.webp', true, 10),
  ('Tops', 'tops', 'Tops, blouses, and statement pieces.', 'category-tops.webp', true, 20),
  ('Bottoms', 'bottoms', 'Trousers, skirts, and more.', 'category-bottoms.webp', true, 30),
  ('Outerwear', 'outerwear', 'Jackets and layered looks.', 'category-outerwear.webp', true, 40),
  ('Intimates', 'intimates', 'Essentials worn close to the body.', NULL, true, 50),
  ('Lounge & Sleepwear', 'lounge-and-sleepwear', 'Soft pieces for rest and ease.', NULL, true, 60),
  ('Swim & Beachwear', 'swim-and-beachwear', 'Swim and resort-ready styles.', NULL, true, 70),
  ('Bonnets & Hair Accessories', 'bonnets-and-hair-accessories', 'Hair care and accessories.', NULL, true, 80),
  ('Accessories', 'accessories', 'Finishing pieces for every look.', NULL, true, 90)
ON CONFLICT (slug) DO NOTHING;
