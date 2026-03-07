import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, ArrowLeft, Home, CheckCircle2, User, MapPin, Mail, Phone, CalendarDays, UtensilsCrossed } from 'lucide-react';
import { useOrderById } from '@/hooks/useOrders';
import { useOrderLinesByOrder } from '@/hooks/useOrderLines';
import ClientHeader from '@/components/layout/ClientHeader';

const TYPE_LABELS = { entree: 'Entrée', plat: 'Plat', dessert: 'Dessert', boisson: 'Boisson' };
const SLOT_LABELS = { midi: 'Midi', soir: 'Soir' };

function groupLinesBySlotAndGuest(lines) {
  const groups = {};
  for (const line of lines) {
    const slot = line.meal_slot;
    if (!slot) continue;
    const guestName = line.guest_name || '_default';
    const key = `${slot.slot_date}_${slot.slot_type}_${guestName}`;
    if (!groups[key]) {
      groups[key] = {
        date: slot.slot_date,
        type: slot.slot_type,
        guest_name: line.guest_name,
        menu_unit_price: line.menu_unit_price != null ? Number(line.menu_unit_price) : null,
        items: [],
      };
    }
    groups[key].items.push({
      name: line.menu_item?.name || 'Article inconnu',
      type: line.menu_item?.type || '',
    });
  }
  return Object.values(groups).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type !== b.type) return a.type === 'midi' ? -1 : 1;
    return (a.guest_name || '').localeCompare(b.guest_name || '');
  });
}

