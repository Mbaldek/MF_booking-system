-- Fix notification_settings RLS: use get_user_role() instead of direct subquery
-- The old policy used profiles.id = auth.uid() which could fail;
-- all other admin policies use get_user_role() = 'admin' (via profiles.user_id).

DROP POLICY IF EXISTS admin_full_access ON notification_settings;
CREATE POLICY admin_full_access ON notification_settings
  FOR ALL
  USING (get_user_role() = 'admin'::user_role)
  WITH CHECK (get_user_role() = 'admin'::user_role);
