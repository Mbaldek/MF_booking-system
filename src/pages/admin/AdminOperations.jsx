import { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ClipboardList, Search, Check, Undo2, Camera, X, Package, ChefHat, Truck, Trash2,
} from 'lucide-react';
import { useActiveEvent } from '@/hooks/useEvents';
import {
  useKitchenLines, useDeliveryLines,
  useUpdateOrderLineStatus, useDeliverWithPhoto, useDeleteOrderLines,
} from '@/hooks/useOrderLines';
import { useAuth } from '@/lib/AuthContext';
import EventSelector from '@/components/admin/EventSelector';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

const prepStatusColors = {
  pending: 'bg-mf-poudre/20 text-mf-vieux-rose',
  preparing: 'bg-status-orange/15 text-status-orange',
  ready: 'bg-status-green/15 text-status-green',
  delivered: 'bg-status-green/15 text-status-green',
};

const prepStatusLabels = {
  pending: 'En attente',
  preparing: 'En préparation',
  ready: 'Prêt',
  delivered: 'Livré',
};

export default function AdminOperations() {
  const [activeTab, setActiveTab] = useState('prep');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliverModal, setDeliverModal] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  const { profile } = useAuth();
  const { data: activeEvent } = useActiveEvent();
  const eventId = selectedEventId ?? activeEvent?.id;

  const { data: kitchenLines = [], isLoading: kitchenLoading } = useKitchenLines(eventId);
  const { data: deliveryLines = [], isLoading: deliveryLoading } = useDeliveryLines(eventId);
  const updateStatus = useUpdateOrderLineStatus();
  const deliverMutation = useDeliverWithPhoto();
  const deleteLines = useDeleteOrderLines();
  const [deleteModal, setDeleteModal] = useState(null); // card to delete

  const lines = activeTab === 'prep' ? kitchenLines : deliveryLines;
  const isLoading = activeTab === 'prep' ? kitchenLoading : deliveryLoading;

  // Stats
  const prepStats = useMemo(() => {
    const pending = kitchenLines.filter((l) => l.prep_status === 'pending').length;
    const preparing = kitchenLines.filter((l) => l.prep_status === 'preparing').length;
    const ready = kitchenLines.filter((l) => l.prep_status === 'ready').length;
    return { pending, preparing, ready };
  }, [kitchenLines]);

  const deliveryStats = useMemo(() => {
    const toDeliver = deliveryLines.filter((l) => l.prep_status === 'ready').length;
    const delivered = deliveryLines.filter((l) => l.prep_status === 'delivered').length;
    return { toDeliver, delivered, total: deliveryLines.length };
  }, [deliveryLines]);

  // Available dates
  const availableDates = useMemo(() => {
    const dates = new Set(lines.map((l) => l.meal_slot?.slot_date).filter(Boolean));
    return [...dates].sort();
  }, [lines]);

  // Grouped cards
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

    const grouped = {};
    filtered.forEach((line) => {
      const key = `${line.order_id}-${line.meal_slot_id}-${line.guest_name || ''}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          order: line.order,
          meal_slot: line.meal_slot,
          guest_name: line.guest_name,
          lines: [],
        };
      }
      grouped[key].lines.push(line);
    });

    return Object.values(grouped).sort((a, b) => {
      if (activeTab === 'delivery') {
        const aReady = a.lines.some((l) => l.prep_status === 'ready') ? 0 : 1;
        const bReady = b.lines.some((l) => l.prep_status === 'ready') ? 0 : 1;
        if (aReady !== bReady) return aReady - bReady;
      }
      const dateA = a.meal_slot?.slot_date || '';
      const dateB = b.meal_slot?.slot_date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.meal_slot?.slot_type === 'midi' ? 0 : 1) - (b.meal_slot?.slot_type === 'midi' ? 0 : 1);
    });
  }, [lines, search, dateFilter, statusFilter, activeTab]);

  // Prep actions
  const handleMarkReady = (cardLines) => {
    const ids = cardLines.filter((l) => l.prep_status !== 'ready').map((l) => l.id);
    if (ids.length === 0) return;
    updateStatus.mutate({
      ids,
      prep_status: 'ready',
      prepared_by: profile?.display_name || profile?.email || 'admin',
    });
  };

  const handleUndo = (cardLines) => {
    const ids = cardLines.filter((l) => l.prep_status === 'ready').map((l) => l.id);
    if (ids.length === 0) return;
    updateStatus.mutate({ ids, prep_status: 'pending' });
  };

  // Delivery actions
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDeliver = async () => {
    if (!deliverModal) return;
    const readyLines = deliverModal.lines.filter((l) => l.prep_status === 'ready');
    const deliveredBy = profile?.display_name || profile?.email || 'admin';

    for (const line of readyLines) {
      await deliverMutation.mutateAsync({
        lineId: line.id,
        photo: readyLines.indexOf(line) === 0 ? photo : null,
        delivered_by: deliveredBy,
      });
    }

    setDeliverModal(null);
    setPhoto(null);
    setPhotoPreview(null);
  };

  const closeModal = () => {
    setDeliverModal(null);
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStatusFilter('all');
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-mf-marron-glace flex items-center gap-2">
          <ClipboardList className="w-6 h-6" />
          Suivi commandes
        </h1>
        <EventSelector selectedEventId={selectedEventId} onEventChange={setSelectedEventId} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mf-border">
        <button
          onClick={() => handleTabChange('prep')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'prep'
              ? 'border-[#8B3A43] text-[#8B3A43]'
              : 'border-transparent text-mf-muted hover:text-mf-marron-glace'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          Préparation
          {prepStats.pending + prepStats.preparing > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-mf-poudre/20 text-mf-vieux-rose">
              {prepStats.pending + prepStats.preparing}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('delivery')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'delivery'
              ? 'border-[#8B3A43] text-[#8B3A43]'
              : 'border-transparent text-mf-muted hover:text-mf-marron-glace'
          }`}
        >
          <Truck className="w-4 h-4" />
          Livraison
          {deliveryStats.toDeliver > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-status-orange/15 text-status-orange">
              {deliveryStats.toDeliver}
            </span>
          )}
        </button>
      </div>

      {/* Stats */}
      {activeTab === 'prep' ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-mf-poudre/15 border border-mf-poudre/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-mf-vieux-rose">{prepStats.pending}</p>
            <p className="text-xs text-mf-vieux-rose">En attente</p>
          </div>
          <div className="bg-status-orange/10 border border-status-orange/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-status-orange">{prepStats.preparing}</p>
            <p className="text-xs text-status-orange">En préparation</p>
          </div>
          <div className="bg-status-green/10 border border-status-green/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-status-green">{prepStats.ready}</p>
            <p className="text-xs text-status-green">Prêts</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-status-orange/10 border border-status-orange/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-status-orange">{deliveryStats.toDeliver}</p>
            <p className="text-xs text-status-orange">À livrer</p>
          </div>
          <div className="bg-status-green/10 border border-status-green/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-status-green">{deliveryStats.delivered}</p>
            <p className="text-xs text-status-green">Livrés</p>
          </div>
          <div className="bg-mf-blanc-casse border border-mf-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-mf-marron-glace">{deliveryStats.total}</p>
            <p className="text-xs text-mf-muted">Total</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-muted" />
          <input
            type="text"
            placeholder="Rechercher nom, stand, commande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose/40"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose/40"
          >
            <option value="all">Toutes les dates</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {format(new Date(d + 'T00:00:00'), 'd MMM', { locale: fr })}
              </option>
            ))}
          </select>
          {activeTab === 'prep' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose/40"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="preparing">En préparation</option>
              <option value="ready">Prêt</option>
            </select>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B3A43]" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-mf-poudre mx-auto mb-3" />
          <p className="text-mf-muted">
            {activeTab === 'prep' ? 'Aucune commande à préparer' : 'Aucune livraison en cours'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {cards.map((card) => {
            const allReady = card.lines.every((l) => l.prep_status === 'ready');
            const someReady = card.lines.some((l) => l.prep_status === 'ready');
            const allDelivered = card.lines.every((l) => l.prep_status === 'delivered');
            const hasReadyToDeliver = card.lines.some((l) => l.prep_status === 'ready');

            const isCompleted =
              (activeTab === 'prep' && allReady) ||
              (activeTab === 'delivery' && allDelivered);

            return (
              <div
                key={card.key}
                className={`bg-white border rounded-xl p-4 space-y-3 ${
                  isCompleted
                    ? 'border-status-green/30 bg-status-green/5 opacity-70'
                    : 'border-mf-border'
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-mf-marron-glace">
                      {card.order?.customer_first_name} {card.order?.customer_last_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-mf-muted">
                      <span>Stand {card.order?.stand}</span>
                      <span>&bull;</span>
                      <span className="font-mono">{card.order?.order_number}</span>
                    </div>
                    {card.guest_name && (
                      <p className="text-sm text-[#8B3A43] font-medium mt-1">
                        Menu : {card.guest_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right text-xs">
                      <p className="font-medium capitalize">
                        {card.meal_slot?.slot_date &&
                          format(new Date(card.meal_slot.slot_date + 'T00:00:00'), 'd MMM', { locale: fr })}
                      </p>
                      <p className="text-[#8B3A43] font-semibold uppercase">
                        {card.meal_slot?.slot_type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteModal(card)}
                      className="p-1.5 text-mf-muted hover:text-status-red hover:bg-status-red/10 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Line items */}
                <div className="space-y-1.5">
                  {card.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            prepStatusColors[line.prep_status] || 'bg-mf-blanc-casse text-mf-marron-glace'
                          }`}
                        >
                          {prepStatusLabels[line.prep_status] || line.prep_status}
                        </span>
                        <span>{line.menu_item?.name}</span>
                      </div>
                      <span className="text-xs text-mf-muted capitalize">{line.menu_item?.type}</span>
                    </div>
                  ))}
                </div>

                {/* Actions — Prep tab */}
                {activeTab === 'prep' && (
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
                        className="flex items-center justify-center gap-1.5 px-3 py-2 border border-mf-border text-mf-marron-glace text-sm font-medium rounded-lg hover:bg-mf-blanc-casse disabled:opacity-50 transition-colors"
                      >
                        <Undo2 className="w-4 h-4" />
                        Annuler
                      </button>
                    )}
                  </div>
                )}

                {/* Actions — Delivery tab */}
                {activeTab === 'delivery' && hasReadyToDeliver && (
                  <div className="pt-2 border-t">
                    <button
                      onClick={() => setDeliverModal(card)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#8B3A43] text-white text-sm font-medium rounded-lg hover:bg-[#7a3039] transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Livrer avec photo
                    </button>
                  </div>
                )}

                {/* Delivered info */}
                {activeTab === 'delivery' && allDelivered && card.lines[0]?.delivery_photo_url && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Livré à{' '}
                      {card.lines[0].delivered_at &&
                        format(new Date(card.lines[0].delivered_at), 'HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deliver Modal */}
      {deliverModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Confirmer la livraison</h3>
              <button onClick={closeModal} className="p-1 hover:bg-mf-blanc-casse rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-mf-muted">
              <p className="font-medium text-mf-marron-glace">
                {deliverModal.order?.customer_first_name} {deliverModal.order?.customer_last_name}
              </p>
              <p>
                Stand {deliverModal.order?.stand} &bull;{' '}
                {deliverModal.meal_slot?.slot_type?.toUpperCase()}
              </p>
              <p className="mt-1 text-mf-muted">
                {deliverModal.lines.filter((l) => l.prep_status === 'ready').length} article(s) à
                livrer
              </p>
            </div>

            {/* Photo */}
            <div>
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Photo de livraison"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-mf-border rounded-lg p-6 text-center hover:border-mf-rose/40 transition-colors"
                >
                  <Camera className="w-8 h-8 text-mf-muted mx-auto mb-2" />
                  <p className="text-sm text-mf-muted">Prendre une photo</p>
                  <p className="text-xs text-mf-muted">optionnel</p>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <button
              onClick={handleDeliver}
              disabled={deliverMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {deliverMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Livraison en cours...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmer la livraison
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete modal (double validation) */}
      {deleteModal && (
        <ConfirmDeleteModal
          title="Supprimer ce menu"
          description={`Le menu de ${deleteModal.guest_name || 'ce convive'} (${deleteModal.order?.order_number}, ${deleteModal.lines.length} article${deleteModal.lines.length > 1 ? 's' : ''}) sera définitivement supprimé. Cette action est irréversible.`}
          confirmText="SUPPRIMER"
          onConfirm={async () => {
            try {
              const ids = deleteModal.lines.map((l) => l.id);
              await deleteLines.mutateAsync(ids);
              setDeleteModal(null);
            } catch (err) {
              alert(`Erreur: ${err.message}`);
            }
          }}
          onCancel={() => setDeleteModal(null)}
          loading={deleteLines.isPending}
        />
      )}
    </div>
  );
}
