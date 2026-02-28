import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, ShoppingBag, ChevronDown, ChevronUp, X, AlertTriangle, Trash2 } from 'lucide-react';
import { useActiveEvent } from '@/hooks/useEvents';
import EventSelector from '@/components/admin/EventSelector';
import { useOrders, useUpdateOrder, useDeleteOrder } from '@/hooks/useOrders';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useOrderLines } from '@/hooks/useOrderLines';
import { groupOrderLines, sortedSlotEntries } from '@/lib/groupOrderLines';
import { supabase } from '@/api/supabase';

/* ───────── helpers ───────── */

const PAYMENT_LABELS = {
  pending: 'En attente',
  paid: 'Paye',
  refunded: 'Rembourse',
  cancelled: 'Annule',
};

const PAYMENT_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
};

const PREP_LABELS = {
  pending: 'En attente',
  preparing: 'En preparation',
  ready: 'Pret',
  delivered: 'Livre',
};

const PREP_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-600',
};

const SLOT_TYPE_LABEL = {
  midi: 'Midi',
  soir: 'Soir',
};

function paymentBadge(status) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {PAYMENT_LABELS[status] || status}
    </span>
  );
}

function prepBadge(status) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PREP_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {PREP_LABELS[status] || status}
    </span>
  );
}

function formatSlotHeader(slotDate, slotType) {
  if (!slotDate) return 'Date inconnue';
  const d = new Date(slotDate + 'T00:00:00');
  const label = format(d, 'EEEE d MMMM', { locale: fr });
  const capitalised = label.charAt(0).toUpperCase() + label.slice(1);
  return `${capitalised} — ${SLOT_TYPE_LABEL[slotType] || slotType}`;
}

/* ──── next valid payment transition ──── */
function nextPaymentStatus(current) {
  const transitions = {
    pending: 'paid',
    paid: 'refunded',
  };
  return transitions[current] || null;
}

function nextPaymentLabel(current) {
  const labels = {
    pending: 'Marquer comme paye',
    paid: 'Rembourser',
  };
  return labels[current] || null;
}

/* ───────── loading spinner ───────── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 1 — Factures globales (financial view)
   ═══════════════════════════════════════════════════ */

const PAGE_SIZE = 20;

