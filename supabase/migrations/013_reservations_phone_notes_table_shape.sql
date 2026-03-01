-- Migration 013: guest phone/notes + table shape for visual floor plan

-- Guest contact info and special requests
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS guest_phone text NULL,
  ADD COLUMN IF NOT EXISTS guest_notes text NULL;

-- Table shape for visual floor plan rendering ('square' | 'round' | 'rectangle')
ALTER TABLE restaurant_tables
  ADD COLUMN IF NOT EXISTS shape text NOT NULL DEFAULT 'square';

-- Note: x and y columns already exist on restaurant_tables (migration 010)
-- They store 0–100 percentage position on the floor plan canvas
