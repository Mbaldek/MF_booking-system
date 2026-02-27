-- ============================================================
-- EVENT EATS — Schéma initial Supabase
-- Migration 001 : Tables, RLS, fonctions
-- ============================================================

-- ========================
-- EXTENSIONS
-- ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- ENUM TYPES
-- ========================
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'customer');
CREATE TYPE menu_item_type AS ENUM ('entree', 'plat', 'dessert', 'boisson');
CREATE TYPE meal_slot_type AS ENUM ('midi', 'soir');
CREATE TYPE order_payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE order_line_status AS ENUM ('pending', 'preparing', 'ready', 'delivered');

-- ========================
-- PROFILES (lié à auth.users)
-- ========================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  display_name TEXT,
  phone TEXT,
  stand TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- ÉVÉNEMENTS
-- ========================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- ========================
-- CRÉNEAUX REPAS (midi/soir par jour)
-- ========================
CREATE TABLE meal_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_type meal_slot_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_orders INTEGER, -- limite optionnelle de commandes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, slot_date, slot_type)
);

-- ========================
-- ARTICLES DU MENU
-- ========================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type menu_item_type NOT NULL,
  price NUMERIC(8,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- MENU PAR CRÉNEAU (quels plats dispo midi vs soir)
-- ========================
CREATE TABLE slot_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_slot_id UUID NOT NULL REFERENCES meal_slots(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  UNIQUE(meal_slot_id, menu_item_id)
);

-- ========================
-- COMMANDES (flux finance — commande globale)
-- ========================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id),
  -- Infos client (pour commandes sans compte)
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  stand TEXT NOT NULL,
  -- Finance
  order_number TEXT NOT NULL UNIQUE,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status order_payment_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- LIGNES DE COMMANDE (flux admin — unitaire par créneau)
-- ========================
CREATE TABLE order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  meal_slot_id UUID NOT NULL REFERENCES meal_slots(id),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(8,2) NOT NULL,
  -- Pipeline cuisine
  prep_status order_line_status NOT NULL DEFAULT 'pending',
  prepared_at TIMESTAMPTZ,
  prepared_by UUID REFERENCES profiles(id),
  -- Livraison
  delivered_at TIMESTAMPTZ,
  delivered_by UUID REFERENCES profiles(id),
  delivery_photo_url TEXT,
  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- INDEX PERFORMANCE
-- ========================
CREATE INDEX idx_events_active ON events(is_active) WHERE is_active = true;
CREATE INDEX idx_meal_slots_event ON meal_slots(event_id, slot_date);
CREATE INDEX idx_menu_items_event ON menu_items(event_id, type);
CREATE INDEX idx_orders_event ON orders(event_id, created_at DESC);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_order_lines_order ON order_lines(order_id);
CREATE INDEX idx_order_lines_slot ON order_lines(meal_slot_id, prep_status);
CREATE INDEX idx_order_lines_status ON order_lines(prep_status) WHERE prep_status != 'delivered';

-- ========================
-- FONCTIONS UTILITAIRES
-- ========================

-- Générer un numéro de commande lisible
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CMD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-générer les meal_slots quand on crée un événement
CREATE OR REPLACE FUNCTION generate_meal_slots_for_event()
RETURNS TRIGGER AS $$
DECLARE
  d DATE;
BEGIN
  FOR d IN SELECT generate_series(NEW.start_date, NEW.end_date, '1 day'::interval)::date
  LOOP
    INSERT INTO meal_slots (event_id, slot_date, slot_type)
    VALUES (NEW.id, d, 'midi'), (NEW.id, d, 'soir')
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_meal_slots
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_meal_slots_for_event();

-- Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_lines_updated_at BEFORE UPDATE ON order_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- ROW LEVEL SECURITY
-- ========================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;

-- Helper : récupérer le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (auth_user_role() = 'admin');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (auth_user_role() = 'admin');

-- EVENTS (lecture publique, écriture admin)
CREATE POLICY "Events are publicly readable" ON events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (auth_user_role() = 'admin');

-- MEAL_SLOTS (lecture publique, écriture admin)
CREATE POLICY "Meal slots are publicly readable" ON meal_slots FOR SELECT USING (true);
CREATE POLICY "Admins can manage meal slots" ON meal_slots FOR ALL USING (auth_user_role() = 'admin');

-- MENU_ITEMS (lecture publique, écriture admin)
CREATE POLICY "Menu items are publicly readable" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage menu items" ON menu_items FOR ALL USING (auth_user_role() = 'admin');

-- SLOT_MENU_ITEMS (lecture publique, écriture admin)
CREATE POLICY "Slot menu items are publicly readable" ON slot_menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage slot menu items" ON slot_menu_items FOR ALL USING (auth_user_role() = 'admin');

-- ORDERS
CREATE POLICY "Customers see own orders" ON orders FOR SELECT USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');
CREATE POLICY "Staff and admins see all orders" ON orders FOR SELECT USING (auth_user_role() IN ('admin', 'staff'));
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING (auth_user_role() = 'admin');

-- ORDER_LINES
CREATE POLICY "Staff and admins see all order lines" ON order_lines FOR SELECT USING (auth_user_role() IN ('admin', 'staff'));
CREATE POLICY "Anyone can create order lines" ON order_lines FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update order lines" ON order_lines FOR UPDATE USING (auth_user_role() IN ('admin', 'staff'));
CREATE POLICY "Admins can manage order lines" ON order_lines FOR ALL USING (auth_user_role() = 'admin');

-- ========================
-- VUES UTILES
-- ========================

-- Vue cuisine : commandes du jour groupées par créneau
CREATE OR REPLACE VIEW kitchen_view AS
SELECT
  ol.id AS line_id,
  ol.prep_status,
  ol.quantity,
  ms.slot_date,
  ms.slot_type,
  mi.name AS item_name,
  mi.type AS item_type,
  o.customer_first_name,
  o.customer_last_name,
  o.stand,
  o.order_number
FROM order_lines ol
JOIN orders o ON o.id = ol.order_id
JOIN meal_slots ms ON ms.id = ol.meal_slot_id
JOIN menu_items mi ON mi.id = ol.menu_item_id
WHERE o.payment_status = 'paid'
ORDER BY ms.slot_date, ms.slot_type, ol.prep_status, mi.type;

-- Vue facturation : totaux par commande
CREATE OR REPLACE VIEW invoice_view AS
SELECT
  o.*,
  COUNT(ol.id) AS total_lines,
  SUM(ol.unit_price * ol.quantity) AS computed_total,
  COUNT(DISTINCT ms.id) AS total_slots
FROM orders o
LEFT JOIN order_lines ol ON ol.order_id = o.id
LEFT JOIN meal_slots ms ON ms.id = ol.meal_slot_id
GROUP BY o.id;