function FinancialTab({ orders, orderLines, updateOrder, deleteOrder }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { order, action: 'cancel'|'refund' }
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [deleteModal, setDeleteModal] = useState(null); // order to delete

  /* line lookup keyed by order_id */
  const linesByOrder = useMemo(() => {
    const map = {};
    for (const line of orderLines ?? []) {
      const oid = line.order_id;
      if (!map[oid]) map[oid] = [];
      map[oid].push(line);
    }
    return map;
  }, [orderLines]);

  /* filtered orders — see filteredAll in the action handlers section below */

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleStatusUpdate(order) {
    const next = nextPaymentStatus(order.payment_status);
    if (!next) return;
    if (next === 'refunded') {
      setConfirmModal({ order, action: 'refund' });
      return;
    }
    updateOrder.mutate({ id: order.id, payment_status: next });
  }

  async function handleConfirmAction() {
    if (!confirmModal) return;
    const { order, action } = confirmModal;
    setActionLoading(true);

    try {
      if (action === 'cancel') {
        updateOrder.mutate({ id: order.id, payment_status: 'cancelled' });
      } else if (action === 'refund') {
        const { data, error } = await supabase.functions.invoke('refund-order', {
          body: { orderId: order.id },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        updateOrder.mutate({ id: order.id, payment_status: 'refunded' });
      }
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  }

  // Reset page when filters change
  const filteredAll = useMemo(() => {
    let result = orders ?? [];
    if (statusFilter !== 'all') result = result.filter((o) => o.payment_status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) => {
        const fullName = `${o.customer_first_name ?? ''} ${o.customer_last_name ?? ''}`.toLowerCase();
        return fullName.includes(q) || (o.stand ?? '').toLowerCase().includes(q) || (o.customer_email ?? '').toLowerCase().includes(q) || (o.order_number ?? '').toLowerCase().includes(q);
      });
    }
    return result;
  }, [orders, statusFilter, search]);

  const totalPages = Math.ceil(filteredAll.length / PAGE_SIZE);
  const paginated = filteredAll.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, stand, email, n° commande..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-[#8B3A43] focus:ring-2 focus:ring-[#8B3A43]/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#8B3A43] focus:ring-2 focus:ring-[#8B3A43]/20"
        >
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="paid">Paye</option>
          <option value="refunded">Rembourse</option>
          <option value="cancelled">Annule</option>
        </select>
      </div>

      <p className="text-xs text-gray-400">{filteredAll.length} commande{filteredAll.length !== 1 ? 's' : ''}</p>

      {/* order cards */}
      {paginated.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">Aucune commande trouvee.</p>
      )}

      {paginated.map((order) => {
        const isExpanded = expandedId === order.id;
        const lines = linesByOrder[order.id] ?? [];
        const grouped = groupOrderLines(lines);
        const slots = sortedSlotEntries(grouped);
        const next = nextPaymentStatus(order.payment_status);
        const canCancel = order.payment_status === 'pending';
        const canRefund = order.payment_status === 'paid';

        return (
          <div
            key={order.id}
            className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* card header — always visible */}
            <button
              type="button"
              onClick={() => toggleExpand(order.id)}
              className="flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {order.order_number}
                  </span>
                  {paymentBadge(order.payment_status)}
                  {order.delivery_method && (
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                      {order.delivery_method === 'retrait' ? 'Retrait' : 'Livraison'}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700">
                  {order.customer_first_name} {order.customer_last_name}
                  {order.stand && (
                    <span className="ml-2 text-gray-400">— Stand {order.stand}</span>
                  )}
                </p>

                <p className="text-xs text-gray-400">
                  {order.customer_email}
                  {order.customer_phone && ` | ${order.customer_phone}`}
                </p>

                <p className="text-xs text-gray-400">
                  {order.created_at &&
                    format(new Date(order.created_at), "d MMM yyyy 'a' HH:mm", {
                      locale: fr,
                    })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-lg font-bold text-gray-900">
                  {Number(order.total_amount ?? 0).toFixed(2)}&nbsp;&euro;
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* expanded detail */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
                {slots.length === 0 && (
                  <p className="text-xs text-gray-400">Aucune ligne de commande.</p>
                )}

                {slots.map(([slotKey, slot]) => (
                  <div key={slotKey}>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {formatSlotHeader(slot.slot_date, slot.slot_type)}
                      {slot.guest_name && (
                        <span className="ml-2 text-[#8B3A43] font-semibold">{slot.guest_name}</span>
                      )}
                    </p>
                    <ul className="space-y-0.5 pl-3">
                      {['entree', 'plat', 'dessert', 'boisson'].map((type) => {
                        const item = slot[type];
                        if (!item) return null;
                        return (
                          <li
                            key={type}
                            className="flex items-center justify-between text-sm text-gray-700"
                          >
                            <span>{item.name}</span>
                          </li>
                        );
                      })}
                    </ul>
                    {slot.menu_unit_price != null && (
                      <p className="mt-1 text-right text-xs font-medium text-gray-500">
                        Menu : {Number(slot.menu_unit_price).toFixed(2)}&nbsp;&euro;
                      </p>
                    )}
                  </div>
                ))}

                {/* action buttons */}
                <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                  {(order.payment_status === 'cancelled' || order.payment_status === 'refunded') && (
                    <button
                      type="button"
                      onClick={() => setDeleteModal(order)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setConfirmModal({ order, action: 'cancel' })}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                  {next && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order)}
                      disabled={updateOrder.isPending}
                      className="rounded-lg bg-[#8B3A43] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#7a3039] disabled:opacity-50 transition-colors"
                    >
                      {updateOrder.isPending ? '...' : nextPaymentLabel(order.payment_status)}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            &larr; Precedent
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            Suivant &rarr;
          </button>
        </div>
      )}

      {/* Delete modal (double validation) */}
      {deleteModal && (
        <ConfirmDeleteModal
          title="Supprimer la commande"
          description={`La commande ${deleteModal.order_number} (${deleteModal.customer_first_name} ${deleteModal.customer_last_name}) et toutes ses lignes seront définitivement supprimées. Cette action est irréversible.`}
          confirmText={deleteModal.order_number}
          onConfirm={async () => {
            try {
              await deleteOrder.mutateAsync(deleteModal.id);
              setDeleteModal(null);
              setExpandedId(null);
            } catch (err) {
              alert(`Erreur: ${err.message}`);
            }
          }}
          onCancel={() => setDeleteModal(null)}
          loading={deleteOrder.isPending}
        />
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {confirmModal.action === 'cancel' ? 'Annuler la commande' : 'Rembourser la commande'}
                </h3>
                <p className="text-sm text-gray-500">{confirmModal.order.order_number}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              {confirmModal.action === 'cancel'
                ? 'Cette commande sera marquee comme annulee. Cette action est irreversible.'
                : `Le montant de ${Number(confirmModal.order.total_amount).toFixed(2)}€ sera rembourse via Stripe. Cette action est irreversible.`}
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2 — Commandes quotidiennes (operational view)
   ═══════════════════════════════════════════════════ */

function DailyTab({ orderLines }) {
  /* group lines by slot key (date + type) then by order */
  const slotGroups = useMemo(() => {
    const map = {};

    for (const line of orderLines ?? []) {
      const slotDate = line.meal_slot?.slot_date ?? 'unknown';
      const slotType = line.meal_slot?.slot_type ?? 'unknown';
      const key = `${slotDate}__${slotType}`;

      if (!map[key]) {
        map[key] = { slot_date: slotDate, slot_type: slotType, orderMap: {} };
      }

      const menuKey = `${line.order_id}__${line.guest_name || ''}`;
      if (!map[key].orderMap[menuKey]) {
        map[key].orderMap[menuKey] = {
          order: line.order,
          guest_name: line.guest_name,
          lines: [],
        };
      }
      map[key].orderMap[menuKey].lines.push(line);
    }

    /* sort slot keys chronologically, midi before soir */
    return Object.values(map).sort((a, b) => {
      const dc = (a.slot_date || '').localeCompare(b.slot_date || '');
      if (dc !== 0) return dc;
      return a.slot_type === 'midi' ? -1 : 1;
    });
  }, [orderLines]);

  if (slotGroups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        Aucune commande quotidienne.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {slotGroups.map((group) => {
        const header = formatSlotHeader(group.slot_date, group.slot_type);
        const orderEntries = Object.values(group.orderMap);

        return (
          <section key={`${group.slot_date}__${group.slot_type}`}>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">{header}</h3>

            <div className="space-y-3">
              {orderEntries.map(({ order, guest_name, lines }) => (
                <div
                  key={`${order?.id ?? lines[0]?.order_id}__${guest_name || ''}`}
                  className="rounded-xl bg-white shadow-sm border border-gray-100 p-4 space-y-2"
                >
                  {/* order header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order?.customer_first_name} {order?.customer_last_name}
                        {order?.stand && (
                          <span className="ml-2 text-gray-400 font-normal">
                            — Stand {order.stand}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">{order?.order_number}</p>
                        {guest_name && (
                          <span className="text-xs text-purple-600 font-medium">Menu : {guest_name}</span>
                        )}
                      </div>
                    </div>
                    {paymentBadge(order?.payment_status ?? 'pending')}
                  </div>

                  {/* items */}
                  <ul className="space-y-1 pl-1">
                    {lines.map((line) => (
                      <li
                        key={line.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700">
                          {line.menu_item?.name ?? '—'}
                        </span>
                        {prepBadge(line.prep_status)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN — AdminOrders
   ═══════════════════════════════════════════════════ */

const TABS = [
  { key: 'financial', label: 'Factures globales' },
  { key: 'daily', label: 'Commandes quotidiennes' },
];

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState('financial');
  const [selectedEventId, setSelectedEventId] = useState(null);

  const { data: activeEvent, isLoading: eventLoading } = useActiveEvent();
  const eventId = selectedEventId ?? activeEvent?.id;

  const { data: orders, isLoading: ordersLoading } = useOrders(eventId);
  const { data: orderLines, isLoading: linesLoading } = useOrderLines(eventId);
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const isLoading = eventLoading || ordersLoading || linesLoading;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      {/* page title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Commandes</h1>
        <EventSelector selectedEventId={selectedEventId} onEventChange={setSelectedEventId} />
      </div>

      {/* tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* content */}
      {isLoading ? (
        <Spinner />
      ) : activeTab === 'financial' ? (
        <FinancialTab
          orders={orders}
          orderLines={orderLines}
          updateOrder={updateOrder}
          deleteOrder={deleteOrder}
        />
      ) : (
        <DailyTab orderLines={orderLines} />
      )}
    </div>
  );
}
