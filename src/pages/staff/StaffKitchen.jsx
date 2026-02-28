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

/* ─── Static class maps (avoids dynamic Tailwind JIT issues) ─── */
const SC = {
  pending:   { text: 'text-mf-muted',     bg: 'bg-mf-muted',     light: 'bg-mf-muted/10',     count: 'bg-mf-muted/20 text-mf-muted',       tab: 'border-b-mf-muted bg-mf-muted/5',         borderL: 'border-l-mf-muted',     borderB: 'border-b-mf-muted/40' },
  preparing: { text: 'text-status-orange', bg: 'bg-status-orange', light: 'bg-status-orange/10', count: 'bg-status-orange/20 text-status-orange', tab: 'border-b-status-orange bg-status-orange/5', borderL: 'border-l-status-orange', borderB: 'border-b-status-orange/40' },
  ready:     { text: 'text-mf-vert-olive', bg: 'bg-mf-vert-olive', light: 'bg-mf-vert-olive/10', count: 'bg-mf-vert-olive/20 text-mf-vert-olive', tab: 'border-b-mf-vert-olive bg-mf-vert-olive/5', borderL: 'border-l-mf-vert-olive', borderB: 'border-b-mf-vert-olive/40' },
  delivered: { text: 'text-status-green',  bg: 'bg-status-green',  light: 'bg-status-green/10',  count: 'bg-status-green/20 text-status-green',   tab: 'border-b-status-green bg-status-green/5',   borderL: 'border-l-status-green',  borderB: 'border-b-status-green/40' },
};

const COLUMNS = [
  { key: 'pending',   label: 'En attente',    icon: '◷' },
  { key: 'preparing', label: 'En préparation', icon: '🔥' },
  { key: 'ready',     label: 'Prêts',          icon: '✓' },
  { key: 'delivered', label: 'Livrés',         icon: '🚚' },
];

const TABS = [
  { key: 'pending',   label: 'Attente',  icon: '◷' },
  { key: 'preparing', label: 'En cours', icon: '🔥' },
  { key: 'ready',     label: 'Prêts',    icon: '✓' },
  { key: 'delivered', label: 'Livrés',   icon: '✓✓' },
];

const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'delivered' };
const STATUS_ORDER = { pending: 0, preparing: 1, ready: 2, delivered: 3 };
const TYPE_ICONS = { entree: '🥗', plat: '🍽', dessert: '🍰', boisson: '🥤' };
const TYPE_SORT = { entree: 0, plat: 1, dessert: 2, boisson: 3 };

const NEXT_ACTION = {
  pending:   { label: 'Commencer →',  bulkLabel: 'Commencer · Toute la commande', cls: 'border-status-orange/30 bg-status-orange/8 text-status-orange hover:bg-status-orange/15', bulkCls: 'bg-status-orange/12 text-status-orange' },
  preparing: { label: 'Prêt ✓',       bulkLabel: 'Prêt ✓ · Toute la commande',    cls: 'border-mf-vert-olive/30 bg-mf-vert-olive/8 text-mf-vert-olive hover:bg-mf-vert-olive/15', bulkCls: 'bg-mf-vert-olive/12 text-mf-vert-olive' },
  ready:     { label: 'Livré ✓✓',     bulkLabel: 'Livré ✓✓ · Toute la commande',  cls: 'border-status-green/30 bg-status-green/8 text-status-green hover:bg-status-green/15', bulkCls: 'bg-status-green/12 text-status-green' },
};

