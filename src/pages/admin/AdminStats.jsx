import { useState, useEffect, useMemo } from 'react';
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, TrendingUp, ShoppingBag, Users, UtensilsCrossed } from 'lucide-react';
import { useEvents, useActiveEvent } from '@/hooks/useEvents';
import { useOrders } from '@/hooks/useOrders';
import { useOrderLines } from '@/hooks/useOrderLines';
import { supabase } from '@/api/supabase';

const SLOT_PILLS = [
  { key: 'all', label: 'Tous' },
  { key: 'midi', label: '☀ Midi' },
  { key: 'soir', label: '☽ Soir' },
];
const PERIOD_PILLS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'all', label: 'Tout' },
];
const RATINGS = [
  { value: 1, emoji: '😍' },
  { value: 2, emoji: '😊' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '😞' },
];
const BAR_COLORS = [
  'bg-mf-rose', 'bg-mf-poudre', 'bg-mf-vert-olive', 'bg-mf-vieux-rose', 'bg-mf-marron-glace/40',
];

/* ── Pill button ── */
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full font-body text-xs transition-all duration-200 cursor-pointer border ${
        active
          ? 'bg-mf-rose text-white border-mf-rose'
          : 'bg-white text-mf-marron-glace border-mf-border hover:border-mf-poudre'
      }`}
    >
      {children}
    </button>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, sub, variant = 'rose' }) {
  const variants = {
    rose: 'bg-mf-poudre/20 text-mf-rose',
    olive: 'bg-mf-vert-olive/15 text-mf-vert-olive',
    vieux: 'bg-mf-vieux-rose/15 text-mf-vieux-rose',
    marron: 'bg-mf-marron-glace/10 text-mf-marron-glace',
  };
  return (
    <div className="bg-white rounded-2xl border border-mf-border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variants[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-body text-mf-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold font-body text-mf-marron-glace">{value}</p>
      {sub && <p className="text-xs font-body text-mf-muted mt-1">{sub}</p>}
    </div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ label, value, max, colorClass = 'bg-mf-rose' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-body text-mf-marron-glace font-medium truncate">{label}</span>
        <span className="font-body text-mf-muted shrink-0 ml-2">{value}</span>
      </div>
      <div className="h-2 bg-mf-blanc-casse rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function AdminStats() {
  const qc = useQueryClient();
  const { data: activeEvent } = useActiveEvent();
  const { data: allEvents = [] } = useEvents();

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [slotFilter, setSlotFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [realtimeOk, setRealtimeOk] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState([]);

  // Set default event once loaded
  useEffect(() => {
    if (!selectedEventId && activeEvent?.id) setSelectedEventId(activeEvent.id);
  }, [activeEvent, selectedEventId]);

  const eventId = selectedEventId;
  const { data: orders = [], isLoading: ordersLoading } = useOrders(eventId);
  const { data: lines = [], isLoading: linesLoading } = useOrderLines(eventId);

  /* ── Load feedback ── */
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const { data } = await supabase
        .from('order_feedback')
        .select('*, order:orders!inner(id, event_id, customer_first_name)')
        .eq('order.event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(20);
      setFeedback(data ?? []);
    })();
  }, [eventId]);

  /* ── Realtime ── */
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel('admin-stats-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        qc.invalidateQueries({ queryKey: ['orders', eventId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_lines' }, () => {
        qc.invalidateQueries({ queryKey: ['order_lines', eventId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_feedback' }, () => {
        // Re-fetch feedback
        supabase
          .from('order_feedback')
          .select('*, order:orders!inner(id, event_id, customer_first_name)')
          .eq('order.event_id', eventId)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(({ data }) => setFeedback(data ?? []));
      })
      .subscribe((status) => {
        setRealtimeOk(status === 'SUBSCRIBED');
      });
    return () => supabase.removeChannel(channel);
  }, [eventId, qc]);

  /* ── Filter helpers ── */
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  function matchesPeriod(dateStr) {
    if (periodFilter === 'all' || !dateStr) return true;
    const d = new Date(dateStr);
    if (periodFilter === 'today') return isToday(d);
    if (periodFilter === 'week') return isWithinInterval(d, { start: weekStart, end: weekEnd });
    return true;
  }

  /* ── Compute stats ── */
  const stats = useMemo(() => {
    // Filter lines by slot + period (using meal_slot date)
    const filteredLines = lines.filter((l) => {
      if (slotFilter !== 'all' && l.meal_slot?.slot_type !== slotFilter) return false;
      if (!matchesPeriod(l.meal_slot?.slot_date)) return false;
      return true;
    });

    // Get order IDs that have at least one matching line (for slot/period filter)
    const filteredOrderIds = new Set(filteredLines.map((l) => l.order?.id || l.order_id));

    // Filter orders
    const filteredOrders = slotFilter === 'all' && periodFilter === 'all'
      ? orders
      : orders.filter((o) => filteredOrderIds.has(o.id));

    const paid = filteredOrders.filter((o) => o.payment_status === 'paid');
    const pending = filteredOrders.filter((o) => o.payment_status === 'pending');
    const totalRevenue = paid.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const pendingRevenue = pending.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgOrder = paid.length > 0 ? totalRevenue / paid.length : 0;
    const uniqueEmails = new Set(filteredOrders.map((o) => o.customer_email)).size;

    // Menu item popularity (from filtered lines)
    const paidOrderIds = new Set(paid.map((o) => o.id));
    const paidLines = filteredLines.filter((l) => paidOrderIds.has(l.order?.id || l.order_id));
    const itemCounts = {};
    for (const line of paidLines) {
      const name = line.menu_item?.name || 'Inconnu';
      const type = line.menu_item?.type || '';
      const key = `${name}|${type}`;
      itemCounts[key] = (itemCounts[key] || 0) + (line.quantity || 1);
    }
    const topItems = Object.entries(itemCounts)
      .map(([key, count]) => {
        const [name, type] = key.split('|');
        return { name, type, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Prep status
    const prepCounts = { pending: 0, preparing: 0, ready: 0, delivered: 0 };
    for (const line of filteredLines) {
      if (prepCounts[line.prep_status] !== undefined) prepCounts[line.prep_status]++;
    }

    // Revenue by date + midi/soir split
    const revenueByDate = {};
    for (const line of paidLines) {
      const date = line.meal_slot?.slot_date;
      if (!date) continue;
      const slotType = line.meal_slot?.slot_type || 'midi';
      if (!revenueByDate[date]) revenueByDate[date] = { total: 0, midi: 0, soir: 0 };
      const amount = Number(line.unit_price || line.menu_item?.price || 0) * (line.quantity || 1);
      revenueByDate[date].total += amount;
      revenueByDate[date][slotType] += amount;
    }

    return {
      paid, pending, totalRevenue, pendingRevenue, avgOrder, uniqueEmails,
      topItems, revenueByDate, prepCounts, totalLines: filteredLines.length,
    };
  }, [orders, lines, slotFilter, periodFilter]);

  // Feedback stats
  const feedbackStats = useMemo(() => {
    if (feedback.length === 0) return null;
    const avg = feedback.reduce((s, f) => s + f.rating, 0) / feedback.length;
    const withComment = feedback.filter((f) => f.comment);
    return { avg, count: feedback.length, comments: withComment.slice(0, 5) };
  }, [feedback]);

  const isLoading = ordersLoading || linesLoading;
  const selectedEvent = allEvents.find((e) => e.id === eventId);

  if (isLoading && !selectedEvent) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Header + Live indicator ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display italic text-2xl text-mf-rose">Statistiques</h1>
          {selectedEvent && (
            <p className="font-body text-sm text-mf-muted mt-1">{selectedEvent.name}</p>
          )}
        </div>
        {realtimeOk && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-green/10 font-body text-xs text-status-green">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* ── Filters (sticky) ── */}
      <div className="sticky top-0 z-10 bg-mf-blanc-casse pb-3 -mt-2 pt-2 space-y-3">
        {/* Event selector */}
        <select
          value={eventId || ''}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 rounded-full border border-mf-border bg-white font-body text-sm text-mf-marron-glace focus:outline-none focus:border-mf-rose/40 cursor-pointer"
        >
          {allEvents.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} {ev.is_active ? '●' : ''}
            </option>
          ))}
        </select>

        {/* Slot + Period pills */}
        <div className="flex flex-wrap gap-2">
          {SLOT_PILLS.map((p) => (
            <Pill key={p.key} active={slotFilter === p.key} onClick={() => setSlotFilter(p.key)}>
              {p.label}
            </Pill>
          ))}
          <span className="w-px bg-mf-border mx-1" />
          {PERIOD_PILLS.map((p) => (
            <Pill key={p.key} active={periodFilter === p.key} onClick={() => setPeriodFilter(p.key)}>
              {p.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mf-rose" />
        </div>
      )}

      {!isLoading && !eventId && (
        <div className="text-center py-12">
          <p className="font-body text-mf-muted">Aucun événement sélectionné.</p>
        </div>
      )}

      {!isLoading && eventId && (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Chiffre d'affaires"
              value={`${stats.totalRevenue.toFixed(2)} €`}
              sub={`${stats.pendingRevenue.toFixed(2)} € en attente`}
              variant="rose"
            />
            <StatCard
              icon={ShoppingBag}
              label="Commandes payées"
              value={stats.paid.length}
              sub={`${stats.pending.length} en attente`}
              variant="olive"
            />
            <StatCard
              icon={BarChart3}
              label="Panier moyen"
              value={`${stats.avgOrder.toFixed(2)} €`}
              variant="vieux"
            />
            <StatCard
              icon={Users}
              label="Clients uniques"
              value={stats.uniqueEmails}
              variant="marron"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* ── Top menu items ── */}
            <div className="bg-white rounded-2xl border border-mf-border p-5">
              <h2 className="text-base font-body font-medium text-mf-marron-glace mb-4 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-mf-vieux-rose" />
                Plats les plus commandés
              </h2>
              {stats.topItems.length === 0 ? (
                <p className="font-body text-sm text-mf-muted text-center py-4">Aucune donnée</p>
              ) : (
                <div className="space-y-3">
                  {stats.topItems.map((item, i) => (
                    <ProgressBar
                      key={i}
                      label={item.name}
                      value={item.count}
                      max={stats.topItems[0].count}
                      colorClass={BAR_COLORS[i % BAR_COLORS.length]}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Pipeline cuisine ── */}
            <div className="bg-white rounded-2xl border border-mf-border p-5">
              <h2 className="text-base font-body font-medium text-mf-marron-glace mb-4">Pipeline cuisine</h2>
              <div className="space-y-3">
                <ProgressBar label="En attente" value={stats.prepCounts.pending} max={stats.totalLines} colorClass="bg-mf-vieux-rose" />
                <ProgressBar label="En préparation" value={stats.prepCounts.preparing} max={stats.totalLines} colorClass="bg-status-orange" />
                <ProgressBar label="Prêt" value={stats.prepCounts.ready} max={stats.totalLines} colorClass="bg-status-green" />
                <ProgressBar label="Livré" value={stats.prepCounts.delivered} max={stats.totalLines} colorClass="bg-mf-muted" />
              </div>
              <p className="font-body text-xs text-mf-muted mt-3">{stats.totalLines} lignes au total</p>
            </div>
          </div>

          {/* ── CA par jour ── */}
          {Object.keys(stats.revenueByDate).length > 0 && (
            <div className="bg-white rounded-2xl border border-mf-border p-5">
              <h2 className="text-base font-body font-medium text-mf-marron-glace mb-4">CA par jour</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-mf-border">
                      <th className="text-left font-body text-xs text-mf-muted uppercase tracking-wider py-2">Jour</th>
                      <th className="text-right font-body text-xs text-mf-muted uppercase tracking-wider py-2">☀ Midi</th>
                      <th className="text-right font-body text-xs text-mf-muted uppercase tracking-wider py-2">☽ Soir</th>
                      <th className="text-right font-body text-xs text-mf-muted uppercase tracking-wider py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.revenueByDate)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, rev]) => (
                        <tr key={date} className="border-b border-mf-border/50 last:border-0">
                          <td className="font-body text-sm text-mf-marron-glace py-2.5 capitalize">
                            {format(new Date(date + 'T00:00:00'), 'EEEE d MMM', { locale: fr })}
                          </td>
                          <td className="font-body text-sm text-mf-muted text-right py-2.5">
                            {rev.midi > 0 ? `${rev.midi.toFixed(2)} €` : '—'}
                          </td>
                          <td className="font-body text-sm text-mf-muted text-right py-2.5">
                            {rev.soir > 0 ? `${rev.soir.toFixed(2)} €` : '—'}
                          </td>
                          <td className="font-body text-sm font-medium text-mf-rose text-right py-2.5">
                            {rev.total.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Satisfaction ── */}
          {feedbackStats && (
            <div className="bg-white rounded-2xl border border-mf-border p-5">
              <h2 className="text-base font-body font-medium text-mf-marron-glace mb-4">Satisfaction</h2>
              <div className="flex items-center gap-6 mb-4">
                {/* Average rating */}
                <div className="text-center">
                  <div className="text-4xl">
                    {RATINGS.find((r) => r.value === Math.round(feedbackStats.avg))?.emoji || '😊'}
                  </div>
                  <p className="font-body text-lg font-bold text-mf-marron-glace mt-1">
                    {feedbackStats.avg.toFixed(1)}<span className="text-sm text-mf-muted font-normal"> / 4</span>
                  </p>
                </div>
                <div>
                  <p className="font-body text-sm text-mf-marron-glace">
                    <span className="font-medium">{feedbackStats.count}</span> retour{feedbackStats.count > 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {RATINGS.map((r) => {
                      const count = feedback.filter((f) => f.rating === r.value).length;
                      return (
                        <span key={r.value} className="font-body text-xs text-mf-muted">
                          {r.emoji} {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent comments */}
              {feedbackStats.comments.length > 0 && (
                <div className="space-y-2 border-t border-mf-border pt-3">
                  <p className="font-body text-[10px] uppercase tracking-wider text-mf-muted">Derniers commentaires</p>
                  {feedbackStats.comments.map((f) => (
                    <div key={f.id} className="flex items-start gap-2 py-1.5">
                      <span className="text-lg shrink-0">{RATINGS.find((r) => r.value === f.rating)?.emoji}</span>
                      <div>
                        <p className="font-body text-sm text-mf-marron-glace">{f.comment}</p>
                        <p className="font-body text-[10px] text-mf-muted mt-0.5">
                          {f.order?.customer_first_name || 'Client'} — {format(new Date(f.created_at), 'd MMM', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
