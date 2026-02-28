-- ============================================================
-- Migration 008: Add 'cancelled' to order_payment_status enum
-- ============================================================

ALTER TYPE order_payment_status ADD VALUE IF NOT EXISTS 'cancelled';
