-- ============================================================
-- Migration 025: Activate slot_menu_items + supplement fields
-- ============================================================

-- 1. slot_menu_items already exists with correct structure (migration 001)
--    meal_slot_id UUID FK → meal_slots, menu_item_id UUID FK → menu_items
--    UNIQUE(meal_slot_id, menu_item_id)
--    RLS + policies already in place (001)

-- 2. Supplement fields on menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(8,2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_supplement BOOLEAN DEFAULT false;

-- 3. Supplement flag on order_lines (quantity already exists from 001)
ALTER TABLE order_lines ADD COLUMN IF NOT EXISTS is_supplement BOOLEAN DEFAULT false;
