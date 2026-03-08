-- Seed notification_settings if missing
INSERT INTO notification_settings (key, label, description, recipient_type, subject_template, body_intro, enabled)
SELECT * FROM (VALUES
  ('order_confirmation', 'Confirmation commande', 'Email envoyé au client après paiement', 'client', 'Commande confirmée — Maison Félicien', 'Merci pour votre commande !', true),
  ('admin_notification', 'Notification admin', 'Alerte admin à chaque nouvelle commande', 'admin', 'Nouvelle commande CMD-{order_number}', 'Une nouvelle commande vient d''arriver.', true),
  ('daily_admin_recap', 'Récap J-1 admin', 'Résumé des commandes du lendemain', 'admin', 'Demain — {slot_count} créneaux · {order_count} commandes', 'Voici le récapitulatif pour demain.', true),
  ('daily_client_reminder', 'Rappel J-1 client', 'Rappel envoyé au client la veille', 'client', 'Demain — votre repas vous attend !', 'À demain !', true),
  ('delivery_confirmation', 'Confirmation livraison', 'Email post-livraison avec satisfaction', 'client', 'Bon appétit ! Votre repas a été livré', 'Votre repas vient d''être livré.', true)
) AS v(key, label, description, recipient_type, subject_template, body_intro, enabled)
WHERE NOT EXISTS (SELECT 1 FROM notification_settings ns WHERE ns.key = v.key);

-- Add is_test column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
