/**
 * Groups order_lines by meal_slot_id, reconstructing per-slot menu selections.
 *
 * Input:  array of order_lines with joined meal_slot and menu_item
 * Output: { [slotId]: { slot_date, slot_type, entree, plat, dessert, boisson, subtotal, lines[] } }
 */
export function groupOrderLines(orderLines) {
  const grouped = {};

  for (const line of orderLines) {
    const slotId = line.meal_slot_id;
    if (!grouped[slotId]) {
      grouped[slotId] = {
        slot_date: line.meal_slot?.slot_date,
        slot_type: line.meal_slot?.slot_type,
        entree: null,
        plat: null,
        dessert: null,
        boisson: null,
        subtotal: 0,
        lines: [],
      };
    }

    const type = line.menu_item?.type;
    if (type && ['entree', 'plat', 'dessert', 'boisson'].includes(type)) {
      grouped[slotId][type] = {
        id: line.menu_item.id ?? line.menu_item_id,
        name: line.menu_item.name,
        price: Number(line.unit_price),
        quantity: line.quantity,
        line_id: line.id,
        prep_status: line.prep_status,
      };
    }

    grouped[slotId].subtotal += Number(line.unit_price) * line.quantity;
    grouped[slotId].lines.push(line);
  }

  return grouped;
}

/**
 * Sorts grouped slots by date then type (midi before soir).
 */
export function sortedSlotEntries(grouped) {
  return Object.entries(grouped).sort(([, a], [, b]) => {
    const dateCompare = (a.slot_date || '').localeCompare(b.slot_date || '');
    if (dateCompare !== 0) return dateCompare;
    return a.slot_type === 'midi' ? -1 : 1;
  });
}
