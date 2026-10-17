/*
  Contact form submissions

  - Public can insert messages (anon + authenticated)
  - Only admins can read / update / delete
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  order_number text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON contact_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx
  ON contact_messages (status);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_contact_messages" ON contact_messages;
CREATE POLICY "anyone_insert_contact_messages"
ON contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admins_select_contact_messages" ON contact_messages;
CREATE POLICY "admins_select_contact_messages"
ON contact_messages
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_contact_messages" ON contact_messages;
CREATE POLICY "admins_update_contact_messages"
ON contact_messages
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_delete_contact_messages" ON contact_messages;
CREATE POLICY "admins_delete_contact_messages"
ON contact_messages
FOR DELETE
TO authenticated
USING (public.is_admin());
