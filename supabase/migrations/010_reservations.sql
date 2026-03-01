-- ============================================================
-- Migration 010: restaurant seating, shifts and reservations
-- ============================================================

-- Floor / table plan tied to an event
CREATE TABLE IF NOT EXISTS restaurant_floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id uuid NOT NULL REFERENCES restaurant_floors(id) ON DELETE CASCADE,
  "number" integer NOT NULL,
  seats integer NOT NULL CHECK (seats > 0),
  x numeric NULL,    -- optional coordinate for rendering map
  y numeric NULL     -- optional coordinate for rendering map
);

-- shifts and tours around meal service
CREATE TABLE IF NOT EXISTS meal_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL, /* e.g. "midi", "soir" */
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_interval_minutes integer NOT NULL DEFAULT 30 CHECK (slot_interval_minutes > 0)
);

CREATE TABLE IF NOT EXISTS meal_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES meal_shifts(id) ON DELETE CASCADE,
  start_time time NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0)
);

-- actual reservations made by guests
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES meal_tours(id) ON DELETE CASCADE,
  table_id uuid NULL REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  seats integer NOT NULL CHECK (seats > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- simple indexes
CREATE INDEX IF NOT EXISTS idx_reservations_tour ON reservations(tour_id);
CREATE INDEX IF NOT EXISTS idx_tables_floor ON restaurant_tables(floor_id);
