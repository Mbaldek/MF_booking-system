-- Fix recalculate_order_total trigger function
-- Previously: SUM(unit_price * quantity) across ALL order_lines → inflated by number of categories
-- Now: SUM(menu_unit_price) across unique (meal_slot_id, guest_name) combos = slot price × convives

CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET total_amount = (
    SELECT COALESCE(SUM(menu_unit_price), 0)
    FROM (
      SELECT DISTINCT ON (meal_slot_id, guest_name) menu_unit_price
      FROM order_lines
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ) unique_menus
  )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix all existing orders with inflated totals
UPDATE orders o
SET total_amount = (
  SELECT COALESCE(SUM(menu_unit_price), 0)
  FROM (
    SELECT DISTINCT ON (meal_slot_id, guest_name) menu_unit_price
    FROM order_lines
    WHERE order_id = o.id
  ) unique_menus
)
WHERE EXISTS (SELECT 1 FROM order_lines WHERE order_id = o.id);
