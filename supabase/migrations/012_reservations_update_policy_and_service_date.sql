-- Migration 012: fix missing UPDATE RLS policy + add service_date dimension

-- Add missing UPDATE policy for admin on reservations
-- (was causing silent failure on "Valider" in admin tab)
CREATE POLICY reservations_update_admin ON reservations
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
  ));

-- Add service_date so reservations can be filtered by event day
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS service_date date NULL;