export default function StaffKitchen() {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [slotFilter, setSlotFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [deliveryModal, setDeliveryModal] = useState(null);

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
        () => queryClient.invalidateQueries({ queryKey: ['order_lines'] })
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
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

    Object.values(groups).forEach((g) => {
      g.status = g.lines.reduce(
        (min, l) => (STATUS_ORDER[l.prep_status] < STATUS_ORDER[min] ? l.prep_status : min),
        g.lines[0].prep_status
      );
      g.lines.sort((a, b) => (TYPE_SORT[a.menu_item?.type] ?? 99) - (TYPE_SORT[b.menu_item?.type] ?? 99));
    });

    return Object.values(groups);
  }, [filteredLines]);

  // ─── Stats ───
  const totalGroups = groupedOrders.length;
  const deliveredGroups = groupedOrders.filter((g) => g.status === 'delivered').length;
  const progress = totalGroups > 0 ? (deliveredGroups / totalGroups) * 100 : 0;

  const columnItems = (status) => groupedOrders.filter((g) => g.status === status);

  const tabCounts = useMemo(() => {
    const c = { pending: 0, preparing: 0, ready: 0, delivered: 0 };
    groupedOrders.forEach((g) => { c[g.status] = (c[g.status] || 0) + 1; });
    return c;
  }, [groupedOrders]);

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
        <div className="hidden lg:block"><StaffHeader role="kitchen" /></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
        </div>
      </div>
    );
  }

  const tabOrders = columnItems(activeTab);

  return (
    <div className="min-h-screen bg-mf-blanc-casse">
      {/* ═══ DESKTOP HEADER (hidden on mobile) ═══ */}
      <div className="hidden lg:block">
        <StaffHeader role="kitchen" slotFilter={slotFilter} onSlotFilterChange={setSlotFilter} progress={progress}>
          <EventSelector selectedEventId={selectedEventId} onEventChange={setSelectedEventId} />
        </StaffHeader>
      </div>

      {/* ═══ MOBILE CONTROLS (hidden on desktop) ═══ */}
      <div className="lg:hidden sticky top-[61px] z-30 bg-white border-b border-mf-border">
        {/* Slot filter + Progress */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="inline-flex rounded-pill border border-mf-border overflow-hidden">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'midi', label: '☀' },
              { key: 'soir', label: '☽' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSlotFilter(s.key)}
                className={`px-3 py-1.5 font-body text-[12px] border-none cursor-pointer transition-all ${
                  slotFilter === s.key
                    ? 'bg-mf-rose text-mf-blanc-casse'
                    : 'bg-transparent text-mf-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-mf-border">
              <div
                className="h-full rounded-full bg-status-green transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-body text-[12px] font-medium text-status-green">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-mf-blanc-casse">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const sc = SC[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 cursor-pointer transition-all border-x-0 border-t-0 border-b-[3px] ${
                  active ? sc.tab : 'border-b-transparent bg-transparent'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[14px]">{tab.icon}</span>
                  <span className={`font-body text-[13px] ${active ? `${sc.text} font-medium` : 'text-mf-muted'}`}>
                    {tabCounts[tab.key]}
                  </span>
                </div>
                <span className={`font-body text-[9px] uppercase tracking-[0.06em] ${active ? sc.text : 'text-mf-muted'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ MOBILE ORDER LIST ═══ */}
      <div className="lg:hidden px-3 pt-3 pb-24">
        {tabOrders.length > 0 ? (
          tabOrders.map((group) => (
            <MobileOrderCard key={group.key} group={group} onAdvance={advanceGroup} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-[40px] mb-3 opacity-30">
              {activeTab === 'delivered' ? '🎉' : activeTab === 'ready' ? '✓' : '☕'}
            </div>
            <div className="font-serif text-[20px] italic text-mf-muted">
              {activeTab === 'delivered'
                ? 'Tout est livré !'
                : activeTab === 'ready'
                ? 'Rien en attente de livraison'
                : activeTab === 'preparing'
                ? 'Rien en préparation'
                : 'Aucune commande en attente'}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MOBILE BOTTOM BAR ═══ */}
      {activeTab !== 'delivered' && tabOrders.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-mf-border px-4 py-3 flex items-center justify-between shadow-[0_-2px_12px_rgba(57,45,49,0.06)]">
          <div>
            <div className="font-body text-[11px] text-mf-muted">
              {activeTab === 'pending' ? 'En attente' : activeTab === 'preparing' ? 'En cours' : 'Prêts'}
            </div>
            <div className="font-body text-[16px] font-medium text-mf-marron-glace">
              {tabOrders.length} commande{tabOrders.length > 1 ? 's' : ''}
            </div>
          </div>
          <div className={`font-body text-[12px] uppercase tracking-[0.1em] font-medium px-6 py-3.5 rounded-pill min-h-[48px] flex items-center ${SC[activeTab].bg} text-mf-blanc-casse`}>
            Tout avancer →
          </div>
        </div>
      )}

      {/* ═══ DESKTOP KANBAN ═══ */}
      <div className="hidden lg:grid grid-cols-4 gap-4 p-5 min-h-[calc(100vh-60px)]">
        {COLUMNS.map((col) => {
          const items = columnItems(col.key);
          const sc = SC[col.key];
          return (
            <div key={col.key} className="flex flex-col">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3.5 py-3 rounded-t-card mb-2.5 border-b-2 ${sc.light} ${sc.borderB}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">{col.icon}</span>
                  <span className={`font-body text-[12px] uppercase tracking-widest font-medium ${sc.text}`}>
                    {col.label}
                  </span>
                </div>
                <span className={`font-body text-[12px] font-medium w-6 h-6 rounded-full flex items-center justify-center ${sc.count}`}>
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {items.map((group) => (
                  <DesktopOrderCard key={group.key} group={group} onAdvance={advanceGroup} />
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8 rounded-card border-2 border-dashed border-mf-border">
                    <span className="font-body text-[13px] text-mf-muted">Aucun élément</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Delivery Photo Modal ═══ */}
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

/* ─── Mobile Order Card — expandable, grouped by order ─── */
function MobileOrderCard({ group, onAdvance }) {
  const [expanded, setExpanded] = useState(false);
  const nextAction = NEXT_ACTION[group.status];
  const slotType = group.mealSlot?.slot_type;

  return (
    <div className="bg-white rounded-[16px] border border-mf-border overflow-hidden mb-2.5">
      {/* Header — tappable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-transparent border-none cursor-pointer text-left"
      >
        {/* Stand badge — big and prominent */}
        <div className="min-w-[52px] h-[52px] rounded-[14px] bg-mf-poudre/25 flex items-center justify-center font-body text-[15px] font-medium text-mf-rose shrink-0">
          {group.order?.stand || '—'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-body text-[16px] font-medium text-mf-marron-glace truncate">
              {group.guestName}
            </span>
            <MfBadge variant={slotType === 'midi' ? 'olive' : 'poudre'}>
              {slotType === 'midi' ? '☀' : '☽'}
            </MfBadge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-body text-[12px] text-mf-muted">{group.order?.order_number}</span>
            <span className="font-body text-[12px] text-mf-muted">·</span>
            <span className="font-body text-[12px] text-mf-muted">{group.lines.length} plats</span>
          </div>
        </div>
        <span className={`text-[16px] text-mf-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Items — collapsible */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? 500 : 0 }}
      >
        <div className="px-4 pb-3">
          {group.lines.map((line) => (
            <div key={line.id} className="flex items-center gap-2.5 py-2.5 border-b border-mf-blanc-casse last:border-b-0">
              <span className="text-[20px] w-7 text-center">{TYPE_ICONS[line.menu_item?.type] || '●'}</span>
              <div className="flex-1 min-w-0">
                <span className="font-body text-[14px] text-mf-marron-glace">{line.menu_item?.name}</span>
                {line.quantity > 1 && <span className="font-body text-[13px] text-mf-rose font-medium"> ×{line.quantity}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk action */}
      {nextAction && (
        <button
          onClick={() => onAdvance(group)}
          className={`w-full min-h-[50px] border-t border-mf-border border-x-0 border-b-0 cursor-pointer transition-all active:scale-[0.97] font-body text-[13px] uppercase tracking-[0.1em] font-medium flex items-center justify-center gap-1.5 ${nextAction.bulkCls}`}
        >
          {nextAction.bulkLabel}
        </button>
      )}
    </div>
  );
}

/* ─── Desktop Order Card — kanban ─── */
function DesktopOrderCard({ group, onAdvance }) {
  const nextAction = NEXT_ACTION[group.status];
  const sc = SC[group.status];
  const slotType = group.mealSlot?.slot_type;

  return (
    <div className={`bg-mf-white rounded-card border border-mf-border p-3.5 border-l-[3px] ${sc.borderL} transition-all duration-200 hover:border-mf-rose/20`}>
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
      {nextAction && (
        <button
          onClick={() => onAdvance(group)}
          className={`w-full mt-1 min-h-[48px] py-2 rounded-pill border-2 cursor-pointer transition-all duration-200 active:scale-[0.97] font-body text-[11px] uppercase tracking-wide font-medium flex items-center justify-center gap-1.5 ${nextAction.cls}`}
        >
          {nextAction.label}
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
                ×
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

        <button
          onClick={() => onConfirm(photo)}
          disabled={isPending}
          className="w-full min-h-[48px] py-3 rounded-pill bg-status-green text-mf-blanc-casse font-body text-[12px] uppercase tracking-widest font-medium cursor-pointer border-none transition-all disabled:opacity-50"
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
