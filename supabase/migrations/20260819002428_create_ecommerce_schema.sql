/*
# Teeshogs - E-Commerce Schema

## Overview
Creates the core e-commerce database tables for a fashion store.

## New Tables

### products
- id (uuid, primary key)
- name (text) - product display name
- slug (text, unique) - URL-friendly identifier
- description (text) - full product description
- price (numeric) - base price in USD
- compare_price (numeric, nullable) - original price for showing discounts
- category (text) - e.g. 'dresses', 'tops', 'bottoms', 'accessories'
- subcategory (text, nullable)
- images (jsonb) - array of image URLs
- sizes (jsonb) - available sizes array
- colors (jsonb) - available colors array
- stock (integer) - inventory count
- featured (boolean) - show on homepage
- new_arrival (boolean) - mark as new
- sale (boolean) - on sale
- created_at (timestamptz)

### profiles
- id (uuid, primary key, references auth.users)
- full_name (text)
- email (text)
- phone (text, nullable)
- address (jsonb, nullable)
- created_at (timestamptz)

### wishlists
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- product_id (uuid, references products)
- created_at (timestamptz)

## Security
- Products: public read, admin write (using anon+authenticated for reads)
- Profiles: owner-scoped via RLS
- Wishlists: owner-scoped via RLS
*/

-- Products table (public catalog)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  category text NOT NULL,
  subcategory text,
  images jsonb NOT NULL DEFAULT '[]',
  sizes jsonb NOT NULL DEFAULT '[]',
  colors jsonb NOT NULL DEFAULT '[]',
  stock integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  new_arrival boolean NOT NULL DEFAULT false,
  sale boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 4.5,
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
TO anon, authenticated USING (true);

-- Profiles table (user account info)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  address jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
CREATE POLICY "users_select_own_profile" ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Wishlists table (saved products per user)
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_wishlist" ON wishlists;
CREATE POLICY "users_select_own_wishlist" ON wishlists FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_wishlist" ON wishlists;
CREATE POLICY "users_insert_own_wishlist" ON wishlists FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_wishlist" ON wishlists;
CREATE POLICY "users_delete_own_wishlist" ON wishlists FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Seed product data
INSERT INTO products (name, slug, description, price, compare_price, category, subcategory, images, sizes, colors, stock, featured, new_arrival, sale, rating, reviews_count) VALUES
('Silk Drape Maxi Dress', 'silk-drape-maxi-dress', 'Effortlessly elegant silk-blend maxi dress with a fluid drape silhouette. Perfect for evening events or elevated casual wear.', 189.00, 249.00, 'dresses', 'maxi', '[]', '["XS","S","M","L","XL"]', '["Ivory","Midnight Black","Dusty Rose"]', 45, true, true, true, 4.8, 124),
('Structured Blazer', 'structured-blazer', 'A perfectly tailored blazer that transitions seamlessly from boardroom to evening. Crafted in premium crepe fabric.', 245.00, NULL, 'tops', 'blazers', '[]', '["XS","S","M","L","XL","XXL"]', '["Camel","Black","Navy"]', 60, true, false, false, 4.9, 89),
('Wide-Leg Trousers', 'wide-leg-trousers', 'High-waisted wide-leg trousers in a relaxed yet refined silhouette. Versatile enough for any occasion.', 145.00, NULL, 'bottoms', 'trousers', '[]', '["XS","S","M","L","XL"]', '["Cream","Charcoal","Olive"]', 38, false, true, false, 4.7, 56),
('Linen Wrap Dress', 'linen-wrap-dress', 'A breezy linen wrap dress that celebrates the natural body. The adjustable tie waist flatters every figure.', 129.00, 159.00, 'dresses', 'midi', '[]', '["XS","S","M","L","XL"]', '["Sage Green","Terracotta","White"]', 52, true, false, true, 4.6, 201),
('Bodycon Mini Dress', 'bodycon-mini-dress', 'Confidence in every stitch. This form-fitting mini dress hugs your curves with a sophisticated stretch fabric.', 99.00, NULL, 'dresses', 'mini', '[]', '["XS","S","M","L"]', '["Black","Burgundy","Forest Green"]', 75, true, false, false, 4.8, 178),
('Cashmere Turtleneck', 'cashmere-turtleneck', 'Luxuriously soft 100% cashmere turtleneck. An investment piece that only gets better with age.', 310.00, NULL, 'tops', 'sweaters', '[]', '["XS","S","M","L","XL"]', '["Oatmeal","Charcoal","Blush"]', 30, false, false, false, 4.9, 67),
('Pleated Midi Skirt', 'pleated-midi-skirt', 'A flowing pleated midi skirt that moves beautifully. Pairs effortlessly with everything in your wardrobe.', 119.00, 149.00, 'bottoms', 'skirts', '[]', '["XS","S","M","L","XL"]', '["Champagne","Black","Deep Burgundy"]', 44, false, true, true, 4.5, 93),
('Cropped Leather Jacket', 'cropped-leather-jacket', 'A modern take on the classic leather jacket. Cropped silhouette with clean lines and premium genuine leather.', 395.00, NULL, 'outerwear', 'jackets', '[]', '["XS","S","M","L","XL"]', '["Black","Cognac"]', 25, true, false, false, 4.8, 45),
('Ribbed Bodysuit', 'ribbed-bodysuit', 'A wardrobe essential. This ribbed stretch bodysuit creates a seamless silhouette when tucked into any bottom.', 65.00, NULL, 'tops', 'bodysuits', '[]', '["XS","S","M","L","XL","XXL"]', '["White","Black","Nude","Olive"]', 90, false, true, false, 4.7, 312),
('Asymmetric Hem Dress', 'asymmetric-hem-dress', 'An artistic take on the everyday dress. The asymmetric hem adds drama and movement to every step you take.', 165.00, 195.00, 'dresses', 'midi', '[]', '["XS","S","M","L"]', '["Cobalt Blue","Rust","Graphite"]', 35, false, true, true, 4.6, 71),
('Tailored Shorts', 'tailored-shorts', 'Elevated shorts crafted in a structured fabric. The high waist and tailored fit make these anything but casual.', 89.00, NULL, 'bottoms', 'shorts', '[]', '["XS","S","M","L","XL"]', '["Cream","Black","Sage"]', 55, false, false, false, 4.4, 88),
('Velvet Slip Dress', 'velvet-slip-dress', 'Channel old Hollywood glamour in this lustrous velvet slip dress. Delicate straps and a bias cut for pure elegance.', 215.00, NULL, 'dresses', 'midi', '[]', '["XS","S","M","L","XL"]', '["Emerald","Burgundy","Midnight"]', 28, true, false, false, 4.9, 156)
ON CONFLICT (slug) DO NOTHING;
