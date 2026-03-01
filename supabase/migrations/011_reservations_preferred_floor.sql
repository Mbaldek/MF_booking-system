-- Migration 011: add preferred floor preference to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS preferred_floor_id uuid NULL
    REFERENCES restaurant_floors(id) ON DELETE SET NULL;
