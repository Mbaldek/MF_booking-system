/**
 * Groups order_lines by (meal_slot_id, guest_name), reconstructing per-menu selections.
 *
 * Input:  array of order_lines with joined meal_slot and menu_item
 * Output: { [key]: { slot_date, slot_type, guest_name, menu_unit_price, entree, plat, dessert, boisson, lines[] } }
 */
export function groupOrderLines(orderLines) {
  const grouped = {};

  for (const line of orderLines) {
    const slotId = line.meal_slot_id;
    const guestName = line.guest_name || '_default';
    const key = `${slotId}__${guestName}`;

    if (!grouped[key]) {
      grouped[key] = {
        slot_date: line.meal_slot?.slot_date,
        slot_type: line.meal_slot?.slot_type,
        guest_name: line.guest_name,
        menu_unit_price: line.menu_unit_price != null ? Number(line.menu_unit_price) : null,
        entree: null,
        plat: null,
        dessert: null,
        boisson: null,
        lines: [],
      };
    }

    const type = line.menu_item?.type;
    if (type && ['entree', 'plat', 'dessert', 'boisson'].includes(type)) {
      grouped[key][type] = {
        id: line.menu_item.id ?? line.menu_item_id,
        name: line.menu_item.name,
        price: Number(line.unit_price),
        quantity: line.quantity,
        line_id: line.id,
        prep_status: line.prep_status,
      };
    }

    grouped[key].lines.push(line);
  }

  return grouped;
}

/**
 * Sorts grouped entries by date, then type (midi before soir), then guest_name.
 */
export function sortedSlotEntries(grouped) {
  return Object.entries(grouped).sort(([, a], [, b]) => {
    const dateCompare = (a.slot_date || '').localeCompare(b.slot_date || '');
    if (dateCompare !== 0) return dateCompare;
    if (a.slot_type !== b.slot_type) return a.slot_type === 'midi' ? -1 : 1;
    return (a.guest_name || '').localeCompare(b.guest_name || '');
  });
}
