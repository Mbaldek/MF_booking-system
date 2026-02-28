import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, User, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useActiveEvents } from '@/hooks/useEvents';
import { useMealSlots, useSlotMenuCounts } from '@/hooks/useMealSlots';
import { useEventMenuItems } from '@/hooks/useMenuItems';
import { useCreateOrder } from '@/hooks/useOrders';
import { supabase } from '@/api/supabase';
import MenuSelector from '@/components/order/MenuSelector';

/* ─── DESIGN TOKENS ─── */
const MF = {
  rose: '#8B3A43', vr: '#BF646D', poudre: '#E5B7B3',
  olive: '#968A42', cream: '#F0F0E6', dark: '#392D31',
  white: '#FDFAF7', border: '#E5D9D0', muted: '#9A8A7C', mutedLight: '#C4B5A8',
};

/* ─── STEP INDICATOR ─── */
function StepIndicator({ current, labels }) {
  return (
    <div className="flex items-center w-full px-1">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center" style={{ flex: i < labels.length - 1 ? 1 : 'none' }}>
          <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300"
              style={{
                background: i < current ? MF.rose : i === current ? MF.poudre : 'transparent',
                border: `1.5px solid ${i <= current ? MF.rose : MF.border}`,
                color: i < current ? MF.cream : i === current ? MF.rose : MF.vr,
              }}
            >
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className="mt-1.5 whitespace-nowrap"
              style={{
                fontFamily: "'Questrial', sans-serif",
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: i <= current ? MF.rose : MF.mutedLight,
                fontWeight: i === current ? 600 : 400,
              }}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className="flex-1 h-px mx-1 transition-colors duration-300"
              style={{ background: i < current ? MF.rose : MF.border, marginBottom: 22 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── PILL INPUT ─── */
function MFInput({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: MF.rose }}>
        {label}
      </label>
      <input
        {...props}
        className="px-4 py-3 border rounded-full text-[15px] bg-white outline-none transition-colors"
        style={{ borderColor: MF.border, color: MF.dark, fontFamily: "'Questrial', sans-serif" }}
        onFocus={(e) => (e.target.style.borderColor = MF.rose)}
        onBlur={(e) => (e.target.style.borderColor = MF.border)}
      />
    </div>
  );
}

/* ─── DAY CHIP ─── */
function DayChip({ dayName, date, slotType, selected, full, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={full && !selected}
      className="flex flex-col items-center gap-0.5 transition-all duration-300"
      style={{
        fontFamily: "'Questrial', sans-serif",
        padding: '10px 20px',
        borderRadius: 50,
        border: `1.5px solid ${selected ? MF.rose : MF.border}`,
        background: full && !selected ? MF.cream : selected ? MF.rose : 'white',
        color: selected ? MF.cream : full ? MF.mutedLight : MF.dark,
        cursor: full && !selected ? 'not-allowed' : 'pointer',
        opacity: full && !selected ? 0.6 : 1,
        minWidth: 90,
      }}
    >
      <span className="text-[13px] font-medium">{dayName}</span>
      <span className="text-[11px] opacity-70">{date}</span>
      {slotType && <span className="text-[10px] opacity-60">{slotType}</span>}
    </button>
  );
}

/* ─── SLOT TOGGLE ─── */
function SlotToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-full overflow-hidden" style={{ border: `1px solid ${MF.border}`, background: 'white' }}>
      {['midi', 'soir'].map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className="transition-all duration-300"
          style={{
            fontFamily: "'Questrial', sans-serif",
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '8px 22px',
            border: 'none',
            background: value === slot ? MF.rose : 'transparent',
            color: value === slot ? MF.cream : MF.vr,
            cursor: 'pointer',
          }}
        >
          {slot === 'midi' ? '☀ Midi' : '☽ Soir'}
        </button>
      ))}
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function OrderFunnelTest() {
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

  // Loading
  if (eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: MF.cream }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: MF.rose }} />
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: MF.cream }}>
        <div className="rounded-2xl border p-8 max-w-md text-center" style={{ background: MF.white, borderColor: MF.border }}>
          <p style={{ color: MF.muted }}>Aucun événement actif.</p>
          <Link to="/" className="text-sm hover:underline mt-4 inline-block" style={{ color: MF.rose }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const eventDates = `${format(new Date(ev.start_date + 'T00:00:00'), 'd', { locale: fr })} – ${format(new Date(ev.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}`;
  const slotLabels = { midi: 'Midi', soir: 'Soir' };

  return (
    <div className="min-h-screen" style={{ background: MF.cream, fontFamily: "'Questrial', sans-serif", paddingBottom: step === 2 ? 120 : 40 }}>

      {/* ─── HEADER ─── */}
      <header className="text-center border-b" style={{ padding: '36px 24px 20px', borderColor: MF.border, background: 'white' }}>
        <p className="text-[11px] uppercase tracking-[0.3em] mb-1" style={{ color: MF.vr }}>Maison</p>
        <h1 className="text-[38px] font-normal m-0 leading-tight" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', color: MF.rose }}>
          Félicien
        </h1>
        <p className="text-[13px] mt-2" style={{ color: MF.muted }}>{ev.name} · {eventDates}</p>
      </header>

      {/* ─── STEP INDICATOR ─── */}
      <div className="max-w-[520px] mx-auto px-5 pt-6 pb-4">
        <StepIndicator current={step} labels={['Infos', 'Jours', 'Menus', 'Récap']} />
      </div>

      <div className="max-w-[520px] mx-auto px-5">

        {/* ═══ STEP 0: CLIENT INFO ═══ */}
        {step === 0 && (
          <div className="rounded-[20px] border p-7" style={{ background: 'white', borderColor: MF.border }}>
            <h2 className="text-[22px] font-normal mb-6" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', color: MF.rose }}>
              Vos coordonnées
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <MFInput label="Prénom" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="Jean" />
                <MFInput label="Nom" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Dupont" />
              </div>
              <MFInput label="Stand" value={formData.stand} onChange={(e) => setFormData({ ...formData, stand: e.target.value })} placeholder="A-42" />
              <MFInput label="Téléphone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="06 12 34 56 78" />
              <MFInput label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jean@entreprise.com" />

              {/* Delivery method */}
              <div className="pt-2">
                <label className="text-[11px] uppercase tracking-[0.12em] font-medium mb-2 block" style={{ color: MF.rose }}>Mode de retrait</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'retrait', label: 'Retrait', desc: 'Je viens chercher' },
                    { value: 'livraison', label: 'Livraison', desc: 'Sur mon stand' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_method: opt.value })}
                      className="p-3 rounded-2xl text-left transition-all"
                      style={{
                        border: `1.5px solid ${formData.delivery_method === opt.value ? MF.rose : MF.border}`,
                        background: formData.delivery_method === opt.value ? `${MF.poudre}22` : 'white',
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: formData.delivery_method === opt.value ? MF.rose : MF.dark }}>{opt.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: MF.muted }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!isStep0Valid}
              className="w-full mt-6 py-3.5 rounded-full text-[13px] uppercase tracking-[0.12em] font-medium transition-all"
              style={{
                background: isStep0Valid ? MF.rose : MF.border,
                color: isStep0Valid ? MF.cream : MF.mutedLight,
                border: 'none',
                cursor: isStep0Valid ? 'pointer' : 'default',
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ═══ STEP 1: SELECT SLOTS + GUESTS ═══ */}
        {step === 1 && (
          <div className="rounded-[20px] border p-7" style={{ background: 'white', borderColor: MF.border }}>
            <h2 className="text-[22px] font-normal mb-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', color: MF.rose }}>
              Vos jours de repas
            </h2>
            <p className="text-[13px] mb-5" style={{ color: MF.muted, lineHeight: 1.5 }}>
              Sélectionnez vos créneaux, puis ajoutez un menu par convive.
            </p>

            {/* Slot chips by date */}
            <div className="space-y-4">
              {slotsByDate.map(([date, slots]) => {
                const dayName = format(new Date(date + 'T00:00:00'), 'EEEE', { locale: fr });
                const dayDate = format(new Date(date + 'T00:00:00'), 'd MMM', { locale: fr });

                return (
                  <div key={date}>
                    <p className="text-sm font-semibold capitalize mb-2" style={{ color: MF.dark }}>{dayName} {dayDate}</p>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => {
                        const isSelected = selectedSlotIds.includes(slot.id);
                        const count = slotCounts[slot.id] || 0;
                        const isFull = slot.max_orders != null && count >= slot.max_orders;
                        return (
                          <DayChip
                            key={slot.id}
                            dayName={slotLabels[slot.slot_type]}
                            date={isFull ? 'Complet' : slot.max_orders != null ? `${slot.max_orders - count} pl.` : ''}
                            selected={isSelected}
                            full={isFull}
                            onClick={() => handleToggleSlot(slot.id)}
                          />
                        );
                      })}
                    </div>

                    {/* Guest management for selected slots of this date */}
                    {slots.filter((s) => selectedSlotIds.includes(s.id)).map((slot) => {
                      const guests = slotGuests[slot.id] || [];
                      const menuPrice = slot.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);
                      return (
                        <div key={`g-${slot.id}`} className="mt-3 ml-2 pl-3 border-l-2" style={{ borderColor: MF.poudre }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: MF.rose }}>
                              {slotLabels[slot.slot_type]} — {menuPrice.toFixed(2)}€/menu
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddGuest(slot.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] uppercase tracking-wider rounded-full transition-colors"
                              style={{ background: `${MF.rose}15`, color: MF.rose }}
                            >
                              <Plus className="w-3 h-3" /> Convive
                            </button>
                          </div>
                          {guests.length === 0 && (
                            <p className="text-sm py-3 text-center border-2 border-dashed rounded-2xl" style={{ color: MF.mutedLight, borderColor: MF.border }}>
                              Ajoutez au moins un convive
                            </p>
                          )}
                          {guests.map((g, gi) => (
                            <div key={gi} className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 shrink-0" style={{ color: MF.mutedLight }} />
                              <input
                                type="text"
                                placeholder="Prénom du convive"
                                value={g.name}
                                onChange={(e) => handleGuestNameChange(slot.id, gi, e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-full text-sm bg-white outline-none"
                                style={{ borderColor: MF.border, color: MF.dark }}
                                onFocus={(e) => (e.target.style.borderColor = MF.rose)}
                                onBlur={(e) => (e.target.style.borderColor = MF.border)}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveGuest(slot.id, gi)}
                                className="p-1.5 rounded-full transition-colors"
                                style={{ color: MF.vr }}
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
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3.5 rounded-full text-[13px] uppercase tracking-[0.1em] transition-all"
                style={{ border: `1.5px solid ${MF.border}`, background: 'white', color: MF.dark, cursor: 'pointer' }}
              >
                <ChevronLeft className="w-4 h-4 inline -mt-0.5 mr-1" /> Retour
              </button>
              <button
                onClick={() => { setStep(2); setActiveMenuDay(selectedSlotsByDate[0]?.date || null); }}
                disabled={!isStep1Valid}
                className="flex-[2] py-3.5 rounded-full text-[13px] uppercase tracking-[0.12em] font-medium transition-all"
                style={{
                  background: isStep1Valid ? MF.rose : MF.border,
                  color: isStep1Valid ? MF.cream : MF.mutedLight,
                  border: 'none',
                  cursor: isStep1Valid ? 'pointer' : 'default',
                }}
              >
                Choisir les menus <ChevronRight className="w-4 h-4 inline -mt-0.5 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: MENU SELECTION ═══ */}
        {step === 2 && (
          <div>
            {/* Day tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {selectedSlotsByDate.map(({ date }) => {
                const idx = slotsByDate.findIndex(([d]) => d === date);
                const dayName = format(new Date(date + 'T00:00:00'), 'EEE d MMM', { locale: fr });
                const isActive = menuDay === date;
                const hasMenus = mealSlots.filter((s) => s.slot_date === date && selectedSlotIds.includes(s.id))
                  .some((s) => (slotGuests[s.id] || []).some((g) => g.entree || g.plat || g.dessert || g.boisson));
                return (
                  <button
                    key={date}
                    onClick={() => setActiveMenuDay(date)}
                    className="whitespace-nowrap text-[12px] px-4 py-2 rounded-full flex items-center gap-1.5 transition-all"
                    style={{
                      border: `1.5px solid ${isActive ? MF.rose : hasMenus ? MF.poudre : MF.border}`,
                      background: isActive ? MF.rose : hasMenus ? `${MF.poudre}44` : 'white',
                      color: isActive ? MF.cream : MF.dark,
                      cursor: 'pointer',
                    }}
                  >
                    {hasMenus && !isActive && <span style={{ color: MF.olive }}>✓</span>}
                    {dayName}
                  </button>
                );
              })}
            </div>

            {/* Menu card for active day */}
            {menuDay && (
              <div className="rounded-[20px] border p-5" style={{ background: 'white', borderColor: MF.border }}>
                {mealSlots
                  .filter((s) => s.slot_date === menuDay && selectedSlotIds.includes(s.id))
                  .sort((a, b) => (a.slot_type === 'midi' ? -1 : 1))
                  .map((slot) => {
                    const guests = slotGuests[slot.id] || [];
                    const menuPrice = slot.slot_type === 'soir' ? Number(ev.menu_price_soir) : Number(ev.menu_price_midi);

                    return (
                      <div key={slot.id} className="mb-6 last:mb-0">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[20px] font-normal m-0" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', color: MF.rose }}>
                            {format(new Date(menuDay + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })} — {slotLabels[slot.slot_type]}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: MF.cream, color: MF.muted }}>
                            {menuPrice.toFixed(2)}€
                          </span>
                        </div>

                        {guests.map((guest, gi) => (
                          <div key={gi} className="mb-5 p-4 rounded-2xl" style={{ background: `${MF.cream}80`, border: `1px solid ${MF.border}` }}>
                            <div className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4" style={{ color: MF.mutedLight }} />
                              <span className="text-sm font-medium" style={{ color: MF.dark }}>
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

                {/* Back button */}
                <button
                  onClick={() => setStep(1)}
                  className="py-3 rounded-full text-[13px] uppercase tracking-[0.1em] w-full mt-2 transition-all"
                  style={{ border: `1.5px solid ${MF.border}`, background: 'white', color: MF.dark, cursor: 'pointer' }}
                >
                  <ChevronLeft className="w-4 h-4 inline -mt-0.5 mr-1" /> Modifier les jours
                </button>
              </div>
            )}

            {/* Sticky footer */}
            <div
              className="fixed bottom-0 left-0 right-0 z-50 flex justify-between items-center"
              style={{ background: 'white', borderTop: `1px solid ${MF.border}`, padding: '16px 24px', boxShadow: '0 -4px 20px rgba(57,45,49,0.06)' }}
            >
              <div>
                <div className="text-[12px] uppercase tracking-wider" style={{ color: MF.muted }}>
                  {mealCount} repas sélectionné{mealCount > 1 ? 's' : ''}
                </div>
                <div className="text-[24px]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', color: MF.rose }}>
                  {total.toFixed(2)} €
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={!isStep2Valid}
                className="py-3.5 px-8 rounded-full text-[13px] uppercase tracking-[0.12em] font-medium transition-all"
                style={{
                  background: isStep2Valid ? MF.rose : MF.border,
                  color: isStep2Valid ? MF.cream : MF.mutedLight,
                  border: 'none',
                  cursor: isStep2Valid ? 'pointer' : 'default',
                }}
              >
                Récapitulatif <ChevronRight className="w-4 h-4 inline -mt-0.5 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: RECAP + BILLING ═══ */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Billing */}
            <div className="rounded-[20px] border p-7" style={{ background: 'white', borderColor: MF.border }}>
              <h2 className="text-[22px] font-normal mb-5" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', color: MF.rose }}>
                Facturation
              </h2>
              <div className="flex flex-col gap-4">
                <MFInput label="Entreprise (optionnel)" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} placeholder="Ma Société SAS" />
                <MFInput label="Adresse *" value={formData.billing_address} onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })} placeholder="12 rue de la Paix" />
                <div className="grid grid-cols-2 gap-3">
                  <MFInput label="Code postal *" value={formData.billing_postal_code} onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })} placeholder="75001" />
                  <MFInput label="Ville *" value={formData.billing_city} onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })} placeholder="Paris" />
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="rounded-[20px] border p-7" style={{ background: 'white', borderColor: MF.border }}>
              <h2 className="text-[22px] font-normal mb-5" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', color: MF.rose }}>
                Récapitulatif
              </h2>

              <div className="text-sm mb-4 space-y-1" style={{ color: MF.muted }}>
                <p>{formData.first_name} {formData.last_name} — Stand {formData.stand}</p>
                <p>{formData.email} · {formData.phone}</p>
                <p className="text-[11px] uppercase tracking-wider mt-1" style={{ color: MF.olive }}>
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
                        <div key={`${slot.id}-${gi}`} className="rounded-xl p-3 mb-2" style={{ background: MF.cream, border: `1px solid ${MF.border}` }}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: MF.rose }}>
                              {format(new Date(date + 'T00:00:00'), 'EEE d MMM', { locale: fr })} · {slotLabels[slot.slot_type]}
                            </span>
                            <span className="text-xs font-medium" style={{ color: MF.muted }}>{menuPrice.toFixed(2)}€</span>
                          </div>
                          <p className="text-sm font-medium" style={{ color: MF.dark }}>{guest.name || `Convive ${gi + 1}`}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {['entree', 'plat', 'dessert', 'boisson'].map((type) => {
                              if (!guest[type]) return null;
                              const allItems = [...entrees, ...plats, ...desserts, ...boissons];
                              const item = allItems.find((i) => i.id === guest[type]);
                              return item ? (
                                <span key={type} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${MF.poudre}30`, color: MF.dark }}>
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

              <div className="flex items-center justify-between pt-4 mt-4" style={{ borderTop: `1px solid ${MF.border}` }}>
                <span className="text-base font-semibold" style={{ color: MF.dark }}>Total</span>
                <span className="text-2xl" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', color: MF.rose }}>
                  {total.toFixed(2)}€
                </span>
              </div>
            </div>

            {/* RGPD consent */}
            <div className="rounded-[20px] border p-5" style={{ background: 'white', borderColor: MF.border }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rgpdConsent}
                  onChange={(e) => setRgpdConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#8B3A43] shrink-0"
                />
                <span className="text-[13px] leading-relaxed" style={{ color: MF.dark, fontFamily: "'Questrial', sans-serif" }}>
                  J'accepte que mes données soient utilisées pour le traitement de ma commande
                  et la communication liée à cet événement.
                  <span className="block text-[11px] mt-1" style={{ color: MF.muted }}>
                    Conformément au RGPD, vos données ne seront pas transmises à des tiers.
                  </span>
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-full text-[13px] uppercase tracking-[0.1em] transition-all"
                style={{ border: `1.5px solid ${MF.border}`, background: 'white', color: MF.dark, cursor: 'pointer' }}
              >
                <ChevronLeft className="w-4 h-4 inline -mt-0.5 mr-1" /> Menus
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isStep3Valid || createOrder.isPending}
                className="flex-[2] py-3.5 rounded-full text-[13px] uppercase tracking-[0.12em] font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: isStep3Valid ? MF.rose : MF.border,
                  color: isStep3Valid ? MF.cream : MF.mutedLight,
                  border: 'none',
                  cursor: isStep3Valid && !createOrder.isPending ? 'pointer' : 'default',
                  opacity: createOrder.isPending ? 0.7 : 1,
                }}
              >
                {createOrder.isPending ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> En cours...</>
                ) : (
                  'Valider et payer →'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
