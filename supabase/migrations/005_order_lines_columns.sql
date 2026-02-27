-- ============================================================
-- Migration 005: Add missing columns to order_lines
-- Required for StaffKitchen grouping and price tracking
-- ============================================================

ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS menu_unit_price NUMERIC(8,2);
