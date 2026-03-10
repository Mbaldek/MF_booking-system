-- ============================================================
-- Migration 027: Cleanup duplicate policies, add indexes,
--                fix order_feedback, setup pg_cron jobs
-- ============================================================


-- ========================
-- 1. Drop duplicate legacy policies (auth_user_role style)
--    Keep the get_user_role() versions which use proper enum type
-- ========================

-- events: drop old-style duplicates
DROP POLICY IF EXISTS "Admins can manage events" ON events;
DROP POLICY IF EXISTS "Events are publicly readable" ON events;

-- event_menu_items: drop old-style duplicates
DROP POLICY IF EXISTS "Admins can manage event menu items" ON event_menu_items;
DROP POLICY IF EXISTS "Event menu items are publicly readable" ON event_menu_items;

-- meal_slots: drop old-style duplicates
DROP POLICY IF EXISTS "Admins can manage meal slots" ON meal_slots;
DROP POLICY IF EXISTS "Meal slots are publicly readable" ON meal_slots;

-- menu_items: drop old-style duplicates
DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Menu items are publicly readable" ON menu_items;

-- order_lines: drop old-style duplicates
DROP POLICY IF EXISTS "Admins can manage order lines" ON order_lines;
DROP POLICY IF EXISTS "Anyone can create order lines" ON order_lines;
DROP POLICY IF EXISTS "Staff and admins see all order lines" ON order_lines;
DROP POLICY IF EXISTS "Staff can update order lines" ON order_lines;

-- orders: drop old-style duplicates
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Staff and admins see all orders" ON orders;

-- Drop the legacy helper function (no longer used by any policy)
DROP FUNCTION IF EXISTS auth_user_role();


-- ========================
-- 2. Fix order_feedback — remove overly permissive policies
--    Keep: anyone can INSERT (submit feedback)
--    Keep: admin can READ
--    Remove: anyone can READ all + anyone can UPDATE all
-- ========================

-- Drop duplicate + overly permissive policies
DROP POLICY IF EXISTS "anyone_can_insert" ON order_feedback;
DROP POLICY IF EXISTS "anyone_can_read_feedback" ON order_feedback;
DROP POLICY IF EXISTS "anyone_can_update" ON order_feedback;
DROP POLICY IF EXISTS "anyone_can_update_feedback" ON order_feedback;

-- Keep: anyone_can_insert_feedback (INSERT WITH CHECK true) — needed for anonymous feedback
-- Keep: admin_can_read (SELECT for admin only)

-- Allow admin to update feedback (e.g. mark as reviewed)
CREATE POLICY "admin_can_update_feedback" ON order_feedback FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));


-- ========================
-- 3. Add missing indexes on hot query paths
-- ========================

-- orders.customer_email — used by lookup_orders_by_email RPC
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (customer_email);

-- orders.stripe_checkout_session_id — used by webhook to find order after payment
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders (stripe_checkout_session_id);

-- orders.profile_id — used by orders_read RLS policy
CREATE INDEX IF NOT EXISTS idx_orders_profile ON orders (profile_id);

-- email_logs.order_id — admin lookup by order
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs (order_id);


-- ========================
-- 4. pg_cron jobs — cleanup stale data
-- ========================

-- Job 1: Cancel orders stuck in 'pending' for > 1 hour (abandoned Stripe sessions)
SELECT cron.schedule(
  'cleanup-stale-pending-orders',
  '*/15 * * * *',  -- every 15 minutes
  $$UPDATE public.orders SET payment_status = 'cancelled' WHERE payment_status = 'pending' AND created_at < now() - interval '1 hour'$$
);

-- Job 2: Purge webhook_events older than 30 days (idempotence table, no need to keep forever)
SELECT cron.schedule(
  'cleanup-old-webhook-events',
  '0 3 * * *',  -- daily at 3 AM
  $$DELETE FROM public.webhook_events WHERE processed_at < now() - interval '30 days'$$
);


-- ========================
-- 5. Revoke GraphQL access (unused, reduces attack surface)
-- ========================

REVOKE ALL ON SCHEMA graphql FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql FROM anon, authenticated;
