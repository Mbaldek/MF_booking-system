-- ============================================================
-- Migration 006: Add delivery method + billing fields to orders
-- Backwards-compatible: all new columns are nullable or have defaults
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'livraison';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_postal_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_city TEXT;
