import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, ChevronDown, ChevronUp, X, AlertTriangle, Trash2, Download, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveEvent } from '@/hooks/useEvents';
import EventSelector from '@/components/admin/EventSelector';
import { useOrders, useUpdateOrder, useDeleteOrder, useMarkOrdersSeen } from '@/hooks/useOrders';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useOrderLines } from '@/hooks/useOrderLines';
import { groupOrderLines, sortedSlotEntries } from '@/lib/groupOrderLines';
import { supabase } from '@/api/supabase';
import MfBadge from '@/components/ui/MfBadge';
import MfButton from '@/components/ui/MfButton';
import MfCard from '@/components/ui/MfCard';

/* ───────── helpers ───────── */

const PAYMENT_LABELS = {
  pending: 'En attente',
  paid: 'Payée',
  refunded: 'Remboursée',
  cancelled: 'Annulée',
};

const PAYMENT_BADGE_VARIANT = {
  pending: 'orange',
  paid: 'green',
  refunded: 'rose',
  cancelled: 'red',
};

const PREP_LABELS = {
  pending: 'En attente',
  preparing: 'En préparation',
  ready: 'Prêt',
  delivered: 'Livré',
};

const PREP_BADGE_VARIANT = {
  pending: 'orange',
  preparing: 'olive',
  ready: 'green',
  delivered: 'rose',
};

const SLOT_TYPE_LABEL = { midi: 'Midi', soir: 'Soir' };

const TYPE_LABELS = { entree: 'Entrée', plat: 'Plat', dessert: 'Dessert', boisson: 'Boisson' };

function formatSlotHeader(slotDate, slotType) {
  if (!slotDate) return 'Date inconnue';
  const d = new Date(slotDate + 'T00:00:00');
  const label = format(d, 'EEEE d MMMM', { locale: fr });
  return `${label.charAt(0).toUpperCase() + label.slice(1)} — ${SLOT_TYPE_LABEL[slotType] || slotType}`;
}

function nextPaymentStatus(current) {
  return { pending: 'paid', paid: 'refunded' }[current] || null;
}

function nextPaymentLabel(current) {
  return { pending: 'Marquer comme payée', paid: 'Rembourser' }[current] || null;
}

/* ───────── loading spinner ───────── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose mx-auto" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 1 — Financial view (table layout)
   ═══════════════════════════════════════════════════ */

const PAGE_SIZE = 20;

