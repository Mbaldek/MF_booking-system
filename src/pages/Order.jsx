import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDown, ArrowLeft, Calendar, Plus, Trash2, User } from 'lucide-react';
import { useActiveEvents } from '@/hooks/useEvents';
import { useMealSlots, useSlotMenuCounts } from '@/hooks/useMealSlots';
import { useEventMenuItems } from '@/hooks/useMenuItems';
import { useCreateOrder } from '@/hooks/useOrders';
import { supabase } from '@/api/supabase';
import SlotSelector from '@/components/order/SlotSelector';
import MenuSelector from '@/components/order/MenuSelector';

function EventPicker({ events, onSelect }) {
  return (
    <div className="bg-[#F0F0E6] px-3 py-4 sm:px-4 sm:py-8 min-h-screen">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link to="/login" className="px-4 py-1.5 text-xs font-medium bg-[#FDFAF7] border border-[#E5D9D0] rounded-full hover:border-[#8B3A43] transition-all uppercase tracking-wider">
          Connexion
        </Link>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <img src="/logo.svg" alt="Maison Félicien" className="h-12 mx-auto" />
          <p className="text-sm text-[#9A8A7C]">Choisissez votre événement pour commander</p>
        </div>

        <div className="grid gap-4">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onSelect(event)}
              className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-5 text-left hover:border-[#8B3A43] transition-all group"
            >
              <div className="flex gap-4">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                ) : (
                  <div className="w-20 h-20 bg-[#E5B7B3]/20 rounded-xl shrink-0 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-[#8B3A43]/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[#392D31] group-hover:text-[#8B3A43] transition-colors">{event.name}</h3>
                  <p className="text-sm text-[#9A8A7C] mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(event.start_date + 'T00:00:00'), 'd MMM', { locale: fr })} — {format(new Date(event.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}
                  </p>
                  {event.description && (
                    <p className="text-xs text-[#C4B5A8] mt-1 line-clamp-2">{event.description}</p>
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
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', stand: '', phone: '', email: '',
    delivery_method: 'livraison',
    company_name: '',
    billing_address: '',
    billing_postal_code: '',
    billing_city: '',
  });
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [slotGuests, setSlotGuests] = useState({});
  const [expandedDays, setExpandedDays] = useState({});

  const { data: activeEvents = [], isLoading: eventsLoading } = useActiveEvents();
  const createOrder = useCreateOrder();

  // Auto-select if only one active event
  const effectiveEvent = activeEvents.length === 1 ? activeEvents[0] : selectedEvent;
  const eventId = effectiveEvent?.id;
  const { data: allMealSlots = [] } = useMealSlots(eventId);
  const { data: slotCounts = {} } = useSlotMenuCounts(eventId);
  const { data: menuItems = [] } = useEventMenuItems(eventId);
  const showPicker = !effectiveEvent && activeEvents.length > 1;

  // Filter slots by event meal_service (midi/soir/both)
  const ev = effectiveEvent;
  const mealSlots = useMemo(() => {
    if (!ev?.meal_service || ev.meal_service === 'both') return allMealSlots;
    return allMealSlots.filter((s) => s.slot_type === ev.meal_service);
  }, [allMealSlots, ev?.meal_service]);

  // Filter menu items by event menu_categories
  const categories = ev?.menu_categories || ['entree', 'plat', 'dessert', 'boisson'];
  const entrees = categories.includes('entree') ? menuItems.filter((i) => i.type === 'entree') : [];
  const plats = categories.includes('plat') ? menuItems.filter((i) => i.type === 'plat') : [];
  const desserts = categories.includes('dessert') ? menuItems.filter((i) => i.type === 'dessert') : [];
  const boissons = categories.includes('boisson') ? menuItems.filter((i) => i.type === 'boisson') : [];

  const handleToggleSlot = useCallback((slotId) => {
    setSelectedSlotIds((prev) => {
      if (prev.includes(slotId)) {
        setSlotGuests((current) => {
          const { [slotId]: removed, ...rest } = current;
          return rest;
        });
        return prev.filter((id) => id !== slotId);
      }
      return [...prev, slotId];
    });
  }, []);

  const handleAddGuest = useCallback((slotId) => {
    setSlotGuests((prev) => ({
      ...prev,
      [slotId]: [{ name: '', entree: null, plat: null, dessert: null, boisson: null }, ...(prev[slotId] || [])],
    }));
  }, []);

  const handleRemoveGuest = useCallback((slotId, guestIndex) => {
    setSlotGuests((prev) => ({
      ...prev,
      [slotId]: (prev[slotId] || []).filter((_, i) => i !== guestIndex),
    }));
  }, []);

  const handleGuestNameChange = useCallback((slotId, guestIndex, name) => {
    setSlotGuests((prev) => {
      const guests = [...(prev[slotId] || [])];
      guests[guestIndex] = { ...guests[guestIndex], name };
      return { ...prev, [slotId]: guests };
    });
  }, []);

  const handleGuestMenuSelection = useCallback((slotId, guestIndex, type, itemId) => {
    setSlotGuests((prev) => {
      const guests = [...(prev[slotId] || [])];
      guests[guestIndex] = { ...guests[guestIndex], [type]: itemId };
      return { ...prev, [slotId]: guests };
    });
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
    if (!ev) return 0;
    let total = 0;
    selectedSlotIds.forEach((slotId) => {
      const slot = mealSlots.find((s) => s.id === slotId);
      const price = slot?.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);
      const guests = slotGuests[slotId] || [];
      total += guests.length * price;
    });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalAmount = calculateTotal();

    const orderLines = [];
    selectedSlotIds.forEach((slotId) => {
      const slot = mealSlots.find((s) => s.id === slotId);
      const menuPrice = slot?.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);
      const guests = slotGuests[slotId] || [];

      guests.forEach((guest) => {
        ['entree', 'plat', 'dessert', 'boisson'].forEach((type) => {
          if (guest[type]) {
            orderLines.push({
              meal_slot_id: slotId,
              menu_item_id: guest[type],
              quantity: 1,
              unit_price: 0,
              guest_name: guest.name.trim(),
              menu_unit_price: menuPrice,
            });
          }
        });
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
          delivery_method: formData.delivery_method,
          company_name: formData.company_name || null,
          billing_address: formData.billing_address,
          billing_postal_code: formData.billing_postal_code,
          billing_city: formData.billing_city,
        },
        orderLines,
      });

      // Create Stripe Checkout session and redirect to payment
      try {
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          'create-checkout-session',
          { body: { orderId: result.order.id } }
        );

        if (stripeError) throw stripeError;
        if (stripeData?.url) {
          window.location.href = stripeData.url;
          return;
        }
      } catch (stripeErr) {
        console.warn('Stripe checkout unavailable, redirecting to success page:', stripeErr);
      }

      // Fallback: redirect to success page if Stripe is not configured
      navigate(`/order/success/${result.order.id}`);
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert('Erreur lors de la commande. Veuillez réessayer.');
    }
  };

  // Loading
  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-[#F0F0E6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B3A43]" />
      </div>
    );
  }

  // No active events
  if (activeEvents.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F0E6] flex items-center justify-center p-4">
        <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-8 max-w-md text-center">
          <p className="text-[#9A8A7C]">Aucun événement actif pour le moment.</p>
          <Link to="/" className="text-sm text-[#8B3A43] hover:underline mt-4 inline-block">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  // Event picker (multiple active events)
  if (showPicker) {
    return <EventPicker events={activeEvents} onSelect={setSelectedEvent} />;
  }

  const total = calculateTotal();
  const isFormValid =
    formData.first_name && formData.last_name && formData.stand && formData.phone && formData.email &&
    formData.billing_address && formData.billing_postal_code && formData.billing_city &&
    selectedSlotIds.length > 0 &&
    selectedSlotIds.every((slotId) => {
      const guests = slotGuests[slotId] || [];
      return guests.length > 0 && guests.every((g) =>
        g.name.trim() &&
        (entrees.length === 0 || g.entree) &&
        (plats.length === 0 || g.plat) &&
        (desserts.length === 0 || g.dessert) &&
        (boissons.length === 0 || g.boisson)
      );
    });

  const slotLabels = { midi: 'Midi', soir: 'Soir' };

  return (
    <div className="bg-[#F0F0E6] px-3 py-4 sm:px-4 sm:py-8 min-h-screen">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link to="/login" className="px-4 py-1.5 text-xs font-medium bg-[#FDFAF7] border border-[#E5D9D0] rounded-full hover:border-[#8B3A43] transition-all uppercase tracking-wider">
          Connexion
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Event hero with image */}
        <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] overflow-hidden">
          {ev.image_url && (
            <img src={ev.image_url} alt={ev.name} className="w-full h-40 object-cover" />
          )}
          <div className="p-6 text-center">
            {activeEvents.length > 1 && (
              <button onClick={() => setSelectedEvent(null)}
                className="inline-flex items-center gap-1 text-xs text-[#8B3A43] hover:underline mb-3">
                <ArrowLeft className="w-3 h-3" /> Changer d'événement
              </button>
            )}
            <h1 className="text-2xl font-semibold text-[#392D31] mb-1" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>{ev.name}</h1>
            <p className="text-sm text-[#9A8A7C]">
              {format(new Date(ev.start_date + 'T00:00:00'), 'd MMM', { locale: fr })} — {format(new Date(ev.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}
            </p>
            {ev.description && <p className="text-xs text-[#C4B5A8] mt-2">{ev.description}</p>}
            <div className="flex justify-center gap-4 mt-3">
              {Number(ev.menu_price_midi) > 0 && (
                <span className="text-sm font-medium text-[#8B3A43] bg-[#8B3A43]/10 px-3 py-1 rounded-full">
                  Menu midi : {Number(ev.menu_price_midi).toFixed(2)}€
                </span>
              )}
              {Number(ev.menu_price_soir) > 0 && (
                <span className="text-sm font-medium text-[#968A42] bg-[#968A42]/10 px-3 py-1 rounded-full">
                  Menu soir : {Number(ev.menu_price_soir).toFixed(2)}€
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Order form */}
        <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery method */}
            <div>
              <h2 className="text-lg text-[#8B3A43] mb-3" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>Mode de retrait</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'retrait', label: 'Retrait', desc: 'Je viens chercher ma commande' },
                  { value: 'livraison', label: 'Livraison', desc: 'Livraison sur mon stand' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, delivery_method: option.value })}
                    className={`p-4 rounded-2xl border-[1.5px] text-left transition-all ${
                      formData.delivery_method === option.value
                        ? 'border-[#8B3A43] bg-[#E5B7B3]/15'
                        : 'border-[#E5D9D0] hover:border-[#BF646D]/40'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${
                      formData.delivery_method === option.value ? 'text-[#8B3A43]' : 'text-[#392D31]'
                    }`}>{option.label}</p>
                    <p className="text-xs text-[#9A8A7C] mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <h2 className="text-lg text-[#8B3A43]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>Informations de facturation</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { id: 'first_name', label: 'Prénom', type: 'text' },
                { id: 'last_name', label: 'Nom', type: 'text' },
                { id: 'stand', label: 'Stand', type: 'text' },
                { id: 'phone', label: 'Téléphone', type: 'tel' },
              ].map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label htmlFor={field.id} className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[#8B3A43]">{field.label} *</label>
                  <input id={field.id} type={field.type} required value={formData[field.id]}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#E5D9D0] rounded-full text-sm text-[#392D31] placeholder-[#C4B5A8] focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent bg-white" />
                </div>
              ))}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="email" className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[#8B3A43]">Email *</label>
                <input id="email" type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5D9D0] rounded-full text-sm text-[#392D31] placeholder-[#C4B5A8] focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent bg-white" />
              </div>
            </div>

            {/* Billing address */}
            <div className="pt-4 border-t border-[#E5D9D0]">
              <h2 className="text-lg text-[#8B3A43] mb-3" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>Adresse de facturation</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="company_name" className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[#8B3A43]">Nom de l'entreprise</label>
                  <input id="company_name" type="text" value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#E5D9D0] rounded-full text-sm text-[#392D31] placeholder-[#C4B5A8] focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent bg-white" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="billing_address" className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[#8B3A43]">Adresse *</label>
                  <input id="billing_address" type="text" required value={formData.billing_address}
                    onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#E5D9D0] rounded-full text-sm text-[#392D31] placeholder-[#C4B5A8] focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="billing_postal_code" className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[#8B3A43]">Code postal *</label>
                  <input id="billing_postal_code" type="text" required value={formData.billing_postal_code}
                    onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#E5D9D0] rounded-full text-sm text-[#392D31] placeholder-[#C4B5A8] focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="billing_city" className="block text-[11px] uppercase tracking-[0.12em] font-medium text-[#8B3A43]">Ville *</label>
                  <input id="billing_city" type="text" required value={formData.billing_city}
                    onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#E5D9D0] rounded-full text-sm text-[#392D31] placeholder-[#C4B5A8] focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent bg-white" />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <SlotSelector slots={mealSlots} selectedSlotIds={selectedSlotIds} onToggleSlot={handleToggleSlotWithExpand} slotCounts={slotCounts} />
            </div>

            {selectedSlotsByDate.length > 0 && (
              <div className="space-y-3">
                {selectedSlotsByDate.map(({ date, slots }) => {
                  const isExpanded = expandedDays[date] !== false;
                  const dayMenuCount = slots.reduce((count, slot) => {
                    return count + (slotGuests[slot.id]?.length || 0);
                  }, 0);

                  return (
                    <div key={date} className="border border-[#E5D9D0] rounded-2xl overflow-hidden">
                      <button type="button" onClick={() => toggleDay(date)}
                        className="w-full flex items-center justify-between p-4 bg-[#F0F0E6] hover:bg-[#E5D9D0]/30 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-medium text-[#392D31] capitalize">
                            {format(new Date(date + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })}
                          </span>
                          {dayMenuCount > 0 && (
                            <span className="text-xs bg-[#8B3A43]/10 text-[#8B3A43] px-2 py-0.5 rounded-full">
                              {dayMenuCount} menu{dayMenuCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-5 h-5 text-[#C4B5A8] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="p-4 space-y-6 bg-[#FDFAF7]">
                          {slots.map((slot) => {
                            const guests = slotGuests[slot.id] || [];
                            const menuPrice = slot.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);

                            return (
                              <div key={slot.id} className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <p className="text-[11px] font-semibold text-[#8B3A43] uppercase tracking-[0.12em]">
                                      {slotLabels[slot.slot_type]}
                                    </p>
                                    <span className="text-xs text-[#9A8A7C] bg-[#F0F0E6] px-2 py-0.5 rounded-full">
                                      {menuPrice.toFixed(2)}€ / menu
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddGuest(slot.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8B3A43] bg-[#8B3A43]/10 rounded-full hover:bg-[#8B3A43]/20 transition-colors uppercase tracking-wider"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Ajouter un menu
                                  </button>
                                </div>

                                {guests.length === 0 && (
                                  <p className="text-sm text-[#C4B5A8] text-center py-4 border-2 border-dashed border-[#E5D9D0] rounded-2xl">
                                    Ajoutez au moins un menu pour ce créneau
                                  </p>
                                )}

                                {guests.map((guest, guestIndex) => (
                                  <div key={guestIndex} className="border border-[#E5D9D0] rounded-2xl p-4 space-y-4 bg-[#F0F0E6]/50">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 flex-1">
                                        <User className="w-4 h-4 text-[#C4B5A8] shrink-0" />
                                        <input
                                          type="text"
                                          placeholder="Prénom du convive *"
                                          value={guest.name}
                                          onChange={(e) => handleGuestNameChange(slot.id, guestIndex, e.target.value)}
                                          className="flex-1 px-4 py-2 border border-[#E5D9D0] rounded-full text-sm text-[#392D31] placeholder-[#C4B5A8] focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent bg-white"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveGuest(slot.id, guestIndex)}
                                        className="p-1.5 text-[#BF646D] hover:text-[#8B3A43] hover:bg-[#E5B7B3]/20 rounded-full transition-colors"
                                        title="Supprimer ce menu"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {entrees.length > 0 && (
                                      <MenuSelector
                                        type="entree"
                                        items={entrees}
                                        selectedId={guest.entree}
                                        onSelect={(id) => handleGuestMenuSelection(slot.id, guestIndex, 'entree', id)}
                                        required
                                      />
                                    )}
                                    {plats.length > 0 && (
                                      <MenuSelector
                                        type="plat"
                                        items={plats}
                                        selectedId={guest.plat}
                                        onSelect={(id) => handleGuestMenuSelection(slot.id, guestIndex, 'plat', id)}
                                        required
                                      />
                                    )}
                                    {desserts.length > 0 && (
                                      <MenuSelector
                                        type="dessert"
                                        items={desserts}
                                        selectedId={guest.dessert}
                                        onSelect={(id) => handleGuestMenuSelection(slot.id, guestIndex, 'dessert', id)}
                                        required
                                      />
                                    )}
                                    {boissons.length > 0 && (
                                      <MenuSelector
                                        type="boisson"
                                        items={boissons}
                                        selectedId={guest.boisson}
                                        onSelect={(id) => handleGuestMenuSelection(slot.id, guestIndex, 'boisson', id)}
                                        required
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedSlotIds.length > 0 && (
              <div className="pt-4 border-t border-[#E5D9D0] flex justify-between items-center">
                <span className="text-sm text-[#9A8A7C]">
                  {selectedSlotIds.reduce((c, sid) => c + (slotGuests[sid]?.length || 0), 0)} menu(s) sur {selectedSlotIds.length} créneau{selectedSlotIds.length > 1 ? 'x' : ''}
                </span>
                <span className="text-2xl text-[#8B3A43]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>{total.toFixed(2)}€</span>
              </div>
            )}

            <button type="submit" disabled={!isFormValid || createOrder.isPending}
              className="w-full py-3.5 bg-[#8B3A43] text-[#F0F0E6] font-medium rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 uppercase tracking-[0.12em] text-[13px]">
              {createOrder.isPending ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Traitement en cours...</>
              ) : (
                <>Valider la commande et passer au paiement {total > 0 ? `— ${total.toFixed(2)}€` : ''}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
