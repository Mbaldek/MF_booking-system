import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDown, ArrowLeft, Calendar } from 'lucide-react';
import { useActiveEvents } from '@/hooks/useEvents';
import { useMealSlots } from '@/hooks/useMealSlots';
import { useEventMenuItems } from '@/hooks/useMenuItems';
import { useCreateOrder } from '@/hooks/useOrders';
import SlotSelector from '@/components/order/SlotSelector';
import MenuSelector from '@/components/order/MenuSelector';

function EventPicker({ events, onSelect }) {
  return (
    <div className="bg-slate-50 px-3 py-4 sm:px-4 sm:py-8 min-h-screen">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link to="/login" className="px-3 py-1.5 text-xs font-medium bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-all">
          Connexion
        </Link>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Maison Félicien</h1>
          <p className="text-sm text-gray-500">Choisissez votre événement pour commander</p>
        </div>

        <div className="grid gap-4">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onSelect(event)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex gap-4">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.name} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg shrink-0 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{event.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(event.start_date + 'T00:00:00'), 'd MMM', { locale: fr })} — {format(new Date(event.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}
                  </p>
                  {event.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', stand: '', phone: '', email: '',
  });
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [slotMenus, setSlotMenus] = useState({});
  const [expandedDays, setExpandedDays] = useState({});
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const { data: activeEvents = [], isLoading: eventsLoading } = useActiveEvents();
  const eventId = selectedEvent?.id;
  const { data: mealSlots = [] } = useMealSlots(eventId);
  const { data: menuItems = [] } = useEventMenuItems(eventId);
  const createOrder = useCreateOrder();

  // Auto-select if only one active event
  const effectiveEvent = activeEvents.length === 1 ? activeEvents[0] : selectedEvent;
  const showPicker = !effectiveEvent && activeEvents.length > 1;

  const entrees = menuItems.filter((i) => i.type === 'entree');
  const plats = menuItems.filter((i) => i.type === 'plat');
  const desserts = menuItems.filter((i) => i.type === 'dessert');
  const boissons = menuItems.filter((i) => i.type === 'boisson');

  const handleToggleSlot = useCallback((slotId) => {
    setSelectedSlotIds((prev) => {
      if (prev.includes(slotId)) {
        setSlotMenus((current) => {
          const { [slotId]: removed, ...rest } = current;
          return rest;
        });
        return prev.filter((id) => id !== slotId);
      }
      return [...prev, slotId];
    });
  }, []);

  const handleMenuSelection = useCallback((slotId, type, itemId) => {
    setSlotMenus((prev) => ({
      ...prev,
      [slotId]: { ...(prev[slotId] || {}), [type]: itemId },
    }));
  }, []);

  const selectedSlotsByDate = useMemo(() => {
    const groups = {};
    selectedSlotIds.forEach((slotId) => {
      const slot = mealSlots.find((s) => s.id === slotId);
      if (!slot) return;
      if (!groups[slot.slot_date]) groups[slot.slot_date] = [];
      groups[slot.slot_date].push(slot);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({
        date,
        slots: slots.sort((a, b) => (a.slot_type === 'midi' ? -1 : 1)),
      }));
  }, [selectedSlotIds, mealSlots]);

  const toggleDay = useCallback((date) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  }, []);

  const handleToggleSlotWithExpand = useCallback((slotId) => {
    const slot = mealSlots.find((s) => s.id === slotId);
    if (slot && !selectedSlotIds.includes(slotId)) {
      setExpandedDays((prev) => ({ ...prev, [slot.slot_date]: true }));
    }
    handleToggleSlot(slotId);
  }, [mealSlots, selectedSlotIds, handleToggleSlot]);

  const calculateTotal = () => {
    let total = 0;
    selectedSlotIds.forEach((slotId) => {
      const menu = slotMenus[slotId] || {};
      ['entree', 'plat', 'dessert', 'boisson'].forEach((type) => {
        if (menu[type]) {
          const item = menuItems.find((m) => m.id === menu[type]);
          if (item) total += Number(item.price);
        }
      });
    });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ev = effectiveEvent;
    const totalAmount = calculateTotal();

    const orderLines = [];
    selectedSlotIds.forEach((slotId) => {
      const menu = slotMenus[slotId] || {};
      ['entree', 'plat', 'dessert', 'boisson'].forEach((type) => {
        if (menu[type]) {
          const item = menuItems.find((m) => m.id === menu[type]);
          if (item) {
            orderLines.push({
              meal_slot_id: slotId,
              menu_item_id: item.id,
              quantity: 1,
              unit_price: Number(item.price),
            });
          }
        }
      });
    });

    try {
      const result = await createOrder.mutateAsync({
        orderData: {
          event_id: ev.id,
          customer_first_name: formData.first_name,
          customer_last_name: formData.last_name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          stand: formData.stand,
          total_amount: totalAmount,
          payment_status: 'pending',
        },
        orderLines,
      });

      setCreatedOrder(result.order);
      setOrderSuccess(true);
      setFormData({ first_name: '', last_name: '', stand: '', phone: '', email: '' });
      setSelectedSlotIds([]);
      setSlotMenus({});
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert('Erreur lors de la commande. Veuillez réessayer.');
    }
  };

  // Loading
  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // No active events
  if (activeEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <p className="text-gray-600">Aucun événement actif pour le moment.</p>
          <Link to="/" className="text-sm text-blue-600 hover:underline mt-4 inline-block">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  // Event picker (multiple active events)
  if (showPicker) {
    return <EventPicker events={activeEvents} onSelect={setSelectedEvent} />;
  }

  const ev = effectiveEvent;

  // Order success
  if (orderSuccess && createdOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Commande confirmée !</h2>
            <p className="text-gray-600">Commande <span className="font-mono font-semibold">{createdOrder.order_number}</span></p>
            <p className="text-sm text-gray-500">Un email de confirmation sera envoyé à votre adresse.</p>
            <p className="text-xl font-bold text-gray-900">Total : {Number(createdOrder.total_amount).toFixed(2)}€</p>
          </div>
          <button onClick={() => { setOrderSuccess(false); setCreatedOrder(null); }}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
            Nouvelle commande
          </button>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const isFormValid =
    formData.first_name && formData.last_name && formData.stand && formData.phone && formData.email &&
    selectedSlotIds.length > 0 &&
    selectedSlotIds.every((slotId) => {
      const menu = slotMenus[slotId];
      return menu && (menu.entree || menu.plat || menu.dessert || menu.boisson);
    });

  const slotLabels = { midi: 'Midi', soir: 'Soir' };

  return (
    <div className="bg-slate-50 px-3 py-4 sm:px-4 sm:py-8 min-h-screen">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link to="/login" className="px-3 py-1.5 text-xs font-medium bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-all">
          Connexion
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Event hero with image */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {ev.image_url && (
            <img src={ev.image_url} alt={ev.name} className="w-full h-40 object-cover" />
          )}
          <div className="p-6 text-center">
            {activeEvents.length > 1 && (
              <button onClick={() => setSelectedEvent(null)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mb-3">
                <ArrowLeft className="w-3 h-3" /> Changer d'événement
              </button>
            )}
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">{ev.name}</h1>
            <p className="text-sm text-gray-500">
              {format(new Date(ev.start_date + 'T00:00:00'), 'd MMM', { locale: fr })} — {format(new Date(ev.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}
            </p>
            {ev.description && <p className="text-xs text-gray-400 mt-2">{ev.description}</p>}
          </div>
        </div>

        {/* Order form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { id: 'first_name', label: 'Prénom', type: 'text' },
                { id: 'last_name', label: 'Nom', type: 'text' },
                { id: 'stand', label: 'Stand', type: 'text' },
                { id: 'phone', label: 'Téléphone', type: 'tel' },
              ].map((field) => (
                <div key={field.id} className="space-y-1">
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">{field.label} *</label>
                  <input id={field.id} type={field.type} required value={formData[field.id]}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              ))}
              <div className="space-y-1 md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                <input id="email" type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="mt-6">
              <SlotSelector slots={mealSlots} selectedSlotIds={selectedSlotIds} onToggleSlot={handleToggleSlotWithExpand} />
            </div>

            {selectedSlotsByDate.length > 0 && (
              <div className="space-y-3">
                {selectedSlotsByDate.map(({ date, slots }) => {
                  const isExpanded = expandedDays[date] !== false;
                  const dayItemCount = slots.reduce((count, slot) => {
                    const menu = slotMenus[slot.id] || {};
                    return count + ['entree', 'plat', 'dessert', 'boisson'].filter((t) => menu[t]).length;
                  }, 0);

                  return (
                    <div key={date} className="border rounded-xl overflow-hidden">
                      <button type="button" onClick={() => toggleDay(date)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-medium text-gray-900 capitalize">
                            {format(new Date(date + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })}
                          </span>
                          {dayItemCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {dayItemCount} article{dayItemCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="p-4 space-y-6">
                          {slots.map((slot) => (
                            <div key={slot.id} className="space-y-4">
                              {slots.length > 1 && (
                                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{slotLabels[slot.slot_type]}</p>
                              )}
                              {entrees.length > 0 && <MenuSelector type="entree" items={entrees} selectedId={slotMenus[slot.id]?.entree} onSelect={(id) => handleMenuSelection(slot.id, 'entree', id)} />}
                              {plats.length > 0 && <MenuSelector type="plat" items={plats} selectedId={slotMenus[slot.id]?.plat} onSelect={(id) => handleMenuSelection(slot.id, 'plat', id)} />}
                              {desserts.length > 0 && <MenuSelector type="dessert" items={desserts} selectedId={slotMenus[slot.id]?.dessert} onSelect={(id) => handleMenuSelection(slot.id, 'dessert', id)} />}
                              {boissons.length > 0 && <MenuSelector type="boisson" items={boissons} selectedId={slotMenus[slot.id]?.boisson} onSelect={(id) => handleMenuSelection(slot.id, 'boisson', id)} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedSlotIds.length > 0 && (
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-600">{selectedSlotIds.length} créneau{selectedSlotIds.length > 1 ? 'x' : ''}</span>
                <span className="text-2xl font-semibold">{total.toFixed(2)}€</span>
              </div>
            )}

            <button type="submit" disabled={!isFormValid || createOrder.isPending}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {createOrder.isPending ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Traitement en cours...</>
              ) : (
                <>Valider la commande {total > 0 ? `— ${total.toFixed(2)}€` : ''}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
