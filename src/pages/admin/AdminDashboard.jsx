import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar, ShoppingBag, TrendingUp, ChefHat,
  Download, UtensilsCrossed, Mail,
} from 'lucide-react';
import { useEvents, useActiveEvent } from '@/hooks/useEvents';
import { useOrders } from '@/hooks/useOrders';
import { useOrderLines } from '@/hooks/useOrderLines';
import MfCard from '@/components/ui/MfCard';
import MfBadge from '@/components/ui/MfBadge';

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

  const eventId = selectedEventId ?? activeEvent?.id;
  const currentEvent = events.find((e) => e.id === eventId) || activeEvent;

  const { data: orders = [], isLoading: ordersLoading } = useOrders(eventId);
  const { data: allLines = [], isLoading: linesLoading } = useOrderLines(eventId);

  const isLoading = ordersLoading || linesLoading;

  // ─── Computed stats ───
  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.payment_status === 'paid');
    const revenue = paidOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

    const pending = allLines.filter((l) => l.prep_status === 'pending').length;
    const preparing = allLines.filter((l) => l.prep_status === 'preparing').length;
    const ready = allLines.filter((l) => l.prep_status === 'ready').length;
    const delivered = allLines.filter((l) => l.prep_status === 'delivered').length;
    const total = allLines.length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return { totalOrders: orders.length, revenue, pending, preparing, ready, delivered, total, deliveryRate };
  }, [orders, allLines]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const pipeline = useMemo(() => [
    { label: 'En attente', count: stats.pending, color: 'mf-muted' },
    { label: 'En préparation', count: stats.preparing, color: 'status-orange' },
    { label: 'Prêts', count: stats.ready, color: 'mf-vert-olive' },
    { label: 'Livrés', count: stats.delivered, color: 'status-green' },
  ], [stats]);

  // Revenue grouped by day
  const revenueChart = useMemo(() => {
    const byDate = {};
    orders
      .filter((o) => o.payment_status === 'paid')
      .forEach((o) => {
        const d = o.created_at?.slice(0, 10);
        if (!d) return;
        byDate[d] = (byDate[d] || 0) + Number(o.total_amount || 0);
      });
    const entries = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).slice(-5);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return { entries, max };
  }, [orders]);

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
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-[28px] italic text-mf-rose">Tableau de bord</h1>
          <p className="font-body text-[13px] text-mf-muted mt-0.5">
            {currentEvent?.name || 'Aucun événement'} · {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingBag className="w-5 h-5 text-mf-rose" />}
          value={stats.totalOrders}
          label="Commandes"
          sub={`${orders.filter((o) => o.payment_status === 'paid').length} payées`}
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
        <MfCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-mf-border">
            <h2 className="font-serif text-[20px] italic text-mf-rose">Dernières commandes</h2>
            <Link to="/admin/orders" className="font-body text-[10px] uppercase tracking-widest text-mf-rose hover:text-mf-vieux-rose transition-colors">
              Voir tout →
            </Link>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[90px_1fr_60px_70px_80px_80px] gap-2 px-5 py-2.5 border-b border-mf-border">
            {['N°', 'Client', 'Stand', 'Articles', 'Total', 'Statut'].map((h) => (
              <span key={h} className="font-body text-[9px] uppercase tracking-widest text-mf-muted">{h}</span>
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
                  className="grid grid-cols-[90px_1fr_60px_70px_80px_80px] gap-2 px-5 py-3 border-b border-mf-blanc-casse hover:bg-mf-poudre/8 transition-colors cursor-pointer"
                >
                  <span className="font-body text-[12px] text-mf-rose font-medium truncate">{o.order_number}</span>
                  <div className="min-w-0">
                    <div className="font-body text-[13px] text-mf-marron-glace truncate">
                      {o.customer_first_name} {o.customer_last_name}
                    </div>
                    <div className="font-body text-[10px] text-mf-muted">
                      {o.created_at && format(new Date(o.created_at), 'HH:mm', { locale: fr })}
                    </div>
                  </div>
                  <span className="font-body text-[12px] text-mf-marron-glace">{o.stand || '—'}</span>
                  <span className="font-body text-[12px] text-mf-marron-glace">—</span>
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
          {/* Revenue mini chart */}
          <MfCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-[18px] italic text-mf-rose">Revenus</h3>
              <span className="font-body text-[11px] text-mf-muted">Derniers jours</span>
            </div>
            <div className="font-serif text-[26px] italic text-mf-marron-glace mb-1">
              {stats.revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
            </div>
            <div className="flex items-end gap-2 h-20 mt-4 px-1">
              {revenueChart.entries.map(([date, value]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-mf-rose rounded-t transition-all duration-500"
                    style={{ height: `${(value / revenueChart.max) * 100}%`, minHeight: 4 }}
                  />
                  <span className="font-body text-[10px] text-mf-muted">
                    {format(new Date(date + 'T00:00:00'), 'EEE', { locale: fr })}
                  </span>
                </div>
              ))}
              {revenueChart.entries.length === 0 && (
                <p className="font-body text-[11px] text-mf-muted text-center w-full py-6">Pas de données</p>
              )}
            </div>
          </MfCard>

          {/* Pipeline cuisine */}
          <MfCard>
            <h3 className="font-serif text-[18px] italic text-mf-rose mb-4">Pipeline cuisine</h3>
            <div className="flex flex-col gap-3">
              {pipeline.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-body text-[12px] text-mf-marron-glace">{p.label}</span>
                    <span className={`font-body text-[12px] font-medium text-${p.color}`}>{p.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-mf-blanc-casse">
                    <div
                      className={`h-full rounded-full bg-${p.color} transition-all duration-500`}
                      style={{ width: `${stats.total > 0 ? (p.count / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </MfCard>

          {/* Quick actions */}
          <MfCard>
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
