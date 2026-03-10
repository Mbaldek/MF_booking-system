-- ============================================================
-- Migration 026: Security hardening — pre-go-live audit fixes
-- Fixes: C1 (RLS), H1 (slot capacity), H2 (event delete guard),
--        H3 (storage policies), M2 (webhook idempotence),
--        M3 (status transitions)
-- ============================================================

-- ========================
-- C1: Fix overly permissive RLS on orders & order_lines
-- Remove USING(true) policies, replace with SECURITY DEFINER RPCs
-- Staff/admin policies (auth_user_role()) remain untouched
-- ========================

-- Drop the permissive anonymous SELECT policies
DROP POLICY IF EXISTS "Customers see own orders" ON orders;
DROP POLICY IF EXISTS "Anyone can read order lines" ON order_lines;

-- RPC: get a single order by ID with event join (for OrderSuccess page)
CREATE OR REPLACE FUNCTION get_order_by_id(p_order_id UUID)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'event_id', o.event_id,
    'profile_id', o.profile_id,
    'customer_first_name', o.customer_first_name,
    'customer_last_name', o.customer_last_name,
    'customer_email', o.customer_email,
    'customer_phone', o.customer_phone,
    'stand', o.stand,
    'order_number', o.order_number,
    'total_amount', o.total_amount,
    'payment_status', o.payment_status,
    'stripe_checkout_session_id', o.stripe_checkout_session_id,
    'stripe_payment_intent_id', o.stripe_payment_intent_id,
    'delivery_method', o.delivery_method,
    'company_name', o.company_name,
    'billing_address', o.billing_address,
    'billing_postal_code', o.billing_postal_code,
    'billing_city', o.billing_city,
    'paid_at', o.paid_at,
    'admin_seen', o.admin_seen,
    'is_test', o.is_test,
    'created_at', o.created_at,
    'event', CASE WHEN e.id IS NOT NULL THEN jsonb_build_object(
      'id', e.id,
      'name', e.name,
      'start_date', e.start_date,
      'end_date', e.end_date,
      'image_url', e.image_url
    ) ELSE NULL END
  )
  FROM orders o
  LEFT JOIN events e ON e.id = o.event_id
  WHERE o.id = p_order_id;
$$;

-- RPC: lookup orders by email (for OrderHistory page)
CREATE OR REPLACE FUNCTION lookup_orders_by_email(p_email TEXT)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'event_id', o.event_id,
      'customer_first_name', o.customer_first_name,
      'customer_last_name', o.customer_last_name,
      'customer_email', o.customer_email,
      'customer_phone', o.customer_phone,
      'stand', o.stand,
      'order_number', o.order_number,
      'total_amount', o.total_amount,
      'payment_status', o.payment_status,
      'delivery_method', o.delivery_method,
      'company_name', o.company_name,
      'paid_at', o.paid_at,
      'created_at', o.created_at,
      'event', CASE WHEN e.id IS NOT NULL THEN jsonb_build_object(
        'id', e.id,
        'name', e.name
      ) ELSE NULL END
    ) ORDER BY o.created_at DESC
  ), '[]'::jsonb)
  FROM orders o
  LEFT JOIN events e ON e.id = o.event_id
  WHERE o.customer_email = lower(trim(p_email));
$$;

-- RPC: lookup orders by order_number (for OrderHistory page)
CREATE OR REPLACE FUNCTION lookup_orders_by_number(p_order_number TEXT)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'event_id', o.event_id,
      'customer_first_name', o.customer_first_name,
      'customer_last_name', o.customer_last_name,
      'customer_email', o.customer_email,
      'customer_phone', o.customer_phone,
      'stand', o.stand,
      'order_number', o.order_number,
      'total_amount', o.total_amount,
      'payment_status', o.payment_status,
      'delivery_method', o.delivery_method,
      'company_name', o.company_name,
      'paid_at', o.paid_at,
      'created_at', o.created_at,
      'event', CASE WHEN e.id IS NOT NULL THEN jsonb_build_object(
        'id', e.id,
        'name', e.name
      ) ELSE NULL END
    ) ORDER BY o.created_at DESC
  ), '[]'::jsonb)
  FROM orders o
  LEFT JOIN events e ON e.id = o.event_id
  WHERE o.order_number = trim(p_order_number);
$$;

