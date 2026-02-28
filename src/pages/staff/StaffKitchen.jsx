import { useState, useRef, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveEvent } from '@/hooks/useEvents';
import { useOrderLines, useUpdateOrderLineStatus, useDeliverWithPhoto } from '@/hooks/useOrderLines';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabase';
import StaffHeader from '@/components/layout/StaffHeader';
import MfBadge from '@/components/ui/MfBadge';
import EventSelector from '@/components/admin/EventSelector';

const COLUMNS = [
  { key: 'pending', label: 'En attente', color: 'mf-muted', icon: '◷' },
  { key: 'preparing', label: 'En préparation', color: 'status-orange', icon: '🔥' },
  { key: 'ready', label: 'Prêts', color: 'mf-vert-olive', icon: '✓' },
  { key: 'delivered', label: 'Livrés', color: 'status-green', icon: '🚚' },
];

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'delivered' };
const STATUS_ORDER = { pending: 0, preparing: 1, ready: 2, delivered: 3 };
const TYPE_ICONS = { entree: '🥗', plat: '🍽', dessert: '🍰', boisson: '🥤' };
const TYPE_SORT = { entree: 0, plat: 1, dessert: 2, boisson: 3 };

export default function StaffKitchen() {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [slotFilter, setSlotFilter] = useState('all');
  const [viewMode, setViewMode] = useState('kanban');
  const [deliveryModal, setDeliveryModal] = useState(null); // { lineIds, groupName }

  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: activeEvent } = useActiveEvent();
  const eventId = selectedEventId ?? activeEvent?.id;

  const { data: allLines = [], isLoading } = useOrderLines(eventId);
  const updateStatus = useUpdateOrderLineStatus();
  const deliverWithPhoto = useDeliverWithPhoto();

  // ─── Supabase Realtime ───
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel('kitchen-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_lines' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['order_lines'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);

  // ─── Filter by slot ───
  const filteredLines = useMemo(() => {
    if (slotFilter === 'all') return allLines;
    return allLines.filter((l) => l.meal_slot?.slot_type === slotFilter);
  }, [allLines, slotFilter]);

  // ─── Group lines by order + meal slot ───
  const groupedOrders = useMemo(() => {
    const groups = {};
    filteredLines.forEach((line) => {
      const key = `${line.order_id}_${line.meal_slot_id}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          order: line.order,
          mealSlot: line.meal_slot,
          guestName: line.guest_name || `${line.order?.customer_first_name || ''} ${line.order?.customer_last_name || ''}`.trim(),
          lines: [],
          lineIds: [],
        };
      }
      groups[key].lines.push(line);
      groups[key].lineIds.push(line.id);
    });

    // Determine group status = minimum status across all lines
    Object.values(groups).forEach((g) => {
      g.status = g.lines.reduce(
        (min, l) => (STATUS_ORDER[l.prep_status] < STATUS_ORDER[min] ? l.prep_status : min),
        g.lines[0].prep_status
      );
      // Sort lines by type for consistent display
      g.lines.sort((a, b) => (TYPE_SORT[a.menu_item?.type] ?? 99) - (TYPE_SORT[b.menu_item?.type] ?? 99));
    });

    return Object.values(groups);
  }, [filteredLines]);

  // ─── Stats ───
  const totalGroups = groupedOrders.length;
  const deliveredGroups = groupedOrders.filter((g) => g.status === 'delivered').length;
  const progress = totalGroups > 0 ? (deliveredGroups / totalGroups) * 100 : 0;

  // ─── Column items (grouped) ───
  const columnItems = (status) => groupedOrders.filter((g) => g.status === status);

  // ─── Advance entire group ───
  const advanceGroup = (group) => {
    const next = NEXT_STATUS[group.status];
    if (!next) return;
    if (next === 'delivered') {
      setDeliveryModal({ lineIds: group.lineIds, groupName: group.guestName });
      return;
    }
    updateStatus.mutate({
      ids: group.lineIds,
      prep_status: next,
      prepared_by: profile?.display_name || profile?.email || 'staff',
    });
  };

  const handleDeliverWithPhoto = (photo) => {
    if (!deliveryModal) return;
    deliverWithPhoto.mutate({
      lineIds: deliveryModal.lineIds,
      photo,
      delivered_by: profile?.display_name || profile?.email || 'staff',
    }, { onSuccess: () => setDeliveryModal(null) });
  };

  const handleDeliverSkip = () => {
    if (!deliveryModal) return;
    updateStatus.mutate({
      ids: deliveryModal.lineIds,
      prep_status: 'delivered',
      delivered_by: profile?.display_name || profile?.email || 'staff',
    }, { onSuccess: () => setDeliveryModal(null) });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse">
        <StaffHeader role="kitchen" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mf-blanc-casse">
      {/* ─── Header ─── */}
      <StaffHeader
        role="kitchen"
        slotFilter={slotFilter}
        onSlotFilterChange={setSlotFilter}
        progress={progress}
      >
        {/* View toggle */}
        <div className="flex gap-0.5">
          {['kanban', 'list'].map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[14px] cursor-pointer transition-all duration-200 ${
                viewMode === v
                  ? 'bg-mf-rose text-mf-blanc-casse border-mf-rose'
                  : 'bg-white text-mf-muted border-mf-border hover:border-mf-rose/30'
              }`}
            >
              {v === 'kanban' ? '▦' : '≡'}
            </button>
          ))}
        </div>

        {/* Event selector */}
        <EventSelector selectedEventId={selectedEventId} onEventChange={setSelectedEventId} />
      </StaffHeader>

      {/* ─── Kanban View ─── */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-4 gap-4 p-5 min-h-[calc(100vh-60px)]">
          {COLUMNS.map((col) => {
            const items = columnItems(col.key);
            return (
              <div key={col.key} className="flex flex-col">
                {/* Column header */}
                <div
                  className={`flex items-center justify-between px-3.5 py-3 rounded-t-card mb-2.5 border-b-2`}
                  style={{
                    background: `var(--color-${col.color}, #9A8A7C)10`,
                    borderBottomColor: `var(--color-${col.color}, #9A8A7C)40`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">{col.icon}</span>
                    <span className={`font-body text-[12px] uppercase tracking-widest font-medium text-${col.color}`}>
                      {col.label}
                    </span>
                  </div>
                  <span
                    className={`font-body text-[12px] font-medium w-6 h-6 rounded-full flex items-center justify-center text-${col.color} bg-${col.color}/15`}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {items.map((group) => (
                    <OrderCard
                      key={group.key}
                      group={group}
                      colColor={col.color}
                      onAdvance={advanceGroup}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-8 rounded-card border-2 border-dashed border-mf-border">
                      <span className="font-body text-[13px] text-mf-muted">Aucun element</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── List View ─── */}
      {viewMode === 'list' && (
        <div className="p-5 max-w-[900px] mx-auto space-y-6">
          {COLUMNS.filter((c) => c.key !== 'delivered').map((col) => {
            const items = columnItems(col.key);
            if (items.length === 0) return null;
            return (
              <div key={col.key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`font-body text-[12px] uppercase tracking-widest font-medium text-${col.color}`}>
                    {col.label}
                  </span>
                  <span className={`font-body text-[11px] px-2 py-0.5 rounded-pill bg-${col.color}/12 text-${col.color}`}>
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {items.map((group) => {
                    const nextStatus = NEXT_STATUS[group.status];
                    const nextCol = nextStatus ? COLUMNS.find((c) => c.key === nextStatus) : null;
                    return (
                      <div
                        key={group.key}
                        className="flex items-center gap-3 px-4 py-3 bg-mf-white rounded-xl border border-mf-border"
                        style={{ borderLeftWidth: 3, borderLeftColor: `var(--color-${col.color}, #9A8A7C)` }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-body text-[14px] font-medium text-mf-marron-glace">
                            {group.guestName}
                          </div>
                          <div className="font-body text-[11px] text-mf-muted mt-0.5">
                            {group.lines.map((l) => l.menu_item?.name).join(' + ')}
                          </div>
                        </div>
                        <span className="font-body text-[11px] text-mf-rose font-medium">{group.order?.order_number}</span>
                        <span className="font-body text-[11px] text-mf-marron-glace">{group.order?.stand}</span>
                        {nextCol && (
                          <button
                            onClick={() => advanceGroup(group)}
                            className={`font-body text-[10px] uppercase tracking-wide px-3.5 py-1.5 rounded-pill border-none cursor-pointer transition-all active:scale-[0.97] text-mf-blanc-casse bg-${nextCol.color}`}
                          >
                            {nextStatus === 'delivered' ? 'Valider livraison' : nextCol.label} →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Delivery Photo Modal ─── */}
      {deliveryModal && (
        <DeliveryPhotoModal
          groupName={deliveryModal.groupName}
          itemCount={deliveryModal.lineIds.length}
          isPending={deliverWithPhoto.isPending || updateStatus.isPending}
          onConfirm={handleDeliverWithPhoto}
          onSkip={handleDeliverSkip}
          onClose={() => setDeliveryModal(null)}
        />
      )}
    </div>
  );
}

/* ─── Order Card (kanban) — grouped by order+slot ─── */
function OrderCard({ group, colColor, onAdvance }) {
  const nextStatus = NEXT_STATUS[group.status];
  const nextCol = nextStatus ? COLUMNS.find((c) => c.key === nextStatus) : null;
  const slotType = group.mealSlot?.slot_type;

  return (
    <div
      className="bg-mf-white rounded-card border border-mf-border p-3.5 transition-all duration-200 hover:border-mf-rose/20"
      style={{ borderLeftWidth: 3, borderLeftColor: `var(--color-${colColor}, #9A8A7C)` }}
    >
      {/* Order ref + slot badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-body text-[11px] text-mf-rose font-medium">{group.order?.order_number}</span>
          {group.order?.stand && (
            <span className="font-body text-[9px] uppercase tracking-wide text-mf-muted px-2 py-0.5 rounded-pill bg-mf-blanc-casse">
              {group.order.stand}
            </span>
          )}
        </div>
        <MfBadge variant={slotType === 'midi' ? 'olive' : 'poudre'}>
          {slotType === 'midi' ? '☀ midi' : '☽ soir'}
        </MfBadge>
      </div>

      {/* Guest name */}
      <div className="font-body text-[14px] font-medium text-mf-marron-glace mb-2">
        {group.guestName}
      </div>

      {/* Items list */}
      <div className="space-y-1 mb-2">
        {group.lines.map((line) => (
          <div key={line.id} className="flex items-center gap-2">
            <span className="text-[13px] w-5 text-center">{TYPE_ICONS[line.menu_item?.type] || '●'}</span>
            <span className="font-body text-[12px] text-mf-marron-glace truncate flex-1">
              {line.menu_item?.name}
            </span>
            {line.quantity > 1 && (
              <span className="font-body text-[11px] text-mf-muted">x{line.quantity}</span>
            )}
          </div>
        ))}
      </div>

      {/* Date */}
      {group.mealSlot?.slot_date && (
        <div className="font-body text-[10px] text-mf-muted mb-2">
          {format(new Date(group.mealSlot.slot_date + 'T00:00:00'), 'EEE d MMM', { locale: fr })}
        </div>
      )}

      {/* Advance button */}
      {nextCol && (
        <button
          onClick={() => onAdvance(group)}
          className={`w-full mt-1 py-2 rounded-pill border-2 cursor-pointer transition-all duration-200 active:scale-[0.97] font-body text-[11px] uppercase tracking-wide font-medium flex items-center justify-center gap-1.5 border-${nextCol.color}/30 bg-${nextCol.color}/8 text-${nextCol.color} hover:bg-${nextCol.color}/15`}
        >
          <span>{nextCol.icon}</span> {nextStatus === 'delivered' ? 'Valider livraison' : nextCol.label} →
        </button>
      )}
    </div>
  );
}

/* ─── Delivery Photo Modal ─── */
function DeliveryPhotoModal({ groupName, itemCount, isPending, onConfirm, onSkip, onClose }) {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-mf-marron-glace/40" />
      <div className="relative z-10 bg-mf-white rounded-card border border-mf-border p-6 w-full max-w-sm space-y-4">
        <h3 className="font-serif text-[20px] italic text-mf-rose">Valider la livraison</h3>
        <p className="font-body text-[13px] text-mf-marron-glace">
          {groupName} — {itemCount} article{itemCount > 1 ? 's' : ''}
        </p>

        {/* Photo capture */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Photo livraison" className="w-full h-48 object-cover rounded-xl border border-mf-border" />
              <button
                onClick={() => { setPhoto(null); setPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-mf-white border border-mf-border flex items-center justify-center font-body text-[12px] text-mf-muted cursor-pointer"
              >
                x
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-8 rounded-xl border-2 border-dashed border-mf-border bg-mf-blanc-casse cursor-pointer hover:border-mf-rose/30 transition-colors"
            >
              <div className="text-center">
                <span className="text-[24px] block mb-1">📷</span>
                <span className="font-body text-[12px] text-mf-muted">Prendre une photo de livraison</span>
              </div>
            </button>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={() => onConfirm(photo)}
          disabled={isPending}
          className="w-full py-3 rounded-pill bg-status-green text-mf-blanc-casse font-body text-[12px] uppercase tracking-widest font-medium cursor-pointer border-none transition-all disabled:opacity-50"
        >
          {isPending ? 'En cours...' : photo ? 'Valider avec photo' : 'Valider sans photo'}
        </button>
        {!photo && (
          <button
            onClick={onSkip}
            disabled={isPending}
            className="w-full py-2 font-body text-[11px] text-mf-muted cursor-pointer bg-transparent border-none hover:text-mf-rose transition-colors"
          >
            Passer sans photo →
          </button>
        )}
      </div>
    </div>
  );
}
