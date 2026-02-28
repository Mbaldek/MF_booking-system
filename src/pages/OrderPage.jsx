import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActiveEvents } from '@/hooks/useEvents';
import { useMealSlots, useSlotMenuCounts } from '@/hooks/useMealSlots';
import { useEventMenuItems } from '@/hooks/useMenuItems';
import { useCreateOrder } from '@/hooks/useOrders';
import { supabase } from '@/api/supabase';
import MenuSelector from '@/components/order/MenuSelector';
import MfButton from '@/components/ui/MfButton';
import MfInput from '@/components/ui/MfInput';
import MfCard from '@/components/ui/MfCard';
import MfStepIndicator from '@/components/ui/MfStepIndicator';
import MfBadge from '@/components/ui/MfBadge';

/* ═══════════════════════════════════════════════════════
   OrderPage — Tunnel de commande 4 étapes
   ═══════════════════════════════════════════════════════ */

export default function OrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', stand: '', phone: '', email: '',
    delivery_method: 'livraison',
    company_name: '', billing_address: '', billing_postal_code: '', billing_city: '',
  });
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [slotGuests, setSlotGuests] = useState({});
  const [rgpdConsent, setRgpdConsent] = useState(false);

  // Data hooks
  const { data: activeEvents = [], isLoading: eventsLoading } = useActiveEvents();
  const createOrder = useCreateOrder();

  const ev = activeEvents.length > 0 ? activeEvents[0] : null;
  const eventId = ev?.id;
  const { data: allMealSlots = [] } = useMealSlots(eventId);
  const { data: slotCounts = {} } = useSlotMenuCounts(eventId);
  const { data: menuItems = [] } = useEventMenuItems(eventId);

  const mealSlots = useMemo(() => {
    if (!ev?.meal_service || ev.meal_service === 'both') return allMealSlots;
    return allMealSlots.filter((s) => s.slot_type === ev.meal_service);
  }, [allMealSlots, ev?.meal_service]);

  const categories = ev?.menu_categories || ['entree', 'plat', 'dessert', 'boisson'];
  const entrees = categories.includes('entree') ? menuItems.filter((i) => i.type === 'entree') : [];
  const plats = categories.includes('plat') ? menuItems.filter((i) => i.type === 'plat') : [];
  const desserts = categories.includes('dessert') ? menuItems.filter((i) => i.type === 'dessert') : [];
  const boissons = categories.includes('boisson') ? menuItems.filter((i) => i.type === 'boisson') : [];

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const groups = {};
    mealSlots.forEach((slot) => {
      if (!groups[slot.slot_date]) groups[slot.slot_date] = [];
      groups[slot.slot_date].push(slot);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [mealSlots]);

  // Handlers
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

  const calculateTotal = () => {
    if (!ev) return 0;
    let total = 0;
    selectedSlotIds.forEach((slotId) => {
      const slot = mealSlots.find((s) => s.id === slotId);
      const price = slot?.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);
      total += (slotGuests[slotId]?.length || 0) * price;
    });
    return total;
  };

  const total = calculateTotal();
  const mealCount = selectedSlotIds.reduce((c, sid) => c + (slotGuests[sid]?.length || 0), 0);

  // Validation per step
  const isStep0Valid = formData.first_name && formData.last_name && formData.stand && formData.phone && formData.email;

  const isStep1Valid = selectedSlotIds.length > 0 && selectedSlotIds.every((slotId) => {
    const guests = slotGuests[slotId] || [];
    return guests.length > 0;
  });

  const isStep2Valid = selectedSlotIds.every((slotId) => {
    const guests = slotGuests[slotId] || [];
    return guests.length > 0 && guests.every((g) =>
      g.name.trim() &&
      (entrees.length === 0 || g.entree) &&
      (plats.length === 0 || g.plat) &&
      (desserts.length === 0 || g.dessert) &&
      (boissons.length === 0 || g.boisson)
    );
  });

  const isStep3Valid = formData.billing_address && formData.billing_postal_code && formData.billing_city && rgpdConsent;

  // Submit
  const handleSubmit = async () => {
    const totalAmount = calculateTotal();
    const orderLines = [];
    selectedSlotIds.forEach((slotId) => {
      const slot = mealSlots.find((s) => s.id === slotId);
      const menuPrice = slot?.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);
      (slotGuests[slotId] || []).forEach((guest) => {
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

      try {
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          'create-checkout-session',
          { body: { orderId: result.order.id } }
        );
        if (stripeError) throw stripeError;
        if (stripeData?.url) { window.location.href = stripeData.url; return; }
      } catch (stripeErr) {
        console.warn('Stripe checkout unavailable:', stripeErr);
      }
      navigate(`/order/success/${result.order.id}`);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la commande. Veuillez réessayer.');
    }
  };

  // Selected slots grouped by date
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
      .map(([date, slots]) => ({ date, slots: slots.sort((a, b) => (a.slot_type === 'midi' ? -1 : 1)) }));
  }, [selectedSlotIds, mealSlots]);

  // Active menu day tab
  const [activeMenuDay, setActiveMenuDay] = useState(null);
  const menuDay = activeMenuDay || (selectedSlotsByDate.length > 0 ? selectedSlotsByDate[0].date : null);

  const slotLabels = { midi: 'Midi', soir: 'Soir' };

  /* ─── Loading ─── */
  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center p-4">
        <MfCard className="max-w-md w-full text-center">
          <p className="font-body text-mf-muted">Aucun événement actif.</p>
          <Link to="/" className="font-body text-sm text-mf-rose hover:underline mt-4 inline-block">
            Retour à l'accueil
          </Link>
        </MfCard>
      </div>
    );
  }

  const eventDates = `${format(new Date(ev.start_date + 'T00:00:00'), 'd', { locale: fr })} – ${format(new Date(ev.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}`;

  return (
    <div className={`min-h-screen bg-mf-blanc-casse ${step === 2 ? 'pb-[120px]' : 'pb-10'}`}>

      {/* ─── HEADER ─── */}
      <header className="text-center bg-white border-b border-mf-border pt-9 pb-5 px-6">
        <div className="text-[24px] leading-none text-mf-poudre opacity-50 mb-2">❋</div>
        <p className="font-body text-[11px] uppercase tracking-[0.3em] text-mf-vieux-rose mb-0.5">Maison</p>
        <h1 className="font-serif text-[34px] font-normal italic text-mf-rose leading-tight">
          Félicien
        </h1>
        <p className="font-body text-[13px] text-mf-muted mt-2">{ev.name} · {eventDates}</p>
      </header>

      {/* ─── STEP INDICATOR ─── */}
      <div className="max-w-[520px] mx-auto px-5 pt-6 pb-4">
        <MfStepIndicator steps={['Infos', 'Jours', 'Menus', 'Récap']} current={step} />
      </div>

      <div className="max-w-[520px] mx-auto px-5">

        {/* ═══ STEP 0: CLIENT INFO ═══ */}
        {step === 0 && (
          <MfCard>
            <h2 className="font-serif text-[22px] font-normal italic text-mf-rose mb-6">
              Vos coordonnées
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <MfInput label="Prénom" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="Jean" />
                <MfInput label="Nom" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Dupont" />
              </div>
              <MfInput label="Stand" value={formData.stand} onChange={(e) => setFormData({ ...formData, stand: e.target.value })} placeholder="A-42" />
              <MfInput label="Téléphone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="06 12 34 56 78" />
              <MfInput label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jean@entreprise.com" />

              {/* Delivery method */}
              <div className="pt-2">
                <label className="font-body text-[10px] uppercase tracking-[0.12em] text-mf-rose block mb-2 pl-1">
                  Mode de retrait
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'retrait', label: 'Retrait', desc: 'Je viens chercher' },
                    { value: 'livraison', label: 'Livraison', desc: 'Sur mon stand' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_method: opt.value })}
                      className={`p-3 rounded-card text-left transition-all duration-200 border-[1.5px] cursor-pointer ${
                        formData.delivery_method === opt.value
                          ? 'border-mf-rose bg-mf-poudre/15'
                          : 'border-mf-border bg-white'
                      }`}
                    >
                      <p className={`font-body text-sm font-medium ${formData.delivery_method === opt.value ? 'text-mf-rose' : 'text-mf-marron-glace'}`}>
                        {opt.label}
                      </p>
                      <p className="font-body text-xs text-mf-muted mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <MfButton fullWidth disabled={!isStep0Valid} onClick={() => setStep(1)} className="mt-6">
              Continuer →
            </MfButton>
          </MfCard>
        )}

        {/* ═══ STEP 1: SELECT SLOTS + GUESTS ═══ */}
        {step === 1 && (
          <MfCard>
            <h2 className="font-serif text-[22px] font-normal italic text-mf-rose mb-2">
              Vos jours de repas
            </h2>
            <p className="font-body text-[13px] text-mf-muted leading-normal mb-5">
              Sélectionnez vos créneaux, puis ajoutez un menu par convive.
            </p>

            <div className="space-y-4">
              {slotsByDate.map(([date, slots]) => {
                const dayName = format(new Date(date + 'T00:00:00'), 'EEEE', { locale: fr });
                const dayDate = format(new Date(date + 'T00:00:00'), 'd MMM', { locale: fr });

                return (
                  <div key={date}>
                    <p className="font-body text-sm font-medium capitalize text-mf-marron-glace mb-2">
                      {dayName} {dayDate}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedSlotIds.includes(slot.id);
                        const count = slotCounts[slot.id] || 0;
                        const isFull = slot.max_orders != null && count >= slot.max_orders;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => handleToggleSlot(slot.id)}
                            disabled={isFull && !isSelected}
                            className={`flex flex-col items-center gap-0.5 rounded-pill border-[1.5px] px-5 py-2.5 min-w-[90px] transition-all duration-300 font-body cursor-pointer ${
                              isFull && !isSelected
                                ? 'bg-mf-blanc-casse border-mf-border text-mf-muted-light opacity-60 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-mf-rose border-mf-rose text-mf-blanc-casse'
                                  : 'bg-white border-mf-border text-mf-marron-glace'
                            }`}
                          >
                            <span className="text-[13px] font-medium">{slotLabels[slot.slot_type]}</span>
                            <span className="text-[11px] opacity-70">
                              {isFull ? 'Complet' : slot.max_orders != null ? `${slot.max_orders - count} pl.` : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Guest management for selected slots of this date */}
                    {slots.filter((s) => selectedSlotIds.includes(s.id)).map((slot) => {
                      const guests = slotGuests[slot.id] || [];
                      const menuPrice = slot.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);
                      return (
                        <div key={`g-${slot.id}`} className="mt-3 ml-2 pl-3 border-l-2 border-mf-poudre">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-body text-[11px] uppercase tracking-wider font-medium text-mf-rose">
                              {slotLabels[slot.slot_type]} — {menuPrice.toFixed(2)}€/menu
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddGuest(slot.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 font-body text-[11px] uppercase tracking-wider rounded-pill bg-mf-rose/10 text-mf-rose transition-colors cursor-pointer border-none"
                            >
                              <Plus className="w-3 h-3" /> Convive
                            </button>
                          </div>
                          {guests.length === 0 && (
                            <p className="font-body text-sm py-3 text-center border-2 border-dashed border-mf-border rounded-card text-mf-muted-light">
                              Ajoutez au moins un convive
                            </p>
                          )}
                          {guests.map((g, gi) => (
                            <div key={gi} className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 shrink-0 text-mf-muted-light" />
                              <input
                                type="text"
                                placeholder="Prénom du convive"
                                value={g.name}
                                onChange={(e) => handleGuestNameChange(slot.id, gi, e.target.value)}
                                className="flex-1 px-3 py-2 border border-mf-border rounded-pill text-sm font-body bg-white text-mf-marron-glace outline-none focus:border-mf-rose transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveGuest(slot.id, gi)}
                                className="p-1.5 rounded-full text-mf-vieux-rose transition-colors cursor-pointer bg-transparent border-none hover:text-mf-rose"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Nav buttons */}
            <div className="flex gap-3 mt-6">
              <MfButton variant="secondary" onClick={() => setStep(0)} className="flex-1">
                <ChevronLeft className="w-4 h-4 inline -mt-0.5 mr-1" /> Retour
              </MfButton>
              <MfButton
                disabled={!isStep1Valid}
                onClick={() => { setStep(2); setActiveMenuDay(selectedSlotsByDate[0]?.date || null); }}
                className="flex-[2]"
              >
                Choisir les menus <ChevronRight className="w-4 h-4 inline -mt-0.5 ml-1" />
              </MfButton>
            </div>
          </MfCard>
        )}

        {/* ═══ STEP 2: MENU SELECTION ═══ */}
        {step === 2 && (
          <div>
            {/* Day tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {selectedSlotsByDate.map(({ date }) => {
                const dayName = format(new Date(date + 'T00:00:00'), 'EEE d MMM', { locale: fr });
                const isActive = menuDay === date;
                const hasMenus = mealSlots.filter((s) => s.slot_date === date && selectedSlotIds.includes(s.id))
                  .some((s) => (slotGuests[s.id] || []).some((g) => g.entree || g.plat || g.dessert || g.boisson));
                return (
                  <button
                    key={date}
                    onClick={() => setActiveMenuDay(date)}
                    className={`whitespace-nowrap font-body text-[12px] px-4 py-2 rounded-pill flex items-center gap-1.5 transition-all duration-200 border-[1.5px] cursor-pointer ${
                      isActive
                        ? 'bg-mf-rose border-mf-rose text-mf-blanc-casse'
                        : hasMenus
                          ? 'bg-mf-poudre/30 border-mf-poudre text-mf-marron-glace'
                          : 'bg-white border-mf-border text-mf-marron-glace'
                    }`}
                  >
                    {hasMenus && !isActive && <span className="text-mf-vert-olive">✓</span>}
                    {dayName}
                  </button>
                );
              })}
            </div>

            {/* Menu card for active day */}
            {menuDay && (
              <MfCard className="p-5">
                {mealSlots
                  .filter((s) => s.slot_date === menuDay && selectedSlotIds.includes(s.id))
                  .sort((a, b) => (a.slot_type === 'midi' ? -1 : 1))
                  .map((slot) => {
                    const guests = slotGuests[slot.id] || [];
                    const menuPrice = slot.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);

                    return (
                      <div key={slot.id} className="mb-6 last:mb-0">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-serif text-[20px] font-normal italic text-mf-rose">
                            {format(new Date(menuDay + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })} — {slotLabels[slot.slot_type]}
                          </h3>
                          <MfBadge variant="poudre">
                            {menuPrice.toFixed(2)}€
                          </MfBadge>
                        </div>

                        {guests.map((guest, gi) => (
                          <div key={gi} className="mb-5 p-4 rounded-card bg-mf-blanc-casse/80 border border-mf-border">
                            <div className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4 text-mf-muted-light" />
                              <span className="font-body text-sm font-medium text-mf-marron-glace">
                                {guest.name || `Convive ${gi + 1}`}
                              </span>
                            </div>
                            {entrees.length > 0 && (
                              <MenuSelector type="entree" items={entrees} selectedId={guest.entree}
                                onSelect={(id) => handleGuestMenuSelection(slot.id, gi, 'entree', id)} required />
                            )}
                            {plats.length > 0 && (
                              <div className="mt-3">
                                <MenuSelector type="plat" items={plats} selectedId={guest.plat}
                                  onSelect={(id) => handleGuestMenuSelection(slot.id, gi, 'plat', id)} required />
                              </div>
                            )}
                            {desserts.length > 0 && (
                              <div className="mt-3">
                                <MenuSelector type="dessert" items={desserts} selectedId={guest.dessert}
                                  onSelect={(id) => handleGuestMenuSelection(slot.id, gi, 'dessert', id)} required />
                              </div>
                            )}
                            {boissons.length > 0 && (
                              <div className="mt-3">
                                <MenuSelector type="boisson" items={boissons} selectedId={guest.boisson}
                                  onSelect={(id) => handleGuestMenuSelection(slot.id, gi, 'boisson', id)} required />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}

                <MfButton variant="secondary" fullWidth onClick={() => setStep(1)} className="mt-2">
                  <ChevronLeft className="w-4 h-4 inline -mt-0.5 mr-1" /> Modifier les jours
                </MfButton>
              </MfCard>
            )}

            {/* Sticky footer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-between items-center bg-white border-t border-mf-border px-6 py-4 shadow-[0_-4px_20px_rgba(57,45,49,0.06)]">
              <div>
                <div className="font-body text-[12px] uppercase tracking-wider text-mf-muted">
                  {mealCount} repas sélectionné{mealCount > 1 ? 's' : ''}
                </div>
                <div className="font-serif text-[24px] italic text-mf-rose">
                  {total.toFixed(2)} €
                </div>
              </div>
              <MfButton disabled={!isStep2Valid} onClick={() => setStep(3)}>
                Récapitulatif <ChevronRight className="w-4 h-4 inline -mt-0.5 ml-1" />
              </MfButton>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: RECAP + BILLING ═══ */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Billing */}
            <MfCard>
              <h2 className="font-serif text-[22px] font-normal italic text-mf-rose mb-5">
                Facturation
              </h2>
              <div className="flex flex-col gap-4">
                <MfInput label="Entreprise (optionnel)" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} placeholder="Ma Société SAS" />
                <MfInput label="Adresse *" value={formData.billing_address} onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })} placeholder="12 rue de la Paix" />
                <div className="grid grid-cols-2 gap-3">
                  <MfInput label="Code postal *" value={formData.billing_postal_code} onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })} placeholder="75001" />
                  <MfInput label="Ville *" value={formData.billing_city} onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })} placeholder="Paris" />
                </div>
              </div>
            </MfCard>

            {/* Order summary */}
            <MfCard>
              <h2 className="font-serif text-[22px] font-normal italic text-mf-rose mb-5">
                Récapitulatif
              </h2>

              <div className="font-body text-sm text-mf-muted mb-4 space-y-1">
                <p>{formData.first_name} {formData.last_name} — Stand {formData.stand}</p>
                <p>{formData.email} · {formData.phone}</p>
                <p className="text-[11px] uppercase tracking-wider mt-1 text-mf-vert-olive">
                  {formData.delivery_method === 'retrait' ? 'Retrait sur place' : 'Livraison au stand'}
                </p>
              </div>

              <div className="space-y-3">
                {selectedSlotsByDate.map(({ date, slots }) => (
                  <div key={date}>
                    {slots.map((slot) => {
                      const guests = slotGuests[slot.id] || [];
                      const menuPrice = slot.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);
                      return guests.map((guest, gi) => (
                        <div key={`${slot.id}-${gi}`} className="rounded-xl p-3 mb-2 bg-mf-blanc-casse border border-mf-border">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-body text-[11px] uppercase tracking-wider font-medium text-mf-rose">
                              {format(new Date(date + 'T00:00:00'), 'EEE d MMM', { locale: fr })} · {slotLabels[slot.slot_type]}
                            </span>
                            <span className="font-body text-xs font-medium text-mf-muted">{menuPrice.toFixed(2)}€</span>
                          </div>
                          <p className="font-body text-sm font-medium text-mf-marron-glace">{guest.name || `Convive ${gi + 1}`}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {['entree', 'plat', 'dessert', 'boisson'].map((type) => {
                              if (!guest[type]) return null;
                              const allItems = [...entrees, ...plats, ...desserts, ...boissons];
                              const item = allItems.find((i) => i.id === guest[type]);
                              return item ? (
                                <span key={type} className="font-body text-xs px-2 py-0.5 rounded-pill bg-mf-poudre/30 text-mf-marron-glace">
                                  {item.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ));
                    })}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-mf-rose">
                <span className="font-body text-[13px] uppercase tracking-[0.1em] text-mf-rose font-medium">Total</span>
                <span className="font-serif text-[28px] italic text-mf-rose">
                  {total.toFixed(2)}€
                </span>
              </div>
            </MfCard>

            {/* RGPD consent */}
            <MfCard className="p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rgpdConsent}
                  onChange={(e) => setRgpdConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-mf-rose shrink-0"
                />
                <span className="font-body text-[13px] leading-relaxed text-mf-marron-glace">
                  J'accepte que mes données soient utilisées pour le traitement de ma commande
                  et la communication liée à cet événement.
                  <span className="block text-[11px] mt-1 text-mf-muted">
                    Conformément au RGPD, vos données ne seront pas transmises à des tiers.
                  </span>
                </span>
              </label>
            </MfCard>

            {/* Action buttons */}
            <div className="flex gap-3">
              <MfButton variant="secondary" onClick={() => setStep(2)} className="flex-1">
                <ChevronLeft className="w-4 h-4 inline -mt-0.5 mr-1" /> Menus
              </MfButton>
              <MfButton
                disabled={!isStep3Valid || createOrder.isPending}
                onClick={handleSubmit}
                className={`flex-[2] flex items-center justify-center gap-2 ${createOrder.isPending ? 'opacity-70' : ''}`}
              >
                {createOrder.isPending ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> En cours...</>
                ) : (
                  'Valider et payer →'
                )}
              </MfButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