function FinancialTab({ orders, orderLines, updateOrder, deleteOrder }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prepFilter, setPrepFilter] = useState('all');
  const [slotFilter, setSlotFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [deleteModal, setDeleteModal] = useState(null);

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

  /* slot types per order (for midi/soir filter) */
  const slotTypesByOrder = useMemo(() => {
    const map = {};
    for (const line of orderLines ?? []) {
      const oid = line.order_id;
      if (!map[oid]) map[oid] = new Set();
      if (line.meal_slot?.slot_type) map[oid].add(line.meal_slot.slot_type);
    }
    return map;
  }, [orderLines]);

  /* aggregate prep status per order: pending|preparing|ready|delivered */
  const prepStatusByOrder = useMemo(() => {
    const map = {};
    for (const [orderId, lines] of Object.entries(linesByOrder)) {
      if (lines.length === 0) { map[orderId] = 'pending'; continue; }
      const statuses = new Set(lines.map((l) => l.prep_status));
      if (statuses.size === 1 && statuses.has('delivered')) { map[orderId] = 'delivered'; }
      else if ([...statuses].every((s) => s === 'ready' || s === 'delivered')) { map[orderId] = 'ready'; }
      else if (statuses.has('preparing') || statuses.has('ready') || statuses.has('delivered')) { map[orderId] = 'preparing'; }
      else { map[orderId] = 'pending'; }
    }
    return map;
  }, [linesByOrder]);

  /* status counts */
  const statusCounts = useMemo(() => {
    const counts = { all: 0, paid: 0, pending: 0, cancelled: 0, refunded: 0 };
    for (const o of orders ?? []) {
      counts.all++;
      if (counts[o.payment_status] !== undefined) counts[o.payment_status]++;
    }
    return counts;
  }, [orders]);

  /* filtered */
  const filteredAll = useMemo(() => {
    let result = orders ?? [];
    if (statusFilter !== 'all') result = result.filter((o) => o.payment_status === statusFilter);
    if (prepFilter !== 'all') result = result.filter((o) => prepStatusByOrder[o.id] === prepFilter);
    if (slotFilter !== 'all') {
      result = result.filter((o) => {
        const types = slotTypesByOrder[o.id];
        return types && types.has(slotFilter);
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) => {
        const fullName = `${o.customer_first_name ?? ''} ${o.customer_last_name ?? ''}`.toLowerCase();
        return (
          fullName.includes(q) ||
          (o.stand ?? '').toLowerCase().includes(q) ||
          (o.customer_email ?? '').toLowerCase().includes(q) ||
          (o.order_number ?? '').toLowerCase().includes(q) ||
          (o.company_name ?? '').toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [orders, statusFilter, prepFilter, slotFilter, search, slotTypesByOrder, prepStatusByOrder]);

  const totalRevenue = useMemo(
    () => filteredAll.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount || 0), 0),
    [filteredAll],
  );

  const totalPages = Math.ceil(filteredAll.length / PAGE_SIZE);
  const paginated = filteredAll.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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

  const STATUS_FILTERS = [
    { key: 'all', label: 'Toutes' },
    { key: 'paid', label: 'Payées' },
    { key: 'pending', label: 'En attente' },
    { key: 'cancelled', label: 'Annulées' },
    { key: 'refunded', label: 'Remboursées' },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Filters ─── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-muted" />
          <input
            type="text"
            placeholder="Rechercher par nom, n° ou stand..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-pill border border-mf-border bg-white font-body text-[13px] text-mf-marron-glace placeholder:text-mf-muted outline-none focus:border-mf-rose transition-colors"
          />
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(0); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-pill font-body text-[11px] border transition-all duration-200 cursor-pointer ${
                statusFilter === f.key
                  ? 'bg-mf-rose border-mf-rose text-white'
                  : 'bg-white border-mf-border text-mf-marron-glace hover:border-mf-rose/40'
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 rounded-pill ${
                statusFilter === f.key ? 'text-mf-poudre' : 'text-mf-muted'
              }`}>
                {statusCounts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Prep status pills */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'preparing', label: 'En préparation' },
            { key: 'ready', label: 'Prêt' },
            { key: 'delivered', label: 'Livré' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setPrepFilter(f.key); setPage(0); }}
              className={`px-3.5 py-2 rounded-pill font-body text-[11px] border transition-all duration-200 cursor-pointer ${
                prepFilter === f.key
                  ? 'bg-mf-vert-olive border-mf-vert-olive text-white'
                  : 'bg-white border-mf-border text-mf-marron-glace hover:border-mf-vert-olive/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Slot toggle */}
        <div className="inline-flex rounded-pill border border-mf-border overflow-hidden ml-auto shrink-0">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'midi', label: '☀' },
            { key: 'soir', label: '☽' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => { setSlotFilter(s.key); setPage(0); }}
              className={`px-3.5 py-2 font-body text-[12px] border-none transition-all duration-200 cursor-pointer ${
                slotFilter === s.key
                  ? 'bg-mf-rose text-white'
                  : 'bg-transparent text-mf-muted hover:text-mf-marron-glace'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Subtitle ─── */}
      <p className="font-body text-[12px] text-mf-muted">
        {filteredAll.length} commande{filteredAll.length !== 1 ? 's' : ''} · {totalRevenue.toFixed(2)} € de CA
      </p>

      {/* ─── Table ─── */}
      <MfCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-mf-border">
                {['N° Commande', 'Client', 'Stand', 'Service', 'Articles', 'Total', 'Statut', 'Préparation'].map((h) => (
                  <th
                    key={h}
                    className="font-body text-[9px] uppercase tracking-[0.1em] text-mf-muted font-normal text-left px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((order) => {
                const lines = linesByOrder[order.id] ?? [];
                const lineCount = lines.length;
                const slotTypes = slotTypesByOrder[order.id];
                const hasMidday = slotTypes?.has('midi');
                const hasSoir = slotTypes?.has('soir');
                const prepStatus = prepStatusByOrder[order.id] ?? 'pending';

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="border-b border-mf-blanc-casse hover:bg-mf-poudre/10 cursor-pointer transition-all duration-200"
                  >
                    {/* N° Commande */}
                    <td className="px-4 py-3">
                      <span className="font-body text-[13px] text-mf-rose font-medium">{order.order_number}</span>
                      <div className="font-body text-[10px] text-mf-muted">
                        {order.created_at && format(new Date(order.created_at), 'dd/MM · HH:mm', { locale: fr })}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="font-body text-[13px] text-mf-marron-glace font-medium">
                        {order.customer_first_name} {order.customer_last_name}
                      </div>
                      {order.company_name && (
                        <div className="font-body text-[10px] text-mf-muted">{order.company_name}</div>
                      )}
                    </td>

                    {/* Stand */}
                    <td className="px-4 py-3">
                      {order.stand ? (
                        <span className="inline-block font-body text-[12px] font-medium text-mf-vert-olive px-2.5 py-0.5 rounded-lg bg-mf-vert-olive/10">
                          {order.stand}
                        </span>
                      ) : (
                        <span className="font-body text-[12px] text-mf-muted">—</span>
                      )}
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {hasMidday && (
                          <span className="font-body text-[11px] text-mf-vert-olive">☀ Midi</span>
                        )}
                        {hasSoir && (
                          <span className="font-body text-[11px] text-mf-vieux-rose">☽ Soir</span>
                        )}
                        {!hasMidday && !hasSoir && (
                          <span className="font-body text-[11px] text-mf-muted">—</span>
                        )}
                      </div>
                    </td>

                    {/* Articles */}
                    <td className="px-4 py-3">
                      <span className="font-body text-[13px] text-mf-marron-glace font-medium">{lineCount}</span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3">
                      <span className="font-serif text-[14px] italic text-mf-rose">
                        {Number(order.total_amount ?? 0).toFixed(2)} €
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <MfBadge variant={PAYMENT_BADGE_VARIANT[order.payment_status] || 'rose'}>
                        {PAYMENT_LABELS[order.payment_status] || order.payment_status}
                      </MfBadge>
                    </td>

                    {/* Préparation */}
                    <td className="px-4 py-3">
                      <MfBadge variant={PREP_BADGE_VARIANT[prepStatus] || 'rose'}>
                        {PREP_LABELS[prepStatus] || prepStatus}
                      </MfBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginated.length === 0 && (
            <div className="text-center py-12">
              <div className="text-[28px] opacity-30 mb-2">📋</div>
              <p className="font-body text-[13px] text-mf-muted">Aucune commande trouvée</p>
            </div>
          )}
        </div>
      </MfCard>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 font-body text-[11px] uppercase tracking-wider rounded-pill border border-mf-border text-mf-marron-glace disabled:opacity-30 hover:border-mf-rose/40 transition-all duration-200 cursor-pointer bg-white"
          >
            ← Précédent
          </button>
          <span className="font-body text-[12px] text-mf-muted">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 font-body text-[11px] uppercase tracking-wider rounded-pill border border-mf-border text-mf-marron-glace disabled:opacity-30 hover:border-mf-rose/40 transition-all duration-200 cursor-pointer bg-white"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* ─── Order Detail Modal ─── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          lines={linesByOrder[selectedOrder.id] ?? []}
          prepStatus={prepStatusByOrder[selectedOrder.id] ?? 'pending'}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onCancel={(order) => setConfirmModal({ order, action: 'cancel' })}
          onDelete={setDeleteModal}
          updatePending={updateOrder.isPending}
        />
      )}

      {/* ─── Delete modal ─── */}
      {deleteModal && (
        <ConfirmDeleteModal
          title="Supprimer la commande"
          description={`La commande ${deleteModal.order_number} (${deleteModal.customer_first_name} ${deleteModal.customer_last_name}) et toutes ses lignes seront définitivement supprimées. Cette action est irréversible.`}
          confirmText={deleteModal.order_number}
          onConfirm={async () => {
            try {
              await deleteOrder.mutateAsync(deleteModal.id);
              setDeleteModal(null);
              setSelectedOrder(null);
            } catch (err) {
              alert(`Erreur: ${err.message}`);
            }
          }}
          onCancel={() => setDeleteModal(null)}
          loading={deleteOrder.isPending}
        />
      )}

      {/* ─── Confirm Action modal ─── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setConfirmModal(null)} className="absolute inset-0 bg-mf-marron-glace/30 backdrop-blur-sm" style={{ animation: 'mf-backdrop-in 0.3s ease' }} />
          <div className="relative bg-white rounded-card w-full max-w-sm p-6 space-y-4 shadow-xl" style={{ animation: 'mf-modal-in 0.4s ease both' }}>
            <style>{`
              @keyframes mf-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
              @keyframes mf-modal-in { from { opacity: 0; transform: scale(0.92) translateY(16px) } to { opacity: 1; transform: scale(1) translateY(0) } }
            `}</style>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-status-red/12 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-status-red" />
              </div>
              <div>
                <h3 className="font-body text-[15px] font-medium text-mf-marron-glace">
                  {confirmModal.action === 'cancel' ? 'Annuler la commande' : 'Rembourser la commande'}
                </h3>
                <p className="font-body text-[12px] text-mf-muted">{confirmModal.order.order_number}</p>
              </div>
            </div>

            <p className="font-body text-[13px] text-mf-muted leading-relaxed">
              {confirmModal.action === 'cancel'
                ? 'Cette commande sera marquée comme annulée. Cette action est irréversible.'
                : `Le montant de ${Number(confirmModal.order.total_amount).toFixed(2)} € sera remboursé via Stripe. Cette action est irréversible.`}
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <MfButton
                variant="secondary"
                size="sm"
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
              >
                Retour
              </MfButton>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 font-body text-[11px] uppercase tracking-wider rounded-pill px-5 py-2 bg-status-red text-white hover:opacity-90 disabled:opacity-50 transition-all duration-200 cursor-pointer"
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
   ORDER DETAIL MODAL
   ═══════════════════════════════════════════════════ */

function OrderDetailModal({ order, lines, prepStatus, onClose, onStatusUpdate, onCancel, onDelete, updatePending }) {
  const grouped = groupOrderLines(lines);
  const slots = sortedSlotEntries(grouped);
  const next = nextPaymentStatus(order.payment_status);
  const canCancel = order.payment_status === 'pending';
  const canDelete = order.payment_status === 'cancelled' || order.payment_status === 'refunded';

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
            <h2 className="font-serif text-[24px] italic text-mf-rose">{order.order_number}</h2>
            <MfBadge variant={PAYMENT_BADGE_VARIANT[order.payment_status] || 'rose'} className="mt-1">
              {PAYMENT_LABELS[order.payment_status] || order.payment_status}
            </MfBadge>
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
              { label: 'Service', value: (() => {
                const types = new Set(lines.map((l) => l.meal_slot?.slot_type).filter(Boolean));
                if (types.has('midi') && types.has('soir')) return '☀ Midi + ☽ Soir';
                if (types.has('midi')) return '☀ Midi';
                if (types.has('soir')) return '☽ Soir';
                return '—';
              })() },
              { label: 'Mode', value: order.delivery_method === 'retrait' ? '📦 Emporter' : '🚚 Livraison' },
            ].map((d) => (
              <div key={d.label} className="rounded-xl bg-mf-blanc-casse p-3 text-center">
                <div className="font-body text-[9px] uppercase tracking-[0.08em] text-mf-muted">{d.label}</div>
                <div className="font-body text-[13px] text-mf-marron-glace font-medium mt-1">{d.value}</div>
              </div>
            ))}
          </div>

          {/* Items by slot / guest */}
          {slots.length > 0 && (
            <div className="space-y-3">
              <div className="font-body text-[10px] uppercase tracking-[0.1em] text-mf-vieux-rose">Détail des menus</div>
              {slots.map(([slotKey, slot]) => (
                <div key={slotKey} className="rounded-xl border border-mf-border p-3">
                  <p className="font-body text-[11px] text-mf-muted mb-2">
                    {formatSlotHeader(slot.slot_date, slot.slot_type)}
                    {slot.guest_name && (
                      <span className="ml-2 font-medium text-mf-rose">{slot.guest_name}</span>
                    )}
                  </p>
                  <ul className="space-y-1">
                    {['entree', 'plat', 'dessert', 'boisson'].map((type) => {
                      const item = slot[type];
                      if (!item) return null;
                      return (
                        <li key={type} className="flex items-center justify-between">
                          <span className="font-body text-[13px] text-mf-marron-glace">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <MfBadge variant={PREP_BADGE_VARIANT[item.prep_status] || 'rose'}>
                              {PREP_LABELS[item.prep_status] || item.prep_status}
                            </MfBadge>
                            <span className="font-body text-[10px] text-mf-muted">{TYPE_LABELS[type]}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {slot.menu_unit_price != null && (
                    <p className="mt-2 text-right font-body text-[11px] text-mf-muted">
                      Menu : {Number(slot.menu_unit_price).toFixed(2)} €
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Prep status */}
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] text-mf-marron-glace">Préparation</span>
            <MfBadge variant={PREP_BADGE_VARIANT[prepStatus] || 'rose'}>
              {PREP_LABELS[prepStatus] || prepStatus}
            </MfBadge>
          </div>

          {/* Total */}
          <div className="flex items-baseline justify-between pt-4 border-t-2 border-mf-rose">
            <span className="font-body text-[11px] uppercase tracking-[0.1em] text-mf-rose">
              {lines.length} article{lines.length !== 1 ? 's' : ''} · Total
            </span>
            <span className="font-serif text-[28px] italic text-mf-marron-glace">
              {Number(order.total_amount ?? 0).toFixed(2)} €
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {canDelete && (
              <button
                onClick={() => onDelete(order)}
                className="flex items-center gap-1.5 font-body text-[11px] uppercase tracking-wider rounded-pill px-4 py-2.5 border-[1.5px] border-status-red/30 text-status-red bg-white hover:bg-status-red/5 transition-all duration-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(order)}
                className="font-body text-[11px] uppercase tracking-wider rounded-pill px-4 py-2.5 border-[1.5px] border-status-red/30 text-status-red bg-white hover:bg-status-red/5 transition-all duration-200 cursor-pointer"
              >
                Annuler
              </button>
            )}
            {next && (
              <MfButton
                size="sm"
                onClick={() => onStatusUpdate(order)}
                disabled={updatePending}
                className="flex-1"
              >
                {updatePending ? '...' : nextPaymentLabel(order.payment_status)}
              </MfButton>
            )}
            <MfButton variant="secondary" size="sm" onClick={onClose}>
              Fermer
            </MfButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2 — Daily operational view
   ═══════════════════════════════════════════════════ */

function DailyTab({ orderLines }) {
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

    return Object.values(map).sort((a, b) => {
      const dc = (a.slot_date || '').localeCompare(b.slot_date || '');
      if (dc !== 0) return dc;
      return a.slot_type === 'midi' ? -1 : 1;
    });
  }, [orderLines]);

  if (slotGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-[28px] opacity-30 mb-2">📋</div>
        <p className="font-body text-[13px] text-mf-muted">Aucune commande quotidienne</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {slotGroups.map((group) => {
        const header = formatSlotHeader(group.slot_date, group.slot_type);
        const orderEntries = Object.values(group.orderMap);

        return (
          <section key={`${group.slot_date}__${group.slot_type}`}>
            <h3 className="font-body text-[12px] font-medium text-mf-marron-glace uppercase tracking-wider mb-3">
              {header}
            </h3>

            <div className="space-y-3">
              {orderEntries.map(({ order, guest_name, lines }) => (
                <MfCard
                  key={`${order?.id ?? lines[0]?.order_id}__${guest_name || ''}`}
                  className="p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-[13px] font-medium text-mf-marron-glace">
                        {order?.customer_first_name} {order?.customer_last_name}
                        {order?.stand && (
                          <span className="ml-2 text-mf-muted font-normal">— Stand {order.stand}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-body text-[11px] text-mf-muted">{order?.order_number}</p>
                        {guest_name && (
                          <span className="font-body text-[11px] text-mf-rose font-medium">Menu : {guest_name}</span>
                        )}
                      </div>
                    </div>
                    <MfBadge variant={PAYMENT_BADGE_VARIANT[order?.payment_status] || 'rose'}>
                      {PAYMENT_LABELS[order?.payment_status] || 'En attente'}
                    </MfBadge>
                  </div>

                  <ul className="space-y-1 pl-1">
                    {lines.map((line) => (
                      <li key={line.id} className="flex items-center justify-between">
                        <span className="font-body text-[13px] text-mf-marron-glace">
                          {line.menu_item?.name ?? '—'}
                        </span>
                        <MfBadge variant={PREP_BADGE_VARIANT[line.prep_status] || 'rose'}>
                          {PREP_LABELS[line.prep_status] || line.prep_status}
                        </MfBadge>
                      </li>
                    ))}
                  </ul>
                </MfCard>
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
  const qc = useQueryClient();

  const { data: activeEvent, isLoading: eventLoading } = useActiveEvent();
  const eventId = selectedEventId ?? activeEvent?.id;

  const { data: orders, isLoading: ordersLoading } = useOrders(eventId);
  const { data: orderLines, isLoading: linesLoading } = useOrderLines(eventId);
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const markSeen = useMarkOrdersSeen();

  /* Mark orders as seen when page loads with data */
  useEffect(() => {
    if (eventId && orders?.length) {
      markSeen.mutate(eventId);
    }
  }, [eventId, orders?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Realtime: refresh order_lines when staff changes prep_status */
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel('admin-order-lines')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_lines' }, () => {
        qc.invalidateQueries({ queryKey: ['order_lines', eventId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, qc]);

  const isLoading = eventLoading || ordersLoading || linesLoading;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1200px]">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-serif text-[28px] italic text-mf-rose">Commandes</h1>
            <p className="font-body text-[13px] text-mf-muted mt-0.5">
              {activeEvent?.name || 'Aucun événement'}
            </p>
          </div>
          {orders && (
            <span className="inline-flex items-center rounded-pill px-3 py-1 bg-mf-poudre/30 font-body text-[12px] text-mf-rose font-medium">
              {orders.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <EventSelector selectedEventId={selectedEventId} onEventChange={setSelectedEventId} />
          <MfButton variant="outline" size="sm">
            <Download className="w-3.5 h-3.5 mr-1" />
            Exporter CSV
          </MfButton>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-pill font-body text-[12px] border transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-mf-rose border-mf-rose text-white'
                : 'bg-white border-mf-border text-mf-marron-glace hover:border-mf-rose/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Content ─── */}
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
