import { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Truck, Search, Camera, X, Check, Package } from 'lucide-react';
import { useActiveEvent } from '@/hooks/useEvents';
import { useDeliveryLines, useDeliverWithPhoto } from '@/hooks/useOrderLines';
import { useAuth } from '@/lib/AuthContext';

export default function StaffDelivery() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [deliverModal, setDeliverModal] = useState(null); // line being delivered
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  const { profile } = useAuth();
  const { data: activeEvent } = useActiveEvent();
  const { data: lines = [], isLoading } = useDeliveryLines(activeEvent?.id);
  const deliverMutation = useDeliverWithPhoto();

  // Stats
  const stats = useMemo(() => {
    const toDeliver = lines.filter((l) => l.prep_status === 'ready').length;
    const delivered = lines.filter((l) => l.prep_status === 'delivered').length;
    return { toDeliver, delivered, total: lines.length };
  }, [lines]);

  // Available dates
  const availableDates = useMemo(() => {
    const dates = new Set(lines.map((l) => l.meal_slot?.slot_date).filter(Boolean));
    return [...dates].sort();
  }, [lines]);

  // Group by order + slot
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
      // Ready first, delivered last
      const aReady = a.lines.some((l) => l.prep_status === 'ready') ? 0 : 1;
      const bReady = b.lines.some((l) => l.prep_status === 'ready') ? 0 : 1;
      if (aReady !== bReady) return aReady - bReady;
      const dateA = a.meal_slot?.slot_date || '';
      const dateB = b.meal_slot?.slot_date || '';
      return dateA.localeCompare(dateB);
    });
  }, [lines, search, dateFilter]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDeliver = async () => {
    if (!deliverModal) return;

    // Deliver all ready lines in the card
    const readyLines = deliverModal.lines.filter((l) => l.prep_status === 'ready');
    const deliveredBy = profile?.display_name || profile?.email || 'staff';

    for (const line of readyLines) {
      await deliverMutation.mutateAsync({
        lineId: line.id,
        photo: readyLines.indexOf(line) === 0 ? photo : null, // photo on first line only
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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B3A43]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Livraison
        </h1>
        {activeEvent && <p className="text-sm text-gray-500 mt-1">{activeEvent.name}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{stats.toDeliver}</p>
          <p className="text-xs text-orange-600">À livrer</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
          <p className="text-xs text-green-600">Livrés</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
          <p className="text-xs text-gray-600">Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher nom, stand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A43]"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A43]"
        >
          <option value="all">Toutes les dates</option>
          {availableDates.map((d) => (
            <option key={d} value={d}>
              {format(new Date(d + 'T00:00:00'), 'd MMM', { locale: fr })}
            </option>
          ))}
        </select>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune livraison en cours</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {cards.map((card) => {
            const allDelivered = card.lines.every((l) => l.prep_status === 'delivered');
            const hasReady = card.lines.some((l) => l.prep_status === 'ready');

            return (
              <div
                key={card.key}
                className={`bg-white border rounded-xl p-4 space-y-3 ${
                  allDelivered ? 'border-green-300 bg-green-50/50 opacity-70' : 'border-gray-200'
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
                    {card.guest_name && (
                      <p className="text-sm text-[#8B3A43] font-medium mt-1">Menu : {card.guest_name}</p>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium capitalize">
                      {card.meal_slot?.slot_date &&
                        format(new Date(card.meal_slot.slot_date + 'T00:00:00'), 'd MMM', { locale: fr })}
                    </p>
                    <p className="text-[#8B3A43] font-semibold uppercase">
                      {card.meal_slot?.slot_type}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {card.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            line.prep_status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {line.prep_status === 'delivered' ? 'Livré' : 'Prêt'}
                        </span>
                        <span>{line.menu_item?.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">{line.menu_item?.type}</span>
                    </div>
                  ))}
                </div>

                {hasReady && (
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

                {allDelivered && card.lines[0]?.delivery_photo_url && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Livré à {card.lines[0].delivered_at && format(new Date(card.lines[0].delivered_at), 'HH:mm', { locale: fr })}
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
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">
                {deliverModal.order?.customer_first_name} {deliverModal.order?.customer_last_name}
              </p>
              <p>Stand {deliverModal.order?.stand} &bull; {deliverModal.meal_slot?.slot_type?.toUpperCase()}</p>
              <p className="mt-1 text-gray-500">
                {deliverModal.lines.filter((l) => l.prep_status === 'ready').length} article(s) à livrer
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
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#8B3A43]/40 transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Prendre une photo</p>
                  <p className="text-xs text-gray-400">optionnel</p>
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
    </div>
  );
}
