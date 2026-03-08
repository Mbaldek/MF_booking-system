import { useState, useEffect, useMemo } from 'react';
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart3, TrendingUp, ShoppingBag, Users, UtensilsCrossed, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useEvents, useActiveEvent } from '@/hooks/useEvents';
import { useOrders, useAllOrders } from '@/hooks/useOrders';
import { useOrderLines, useAllOrderLines } from '@/hooks/useOrderLines';
import { supabase } from '@/api/supabase';
import MfBadge from '@/components/ui/MfBadge';

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
  { value: 4, emoji: '😍' },
  { value: 3, emoji: '😊' },
  { value: 2, emoji: '😐' },
  { value: 1, emoji: '😞' },
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

const STATS_TABS = [
  { key: 'overview', label: '📊 Vue générale' },
  { key: 'clients', label: '👤 Clients' },
];

const LOYALTY_BADGE = {
  new: { variant: 'poudre', label: 'Nouveau' },
  regular: { variant: 'olive', label: 'Régulier' },
  loyal: { variant: 'rose', label: 'Fidèle' },
};

function getLoyalty(count) {
  if (count >= 4) return 'loyal';
  if (count >= 2) return 'regular';
  return 'new';
}

const PAYMENT_BADGE = {
  paid: { variant: 'green', label: 'Payée' },
  refunded: { variant: 'rose', label: 'Remboursée' },
  cancelled: { variant: 'red', label: 'Annulée' },
  pending: { variant: 'orange', label: 'En attente' },
};

const RATING_EMOJIS = { 4: '😍', 3: '😊', 2: '😐', 1: '😞' };

