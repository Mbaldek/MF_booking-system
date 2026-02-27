-- ============================================================
-- Migration 002: Fix event_menu_items RLS + CASCADE deletes
-- Fixes: 1) Cannot delete events (FK without CASCADE)
--         2) Order page cannot read menu items (missing RLS policy)
-- ============================================================

-- ========================
-- 1. Ensure event_menu_items has ON DELETE CASCADE
-- ========================
-- Drop existing FK constraints and recreate with CASCADE
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all FK constraints on event_menu_items that reference events or menu_items
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'event_menu_items'
      AND con.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE event_menu_items DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Recreate FKs with CASCADE
ALTER TABLE event_menu_items
  ADD CONSTRAINT event_menu_items_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_menu_items
  ADD CONSTRAINT event_menu_items_menu_item_id_fkey
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;

-- ========================
-- 2. Fix order_lines FKs to have CASCADE (prevent blocking event deletion)
-- ========================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname, pg_get_constraintdef(con.oid) as def
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'order_lines'
      AND con.contype = 'f'
      AND (pg_get_constraintdef(con.oid) LIKE '%meal_slots%'
        OR pg_get_constraintdef(con.oid) LIKE '%menu_items%')
  LOOP
    EXECUTE format('ALTER TABLE order_lines DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE order_lines
  ADD CONSTRAINT order_lines_meal_slot_id_fkey
    FOREIGN KEY (meal_slot_id) REFERENCES meal_slots(id) ON DELETE CASCADE;

ALTER TABLE order_lines
  ADD CONSTRAINT order_lines_menu_item_id_fkey
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;

-- ========================
-- 3. RLS: enable + public read on event_menu_items
-- ========================
ALTER TABLE event_menu_items ENABLE ROW LEVEL SECURITY;

-- Public read (for order page, unauthenticated users)
DROP POLICY IF EXISTS "Event menu items are publicly readable" ON event_menu_items;
CREATE POLICY "Event menu items are publicly readable"
  ON event_menu_items FOR SELECT USING (true);

-- Admin full access (inline role check since auth_user_role() may not exist)
DROP POLICY IF EXISTS "Admins can manage event menu items" ON event_menu_items;
CREATE POLICY "Admins can manage event menu items"
  ON event_menu_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
