import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart3, TrendingUp, ShoppingBag, Users, UtensilsCrossed } from 'lucide-react';
import { useActiveEvent } from '@/hooks/useEvents';
import { useOrders } from '@/hooks/useOrders';
import { useOrderLines } from '@/hooks/useOrderLines';

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ label, value, max, color = 'blue' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColors = { blue: 'bg-blue-500', green: 'bg-green-500', amber: 'bg-amber-500', purple: 'bg-purple-500', red: 'bg-red-500' };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium truncate">{label}</span>
        <span className="text-gray-500 shrink-0 ml-2">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColors[color] || barColors.blue}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminStats() {
  const { data: event } = useActiveEvent();
  const { data: orders = [], isLoading: ordersLoading } = useOrders(event?.id);
  const { data: lines = [], isLoading: linesLoading } = useOrderLines(event?.id);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.payment_status === 'paid');
    const pending = orders.filter((o) => o.payment_status === 'pending');
    const totalRevenue = paid.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const pendingRevenue = pending.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgOrder = paid.length > 0 ? totalRevenue / paid.length : 0;
    const uniqueEmails = new Set(orders.map((o) => o.customer_email)).size;

    // Menu item popularity
    const itemCounts = {};
    for (const line of lines) {
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

    // Revenue by date
    const revenueByDate = {};
    for (const o of paid) {
      const date = format(new Date(o.created_at), 'yyyy-MM-dd');
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(o.total_amount);
    }

    // Prep status distribution
    const prepCounts = { pending: 0, preparing: 0, ready: 0, delivered: 0 };
    for (const line of lines) {
      if (prepCounts[line.prep_status] !== undefined) prepCounts[line.prep_status]++;
    }

    return { paid, pending, totalRevenue, pendingRevenue, avgOrder, uniqueEmails, topItems, revenueByDate, prepCounts, totalLines: lines.length };
  }, [orders, lines]);

  const isLoading = ordersLoading || linesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Aucun événement actif.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Statistiques</h1>
        <p className="text-sm text-gray-500 mt-1">{event.name}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Chiffre d'affaires" value={`${stats.totalRevenue.toFixed(2)}€`} sub={`${stats.pendingRevenue.toFixed(2)}€ en attente`} color="green" />
        <StatCard icon={ShoppingBag} label="Commandes payées" value={stats.paid.length} sub={`${stats.pending.length} en attente`} color="blue" />
        <StatCard icon={BarChart3} label="Panier moyen" value={`${stats.avgOrder.toFixed(2)}€`} color="amber" />
        <StatCard icon={Users} label="Clients uniques" value={stats.uniqueEmails} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top menu items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-gray-400" />
            Plats les plus commandés
          </h2>
          {stats.topItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {stats.topItems.map((item, i) => (
                <ProgressBar
                  key={i}
                  label={item.name}
                  value={item.count}
                  max={stats.topItems[0].count}
                  color={['blue', 'green', 'amber', 'purple', 'red'][i % 5]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Prep status distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Pipeline cuisine</h2>
          <div className="space-y-3">
            <ProgressBar label="En attente" value={stats.prepCounts.pending} max={stats.totalLines} color="amber" />
            <ProgressBar label="En préparation" value={stats.prepCounts.preparing} max={stats.totalLines} color="blue" />
            <ProgressBar label="Prêt" value={stats.prepCounts.ready} max={stats.totalLines} color="green" />
            <ProgressBar label="Livré" value={stats.prepCounts.delivered} max={stats.totalLines} color="purple" />
          </div>
          <p className="text-xs text-gray-400 mt-3">{stats.totalLines} lignes de commande au total</p>
        </div>
      </div>

      {/* Revenue by date */}
      {Object.keys(stats.revenueByDate).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">CA par jour</h2>
          <div className="space-y-2">
            {Object.entries(stats.revenueByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, amount]) => (
                <div key={date} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 capitalize">
                    {format(new Date(date), 'EEEE d MMM', { locale: fr })}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{amount.toFixed(2)}€</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