export default function OrderSuccess() {
  const { orderId } = useParams();
  const { data: order, isLoading: orderLoading } = useOrderById(orderId);
  const { data: lines = [], isLoading: linesLoading } = useOrderLinesByOrder(orderId);
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const isLoading = orderLoading || linesLoading;

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Remove Tailwind stylesheets to avoid oklch() parsing errors
          clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
        },
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Handle multi-page if content is taller than A4
      const pageHeight = 297;
      let position = 0;
      let remaining = imgHeight;

      while (remaining > 0) {
        if (position > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -position, imgWidth, imgHeight);
        remaining -= pageHeight;
        position += pageHeight;
      }

      pdf.save(`facture-${order.order_number}.pdf`);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F0E6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B3A43]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F0F0E6] flex items-center justify-center p-4">
        <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-8 max-w-md text-center space-y-3">
          <p className="text-[#9A8A7C]">Commande introuvable.</p>
          <Link to="/order" className="text-sm text-[#8B3A43] hover:underline">Retour aux commandes</Link>
        </div>
      </div>
    );
  }

  const grouped = groupLinesBySlotAndGuest(lines);
  const eventName = order.event?.name || '';
  const eventDates = order.event
    ? `${format(new Date(order.event.start_date), 'd MMM', { locale: fr })} — ${format(new Date(order.event.end_date), 'd MMM yyyy', { locale: fr })}`
    : '';

  return (
    <div className="min-h-screen bg-[#F0F0E6]">
      <ClientHeader />
      <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">

        {/* Success header */}
        <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-[#E5B7B3]/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-[#8B3A43]" />
          </div>
          <h1 className="text-2xl font-bold text-[#8B3A43]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>Commande confirmée !</h1>
          <p className="text-[#9A8A7C]">
            Votre commande <span className="font-mono font-semibold text-[#392D31]">{order.order_number}</span> a bien été enregistrée.
          </p>
          {eventName && (
            <p className="text-sm text-[#9A8A7C]">{eventName} — {eventDates}</p>
          )}
        </div>

        {/* Delivery method communication */}
        <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-6 space-y-3">
          <h2 className="text-lg text-[#8B3A43]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
            {order.delivery_method === 'retrait' ? 'Retrait de votre commande' : 'Livraison de votre commande'}
          </h2>
          <div className="bg-[#8B3A43]/5 border border-[#8B3A43]/20 rounded-2xl p-4">
            {order.delivery_method === 'retrait' ? (
              <p className="text-sm text-[#392D31]">
                Vous avez choisi le <strong>retrait sur place</strong>. Vous recevrez un email
                lorsque votre commande sera prête à être retirée.
              </p>
            ) : (
              <p className="text-sm text-[#392D31]">
                Votre commande sera <strong>livrée à votre stand</strong>. Vous recevrez un email
                pour vous informer de l'avancement de la préparation et de la livraison.
              </p>
            )}
          </div>
          <p className="text-xs text-[#C4B5A8]">
            Notifications envoyées à : {order.customer_email}
            {order.customer_phone && ` / ${order.customer_phone}`}
          </p>
        </div>

        {/* Order summary (visible on screen) */}
        <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-6 space-y-5">
          <h2 className="text-lg text-[#8B3A43]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>Récapitulatif</h2>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-[#9A8A7C]">
              <User className="w-4 h-4 text-[#C4B5A8]" />
              {order.customer_first_name} {order.customer_last_name}
            </div>
            <div className="flex items-center gap-2 text-[#9A8A7C]">
              <MapPin className="w-4 h-4 text-[#C4B5A8]" />
              Stand {order.stand}
            </div>
            <div className="flex items-center gap-2 text-[#9A8A7C]">
              <Mail className="w-4 h-4 text-[#C4B5A8]" />
              {order.customer_email}
            </div>
            <div className="flex items-center gap-2 text-[#9A8A7C]">
              <Phone className="w-4 h-4 text-[#C4B5A8]" />
              {order.customer_phone}
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                order.delivery_method === 'retrait'
                  ? 'bg-[#968A42]/10 text-[#968A42]'
                  : 'bg-[#8B3A43]/10 text-[#8B3A43]'
              }`}>
                {order.delivery_method === 'retrait' ? 'Retrait sur place' : 'Livraison au stand'}
              </span>
            </div>
            {(order.billing_address || order.company_name) && (
              <div className="col-span-2 text-xs text-[#9A8A7C] pt-1 border-t border-[#E5D9D0]">
                {order.company_name && <p className="font-medium">{order.company_name}</p>}
                {order.billing_address && (
                  <p>{order.billing_address}, {order.billing_postal_code} {order.billing_city}</p>
                )}
              </div>
            )}
          </div>

          {/* Lines grouped by slot + guest */}
          <div className="space-y-4">
            {grouped.map((group, gi) => (
              <div key={gi} className="border border-[#E5D9D0] rounded-2xl overflow-hidden">
                <div className="bg-[#F0F0E6] px-4 py-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#C4B5A8]" />
                  <span className="text-sm font-medium text-[#392D31]">
                    {format(new Date(group.date), 'EEEE d MMMM', { locale: fr })}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B3A43]/10 text-[#8B3A43] font-medium">
                    {SLOT_LABELS[group.type] || group.type}
                  </span>
                  {group.guest_name && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#968A42]/10 text-[#968A42] font-medium">
                      {group.guest_name}
                    </span>
                  )}
                  {group.menu_unit_price != null && (
                    <span className="ml-auto text-xs font-medium text-[#9A8A7C]">
                      {group.menu_unit_price.toFixed(2)}€
                    </span>
                  )}
                </div>
                <div className="divide-y divide-[#E5D9D0]/50 bg-[#FDFAF7]">
                  {group.items.map((item, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-2">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-[#E5D9D0]" />
                      <span className="text-sm text-[#392D31]">{item.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#F0F0E6] text-[#9A8A7C]">
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E5D9D0]">
            <span className="text-base font-semibold text-[#392D31]">Total</span>
            <span className="text-xl text-[#8B3A43]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>{Number(order.total_amount).toFixed(2)}€</span>
          </div>

          {/* Payment status */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
              order.payment_status === 'paid'
                ? 'bg-green-100 text-green-700'
                : order.payment_status === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {order.payment_status === 'paid' ? 'Payé' :
               order.payment_status === 'pending' ? 'En attente de paiement' :
               order.payment_status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-mf-rose text-mf-blanc-casse font-medium rounded-full hover:opacity-90 transition-all uppercase tracking-[0.12em] text-[13px]"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-mf-white text-mf-marron-glace font-medium rounded-full border border-mf-border hover:border-mf-rose transition-all disabled:opacity-50 uppercase tracking-[0.12em] text-[13px]"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Génération...' : 'Facture PDF'}
            </button>
            <Link
              to="/order"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-mf-white text-mf-marron-glace font-medium rounded-full border border-mf-border hover:border-mf-rose transition-all uppercase tracking-[0.12em] text-[13px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Nouvelle commande
            </Link>
          </div>
        </div>
      </div>

      {/* Hidden invoice template for PDF generation — uses inline styles for html2canvas compatibility */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={invoiceRef} style={{ width: '794px', padding: '40px', backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
          {/* PDF Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '2px solid #8B3A43', paddingBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#8B3A43', margin: 0 }}>Maison Félicien</h1>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Traiteur événementiel</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#8B3A43', margin: 0 }}>FACTURE</h2>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{order.order_number}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                {format(new Date(order.created_at), 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {/* Event + Customer */}
          <div style={{ display: 'flex', gap: '40px', marginBottom: '28px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Événement</h3>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{eventName}</p>
              {eventDates && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{eventDates}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Client</h3>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                {order.customer_first_name} {order.customer_last_name}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Stand {order.stand}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{order.customer_email}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{order.customer_phone}</p>
              {order.company_name && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0', fontWeight: '500' }}>{order.company_name}</p>
              )}
              {order.billing_address && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                  {order.billing_address}, {order.billing_postal_code} {order.billing_city}
                </p>
              )}
            </div>
          </div>

          {/* Menus table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Créneau</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Convive</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Menu</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Prix</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((group, gi) => (
                <tr key={gi}>
                  <td style={{ padding: '8px 12px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                    {format(new Date(group.date), 'd MMM yyyy', { locale: fr })}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                    {SLOT_LABELS[group.type] || group.type}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '13px', color: '#968A42', fontWeight: '500', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                    {group.guest_name || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '12px', color: '#111827', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                    {group.items.map((item) => item.name).join(', ')}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '13px', color: '#111827', fontWeight: '500', textAlign: 'right', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                    {group.menu_unit_price != null ? `${group.menu_unit_price.toFixed(2)}€` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#111827', textAlign: 'right', borderTop: '2px solid #e5e7eb' }}>Total</td>
                <td style={{ padding: '12px', fontSize: '16px', fontWeight: 'bold', color: '#111827', textAlign: 'right', borderTop: '2px solid #e5e7eb' }}>{Number(order.total_amount).toFixed(2)}€</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>
                {order.delivery_method === 'retrait' ? 'Retrait sur place' : 'Livraison au stand'}
              </p>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                Commande n°{order.order_number}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Merci pour votre commande !</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>Maison Félicien — Traiteur événementiel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
