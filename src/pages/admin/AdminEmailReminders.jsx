import { useState, useMemo } from 'react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail, Send, CheckCircle2, Clock, Filter } from 'lucide-react';
import { useActiveEvent } from '@/hooks/useEvents';
import { useOrders } from '@/hooks/useOrders';
import { useOrderLines } from '@/hooks/useOrderLines';
import { supabase } from '@/api/supabase';

const SLOT_LABELS = { midi: 'Midi', soir: 'Soir' };

export default function AdminEmailReminders() {
  const { data: event } = useActiveEvent();
  const { data: orders = [], isLoading: ordersLoading } = useOrders(event?.id);
  const { data: lines = [] } = useOrderLines(event?.id);
  const [sending, setSending] = useState({});
  const [sent, setSent] = useState({});
  const [dateFilter, setDateFilter] = useState('all');

  // Group orders with their upcoming meal slots
  const reminders = useMemo(() => {
    if (!orders.length || !lines.length) return [];

    const paidOrders = orders.filter((o) => o.payment_status === 'paid');

    return paidOrders.map((order) => {
      const orderLines = lines.filter((l) => l.order_id === order.id);
      const slots = {};
      for (const line of orderLines) {
        const slotKey = `${line.meal_slot?.slot_date}_${line.meal_slot?.slot_type}`;
        if (!slots[slotKey] && line.meal_slot) {
          slots[slotKey] = {
            date: line.meal_slot.slot_date,
            type: line.meal_slot.slot_type,
          };
        }
      }
      return {
        order,
        slots: Object.values(slots).sort((a, b) => a.date.localeCompare(b.date)),
        lineCount: orderLines.length,
      };
    }).filter((r) => r.slots.length > 0);
  }, [orders, lines]);

  // Filter by date
  const filtered = useMemo(() => {
    if (dateFilter === 'all') return reminders;
    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    return reminders.filter((r) =>
      r.slots.some((s) => {
        if (dateFilter === 'today') return s.date === today;
        if (dateFilter === 'tomorrow') return s.date === tomorrow;
        return true;
      })
    );
  }, [reminders, dateFilter]);

  const handleSendReminder = async (order) => {
    setSending((prev) => ({ ...prev, [order.id]: true }));
    try {
      const { error } = await supabase.functions.invoke('send-order-confirmation', {
        body: { orderId: order.id },
      });
      if (error) throw error;
      setSent((prev) => ({ ...prev, [order.id]: true }));
    } catch (err) {
      console.error('Erreur envoi email:', err);
      alert('Erreur lors de l\'envoi de l\'email.');
    } finally {
      setSending((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const handleBulkSend = async () => {
    const toSend = filtered.filter((r) => !sent[r.order.id]);
    for (const r of toSend) {
      await handleSendReminder(r.order);
    }
  };

  const isLoading = ordersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 text-center">
        <p className="text-mf-muted">Aucun événement actif.</p>
      </div>
    );
  }

  const sentCount = filtered.filter((r) => sent[r.order.id]).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-mf-marron-glace">Rappels email</h1>
          <p className="text-sm text-mf-muted mt-1">{event.name} — Envoyer des rappels de commande</p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={handleBulkSend}
            disabled={sentCount === filtered.length}
            className="inline-flex items-center gap-2 px-4 py-2 bg-mf-rose text-white text-sm font-medium rounded-pill hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            Envoyer tout ({filtered.length - sentCount})
          </button>
        )}
      </div>

      {/* Date filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Toutes les dates' },
          { key: 'today', label: "Aujourd'hui" },
          { key: 'tomorrow', label: 'Demain' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setDateFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              dateFilter === tab.key
                ? 'bg-mf-rose text-white'
                : 'bg-mf-blanc-casse text-mf-muted hover:bg-mf-poudre/20'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Mail className="w-12 h-12 text-mf-poudre mx-auto mb-4" />
          <p className="text-mf-muted font-medium">Aucune commande à rappeler</p>
          <p className="text-sm text-mf-muted mt-1">Les commandes payées avec des créneaux à venir apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ order, slots, lineCount }) => {
            const isSent = sent[order.id];
            const isSending = sending[order.id];

            return (
              <div key={order.id} className={`bg-white rounded-xl shadow-sm border p-5 transition-opacity ${isSent ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-mf-marron-glace">{order.order_number}</span>
                      <span className="text-sm text-mf-marron-glace">{order.customer_first_name} {order.customer_last_name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-mf-muted">
                      <span>{order.customer_email}</span>
                      <span>Stand {order.stand}</span>
                      <span>{lineCount} article{lineCount > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.map((slot, i) => {
                        const d = new Date(slot.date + 'T00:00:00');
                        const isT = isToday(d);
                        const isTm = isTomorrow(d);
                        return (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isT ? 'bg-status-red/15 text-status-red' : isTm ? 'bg-status-orange/15 text-status-orange' : 'bg-mf-blanc-casse text-mf-muted'
                          }`}>
                            {format(d, 'd MMM', { locale: fr })} {SLOT_LABELS[slot.type]}
                            {isT && ' (aujourd\'hui)'}
                            {isTm && ' (demain)'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendReminder(order)}
                    disabled={isSending || isSent}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                      isSent
                        ? 'bg-status-green/10 text-status-green'
                        : 'bg-mf-poudre/20 text-mf-rose hover:bg-mf-poudre/30'
                    } disabled:opacity-50`}
                  >
                    {isSent ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Envoyé</>
                    ) : isSending ? (
                      <><Clock className="w-3.5 h-3.5 animate-spin" /> Envoi...</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Envoyer</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
