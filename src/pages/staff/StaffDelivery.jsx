import { useState, useRef, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveEvent } from '@/hooks/useEvents';
import { useDeliveryLines, useDeliverWithPhoto, useUpdateOrderLineStatus } from '@/hooks/useOrderLines';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabase';
import StaffHeader from '@/components/layout/StaffHeader';
import MfBadge from '@/components/ui/MfBadge';
import EventSelector from '@/components/admin/EventSelector';

const TYPE_ICONS = { entree: '🥗', plat: '🍽', dessert: '🍰', boisson: '🥤' };

export default function StaffDelivery() {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [view, setView] = useState('active'); // active | done
  const [inTransitKeys, setInTransitKeys] = useState(new Set()); // local-only "in_transit" state

  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: activeEvent } = useActiveEvent();
  const eventId = selectedEventId ?? activeEvent?.id;

  const { data: lines = [], isLoading } = useDeliveryLines(eventId);
  const deliverMutation = useDeliverWithPhoto();
  const updateStatus = useUpdateOrderLineStatus();

  // ─── Supabase Realtime ───
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel('delivery-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_lines' },
        () => queryClient.invalidateQueries({ queryKey: ['order_lines'] })
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [eventId, queryClient]);

  // ─── Group by order + slot + guest ───
  const cards = useMemo(() => {
    const grouped = {};
    lines.forEach((line) => {
      const key = `${line.order_id}-${line.meal_slot_id}-${line.guest_name || ''}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          order: line.order,
          meal_slot: line.meal_slot,
          guest_name: line.guest_name,
          lines: [],
          lineIds: [],
        };
      }
      grouped[key].lines.push(line);
      grouped[key].lineIds.push(line.id);
    });

    return Object.values(grouped).sort((a, b) => {
      const aReady = a.lines.some((l) => l.prep_status === 'ready') ? 0 : 1;
      const bReady = b.lines.some((l) => l.prep_status === 'ready') ? 0 : 1;
      if (aReady !== bReady) return aReady - bReady;
      return (a.order?.stand || '').localeCompare(b.order?.stand || '');
    });
  }, [lines]);

  const activeCards = cards.filter((c) => c.lines.some((l) => l.prep_status === 'ready'));
  const doneCards = cards.filter((c) => c.lines.every((l) => l.prep_status === 'delivered'));
  const displayed = view === 'active' ? activeCards : doneCards;

  const readyCount = activeCards.length;
  const doneCount = doneCards.length;

  // Route suggestion — sorted stands
  const sortedRoute = useMemo(() => {
    const stands = activeCards.map((c) => c.order?.stand).filter(Boolean);
    return [...new Set(stands)].sort();
  }, [activeCards]);

  const transitCount = activeCards.filter((c) => inTransitKeys.has(c.key)).length;

  const startTransit = (key) => {
    setInTransitKeys((prev) => new Set(prev).add(key));
  };

  const startAllTransit = () => {
    setInTransitKeys((prev) => {
      const next = new Set(prev);
      activeCards.forEach((c) => next.add(c.key));
      return next;
    });
  };

  const handleDeliver = (card, photo) => {
    const readyIds = card.lines.filter((l) => l.prep_status === 'ready').map((l) => l.id);
    if (readyIds.length === 0) return;
    const deliveredBy = profile?.display_name || profile?.email || 'staff';
    const onSuccess = () => {
      setInTransitKeys((prev) => { const next = new Set(prev); next.delete(card.key); return next; });
    };
    if (photo) {
      deliverMutation.mutate({ lineIds: readyIds, photo, delivered_by: deliveredBy }, { onSuccess });
    } else {
      updateStatus.mutate({ ids: readyIds, prep_status: 'delivered', delivered_by: deliveredBy }, { onSuccess });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse">
        <div className="hidden lg:block"><StaffHeader role="delivery" /></div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mf-blanc-casse">
      <style>{`
        @keyframes deliveryFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .delivery-fade-in { animation: deliveryFadeIn 0.3s ease both; }
      `}</style>

      {/* ═══ DESKTOP HEADER ═══ */}
      <div className="hidden lg:block">
        <StaffHeader role="delivery">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-mf-vert-olive/10">
              <div className="w-2 h-2 rounded-full bg-mf-vert-olive" />
              <span className="font-body text-[11px] font-medium text-mf-vert-olive">{readyCount - transitCount}</span>
              <span className="font-body text-[10px] text-mf-muted">À livrer</span>
            </div>
            {transitCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-status-orange/10">
                <div className="w-2 h-2 rounded-full bg-status-orange" />
                <span className="font-body text-[11px] font-medium text-status-orange">{transitCount}</span>
                <span className="font-body text-[10px] text-mf-muted">En cours</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-status-green/10">
              <div className="w-2 h-2 rounded-full bg-status-green" />
              <span className="font-body text-[11px] font-medium text-status-green">{doneCount}</span>
              <span className="font-body text-[10px] text-mf-muted">Livrés</span>
            </div>
          </div>
          <EventSelector selectedEventId={selectedEventId} onEventChange={setSelectedEventId} />
        </StaffHeader>
      </div>

      {/* ═══ MOBILE CONTROLS ═══ */}
      <div className="lg:hidden sticky top-[61px] z-30 bg-white border-b border-mf-border">
        {/* Quick count badges */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-mf-vert-olive/10">
              <div className="w-2 h-2 rounded-full bg-mf-vert-olive" />
              <span className="font-body text-[13px] font-medium text-mf-vert-olive">{readyCount - transitCount}</span>
            </div>
            {transitCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-status-orange/10">
                <div className="w-2 h-2 rounded-full bg-status-orange" />
                <span className="font-body text-[13px] font-medium text-status-orange">{transitCount}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-status-green/10">
              <div className="w-2 h-2 rounded-full bg-status-green" />
              <span className="font-body text-[13px] font-medium text-status-green">{doneCount}</span>
            </div>
          </div>
        </div>

        {/* 2 tabs */}
        <div className="flex">
          {[
            { key: 'active', label: `À livrer (${readyCount})`, border: 'border-b-status-orange' },
            { key: 'done', label: `Fait (${doneCount})`, border: 'border-b-status-green' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex-1 py-2.5 cursor-pointer transition-all font-body text-[13px] min-h-[42px] border-x-0 border-t-0 border-b-[3px] ${
                view === v.key
                  ? `${v.border} font-medium text-mf-marron-glace bg-transparent`
                  : 'border-b-transparent bg-transparent text-mf-muted'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-[600px] mx-auto px-3 lg:px-6 pt-3 pb-6">
        {/* Desktop filter tabs */}
        <div className="hidden lg:flex gap-2 mb-4">
          {[
            { key: 'active', label: `À traiter (${readyCount})` },
            { key: 'done', label: `Livrés (${doneCount})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setView(f.key)}
              className={`px-4 py-2 rounded-pill font-body text-[12px] cursor-pointer transition-all border ${
                view === f.key
                  ? 'bg-mf-rose text-mf-blanc-casse border-mf-rose'
                  : 'bg-white text-mf-marron-glace border-mf-border hover:border-mf-rose/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Route suggestion */}
        {view === 'active' && sortedRoute.length > 1 && (
          <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-[14px] bg-mf-vert-olive/8 border border-mf-vert-olive/20 mb-3">
            <span className="text-[18px]">🗺</span>
            <div className="flex-1 min-w-0">
              <div className="font-body text-[11px] font-medium text-mf-marron-glace">Itinéraire suggéré</div>
              <div className="font-body text-[13px] font-medium text-mf-vert-olive truncate">
                {sortedRoute.join('  →  ')}
              </div>
            </div>
            <button
              onClick={startAllTransit}
              className="shrink-0 px-3.5 py-2 rounded-pill bg-mf-vert-olive/15 border-none cursor-pointer font-body text-[10px] uppercase tracking-[0.06em] font-medium text-mf-vert-olive transition-all active:scale-95 hover:bg-mf-vert-olive/25"
            >
              Tout livrer →
            </button>
          </div>
        )}

        {/* Cards */}
        {displayed.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {displayed.map((card, i) => (
              <div key={card.key} className="delivery-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <DeliveryCard
                  card={card}
                  isInTransit={inTransitKeys.has(card.key)}
                  onStartTransit={() => startTransit(card.key)}
                  onDeliver={handleDeliver}
                  isPending={deliverMutation.isPending || updateStatus.isPending}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-[40px] mb-3 opacity-30">
              {view === 'active' ? '🎉' : '📋'}
            </div>
            <div className="font-serif text-[20px] italic text-mf-muted">
              {view === 'active' ? 'Tout est livré !' : 'Aucune livraison encore'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Delivery Card — 2-step: "Partir livrer" → inline photo + "Confirmer" ─── */
function DeliveryCard({ card, isInTransit, onStartTransit, onDeliver, isPending }) {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const allDelivered = card.lines.every((l) => l.prep_status === 'delivered');
  const hasReady = card.lines.some((l) => l.prep_status === 'ready');
  const slotType = card.meal_slot?.slot_type;

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleConfirm = () => {
    onDeliver(card, photo);
    setPhoto(null);
    setPreview(null);
  };

  return (
    <div className={`bg-white rounded-[16px] border border-mf-border overflow-hidden transition-all ${allDelivered ? 'opacity-55' : ''}`}>
      {/* Card body */}
      <div className={`p-4 ${isInTransit ? 'bg-status-orange/4' : ''}`}>
        <div className="flex gap-3.5 items-start">
          {/* Stand badge — 64px, big and prominent */}
          <div className={`min-w-[64px] h-[64px] rounded-[16px] flex flex-col items-center justify-center shrink-0 ${
            allDelivered ? 'bg-status-green/12' : isInTransit ? 'bg-status-orange/12' : 'bg-mf-poudre/30'
          }`}>
            <span className={`font-body text-[20px] font-medium ${allDelivered ? 'text-status-green' : isInTransit ? 'text-status-orange' : 'text-mf-rose'}`}>
              {card.order?.stand || '—'}
            </span>
            {isInTransit && <span className="text-[10px]">🚚</span>}
            {allDelivered && <span className="text-[10px]">✓✓</span>}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + slot */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-body text-[16px] font-medium text-mf-marron-glace truncate">
                {card.order?.customer_first_name} {card.order?.customer_last_name}
              </span>
              <MfBadge variant={slotType === 'midi' ? 'olive' : 'poudre'}>
                {slotType === 'midi' ? '☀' : '☽'}
              </MfBadge>
            </div>
            <div className="font-body text-[12px] text-mf-muted">
              {card.order?.order_number} · {card.lines.length} plat{card.lines.length > 1 ? 's' : ''}
            </div>
            {card.guest_name && (
              <div className="font-body text-[12px] text-mf-rose font-medium mt-0.5">
                {card.guest_name}
              </div>
            )}

            {/* Items as compact pills */}
            <div className="flex flex-wrap gap-1 mt-2">
              {card.lines.map((line) => (
                <span key={line.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-mf-blanc-casse font-body text-[12px] text-mf-marron-glace">
                  <span className="text-[13px]">{TYPE_ICONS[line.menu_item?.type] || '●'}</span>
                  {line.quantity > 1 ? `×${line.quantity}` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Date + slot info */}
        {card.meal_slot?.slot_date && (
          <div className="mt-2 font-body text-[11px] text-mf-muted">
            {format(new Date(card.meal_slot.slot_date + 'T00:00:00'), 'EEEE d MMM', { locale: fr })}
          </div>
        )}

        {/* Delivered info */}
        {allDelivered && card.lines[0]?.delivered_at && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="font-body text-[12px] text-status-green">
              ✓✓ Livré à {format(new Date(card.lines[0].delivered_at), 'HH:mm', { locale: fr })}
            </span>
            {card.lines[0]?.delivery_photo_url && (
              <span className="px-2 py-0.5 rounded-pill bg-mf-vert-olive/12 font-body text-[9px] uppercase tracking-wide text-mf-vert-olive">
                📷 Photo
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══ Step 1: "Partir livrer" button ═══ */}
      {hasReady && !isInTransit && !allDelivered && (
        <button
          onClick={onStartTransit}
          className="w-full min-h-12 border-t border-mf-border border-x-0 border-b-0 cursor-pointer transition-all active:scale-[0.97] font-body text-[14px] uppercase tracking-[0.08em] font-medium flex items-center justify-center gap-2 bg-status-orange/10 text-status-orange"
        >
          🚚 Partir livrer
        </button>
      )}

      {/* ═══ Step 2: Inline photo + confirm ═══ */}
      {isInTransit && hasReady && (
        <div className="p-4 border-t border-mf-border bg-status-green/5">
          <div className="font-body text-[13px] text-mf-marron-glace mb-2.5">
            Livré au stand <strong>{card.order?.stand}</strong> ?
          </div>

          {/* Inline photo capture */}
          <div className="mb-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Photo livraison" className="w-full h-20 object-cover rounded-lg border border-mf-border" />
                <button
                  onClick={() => { setPhoto(null); setPreview(null); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white border border-mf-border flex items-center justify-center font-body text-[11px] text-mf-muted cursor-pointer"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-20 rounded-lg border-2 border-dashed border-mf-border bg-white cursor-pointer hover:border-mf-rose/30 transition-colors flex items-center justify-center gap-2 font-body text-[13px] text-mf-muted"
              >
                📷 Photo (optionnel)
              </button>
            )}
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full min-h-12 rounded-pill border-none bg-status-green cursor-pointer font-body text-[13px] uppercase tracking-[0.08em] font-medium text-mf-blanc-casse transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {isPending ? 'En cours...' : "✓✓ C'est livré"}
          </button>
        </div>
      )}
    </div>
  );
}