/* ══════════════════════════════════════════ */
export default function AdminStats() {
  const qc = useQueryClient();
  const { data: activeEvent } = useActiveEvent();
  const { data: allEvents = [] } = useEvents();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEventId, setSelectedEventId] = useState('__all__');
  const [slotFilter, setSlotFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [realtimeOk, setRealtimeOk] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState([]);

  const isAllEvents = selectedEventId === '__all__';
  const eventId = isAllEvents ? null : selectedEventId;

  // Fetch data — single event or all events
  const { data: singleOrders = [], isLoading: singleOrdersLoading } = useOrders(eventId);
  const { data: singleLines = [], isLoading: singleLinesLoading } = useOrderLines(eventId);
  const { data: allOrdersData = [], isLoading: allOrdersLoading } = useAllOrders();
  const { data: allLinesData = [], isLoading: allLinesLoading } = useAllOrderLines();

  const orders = isAllEvents ? allOrdersData : singleOrders;
  const lines = isAllEvents ? allLinesData : singleLines;
  const ordersLoading = isAllEvents ? allOrdersLoading : singleOrdersLoading;
  const linesLoading = isAllEvents ? allLinesLoading : singleLinesLoading;

  /* ── Load feedback ── */
  useEffect(() => {
    if (!isAllEvents && !eventId) return;
    (async () => {
      let query = supabase
        .from('order_feedback')
        .select('*, order:orders!inner(id, event_id, customer_first_name)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!isAllEvents) query = query.eq('order.event_id', eventId);
      const { data } = await query;
      setFeedback(data ?? []);
    })();
  }, [eventId, isAllEvents]);

  /* ── Realtime ── */
  useEffect(() => {
    if (!isAllEvents && !eventId) return;
    const channel = supabase
      .channel('admin-stats-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (isAllEvents) qc.invalidateQueries({ queryKey: ['orders', 'all'] });
        else qc.invalidateQueries({ queryKey: ['orders', eventId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_lines' }, () => {
        if (isAllEvents) qc.invalidateQueries({ queryKey: ['order_lines', 'all'] });
        else qc.invalidateQueries({ queryKey: ['order_lines', eventId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_feedback' }, () => {
        let query = supabase
          .from('order_feedback')
          .select('*, order:orders!inner(id, event_id, customer_first_name)')
          .order('created_at', { ascending: false })
          .limit(20);
        if (!isAllEvents) query = query.eq('order.event_id', eventId);
        query.then(({ data }) => setFeedback(data ?? []));
      })
      .subscribe((status) => {
        setRealtimeOk(status === 'SUBSCRIBED');
      });
    return () => supabase.removeChannel(channel);
  }, [eventId, isAllEvents, qc]);

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
    // Exclude test orders
    const realOrders = orders.filter((o) => !o.is_test);
    const realOrderIds = new Set(realOrders.map((o) => o.id));
    const realLines = lines.filter((l) => realOrderIds.has(l.order?.id || l.order_id));

    // Filter lines by slot + period (using meal_slot date)
    const filteredLines = realLines.filter((l) => {
      if (slotFilter !== 'all' && l.meal_slot?.slot_type !== slotFilter) return false;
      if (!matchesPeriod(l.meal_slot?.slot_date)) return false;
      return true;
    });

    // Get order IDs that have at least one matching line (for slot/period filter)
    const filteredOrderIds = new Set(filteredLines.map((l) => l.order?.id || l.order_id));

    // Filter orders
    const filteredOrders = slotFilter === 'all' && periodFilter === 'all'
      ? realOrders
      : realOrders.filter((o) => filteredOrderIds.has(o.id));

    const paid = filteredOrders.filter((o) => o.payment_status === 'paid');
    const pending = filteredOrders.filter((o) => o.payment_status === 'pending');
    const totalRevenue = paid.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const pendingRevenue = pending.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgOrder = paid.length > 0 ? totalRevenue / paid.length : 0;
    const uniqueEmails = new Set(filteredOrders.map((o) => o.customer_email)).size;

    // Menu item popularity (from filtered lines) — exclude supplements
    const paidOrderIds = new Set(paid.map((o) => o.id));
    const paidLines = filteredLines.filter((l) => paidOrderIds.has(l.order?.id || l.order_id));
    const itemCounts = {};
    for (const line of paidLines) {
      if (line.is_supplement) continue;
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
      if (!revenueByDate[date]) revenueByDate[date] = { total: 0, midi: 0, soir: 0, events: new Set() };
      const amount = Number(line.unit_price || line.menu_item?.price || 0) * (line.quantity || 1);
      revenueByDate[date].total += amount;
      revenueByDate[date][slotType] += amount;
      if (line.order?.event_id) revenueByDate[date].events.add(line.order.event_id);
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
  const selectedEvent = isAllEvents ? null : allEvents.find((e) => e.id === eventId);

  if (isLoading && !selectedEvent && !isAllEvents) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 space-y-6">
      {/* ── Header + Live indicator ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display italic text-2xl text-mf-rose">Statistiques</h1>
          <p className="font-body text-sm text-mf-muted mt-1">
            {isAllEvents ? 'Tous les événements' : selectedEvent?.name || ''}
          </p>
        </div>
        {realtimeOk && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-green/10 font-body text-xs text-status-green">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
        {STATS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-full font-body text-xs border transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-mf-rose border-mf-rose text-white'
                : 'bg-white border-mf-border text-mf-marron-glace hover:border-mf-rose/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'clients' && (
        <ClientsTab
          orders={orders}
          lines={lines}
          feedback={feedback}
          isLoading={isLoading}
          eventId={eventId}
          isAllEvents={isAllEvents}
        />
      )}

      {activeTab === 'overview' && <>
      {/* ── Filters (sticky) ── */}
      <div className="sticky top-0 z-10 bg-mf-blanc-casse pb-3 -mt-2 pt-2 space-y-3">
        {/* Event selector */}
        <select
          value={selectedEventId || ''}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 rounded-full border border-mf-border bg-white font-body text-sm text-mf-marron-glace focus:outline-none focus:border-mf-rose/40 cursor-pointer"
        >
          <option value="__all__">📊 Tous les événements</option>
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

      {!isLoading && !eventId && !isAllEvents && (
        <div className="text-center py-12">
          <p className="font-body text-mf-muted">Aucun événement sélectionné.</p>
        </div>
      )}

      {!isLoading && (eventId || isAllEvents) && (
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
                            {isAllEvents && rev.events?.size > 0 && (
                              <div className="font-body text-[10px] text-mf-muted normal-case">
                                {[...rev.events].map((eid) => allEvents.find((e) => e.id === eid)?.name).filter(Boolean).join(', ')}
                              </div>
                            )}
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
      </>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2 — Clients
   ═══════════════════════════════════════════════════ */

function ClientsTab({ orders, lines, feedback, isLoading, eventId, isAllEvents }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState(null);

  const clientData = useMemo(() => {
    const realOrders = orders.filter((o) => !o.is_test);
    const paidOrders = realOrders.filter((o) => o.payment_status === 'paid');

    // Group by email
    const byEmail = {};
    for (const order of realOrders) {
      const email = order.customer_email;
      if (!email) continue;
      if (!byEmail[email]) {
        byEmail[email] = {
          email,
          name: `${order.customer_last_name || ''} ${order.customer_first_name || ''}`.trim(),
          firstName: order.customer_first_name || '',
          lastName: order.customer_last_name || '',
          orders: [],
          events: new Set(),
          revenue: 0,
          lastDate: null,
        };
      }
      const client = byEmail[email];
      client.orders.push(order);
      if (order.event_id) client.events.add(order.event_id);
      if (order.payment_status === 'paid') {
        client.revenue += Number(order.total_amount) || 0;
      }
      const d = new Date(order.created_at);
      if (!client.lastDate || d > client.lastDate) client.lastDate = d;
    }

    // Attach feedback per order
    const feedbackByOrder = {};
    for (const f of feedback) {
      feedbackByOrder[f.order_id] = f;
    }

    // Attach lines per order
    const linesByOrder = {};
    for (const l of lines) {
      const oid = l.order?.id || l.order_id;
      if (!oid) continue;
      if (!linesByOrder[oid]) linesByOrder[oid] = [];
      linesByOrder[oid].push(l);
    }

    // Build client list
    const clients = Object.values(byEmail).map((c) => {
      const paidCount = c.orders.filter((o) => o.payment_status === 'paid').length;
      const ratings = c.orders
        .map((o) => feedbackByOrder[o.id]?.rating)
        .filter(Boolean);
      const avgRating = ratings.length > 0
        ? ratings.reduce((s, r) => s + r, 0) / ratings.length
        : null;

      return {
        ...c,
        orderCount: c.orders.length,
        paidCount,
        eventCount: c.events.size,
        loyalty: getLoyalty(paidCount),
        avgRating,
        feedbackByOrder,
        linesByOrder,
      };
    });

    return clients;
  }, [orders, lines, feedback]);

  // Stats cards
  const totalClients = clientData.length;
  const totalRevenue = clientData.reduce((s, c) => s + c.revenue, 0);
  const avgRevenue = totalClients > 0 ? totalRevenue / totalClients : 0;
  const totalOrders = clientData.reduce((s, c) => s + c.paidCount, 0);
  const avgOrders = totalClients > 0 ? totalOrders / totalClients : 0;

  // Filter + sort
  const filtered = useMemo(() => {
    let list = clientData;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va, vb;
      if (sortKey === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortKey === 'orders') { va = a.paidCount; vb = b.paidCount; }
      else if (sortKey === 'revenue') { va = a.revenue; vb = b.revenue; }
      else if (sortKey === 'lastDate') { va = a.lastDate?.getTime() || 0; vb = b.lastDate?.getTime() || 0; }
      else { va = 0; vb = 0; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [clientData, search, sortKey, sortAsc]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Clients uniques" value={totalClients} variant="marron" />
        <StatCard
          icon={TrendingUp}
          label="CA moyen / client"
          value={`${avgRevenue.toFixed(2)} €`}
          variant="rose"
        />
        <StatCard
          icon={ShoppingBag}
          label="Commandes / client"
          value={avgOrders.toFixed(1)}
          sub="en moyenne"
          variant="olive"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client..."
          className="w-full rounded-full border border-mf-border pl-10 pr-5 py-2.5 font-body text-sm text-mf-marron-glace bg-white placeholder:text-mf-muted-light outline-none focus:border-mf-rose transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-mf-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-mf-border">
                <SortableHeader label="Client" col="name" onClick={toggleSort} sortKey={sortKey} sortAsc={sortAsc} />
                <th className="text-left px-4 py-3 font-body text-[10px] uppercase tracking-wider text-mf-muted bg-mf-blanc-casse">Email</th>
                <SortableHeader label="Commandes" col="orders" onClick={toggleSort} sortKey={sortKey} sortAsc={sortAsc} />
                <th className="text-left px-4 py-3 font-body text-[10px] uppercase tracking-wider text-mf-muted bg-mf-blanc-casse">Événements</th>
                <SortableHeader label="CA total" col="revenue" onClick={toggleSort} sortKey={sortKey} sortAsc={sortAsc} />
                <SortableHeader label="Dernière cmd" col="lastDate" onClick={toggleSort} sortKey={sortKey} sortAsc={sortAsc} />
                <th className="text-left px-4 py-3 font-body text-[10px] uppercase tracking-wider text-mf-muted bg-mf-blanc-casse">Satisfaction</th>
                <th className="text-left px-4 py-3 font-body text-[10px] uppercase tracking-wider text-mf-muted bg-mf-blanc-casse">Fidélité</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <ClientRow
                  key={client.email}
                  client={client}
                  isExpanded={expandedEmail === client.email}
                  onToggle={() => setExpandedEmail(expandedEmail === client.email ? null : client.email)}
                />
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-mf-muted/30 mx-auto mb-2" />
              <p className="font-body text-sm text-mf-muted">Aucun client trouvé</p>
            </div>
          )}
        </div>
      </div>

      <p className="font-body text-xs text-mf-muted text-center">
        {filtered.length} client{filtered.length !== 1 ? 's' : ''} · hors commandes de test
      </p>
    </div>
  );
}

function SortableHeader({ label, col, onClick, sortKey, sortAsc }) {
  return (
    <th
      onClick={() => onClick(col)}
      className="text-left px-4 py-3 font-body text-[10px] uppercase tracking-wider text-mf-muted bg-mf-blanc-casse cursor-pointer hover:text-mf-rose transition-colors select-none"
    >
      {label}
      {sortKey === col && (
        sortAsc
          ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
          : <ChevronDown className="w-3 h-3 inline ml-0.5" />
      )}
    </th>
  );
}

function ClientRow({ client, isExpanded, onToggle }) {
  const badge = LOYALTY_BADGE[client.loyalty];

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-mf-border/50 hover:bg-mf-poudre/10 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3 font-body text-sm font-medium text-mf-marron-glace whitespace-nowrap">
          {client.name || '—'}
        </td>
        <td className="px-4 py-3 font-body text-sm text-mf-muted">
          {client.email}
        </td>
        <td className="px-4 py-3 font-body text-sm text-mf-marron-glace text-center">
          {client.paidCount}
        </td>
        <td className="px-4 py-3 font-body text-sm text-mf-muted text-center">
          {client.eventCount}
        </td>
        <td className="px-4 py-3 font-body text-sm font-medium text-mf-rose whitespace-nowrap">
          {client.revenue.toFixed(2)} €
        </td>
        <td className="px-4 py-3 font-body text-sm text-mf-muted whitespace-nowrap">
          {client.lastDate ? format(client.lastDate, 'd MMM yyyy', { locale: fr }) : '—'}
        </td>
        <td className="px-4 py-3 text-center">
          {client.avgRating != null ? (
            <span className="font-body text-sm">
              {RATING_EMOJIS[Math.round(client.avgRating)] || '—'}{' '}
              <span className="text-mf-muted text-xs">{client.avgRating.toFixed(1)}</span>
            </span>
          ) : (
            <span className="text-mf-muted text-xs">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <MfBadge variant={badge.variant}>{badge.label}</MfBadge>
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <ClientDetail client={client} />
          </td>
        </tr>
      )}
    </>
  );
}

function ClientDetail({ client }) {
  const firstOrder = client.orders.reduce((oldest, o) => {
    const d = new Date(o.created_at);
    return !oldest || d < oldest ? d : oldest;
  }, null);

  const sortedOrders = [...client.orders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="bg-mf-blanc-casse border-t border-mf-border px-6 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="font-display italic text-lg text-mf-rose">{client.name || client.email}</h3>
        <MfBadge variant={LOYALTY_BADGE[client.loyalty].variant}>
          {LOYALTY_BADGE[client.loyalty].label}
        </MfBadge>
        <span className="font-body text-xs text-mf-muted ml-auto">
          {client.email}
        </span>
      </div>

      {/* Summary */}
      <p className="font-body text-sm text-mf-muted">
        Client depuis{' '}
        <span className="text-mf-marron-glace font-medium">
          {firstOrder ? format(firstOrder, 'd MMMM yyyy', { locale: fr }) : '—'}
        </span>
        {' · '}{client.paidCount} commande{client.paidCount > 1 ? 's' : ''} sur {client.eventCount} événement{client.eventCount > 1 ? 's' : ''}
        {' · '}{client.revenue.toFixed(2)} € de CA
      </p>

      {/* Timeline */}
      <div className="space-y-0">
        {sortedOrders.map((order) => {
          const orderLines = client.linesByOrder[order.id] || [];
          const fb = client.feedbackByOrder[order.id];
          const payBadge = PAYMENT_BADGE[order.payment_status] || PAYMENT_BADGE.pending;

          return (
            <div key={order.id} className="flex gap-4 py-3 border-b border-mf-border/30 last:border-0">
              {/* Date col */}
              <div className="w-24 shrink-0">
                <p className="font-body text-xs font-medium text-mf-marron-glace">
                  {format(new Date(order.created_at), 'd MMM yyyy', { locale: fr })}
                </p>
                <p className="font-body text-[10px] text-mf-muted">
                  {order.event?.name || ''}
                </p>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-medium text-mf-rose">
                    {order.order_number}
                  </span>
                  <span className="font-body text-sm text-mf-marron-glace font-medium">
                    {Number(order.total_amount).toFixed(2)} €
                  </span>
                  <MfBadge variant={payBadge.variant}>{payBadge.label}</MfBadge>
                  {fb && (
                    <span className="text-sm" title={`Note: ${fb.rating}/4`}>
                      {RATING_EMOJIS[fb.rating] || ''}
                    </span>
                  )}
                </div>

                {/* Items as pills */}
                {orderLines.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {orderLines.map((l, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded-full bg-mf-poudre/20 font-body text-[10px] text-mf-rose"
                      >
                        {l.menu_item?.name || '?'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
