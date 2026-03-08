-- Notification settings table for admin email management
CREATE TABLE notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  label TEXT NOT NULL,
  description TEXT,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'admin', 'staff')),
  recipient_override TEXT,
  subject_template TEXT,
  body_intro TEXT,
  send_hour INTEGER DEFAULT 17,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the 5 email types
INSERT INTO notification_settings (key, label, description, recipient_type, subject_template, body_intro, enabled) VALUES
('order_confirmation', 'Confirmation commande', 'Email envoyé au client après paiement', 'client', 'Commande confirmée — Maison Félicien', 'Merci pour votre commande !', true),
('admin_notification', 'Notification admin', 'Alerte admin à chaque nouvelle commande', 'admin', 'Nouvelle commande CMD-{order_number}', 'Une nouvelle commande vient d''arriver.', true),
('daily_admin_recap', 'Récap J-1 admin', 'Résumé des commandes du lendemain pour l''admin', 'admin', 'Demain — {slot_count} créneaux · {order_count} commandes', 'Voici le récapitulatif pour demain.', true),
('daily_client_reminder', 'Rappel J-1 client', 'Rappel envoyé au client la veille', 'client', 'Demain — votre repas vous attend !', 'À demain !', true),
('delivery_confirmation', 'Confirmation livraison', 'Email post-livraison avec enquête satisfaction', 'client', 'Bon appétit ! Votre repas a été livré', 'Votre repas vient d''être livré.', true);

-- RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access" ON notification_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
