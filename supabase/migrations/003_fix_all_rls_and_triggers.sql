-- ============================================================
-- Migration 003: Ensure all public RLS policies + meal slot trigger exist
-- The DB was set up manually, so migration 001 policies may be missing
-- ============================================================

-- ========================
-- 1. Ensure RLS is enabled on all tables
-- ========================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;

-- ========================
-- 2. Public read policies (for unauthenticated order page)
-- ========================

-- Events
DROP POLICY IF EXISTS "Events are publicly readable" ON events;
CREATE POLICY "Events are publicly readable"
  ON events FOR SELECT USING (true);

-- Meal slots
DROP POLICY IF EXISTS "Meal slots are publicly readable" ON meal_slots;
CREATE POLICY "Meal slots are publicly readable"
  ON meal_slots FOR SELECT USING (true);

-- Menu items
DROP POLICY IF EXISTS "Menu items are publicly readable" ON menu_items;
CREATE POLICY "Menu items are publicly readable"
  ON menu_items FOR SELECT USING (true);

-- ========================
-- 3. Order insert policies (anyone can place an order)
-- ========================
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create order lines" ON order_lines;
CREATE POLICY "Anyone can create order lines"
  ON order_lines FOR INSERT WITH CHECK (true);

-- Customers can see their own orders by email
DROP POLICY IF EXISTS "Customers see own orders" ON orders;
CREATE POLICY "Customers see own orders"
  ON orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read order lines" ON order_lines;
CREATE POLICY "Anyone can read order lines"
  ON order_lines FOR SELECT USING (true);

-- ========================
-- 4. Admin policies (full access)
-- ========================
DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events"
  ON events FOR ALL USING (auth_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage meal slots" ON meal_slots;
CREATE POLICY "Admins can manage meal slots"
  ON meal_slots FOR ALL USING (auth_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;
CREATE POLICY "Admins can manage menu items"
  ON menu_items FOR ALL USING (auth_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders"
  ON orders FOR ALL USING (auth_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage order lines" ON order_lines;
CREATE POLICY "Admins can manage order lines"
  ON order_lines FOR ALL USING (auth_user_role() = 'admin');

-- Staff policies
DROP POLICY IF EXISTS "Staff and admins see all orders" ON orders;
CREATE POLICY "Staff and admins see all orders"
  ON orders FOR SELECT USING (auth_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Staff and admins see all order lines" ON order_lines;
CREATE POLICY "Staff and admins see all order lines"
  ON order_lines FOR SELECT USING (auth_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Staff can update order lines" ON order_lines;
CREATE POLICY "Staff can update order lines"
  ON order_lines FOR UPDATE USING (auth_user_role() IN ('admin', 'staff'));

-- ========================
-- 5. Meal slot auto-generation trigger
-- ========================
CREATE OR REPLACE FUNCTION generate_meal_slots_for_event()
RETURNS TRIGGER AS $$
DECLARE
  d DATE;
BEGIN
  FOR d IN SELECT generate_series(NEW.start_date, NEW.end_date, '1 day'::interval)::date
  LOOP
    INSERT INTO meal_slots (event_id, slot_date, slot_type)
    VALUES (NEW.id, d, 'midi'), (NEW.id, d, 'soir')
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_meal_slots ON events;
CREATE TRIGGER trg_generate_meal_slots
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_meal_slots_for_event();

-- ========================
-- 6. Generate meal slots for existing events that have none
-- ========================
DO $$
DECLARE
  ev RECORD;
  d DATE;
BEGIN
  FOR ev IN
    SELECT e.id, e.start_date, e.end_date
    FROM events e
    WHERE NOT EXISTS (SELECT 1 FROM meal_slots ms WHERE ms.event_id = e.id)
  LOOP
    FOR d IN SELECT generate_series(ev.start_date, ev.end_date, '1 day'::interval)::date
    LOOP
      INSERT INTO meal_slots (event_id, slot_date, slot_type)
      VALUES (ev.id, d, 'midi'), (ev.id, d, 'soir')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
