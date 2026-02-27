import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChefHat, Search, Check, Undo2 } from 'lucide-react';
import { useActiveEvent } from '@/hooks/useEvents';
import { useKitchenLines, useUpdateOrderLineStatus } from '@/hooks/useOrderLines';
import { useAuth } from '@/lib/AuthContext';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
};

const statusLabels = {
  pending: 'En attente',
  preparing: 'En préparation',
  ready: 'Prêt',
};

export default function StaffKitchen() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { profile } = useAuth();
  const { data: activeEvent } = useActiveEvent();
  const { data: lines = [], isLoading } = useKitchenLines(activeEvent?.id);
  const updateStatus = useUpdateOrderLineStatus();

  // Stats
  const stats = useMemo(() => {
    const pending = lines.filter((l) => l.prep_status === 'pending').length;
    const preparing = lines.filter((l) => l.prep_status === 'preparing').length;
    const ready = lines.filter((l) => l.prep_status === 'ready').length;
    return { pending, preparing, ready, total: lines.length };
  }, [lines]);

  // Available dates for filter
  const availableDates = useMemo(() => {
    const dates = new Set(lines.map((l) => l.meal_slot?.slot_date).filter(Boolean));
    return [...dates].sort();
  }, [lines]);

  // Group lines by order + slot for card display
  const cards = useMemo(() => {
    let filtered = lines;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.order?.customer_first_name?.toLowerCase().includes(q) ||
          l.order?.customer_last_name?.toLowerCase().includes(q) ||
          l.order?.stand?.toLowerCase().includes(q) ||
          l.order?.order_number?.toLowerCase().includes(q)
      );
    }

    if (dateFilter !== 'all') {
      filtered = filtered.filter((l) => l.meal_slot?.slot_date === dateFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((l) => l.prep_status === statusFilter);
    }

    // Group by order_id + meal_slot_id
    const grouped = {};
    filtered.forEach((line) => {
      const key = `${line.order_id}-${line.meal_slot_id}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          order: line.order,
          meal_slot: line.meal_slot,
          lines: [],
        };
      }
      grouped[key].lines.push(line);
    });

    // Sort by date then slot type
    return Object.values(grouped).sort((a, b) => {
      const dateA = a.meal_slot?.slot_date || '';
      const dateB = b.meal_slot?.slot_date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.meal_slot?.slot_type === 'midi' ? 0 : 1) - (b.meal_slot?.slot_type === 'midi' ? 0 : 1);
    });
  }, [lines, search, dateFilter, statusFilter]);

  const handleMarkReady = (cardLines) => {
    const ids = cardLines.filter((l) => l.prep_status !== 'ready').map((l) => l.id);
    if (ids.length === 0) return;
    updateStatus.mutate({
      ids,
      prep_status: 'ready',
      prepared_by: profile?.display_name || profile?.email || 'staff',
    });
  };

  const handleUndo = (cardLines) => {
    const ids = cardLines.filter((l) => l.prep_status === 'ready').map((l) => l.id);
    if (ids.length === 0) return;
    updateStatus.mutate({ ids, prep_status: 'pending' });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ChefHat className="w-6 h-6" />
          Préparation cuisine
        </h1>
        {activeEvent && <p className="text-sm text-gray-500 mt-1">{activeEvent.name}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          <p className="text-xs text-yellow-600">En attente</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.preparing}</p>
          <p className="text-xs text-blue-600">En préparation</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.ready}</p>
          <p className="text-xs text-green-600">Prêts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher nom, stand, commande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Toutes les dates</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {format(new Date(d + 'T00:00:00'), 'd MMM', { locale: fr })}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="preparing">En préparation</option>
            <option value="ready">Prêt</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune commande à préparer</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {cards.map((card) => {
            const allReady = card.lines.every((l) => l.prep_status === 'ready');
            const someReady = card.lines.some((l) => l.prep_status === 'ready');

            return (
              <div
                key={card.key}
                className={`bg-white border rounded-xl p-4 space-y-3 ${
                  allReady ? 'border-green-300 bg-green-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {card.order?.customer_first_name} {card.order?.customer_last_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span>Stand {card.order?.stand}</span>
                      <span>&bull;</span>
                      <span className="font-mono">{card.order?.order_number}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium capitalize">
                      {card.meal_slot?.slot_date &&
                        format(new Date(card.meal_slot.slot_date + 'T00:00:00'), 'd MMM', { locale: fr })}
                    </p>
                    <p className="text-purple-600 font-semibold uppercase">
                      {card.meal_slot?.slot_type}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {card.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[line.prep_status]}`}>
                          {statusLabels[line.prep_status]}
                        </span>
                        <span>{line.menu_item?.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">{line.menu_item?.type}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  {!allReady && (
                    <button
                      onClick={() => handleMarkReady(card.lines)}
                      disabled={updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Marquer prêt
                    </button>
                  )}
                  {someReady && (
                    <button
                      onClick={() => handleUndo(card.lines)}
                      disabled={updateStatus.isPending}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <Undo2 className="w-4 h-4" />
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
