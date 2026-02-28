-- ============================================================
-- Migration 009: Meal slot capacity limits
-- ============================================================

-- Add max_orders column to meal_slots (NULL = unlimited)
ALTER TABLE meal_slots ADD COLUMN IF NOT EXISTS max_orders INTEGER DEFAULT NULL;

-- RPC function: count current menus (guests) per slot for an event
-- Only counts orders that are pending or paid (not cancelled/refunded)
CREATE OR REPLACE FUNCTION get_slot_menu_counts(p_event_id UUID)
RETURNS TABLE(meal_slot_id UUID, menu_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ol.meal_slot_id, COUNT(DISTINCT (ol.order_id, ol.guest_name))
  FROM order_lines ol
  JOIN orders o ON o.id = ol.order_id
  WHERE o.event_id = p_event_id
    AND o.payment_status IN ('pending', 'paid')
  GROUP BY ol.meal_slot_id;
$$;
