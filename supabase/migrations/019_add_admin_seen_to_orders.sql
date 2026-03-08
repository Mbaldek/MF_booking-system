-- Add admin_seen column for new order badge in sidebar
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_seen BOOLEAN DEFAULT false;
