/*
  Phase 1 — Admin access control

  - Adds profiles.role (customer | admin)
  - Adds is_admin() helper for RLS
  - Allows only admins to write products
  - Keeps public product reads
*/

-- Role column on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'admin'));

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role);

-- Helper used by RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Product write policies (admin only)
DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Admins can read all profiles (needed for admin checks / later customer list)
DROP POLICY IF EXISTS "admins_select_all_profiles" ON profiles;
CREATE POLICY "admins_select_all_profiles" ON profiles
FOR SELECT
TO authenticated
USING (public.is_admin() OR auth.uid() = id);

/*
  Promote your first admin after signup (run in Supabase SQL editor):

  UPDATE profiles
  SET role = 'admin'
  WHERE email = 'you@example.com';
*/
