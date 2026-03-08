import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar, ShoppingBag, TrendingUp, ChefHat,
  Download, UtensilsCrossed, Mail, X,
} from 'lucide-react';
import { useEvents, useActiveEvent } from '@/hooks/useEvents';
import { useOrders } from '@/hooks/useOrders';
import { useOrderLines } from '@/hooks/useOrderLines';
import MfCard from '@/components/ui/MfCard';
import MfBadge from '@/components/ui/MfBadge';
import StartupChecklist from '@/components/onboarding/StartupChecklist';
import PageTour from '@/components/onboarding/PageTour';

const STATUS_MAP = {
  paid: { variant: 'green', label: 'Payée' },
  pending: { variant: 'orange', label: 'En attente' },
  cancelled: { variant: 'red', label: 'Annulée' },
  refunded: { variant: 'rose', label: 'Remboursée' },
};

export default function AdminDashboard() {
  const { data: events = [] } = useEvents();
  const { data: activeEvent } = useActiveEvent();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const eventId = selectedEventId ?? activeEvent?.id;
  const currentEvent = events.find((e) => e.id === eventId) || activeEvent;

  const { data: orders = [], isLoading: ordersLoading } = useOrders(eventId);
  const { data: allLines = [], isLoading: linesLoading } = useOrderLines(eventId);

  const isLoading = ordersLoading || linesLoading;

  // ─── Computed stats (exclude test orders) ───
  const realOrders = useMemo(() => orders.filter((o) => !o.is_test), [orders]);
  const realOrderIds = useMemo(() => new Set(realOrders.map((o) => o.id)), [realOrders]);
  const realLines = useMemo(() => allLines.filter((l) => realOrderIds.has(l.order_id)), [allLines, realOrderIds]);

  const stats = useMemo(() => {
    const paidOrders = realOrders.filter((o) => o.payment_status === 'paid');
    const revenue = paidOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

    const pending = realLines.filter((l) => l.prep_status === 'pending').length;
    const preparing = realLines.filter((l) => l.prep_status === 'preparing').length;
    const ready = realLines.filter((l) => l.prep_status === 'ready').length;
    const delivered = realLines.filter((l) => l.prep_status === 'delivered').length;
    const total = realLines.length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return { totalOrders: realOrders.length, revenue, pending, preparing, ready, delivered, total, deliveryRate };
  }, [realOrders, realLines]);

  const recentOrders = useMemo(() => realOrders.slice(0, 5), [realOrders]);

  const pipeline = useMemo(() => [
    { label: 'En attente', count: stats.pending, textClass: 'text-mf-muted', bgClass: 'bg-mf-muted' },
    { label: 'En préparation', count: stats.preparing, textClass: 'text-status-orange', bgClass: 'bg-status-orange' },
    { label: 'Prêts', count: stats.ready, textClass: 'text-mf-vert-olive', bgClass: 'bg-mf-vert-olive' },
    { label: 'Livrés', count: stats.delivered, textClass: 'text-status-green', bgClass: 'bg-status-green' },
  ], [stats]);

  // Count lines per order for "Articles" column
  const lineCountByOrder = useMemo(() => {
    const counts = {};
    for (const line of realLines) {
      counts[line.order_id] = (counts[line.order_id] || 0) + 1;
    }
    return counts;
  }, [realLines]);

  // Revenue grouped by day, split midi/soir via order_lines meal_slot
  const revenueChart = useMemo(() => {
    // Build per-order slot-type revenue using DISTINCT (meal_slot_id, guest_name) like the DB trigger
    const paidIds = new Set(realOrders.filter((o) => o.payment_status === 'paid').map((o) => o.id));
    const orderDateMap = {};
    for (const o of realOrders) {
      if (paidIds.has(o.id)) orderDateMap[o.id] = o.created_at?.slice(0, 10);
    }

    const byDate = {};
    // Track unique (order, meal_slot, guest_name) combos to avoid double-counting
    const seen = new Set();
    for (const line of realLines) {
      if (!paidIds.has(line.order_id)) continue;
      const d = orderDateMap[line.order_id];
      if (!d) continue;
      const slotType = line.meal_slot?.slot_type || 'midi';
      const comboKey = `${line.order_id}__${line.meal_slot_id}__${line.guest_name || ''}`;
      if (seen.has(comboKey)) continue;
      seen.add(comboKey);
      const price = Number(line.menu_unit_price || 0);
      if (!byDate[d]) byDate[d] = { midi: 0, soir: 0 };
      byDate[d][slotType] += price;
    }

    const entries = Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-5)
      .map(([date, { midi, soir }]) => ({ date, midi, soir, total: midi + soir }));
    const max = Math.max(...entries.map((e) => e.total), 1);
    return { entries, max };
  }, [realOrders, realLines]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose mx-auto" />
          <p className="font-body text-[13px] text-mf-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1200px]">
      <PageTour page="dashboard" />
      <StartupChecklist activeEventId={eventId} />

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-[28px] italic text-mf-rose">Tableau de bord</h1>
          <p className="font-body text-[13px] text-mf-muted mt-0.5">
            {currentEvent?.name || 'Aucun événement'} · {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2" data-tour="event-selector">
          <select
            value={eventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
            className="font-body text-[12px] text-mf-marron-glace px-4 py-2.5 rounded-pill border border-mf-border bg-white outline-none focus:border-mf-rose cursor-pointer"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}{ev.id === activeEvent?.id ? ' (actif)' : ''}
              </option>
            ))}
          </select>
          <Link
            to="/admin/events"
            className="font-body text-[11px] uppercase tracking-widest text-mf-blanc-casse bg-mf-rose px-5 py-2.5 rounded-pill hover:opacity-90 transition-opacity"
          >
            + Événement
          </Link>
        </div>
      </div>

      {/* ─── Stat Cards (4) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="stat-cards">
        <StatCard
          icon={<ShoppingBag className="w-5 h-5 text-mf-rose" />}
          value={stats.totalOrders}
          label="Commandes"
          sub={`${realOrders.filter((o) => o.payment_status === 'paid').length} payées`}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-mf-vert-olive" />}
          value={`${stats.revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`}
          label="Chiffre d'affaires"
          serif
        />
        <StatCard
          icon={<ChefHat className="w-5 h-5 text-status-orange" />}
          value={stats.pending + stats.preparing}
          label="Repas à préparer"
          sub={`${stats.preparing} en cours`}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-status-green" />}
          value={`${stats.deliveryRate}%`}
          label="Taux livraison"
          sub={`${stats.delivered}/${stats.total} livrés`}
        />
      </div>

      {/* ─── Main grid: Orders table + Right column ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Recent orders */}
        <MfCard className="p-0 overflow-hidden overflow-x-auto" data-tour="recent-orders">
          <div className="flex items-center justify-between px-5 py-4 border-b border-mf-border">
            <h2 className="font-serif text-[20px] italic text-mf-rose">Dernières commandes</h2>
            <Link to="/admin/orders" className="font-body text-[10px] uppercase tracking-widest text-mf-rose hover:text-mf-vieux-rose transition-colors">
              Voir tout →
            </Link>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[90px_1fr_60px_70px_80px_80px] gap-2 px-5 py-2.5 border-b border-mf-border">
            {['N°', 'Client', 'Stand', 'Articles', 'Total', 'Statut'].map((h, i) => (
              <span key={h} className={`font-body text-[9px] uppercase tracking-widest text-mf-muted${i === 2 || i === 3 ? ' hidden md:block' : ''}`}>{h}</span>
            ))}
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-body text-[13px] text-mf-muted">Aucune commande</p>
            </div>
          ) : (
            recentOrders.map((o) => {
              const st = STATUS_MAP[o.payment_status] || STATUS_MAP.pending;
              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="grid grid-cols-[90px_1fr_60px_70px_80px_80px] gap-2 px-5 py-3 border-b border-mf-blanc-casse hover:bg-mf-poudre/8 transition-colors cursor-pointer"
                >
                  <span className="font-mono text-[11px] text-mf-rose font-medium truncate" title={o.order_number}>
                    {o.order_number ? `CMD-…${o.order_number.slice(-4)}` : '—'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-body text-[13px] text-mf-marron-glace truncate">
                      {o.customer_first_name} {o.customer_last_name}
                    </div>
                    <div className="font-body text-[10px] text-mf-muted">
                      {o.created_at && format(new Date(o.created_at), 'HH:mm', { locale: fr })}
                    </div>
                  </div>
                  <span className="font-body text-[12px] text-mf-marron-glace hidden md:block">{o.stand || '—'}</span>
                  <span className="font-body text-[12px] text-mf-marron-glace hidden md:block">{lineCountByOrder[o.id] || '—'}</span>
                  <span className="font-serif text-[13px] italic text-mf-marron-glace">
                    {Number(o.total_amount || 0).toFixed(2)} €
                  </span>
                  <MfBadge variant={st.variant}>{st.label}</MfBadge>
                </div>
              );
            })
          )}
        </MfCard>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Revenue mini chart — stacked midi/soir */}
          <MfCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-[18px] italic text-mf-rose">Revenus</h3>
              <span className="font-body text-[11px] text-mf-muted">Derniers jours</span>
            </div>
            <div className="font-serif text-[26px] italic text-mf-marron-glace mb-1">
              {stats.revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
            </div>
            <div className="flex items-end gap-2 h-20 mt-4 px-1">
              {revenueChart.entries.map((entry) => (
                <div key={entry.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end gap-px" style={{ height: 80 }}>
                    {entry.soir > 0 && (
                      <div
                        className="w-full bg-mf-poudre rounded-t transition-all duration-500"
                        style={{ height: `${(entry.soir / revenueChart.max) * 100}%`, minHeight: entry.soir > 0 ? 3 : 0 }}
                      />
                    )}
                    <div
                      className={`w-full bg-mf-rose transition-all duration-500 ${entry.soir > 0 ? 'rounded-b' : 'rounded'}`}
                      style={{ height: `${(entry.midi / revenueChart.max) * 100}%`, minHeight: 3 }}
                    />
                  </div>
                  <span className="font-body text-[10px] text-mf-muted">
                    {format(new Date(entry.date + 'T00:00:00'), 'EEE', { locale: fr })}
                  </span>
                </div>
              ))}
              {revenueChart.entries.length === 0 && (
                <p className="font-body text-[11px] text-mf-muted text-center w-full py-6">Pas de données</p>
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-mf-rose" />
                <span className="font-body text-[10px] text-mf-muted">Midi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-mf-poudre" />
                <span className="font-body text-[10px] text-mf-muted">Soir</span>
              </div>
            </div>
          </MfCard>

          {/* Pipeline cuisine */}
          <MfCard data-tour="kitchen-pipeline">
            <h3 className="font-serif text-[18px] italic text-mf-rose mb-4">Pipeline cuisine</h3>
            <div className="flex flex-col gap-3">
              {pipeline.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-body text-[12px] text-mf-marron-glace">{p.label}</span>
                    <span className={`font-body text-[12px] font-medium ${p.textClass}`}>{p.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-mf-blanc-casse">
                    <div
                      className={`h-full rounded-full ${p.bgClass} transition-all duration-500`}
                      style={{ width: `${stats.total > 0 ? (p.count / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </MfCard>

          {/* Quick actions */}
          <MfCard data-tour="quick-actions">
            <h3 className="font-serif text-[18px] italic text-mf-rose mb-4">Actions rapides</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Exporter les commandes', icon: Download, to: '/admin/orders' },
                { label: 'Modifier le menu', icon: UtensilsCrossed, to: '/admin/menu' },
                { label: 'Envoyer un rappel', icon: Mail, to: '/admin/reminders' },
              ].map((a) => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-mf-border bg-white hover:border-mf-rose/30 transition-all duration-200 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-mf-poudre/30 flex items-center justify-center">
                    <a.icon className="w-3.5 h-3.5 text-mf-rose" />
                  </div>
                  <span className="font-body text-[12px] text-mf-marron-glace group-hover:text-mf-rose transition-colors flex-1">
                    {a.label}
                  </span>
                  <span className="font-body text-[12px] text-mf-muted">→</span>
                </Link>
              ))}
            </div>
          </MfCard>
        </div>
      </div>

      {/* ─── Order Detail Modal ─── */}
      {selectedOrder && (
        <DashboardOrderModal
          order={selectedOrder}
          lines={realLines.filter((l) => l.order_id === selectedOrder.id)}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

/* ── Dashboard order detail modal ── */
function DashboardOrderModal({ order, lines, onClose }) {
  const st = STATUS_MAP[order.payment_status] || STATUS_MAP.pending;

  // Group lines by slot
  const slotGroups = useMemo(() => {
    const groups = {};
    lines.forEach((l) => {
      const key = l.meal_slot_id || 'unknown';
      if (!groups[key]) groups[key] = { slot: l.meal_slot, lines: [] };
      groups[key].lines.push(l);
    });
    return Object.values(groups);
  }, [lines]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes mf-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mf-modal-in { from { opacity: 0; transform: scale(0.92) translateY(16px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
      <div onClick={onClose} className="absolute inset-0 bg-mf-marron-glace/30 backdrop-blur-sm" style={{ animation: 'mf-backdrop-in 0.3s ease' }} />
      <div
        className="relative bg-white rounded-card w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
        style={{ animation: 'mf-modal-in 0.4s ease both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-mf-border">
          <div>
            <h2 className="font-display text-[24px] italic text-mf-rose">{order.order_number}</h2>
            <MfBadge variant={st.variant} className="mt-1">{st.label}</MfBadge>
          </div>
          <button onClick={onClose} className="p-1.5 text-mf-muted hover:text-mf-rose rounded-lg transition-colors cursor-pointer bg-transparent border-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Client info */}
          <div className="rounded-2xl bg-mf-blanc-casse p-4">
            <div className="font-body text-[10px] uppercase tracking-[0.1em] text-mf-vieux-rose mb-2">Client</div>
            <div className="font-body text-[16px] text-mf-marron-glace font-medium">
              {order.customer_first_name} {order.customer_last_name}
            </div>
            {order.company_name && (
              <div className="font-body text-[13px] text-mf-muted">{order.company_name}</div>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
              {order.stand && (
                <div>
                  <span className="font-body text-[10px] text-mf-muted">Stand </span>
                  <span className="font-body text-[12px] text-mf-marron-glace font-medium">{order.stand}</span>
                </div>
              )}
              {order.customer_email && (
                <div>
                  <span className="font-body text-[10px] text-mf-muted">Email </span>
                  <span className="font-body text-[12px] text-mf-marron-glace">{order.customer_email}</span>
                </div>
              )}
              {order.customer_phone && (
                <div>
                  <span className="font-body text-[10px] text-mf-muted">Tél. </span>
                  <span className="font-body text-[12px] text-mf-marron-glace">{order.customer_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Date', value: order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy', { locale: fr }) : '—' },
              { label: 'Total', value: `${Number(order.total_amount || 0).toFixed(2)} €` },
              { label: 'Articles', value: lines.length },
            ].map((d) => (
              <div key={d.label} className="rounded-xl bg-mf-blanc-casse p-3 text-center">
                <div className="font-body text-[9px] uppercase tracking-[0.08em] text-mf-muted">{d.label}</div>
                <div className="font-body text-[13px] text-mf-marron-glace font-medium mt-1">{d.value}</div>
              </div>
            ))}
          </div>

          {/* Lines by slot */}
          {slotGroups.length > 0 && (
            <div className="space-y-3">
              <div className="font-body text-[10px] uppercase tracking-[0.1em] text-mf-vieux-rose">Détail</div>
              {slotGroups.map((group, gi) => (
                <div key={gi} className="rounded-xl border border-mf-border p-3">
                  {group.slot && (
                    <p className="font-body text-[11px] text-mf-muted mb-2">
                      {group.slot.slot_type === 'midi' ? '☀' : '☽'}{' '}
                      {group.slot.slot_date && format(new Date(group.slot.slot_date + 'T00:00:00'), 'EEE d MMM', { locale: fr })}{' '}
                      {group.slot.slot_type === 'midi' ? 'Midi' : 'Soir'}
                    </p>
                  )}
                  <ul className="space-y-1">
                    {group.lines.map((l) => (
                      <li key={l.id} className="flex items-center justify-between">
                        <div>
                          <span className="font-body text-[13px] text-mf-marron-glace">{l.menu_item?.name || '—'}</span>
                          {l.guest_name && <span className="font-body text-[10px] text-mf-muted ml-2">({l.guest_name})</span>}
                          {l.quantity > 1 && <span className="font-body text-[10px] text-mf-muted ml-1">×{l.quantity}</span>}
                        </div>
                        <span className="font-body text-[10px] text-mf-muted">{l.prep_status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Link to full orders page */}
          <Link
            to="/admin/orders"
            className="block text-center font-body text-[11px] uppercase tracking-widest text-mf-rose hover:text-mf-vieux-rose transition-colors"
          >
            Voir dans Commandes →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, sub, serif: isSerif }) {
  return (
    <MfCard className="animate-fade-up">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-mf-poudre/25 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className={`text-[24px] text-mf-marron-glace ${isSerif ? 'font-serif italic' : 'font-body font-medium'}`}>
        {value}
      </div>
      <div className="font-body text-[11px] text-mf-muted mt-0.5">{label}</div>
      {sub && <div className="font-body text-[10px] text-mf-vieux-rose mt-0.5">{sub}</div>}
    </MfCard>
  );
}
