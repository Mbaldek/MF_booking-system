-- ============================================================
-- Migration 004: Add menu_categories to events
-- Allows toggling which menu types (entree/plat/dessert/boisson) are active per event
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS menu_categories TEXT[] NOT NULL DEFAULT '{entree,plat,dessert,boisson}';