-- RPC: get order lines by order ID with joins (for OrderSuccess page)
CREATE OR REPLACE FUNCTION get_order_lines_by_order(p_order_id UUID)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ol.id,
      'order_id', ol.order_id,
      'meal_slot_id', ol.meal_slot_id,
      'menu_item_id', ol.menu_item_id,
      'quantity', ol.quantity,
      'unit_price', ol.unit_price,
      'menu_unit_price', ol.menu_unit_price,
      'guest_name', ol.guest_name,
      'is_supplement', ol.is_supplement,
      'prep_status', ol.prep_status,
      'prepared_by', ol.prepared_by,
      'prepared_at', ol.prepared_at,
      'delivered_by', ol.delivered_by,
      'delivered_at', ol.delivered_at,
      'delivery_photo_url', ol.delivery_photo_url,
      'created_at', ol.created_at,
      'meal_slot', CASE WHEN ms.id IS NOT NULL THEN jsonb_build_object(
        'id', ms.id,
        'slot_date', ms.slot_date,
        'slot_type', ms.slot_type
      ) ELSE NULL END,
      'menu_item', CASE WHEN mi.id IS NOT NULL THEN jsonb_build_object(
        'id', mi.id,
        'name', mi.name,
        'type', mi.type,
        'price', mi.price
      ) ELSE NULL END
    ) ORDER BY ol.created_at ASC
  ), '[]'::jsonb)
  FROM order_lines ol
  LEFT JOIN meal_slots ms ON ms.id = ol.meal_slot_id
  LEFT JOIN menu_items mi ON mi.id = ol.menu_item_id
  WHERE ol.order_id = p_order_id;
$$;

-- Grant execute on RPC functions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_order_by_id(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION lookup_orders_by_email(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION lookup_orders_by_number(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_order_lines_by_order(UUID) TO anon, authenticated;


-- ========================
-- H1: Enforce meal slot capacity via trigger
-- ========================

CREATE OR REPLACE FUNCTION check_slot_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_max INTEGER;
  v_current BIGINT;
BEGIN
  SELECT max_orders INTO v_max
  FROM meal_slots
  WHERE id = NEW.meal_slot_id;

  -- NULL max_orders = unlimited
  IF v_max IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count distinct menus (order_id + guest_name) for this slot
  -- among non-cancelled/non-refunded orders
  SELECT COUNT(DISTINCT (ol.order_id, ol.guest_name))
  INTO v_current
  FROM order_lines ol
  JOIN orders o ON o.id = ol.order_id
  WHERE ol.meal_slot_id = NEW.meal_slot_id
    AND o.payment_status IN ('pending', 'paid')
    AND NOT (ol.order_id = NEW.order_id AND ol.guest_name IS NOT DISTINCT FROM NEW.guest_name);

  IF v_current >= v_max THEN
    RAISE EXCEPTION 'Capacité créneau atteinte (% / %)', v_current, v_max
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_slot_capacity ON order_lines;
CREATE TRIGGER trg_check_slot_capacity
  BEFORE INSERT ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION check_slot_capacity();


-- ========================
-- H2: Prevent deletion of events with active orders
-- ========================

CREATE OR REPLACE FUNCTION prevent_event_delete_with_orders()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM orders
    WHERE event_id = OLD.id
      AND payment_status IN ('paid', 'pending')
  ) THEN
    RAISE EXCEPTION 'Impossible de supprimer un événement avec des commandes actives. Annulez ou remboursez les commandes d''abord.'
      USING ERRCODE = 'P0002';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_event_delete ON events;
CREATE TRIGGER trg_prevent_event_delete
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_event_delete_with_orders();


-- ========================
-- H3: Restrict storage upload to staff/admin only
-- ========================

DROP POLICY IF EXISTS "Staff can upload delivery photos" ON storage.objects;
CREATE POLICY "Staff can upload delivery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  );


-- ========================
-- M2: Webhook idempotence table
-- ========================

CREATE TABLE IF NOT EXISTS webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT,
  processed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (edge functions use service role key)
-- No public policies needed


-- ========================
-- M3: Status transition validation on order_lines
-- ========================

CREATE OR REPLACE FUNCTION validate_prep_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if prep_status is actually changing
  IF OLD.prep_status = NEW.prep_status THEN
    RETURN NEW;
  END IF;

  -- Allowed transitions: pending→preparing→ready→delivered
  IF (OLD.prep_status = 'pending' AND NEW.prep_status = 'preparing')
  OR (OLD.prep_status = 'preparing' AND NEW.prep_status = 'ready')
  OR (OLD.prep_status = 'ready' AND NEW.prep_status = 'delivered')
  -- Allow admin to reset status backward (for corrections)
  OR (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Transition de statut invalide: % → %', OLD.prep_status, NEW.prep_status
    USING ERRCODE = 'P0003';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_prep_status ON order_lines;
CREATE TRIGGER trg_validate_prep_status
  BEFORE UPDATE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION validate_prep_status_transition();
