-- Storage bucket for delivery proof photos
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for delivery-photos bucket
CREATE POLICY "staff_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'delivery-photos');
CREATE POLICY "anyone_read" ON storage.objects FOR SELECT USING (bucket_id = 'delivery-photos');

-- Add delivery proof columns on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
