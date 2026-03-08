-- Create order_feedback table if not exists
CREATE TABLE IF NOT EXISTS order_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT order_feedback_order_id_key UNIQUE (order_id)
);

-- Enable RLS
ALTER TABLE order_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (public link from email, no auth required)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_feedback' AND policyname = 'anyone_can_insert_feedback') THEN
    CREATE POLICY anyone_can_insert_feedback ON order_feedback FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Anyone can update their own feedback (upsert support)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_feedback' AND policyname = 'anyone_can_update_feedback') THEN
    CREATE POLICY anyone_can_update_feedback ON order_feedback FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Admins can read all feedback
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_feedback' AND policyname = 'anyone_can_read_feedback') THEN
    CREATE POLICY anyone_can_read_feedback ON order_feedback FOR SELECT USING (true);
  END IF;
END $$;
