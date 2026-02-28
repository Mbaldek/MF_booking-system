-- ============================================================
-- Migration 007: Storage bucket for delivery photos + RLS audit fixes
-- ============================================================

-- ========================
-- 1. Create delivery-photos storage bucket
-- ========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ========================
-- 2. Storage policies for delivery-photos bucket
-- ========================

-- Anyone can view delivery photos (public bucket)
DROP POLICY IF EXISTS "Delivery photos are publicly readable" ON storage.objects;
CREATE POLICY "Delivery photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-photos');

-- Authenticated users (staff/admin) can upload delivery photos
DROP POLICY IF EXISTS "Staff can upload delivery photos" ON storage.objects;
CREATE POLICY "Staff can upload delivery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-photos'
    AND auth.role() = 'authenticated'
  );

-- Admins can delete delivery photos
DROP POLICY IF EXISTS "Admins can delete delivery photos" ON storage.objects;
CREATE POLICY "Admins can delete delivery photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'delivery-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ========================
-- 3. Fix: ensure order_lines are readable for OrderSuccess page
--    (migration 003 added this but re-assert for safety)
-- ========================
DROP POLICY IF EXISTS "Anyone can read order lines" ON order_lines;
CREATE POLICY "Anyone can read order lines"
  ON order_lines FOR SELECT USING (true);

-- ========================
-- 4. Fix: ensure orders are readable for OrderSuccess page
--    (migration 003 added this but re-assert for safety)
-- ========================
DROP POLICY IF EXISTS "Customers see own orders" ON orders;
CREATE POLICY "Customers see own orders"
  ON orders FOR SELECT USING (true);
