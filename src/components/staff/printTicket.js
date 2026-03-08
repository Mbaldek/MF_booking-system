import { generateDeliveryQR } from '@/utils/generateQR';

const TYPE_EMOJI = { entree: '🥗', plat: '🍽', dessert: '🍰', boisson: '🥂' };

/**
 * Opens a print window with a delivery ticket for an order.
 * @param {object} opts
 * @param {string} opts.orderId
 * @param {string} opts.orderNumber
 * @param {string} opts.stand
 * @param {string} opts.customerName
 * @param {string} opts.slotType - 'midi' | 'soir'
 * @param {string} opts.slotDate - ISO date string
 * @param {Array} opts.lines - order lines with menu_item and guest_name
 */
export async function printTicket({ orderId, orderNumber, stand, customerName, slotType, slotDate, lines }) {
  // Generate QR code
  const qrDataUrl = await generateDeliveryQR(orderId);

  // Group items by guest, count duplicates
  const guestGroups = {};
  for (const line of lines) {
    const guest = line.guest_name || customerName || 'Convive';
    if (!guestGroups[guest]) guestGroups[guest] = {};
    const name = line.menu_item?.name || '—';
    const type = line.menu_item?.type || 'plat';
    const key = `${type}__${name}`;
    if (!guestGroups[guest][key]) {
      guestGroups[guest][key] = { name, type, count: 0 };
    }
    guestGroups[guest][key].count += (line.quantity || 1);
  }

  // Collect allergies
  const allergies = [...new Set(
    lines.flatMap((l) => l.menu_item?.tags ?? []).filter((t) => t && t !== 'végétarien')
  )];

  // Format date
  const dateStr = slotDate
    ? new Date(slotDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  const slotLabel = slotType === 'midi' ? '☀ MIDI' : '☽ SOIR';
  const guestCount = Object.keys(guestGroups).length;

  // Build items HTML
  let itemsHtml = '';
  for (const [guest, items] of Object.entries(guestGroups)) {
    if (guestCount > 1) {
      itemsHtml += `<div style="font-size:11px;font-weight:600;margin:6px 0 2px;color:#8B3A43">${guest}</div>`;
    }
    for (const item of Object.values(items)) {
      const emoji = TYPE_EMOJI[item.type] || '🍽';
      const qty = item.count > 1 ? ` ×${item.count}` : '';
      itemsHtml += `<div style="font-size:12px;padding:1px 0">${emoji} ${item.name}${qty}</div>`;
    }
  }

  const allergyHtml = allergies.length > 0
    ? `<div style="margin:8px 0;padding:6px 8px;background:#FFF3E0;border:1px solid #FFB74D;border-radius:6px;font-size:11px;font-weight:700;color:#E65100">⚠ ALLERGIE : ${allergies.join(', ')}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ticket ${orderNumber}</title>
<style>
  @page { size: 62mm auto; margin: 2mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; width: 58mm; padding: 3mm; color: #392D31; }
  .header { text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 6px; margin-bottom: 6px; }
  .slot { font-size: 13px; font-weight: 700; letter-spacing: 1px; }
  .date { font-size: 10px; color: #9A8A7C; }
  .stand { font-size: 32px; font-weight: 900; text-align: center; margin: 8px 0; letter-spacing: 2px; }
  .client { text-align: center; font-size: 12px; margin-bottom: 4px; }
  .count { text-align: center; font-size: 10px; color: #9A8A7C; margin-bottom: 6px; }
  .items { border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 6px 0; }
  .qr { text-align: center; margin: 8px 0; }
  .qr img { width: 120px; height: 120px; }
  .footer { text-align: center; font-size: 9px; color: #9A8A7C; margin-top: 4px; }
</style></head><body>
  <div class="header">
    <div class="slot">${slotLabel}</div>
    <div class="date">${dateStr}</div>
  </div>
  <div class="stand">${stand || '—'}</div>
  <div class="client">${customerName}</div>
  <div class="count">${lines.length} article${lines.length > 1 ? 's' : ''}</div>
  <div class="items">${itemsHtml}</div>
  ${allergyHtml}
  <div class="qr"><img src="${qrDataUrl}" alt="QR"></div>
  <div class="footer">${orderNumber}</div>
</body></html>`;

  const win = window.open('', '_blank', 'width=300,height=600');
  if (!win) { alert('Popup bloquée — autorisez les popups pour imprimer.'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.print(); };
}
