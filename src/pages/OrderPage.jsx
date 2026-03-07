import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X } from 'lucide-react';
import { useActiveEvents } from '@/hooks/useEvents';
import { useMealSlots } from '@/hooks/useMealSlots';
import { useEventMenuItems } from '@/hooks/useMenuItems';
import { useCreateOrder } from '@/hooks/useOrders';
import { supabase } from '@/api/supabase';
import MfButton from '@/components/ui/MfButton';
import MfInput from '@/components/ui/MfInput';
import MfCard from '@/components/ui/MfCard';
import MfStepIndicator from '@/components/ui/MfStepIndicator';
import MfBlurModal from '@/components/ui/MfBlurModal';
import ClientHeader from '@/components/layout/ClientHeader';

/* ─── CollapsibleCategory ─── */
function CollapsibleCategory({ catKey, catLabel, catEmoji, items, selectedId, onSelect }) {
  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;
  const [open, setOpen] = useState(!selectedItem);
  const isOpen = !selectedItem || open;

  if (items.length === 0) return null;

  return (
    <div className={`mb-2 rounded-[14px] overflow-hidden border transition-colors ${
      selectedItem && !isOpen ? 'border-status-green/20' : 'border-mf-border'
    }`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => selectedItem && setOpen(!open)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-transparent border-none text-left ${
          selectedItem ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px]">{catEmoji}</span>
          <span className="font-body text-[10px] uppercase tracking-[0.1em] font-medium text-mf-rose">{catLabel}</span>
          {!selectedItem && <span className="font-body text-[9px] text-mf-muted">obligatoire</span>}
        </div>
        {selectedItem && !isOpen && (
          <div className="flex items-center gap-1.5">
            <span className="text-status-green text-[11px]">✓</span>
            <span className="font-body text-[12px] text-mf-marron-glace">{selectedItem.name}</span>
            <span className="font-body text-[10px] text-mf-vieux-rose">modifier</span>
          </div>
        )}
      </button>

      {/* Items list */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? items.length * 80 + 20 : 0 }}
      >
        <div className="px-3.5 pb-2.5 space-y-1.5">
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id);
                  setTimeout(() => setOpen(false), 280);
                }}
                className={`w-full text-left p-3 rounded-[12px] border-[1.5px] flex items-center gap-2.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-mf-rose bg-mf-poudre/15'
                    : 'border-mf-border bg-white'
                }`}
              >
                {/* Radio circle */}
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  isSelected ? 'border-mf-rose bg-mf-rose' : 'border-mf-border bg-white'
                }`}>
                  {isSelected && <span className="text-white text-[10px]">✓</span>}
                </div>
                <div>
                  <div className={`font-body text-[13px] ${isSelected ? 'text-mf-rose font-medium' : 'text-mf-marron-glace'}`}>
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="font-body text-[11px] text-mf-muted">{item.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   OrderPage — Tunnel de commande 4 étapes
   ═══════════════════════════════════════════════════════ */

export default function OrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    last_name: '', stand: '', phone: '', email: '',
    company_name: '', billing_address: '', billing_postal_code: '', billing_city: '',
  });
  const [rgpdConsent, setRgpdConsent] = useState(false);

  // V4 states — matrix + menu funnel
  const [convives, setConvives] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [newConviveName, setNewConviveName] = useState('');
  const [menuSelections, setMenuSelections] = useState({});
  const [sameForAll, setSameForAll] = useState(true);
  const [menuSlotIdx, setMenuSlotIdx] = useState(0);
  const [activeConvive, setActiveConvive] = useState(0);
  const [autoFillDone, setAutoFillDone] = useState(false);
  const [showAutoFill, setShowAutoFill] = useState(false);

  // ─── Browser history for steps (fix back button) ───
  const goToStep = useCallback((n) => {
    setStep(n);
    window.history.pushState({ step: n }, '', '/order');
  }, []);

  useEffect(() => {
    window.history.replaceState({ step: 0 }, '', '/order');
    const handler = (e) => {
      if (e.state?.step !== undefined) {
        setStep(e.state.step);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Data hooks
  const { data: activeEvents = [], isLoading: eventsLoading } = useActiveEvents();
  const createOrder = useCreateOrder();

  const ev = activeEvents.length > 0 ? activeEvents[0] : null;
  const eventId = ev?.id;
  const { data: allMealSlots = [] } = useMealSlots(eventId);
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

  // ─── V4 Matrix helpers ───
  const addConvive = useCallback((name) => {
    const n = name.trim();
    if (n && !convives.includes(n) && convives.length < 6) {
      setConvives((prev) => [...prev, n]);
      setNewConviveName('');
    }
  }, [convives]);

  const removeConvive = useCallback((name) => {
    setConvives((prev) => prev.filter((c) => c !== name));
    setMatrix((prev) => { const m = { ...prev }; delete m[name]; return m; });
  }, []);

  const isMatrixChecked = useCallback((conv, slotId) => !!(matrix[conv]?.[slotId]), [matrix]);

  const toggleMatrix = useCallback((conv, slotId) => {
    setMatrix((prev) => ({
      ...prev,
      [conv]: { ...(prev[conv] || {}), [slotId]: !prev[conv]?.[slotId] },
    }));
  }, []);

  const toggleRowAll = useCallback((conv) => {
    const allChecked = mealSlots.every((s) => isMatrixChecked(conv, s.id));
    setMatrix((prev) => ({
      ...prev,
      [conv]: Object.fromEntries(mealSlots.map((s) => [s.id, !allChecked])),
    }));
  }, [mealSlots, isMatrixChecked]);

  const selectAllMatrix = useCallback(() => {
    const m = {};
    convives.forEach((c) => {
      m[c] = {};
      mealSlots.forEach((s) => { m[c][s.id] = true; });
    });
    setMatrix(m);
  }, [convives, mealSlots]);

  const clearAllMatrix = useCallback(() => setMatrix({}), []);

  const isAllMatrixSelected = useMemo(
    () => convives.length > 0 && mealSlots.length > 0 && convives.every((c) => mealSlots.every((s) => matrix[c]?.[s.id])),
    [convives, mealSlots, matrix]
  );

  const isRowAll = useCallback(
    (conv) => mealSlots.length > 0 && mealSlots.every((s) => matrix[conv]?.[s.id]),
    [mealSlots, matrix]
  );

  const v4TotalMeals = useMemo(
    () => convives.reduce((sum, c) => sum + mealSlots.filter((s) => matrix[c]?.[s.id]).length, 0),
    [convives, mealSlots, matrix]
  );

  const v4TotalPrice = useMemo(
    () => convives.reduce((sum, c) => sum + mealSlots
      .filter((s) => matrix[c]?.[s.id])
      .reduce((ss, s) => ss + Number(s.slot_type === 'soir' ? ev?.menu_price_soir : ev?.menu_price_midi) || 0, 0), 0),
    [convives, mealSlots, matrix, ev]
  );

  const formatSlotPill = useCallback((slot) => {
    const icon = slot.slot_type === 'soir' ? '☽' : '☀';
    const day = format(new Date(slot.slot_date + 'T00:00:00'), 'EEE d', { locale: fr });
    const label = slot.slot_type === 'midi' ? 'Midi' : 'Soir';
    return `${icon} ${day} ${label}`;
  }, []);

  // ─── V4 Menu helpers ───
  const catConfig = useMemo(() => {
    const cats = [];
    if (categories.includes('entree')) cats.push({ key: 'entree', label: 'Entrée', emoji: '🥗', items: entrees });
    if (categories.includes('plat')) cats.push({ key: 'plat', label: 'Plat', emoji: '🍽', items: plats });
    if (categories.includes('dessert')) cats.push({ key: 'dessert', label: 'Dessert', emoji: '🍰', items: desserts });
    if (categories.includes('boisson')) cats.push({ key: 'boisson', label: 'Boisson', emoji: '🥤', items: boissons });
    return cats;
  }, [categories, entrees, plats, desserts, boissons]);

  const activeSlots = useMemo(
    () => mealSlots.filter((s) => convives.some((c) => matrix[c]?.[s.id])),
    [mealSlots, convives, matrix]
  );

  const slotConvives = useMemo(() => {
    const sc = {};
    activeSlots.forEach((s) => { sc[s.id] = convives.filter((c) => matrix[c]?.[s.id]); });
    return sc;
  }, [activeSlots, convives, matrix]);

  const currentSlot = activeSlots[menuSlotIdx];
  const currentConv = currentSlot ? (slotConvives[currentSlot.id] || []) : [];

  const getSelKey = useCallback(() => sameForAll ? '__all__' : currentConv[activeConvive], [sameForAll, currentConv, activeConvive]);
  const getSel = useCallback((slotId, k) => (menuSelections[slotId] || {})[k] || {}, [menuSelections]);

  const curSel = currentSlot ? getSel(currentSlot.id, getSelKey()) : {};
  const isMenuComplete = catConfig.every((c) => curSel[c.key]);
  const isConvDone = useCallback((slotId, name) => catConfig.every((c) => getSel(slotId, name)[c.key]), [catConfig, getSel]);
  const isSlotDone = useCallback((slotId) => {
    const cv = slotConvives[slotId] || [];
    return sameForAll
      ? catConfig.every((c) => getSel(slotId, '__all__')[c.key])
      : cv.every((n) => isConvDone(slotId, n));
  }, [slotConvives, sameForAll, catConfig, getSel, isConvDone]);

  const doneSlots = activeSlots.filter((s) => isSlotDone(s.id)).length;
  const allSlotsDone = doneSlots === activeSlots.length && activeSlots.length > 0;
  const isLastSlot = menuSlotIdx === activeSlots.length - 1;
  const allConvThisSlot = sameForAll ? isMenuComplete : currentConv.every((n) => isConvDone(currentSlot?.id, n));

  const menuTotal = useMemo(
    () => activeSlots.reduce((sum, s) => {
      const price = Number(s.slot_type === 'soir' ? ev?.menu_price_soir : ev?.menu_price_midi) || 0;
      return sum + (isSlotDone(s.id) ? price * (slotConvives[s.id]?.length || 0) : 0);
    }, 0),
    [activeSlots, ev, isSlotDone, slotConvives]
  );

  const setMenuChoice = useCallback((catKey, itemId) => {
    if (!currentSlot) return;
    const slotId = currentSlot.id;
    const k = sameForAll ? '__all__' : currentConv[activeConvive];
    setMenuSelections((prev) => ({
      ...prev,
      [slotId]: {
        ...(prev[slotId] || {}),
        [k]: {
          ...((prev[slotId] || {})[k] || {}),
          [catKey]: ((prev[slotId] || {})[k] || {})[catKey] === itemId ? null : itemId,
          _pf: false,
        },
      },
    }));
  }, [currentSlot, sameForAll, currentConv, activeConvive]);

  const handleMenuToggle = useCallback((val) => {
    if (!val && sameForAll && currentSlot) {
      const shared = getSel(currentSlot.id, '__all__');
      const ns = { ...(menuSelections[currentSlot.id] || {}) };
      currentConv.forEach((n) => {
        if (!ns[n] || !catConfig.some((c) => ns[n][c.key])) {
          ns[n] = { ...shared, _pf: true };
        }
      });
      setMenuSelections((prev) => ({ ...prev, [currentSlot.id]: ns }));
    }
    setSameForAll(val);
    setActiveConvive(0);
  }, [sameForAll, currentSlot, currentConv, catConfig, menuSelections, getSel]);

  const handleValidateSlot = useCallback(() => {
    if (menuSlotIdx === 0 && !autoFillDone && activeSlots.length > 1) {
      setShowAutoFill(true);
      return;
    }
    if (!isLastSlot) {
      setMenuSlotIdx((i) => i + 1);
      setSameForAll(true);
      setActiveConvive(0);
    }
  }, [menuSlotIdx, autoFillDone, activeSlots.length, isLastSlot]);

  const handleAutoFill = useCallback(() => {
    const firstSlotSel = menuSelections[activeSlots[0]?.id];
    const ns = { ...menuSelections };
    activeSlots.slice(1).forEach((s) => {
      ns[s.id] = {};
      if (firstSlotSel) {
        Object.entries(firstSlotSel).forEach(([k, v]) => {
          ns[s.id][k] = { ...v, _pf: true };
        });
      }
    });
    setMenuSelections(ns);
    setAutoFillDone(true);
    setShowAutoFill(false);
    setMenuSlotIdx(1);
  }, [menuSelections, activeSlots]);

  // Validation
  const isStep0Valid = formData.last_name && formData.stand && formData.phone && formData.email;
  const isStep3Valid = formData.billing_address && formData.billing_postal_code && formData.billing_city && rgpdConsent;

  // V4 total (all slots, not just "done" ones — for the recap/payment)
  const v4FinalTotal = useMemo(
    () => activeSlots.reduce((sum, s) => {
      const price = Number(s.slot_type === 'soir' ? ev?.menu_price_soir : ev?.menu_price_midi) || 0;
      return sum + price * (slotConvives[s.id]?.length || 0);
    }, 0),
    [activeSlots, ev, slotConvives]
  );

  // Submit — builds order + order_lines from V4 matrix + menuSelections
  const handleSubmit = async () => {
    let totalAmount = 0;
    const orderLines = [];

    activeSlots.forEach((slot) => {
      const menuPrice = Number(slot.slot_type === 'soir' ? ev.menu_price_soir : ev.menu_price_midi) || 0;
      const cv = slotConvives[slot.id] || [];
      totalAmount += cv.length * menuPrice;

      cv.forEach((conviveName) => {
        // Resolve selections: use per-convive if it exists, else __all__
        const sel = getSel(slot.id, conviveName);
        const allSel = getSel(slot.id, '__all__');
        const finalSel = catConfig.some((c) => sel[c.key]) ? sel : allSel;

        catConfig.forEach((cat) => {
          const itemId = finalSel[cat.key];
          if (itemId) {
            orderLines.push({
              meal_slot_id: slot.id,
              menu_item_id: itemId,
              quantity: 1,
              unit_price: menuPrice,
              guest_name: conviveName,
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
          customer_first_name: convives[0] || '',
          customer_last_name: formData.last_name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          stand: formData.stand,
          total_amount: totalAmount,
          payment_status: 'pending',
          delivery_method: 'livraison',
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
      navigate(`/order/success/${result.order.id}`, { replace: true });
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la commande. Veuillez réessayer.');
    }
  };


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

      <ClientHeader />

      {/* ─── Event banner ─── */}
      <div className="text-center bg-white border-b border-mf-border py-4 px-6">
        <p className="font-body text-[13px] text-mf-muted">{ev.name} · {eventDates}</p>
      </div>

      {/* ─── STEP INDICATOR ─── */}
      <div className="max-w-[520px] mx-auto px-5 pt-6 pb-4">
        <MfStepIndicator steps={['Infos', 'Créneaux', 'Menus', 'Récap']} current={step} />
      </div>

      <div className="max-w-[520px] mx-auto px-5">

        {/* ═══ STEP 0: CLIENT INFO ═══ */}
        {step === 0 && (
          <MfCard>
            <h2 className="font-serif text-[22px] font-normal italic text-mf-rose mb-6">
              Vos coordonnées
            </h2>
            <div className="flex flex-col gap-4">
              <MfInput label="Nom" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Dupont" />
              <MfInput label="Stand" value={formData.stand} onChange={(e) => setFormData({ ...formData, stand: e.target.value })} placeholder="A-42" />
              <MfInput label="Téléphone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="06 12 34 56 78" />
              <MfInput label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="contact@entreprise.com" />
            </div>

            <MfButton fullWidth disabled={!isStep0Valid} onClick={() => goToStep(1)} className="mt-6">
              Continuer →
            </MfButton>
          </MfCard>
        )}

        {/* ═══ STEP 1: CONVIVES + MATRIX ═══ */}
        {step === 1 && (
          <div className="space-y-3">

            {/* ─── Section A: Votre équipe ─── */}
            <MfCard>
              <h2 className="font-serif text-[22px] font-normal italic text-mf-rose mb-1">
                Votre équipe
              </h2>
              <p className="font-body text-[12px] text-mf-muted leading-normal mb-4">
                Ajoutez les prénoms de chaque personne, une seule fois.
              </p>

              {/* Convive chips */}
              {convives.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {convives.map((name) => (
                    <div key={name} className="flex items-center gap-1.5 py-1.5 pl-2.5 pr-2 rounded-pill bg-mf-poudre/15 border border-mf-poudre">
                      <div className="w-[26px] h-[26px] rounded-full bg-mf-rose flex items-center justify-center font-body text-[12px] font-medium text-mf-blanc-casse">
                        {name[0].toUpperCase()}
                      </div>
                      <span className="font-body text-[14px] text-mf-marron-glace">{name}</span>
                      <button
                        type="button"
                        onClick={() => removeConvive(name)}
                        className="w-[22px] h-[22px] rounded-full bg-mf-rose/8 flex items-center justify-center cursor-pointer border-none transition-colors hover:bg-mf-rose/20"
                      >
                        <X className="w-3 h-3 text-mf-rose" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add convive input */}
              {convives.length < 6 ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newConviveName}
                    onChange={(e) => setNewConviveName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addConvive(newConviveName)}
                    placeholder="Prénom du convive"
                    className="flex-1 px-4 py-2.5 border-[1.5px] border-mf-border rounded-pill text-[14px] font-body bg-white text-mf-marron-glace outline-none focus:border-mf-rose transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => addConvive(newConviveName)}
                    disabled={!newConviveName.trim()}
                    className={`w-[44px] h-[44px] rounded-full border-none flex items-center justify-center text-[20px] transition-all cursor-pointer ${
                      newConviveName.trim()
                        ? 'bg-mf-rose text-mf-blanc-casse'
                        : 'bg-mf-border text-mf-muted cursor-default'
                    }`}
                  >
                    +
                  </button>
                </div>
              ) : (
                <p className="font-body text-[11px] text-mf-muted">Maximum 6 convives atteint</p>
              )}
            </MfCard>

            {/* ─── Section B: Qui mange quand ? (Matrix) ─── */}
            {convives.length > 0 && (
              <MfCard>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-serif text-[22px] font-normal italic text-mf-rose mb-0.5">
                      Qui mange quand ?
                    </h2>
                    <p className="font-body text-[12px] text-mf-muted">
                      Cochez les créneaux pour chaque convive.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={isAllMatrixSelected ? clearAllMatrix : selectAllMatrix}
                    className={`shrink-0 font-body text-[10px] uppercase tracking-[0.06em] font-medium px-3.5 py-1.5 rounded-pill border-none cursor-pointer transition-colors ${
                      isAllMatrixSelected
                        ? 'bg-mf-vieux-rose/10 text-mf-vieux-rose'
                        : 'bg-mf-vert-olive/10 text-mf-vert-olive'
                    }`}
                  >
                    {isAllMatrixSelected ? '✕ Tout décocher' : '⚡ Tout cocher'}
                  </button>
                </div>

                {/* One card per convive */}
                <div className="space-y-2">
                  {convives.map((name) => {
                    const rowAll = isRowAll(name);
                    const convSlotCount = mealSlots.filter((s) => matrix[name]?.[s.id]).length;
                    const convPrice = mealSlots
                      .filter((s) => matrix[name]?.[s.id])
                      .reduce((sum, s) => sum + (Number(s.slot_type === 'soir' ? ev.menu_price_soir : ev.menu_price_midi) || 0), 0);

                    return (
                      <div
                        key={name}
                        className={`p-3 rounded-card border transition-colors ${
                          rowAll
                            ? 'border-status-green/25 bg-status-green/[0.03]'
                            : 'border-mf-border bg-white'
                        }`}
                      >
                        {/* Convive header */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center font-body text-[13px] font-medium transition-all ${
                              rowAll
                                ? 'bg-mf-rose text-mf-blanc-casse'
                                : 'bg-mf-poudre/40 text-mf-marron-glace'
                            }`}>
                              {name[0].toUpperCase()}
                            </div>
                            <span className="font-body text-[15px] font-medium text-mf-marron-glace">{name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleRowAll(name)}
                            className={`font-body text-[10px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-pill border-none cursor-pointer transition-colors ${
                              rowAll
                                ? 'bg-mf-vieux-rose/10 text-mf-vieux-rose'
                                : 'bg-mf-vert-olive/10 text-mf-vert-olive'
                            }`}
                          >
                            {rowAll ? 'Décocher tout' : '⚡ Tous les créneaux'}
                          </button>
                        </div>

                        {/* Slot pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {mealSlots.map((slot) => {
                            const checked = !!matrix[name]?.[slot.id];
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => toggleMatrix(name, slot.id)}
                                className={`py-1.5 px-3 rounded-pill border-[1.5px] cursor-pointer transition-all duration-150 font-body text-[11px] flex items-center gap-1.5 ${
                                  checked
                                    ? 'border-mf-rose bg-mf-poudre/15 text-mf-rose'
                                    : 'border-mf-border bg-white text-mf-muted'
                                }`}
                              >
                                {checked && <span className="text-[10px]">✓</span>}
                                {formatSlotPill(slot)}
                              </button>
                            );
                          })}
                        </div>

                        {/* Convive stats */}
                        {convSlotCount > 0 && (
                          <p className="font-body text-[11px] text-mf-muted mt-1.5">
                            {convSlotCount} créneau{convSlotCount > 1 ? 'x' : ''}
                            <span className="text-mf-vert-olive"> · {convPrice}€</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ─── Sub-total ─── */}
                {v4TotalMeals > 0 && (
                  <div className="mt-4 p-3.5 rounded-card bg-mf-blanc-casse">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-body text-[12px] text-mf-muted">Total repas</span>
                      <span className="font-body text-[12px] font-medium text-mf-marron-glace">{v4TotalMeals}</span>
                    </div>

                    {/* Per-slot breakdown */}
                    <div className="border-t border-mf-border pt-2 mt-1.5 space-y-0.5">
                      {mealSlots.filter((s) => convives.some((c) => matrix[c]?.[s.id])).map((slot) => {
                        const count = convives.filter((c) => matrix[c]?.[slot.id]).length;
                        const price = Number(slot.slot_type === 'soir' ? ev.menu_price_soir : ev.menu_price_midi) || 0;
                        return (
                          <div key={slot.id} className="flex justify-between">
                            <span className="font-body text-[11px] text-mf-muted">
                              {formatSlotPill(slot)} · {count} conv.
                            </span>
                            <span className="font-body text-[11px] text-mf-marron-glace">{count * price}€</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-mf-border pt-2 mt-2 flex justify-between items-center">
                      <span className="font-body text-[13px] font-medium text-mf-rose">Estimation</span>
                      <span className="font-serif text-[20px] italic text-mf-rose">{v4TotalPrice} €</span>
                    </div>
                  </div>
                )}
              </MfCard>
            )}

            {/* ─── Navigation ─── */}
            <div className="flex gap-3">
              <MfButton variant="outline" onClick={() => goToStep(0)} className="flex-1">
                ← Infos
              </MfButton>
              <MfButton
                disabled={v4TotalMeals === 0}
                onClick={() => { goToStep(2); setMenuSlotIdx(0); }}
                className="flex-[2]"
              >
                {v4TotalMeals > 0
                  ? `Choisir les menus (${v4TotalMeals} repas) →`
                  : 'Sélectionnez au moins 1 créneau'}
              </MfButton>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: MENU SELECTION (V4 funnel) ═══ */}
        {step === 2 && currentSlot && (
          <div>
            {/* ─── A) Slot tabs ─── */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2.5">
              {activeSlots.map((s, i) => {
                const isActive = i === menuSlotIdx;
                const done = isSlotDone(s.id);
                const cv = slotConvives[s.id] || [];
                const isPf = done && getSel(s.id, '__all__')._pf;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setMenuSlotIdx(i); setSameForAll(true); setActiveConvive(0); }}
                    className={`whitespace-nowrap font-body text-[11px] px-3 py-1.5 rounded-pill flex items-center gap-1 border-[1.5px] cursor-pointer transition-all ${
                      isActive
                        ? 'bg-mf-rose border-mf-rose text-mf-blanc-casse'
                        : done
                          ? 'bg-mf-poudre/40 border-mf-poudre text-mf-marron-glace'
                          : 'bg-white border-mf-border text-mf-marron-glace'
                    }`}
                  >
                    {done && !isActive && (
                      <span className={`text-[9px] ${isPf ? 'text-mf-vert-olive' : 'text-status-green'}`}>
                        {isPf ? '⚡' : '✓'}
                      </span>
                    )}
                    {formatSlotPill(s)}
                    <span className={`text-[9px] ${isActive ? 'text-mf-poudre' : 'text-mf-muted'}`}>{cv.length}p</span>
                  </button>
                );
              })}
            </div>

            {/* ─── B) Progress bar ─── */}
            <div className="p-2.5 px-3.5 rounded-[10px] bg-white border border-mf-border mb-2.5">
              <div className="flex justify-between mb-1">
                <span className="font-body text-[11px] text-mf-marron-glace">
                  Créneau <strong>{menuSlotIdx + 1}</strong>/{activeSlots.length}
                </span>
                <span className={`font-body text-[11px] font-medium ${allSlotsDone ? 'text-status-green' : 'text-mf-rose'}`}>
                  {doneSlots}/{activeSlots.length}
                </span>
              </div>
              <div className="h-1 rounded-sm bg-mf-blanc-casse">
                <div
                  className={`h-full rounded-sm transition-all duration-400 ${allSlotsDone ? 'bg-status-green' : 'bg-mf-rose'}`}
                  style={{ width: `${(doneSlots / activeSlots.length) * 100}%` }}
                />
              </div>
            </div>

            {/* ─── C) Slot card ─── */}
            <MfCard>
              {/* C1. Header */}
              <div className="flex justify-between items-center mb-1">
                <h2 className="font-serif text-[18px] font-normal italic text-mf-rose">
                  {format(new Date(currentSlot.slot_date + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })} — {currentSlot.slot_type === 'midi' ? 'Midi' : 'Soir'}
                </h2>
                <span className="font-body text-[11px] font-medium text-mf-vert-olive px-2.5 py-0.5 rounded-pill bg-mf-vert-olive/10">
                  {(Number(currentSlot.slot_type === 'soir' ? ev.menu_price_soir : ev.menu_price_midi) || 0) * currentConv.length}€
                </span>
              </div>

              {/* C2. Convive avatars */}
              <div className="flex gap-1.5 my-2 pb-2 border-b border-mf-blanc-casse">
                {currentConv.map((n, i) => {
                  const done = sameForAll ? isMenuComplete : isConvDone(currentSlot.id, n);
                  const ac = !sameForAll && i === activeConvive;
                  return (
                    <div
                      key={n}
                      onClick={() => !sameForAll && setActiveConvive(i)}
                      className={`flex flex-col items-center gap-0.5 transition-opacity ${
                        sameForAll ? 'opacity-45' : 'cursor-pointer opacity-100'
                      }`}
                    >
                      <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center font-body text-[13px] font-medium border-2 transition-all ${
                        ac
                          ? 'bg-mf-rose border-mf-rose text-mf-blanc-casse'
                          : done
                            ? 'bg-status-green/15 border-status-green/35 text-status-green'
                            : 'bg-mf-poudre/30 border-transparent text-mf-marron-glace'
                      }`}>
                        {done && !ac ? <span className="text-[12px]">✓</span> : n[0].toUpperCase()}
                      </div>
                      <span className={`font-body text-[8px] ${ac ? 'text-mf-rose' : 'text-mf-muted'}`}>{n}</span>
                    </div>
                  );
                })}
              </div>

              {/* C3. Same-for-all toggle */}
              {currentConv.length > 1 && (
                <label
                  className={`w-full flex items-center gap-2.5 p-2.5 px-3 rounded-[14px] border-[1.5px] cursor-pointer text-left mb-2.5 transition-colors select-none ${
                    sameForAll
                      ? 'bg-mf-vert-olive/8 border-mf-vert-olive'
                      : 'bg-white border-mf-border'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <input
                    type="checkbox"
                    checked={sameForAll}
                    onChange={(e) => handleMenuToggle(e.target.checked)}
                    className="sr-only"
                  />
                  {/* Toggle switch */}
                  <div className={`w-[38px] h-5 rounded-[10px] p-0.5 shrink-0 flex items-center transition-colors ${
                    sameForAll ? 'bg-mf-vert-olive' : 'bg-mf-border'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      sameForAll ? 'translate-x-[18px]' : 'translate-x-0'
                    }`} />
                  </div>
                  <div>
                    <div className="font-body text-[12px] font-medium text-mf-marron-glace">Même menu pour tous</div>
                    {sameForAll && (
                      <div className="font-body text-[10px] text-mf-vert-olive">
                        ⚡ Un choix pour {currentConv.join(' & ')}
                      </div>
                    )}
                  </div>
                </label>
              )}

              {/* C4. Convive tabs (when sameForAll=false) */}
              {!sameForAll && (
                <div className="flex gap-1 mb-2 overflow-x-auto">
                  {currentConv.map((n, i) => {
                    const done = isConvDone(currentSlot.id, n);
                    const ac = i === activeConvive;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setActiveConvive(i)}
                        className={`whitespace-nowrap font-body text-[11px] py-1.5 px-3 rounded-pill border-[1.5px] cursor-pointer flex items-center gap-1 transition-all ${
                          ac
                            ? 'bg-mf-rose border-mf-rose text-mf-blanc-casse'
                            : done
                              ? 'bg-status-green/10 border-status-green/30 text-mf-marron-glace'
                              : 'bg-white border-mf-border text-mf-marron-glace'
                        }`}
                      >
                        {done && !ac && <span className="text-[9px] text-status-green">✓</span>}
                        {n}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* C5. Pre-filled banner */}
              {curSel._pf && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] mb-2 bg-mf-vert-olive/8 border border-mf-vert-olive/18 font-body text-[11px] text-mf-vert-olive">
                  ⚡ Pré-rempli. Modifiez si besoin.
                </div>
              )}

              {/* C6. Collapsible categories */}
              {catConfig.map((cat) => (
                <CollapsibleCategory
                  key={cat.key + currentSlot.id + (sameForAll ? '__all__' : currentConv[activeConvive])}
                  catKey={cat.key}
                  catLabel={cat.label}
                  catEmoji={cat.emoji}
                  items={cat.items}
                  selectedId={curSel[cat.key]}
                  onSelect={(id) => setMenuChoice(cat.key, id)}
                />
              ))}

              {/* C7. Validate CTA */}
              {isLastSlot ? (
                <MfButton
                  fullWidth
                  variant={allSlotsDone ? 'green' : 'primary'}
                  disabled={!allSlotsDone}
                  onClick={() => goToStep(3)}
                  className="mt-1.5"
                >
                  {allSlotsDone ? 'Voir le récapitulatif →' : `${doneSlots}/${activeSlots.length} créneaux`}
                </MfButton>
              ) : (
                <MfButton
                  fullWidth
                  disabled={!allConvThisSlot}
                  onClick={handleValidateSlot}
                  className="mt-1.5"
                >
                  {allConvThisSlot ? 'Valider ma sélection →' : 'Complétez les menus'}
                </MfButton>
              )}
            </MfCard>

            {/* ─── E) Back navigation ─── */}
            <MfButton
              variant="outline"
              fullWidth
              onClick={() => menuSlotIdx > 0 ? setMenuSlotIdx((i) => i - 1) : goToStep(1)}
              className="mt-2.5"
            >
              {menuSlotIdx > 0 ? '← Créneau précédent' : '‹ Créneaux & convives'}
            </MfButton>
          </div>
        )}

        {/* ─── Auto-fill modal ─── */}
        <MfBlurModal open={showAutoFill} onClose={() => { setAutoFillDone(true); setShowAutoFill(false); setMenuSlotIdx(1); }}>
          <div className="w-[50px] h-[50px] rounded-full mx-auto mb-3 flex items-center justify-center text-[22px]"
            style={{ background: 'linear-gradient(135deg, rgba(150,138,66,0.12), rgba(229,183,179,0.25))' }}>
            ⚡
          </div>
          <h3 className="font-serif text-[22px] font-normal italic text-mf-rose mb-2">Même menu partout ?</h3>
          <p className="font-body text-[13px] text-mf-muted leading-relaxed mb-1.5">Votre sélection du</p>
          {activeSlots[0] && (
            <div className="inline-block px-3.5 py-2 rounded-[12px] bg-mf-blanc-casse font-body text-[14px] font-medium text-mf-marron-glace mb-2">
              {formatSlotPill(activeSlots[0])}
            </div>
          )}
          <p className="font-body text-[13px] text-mf-muted mb-5">
            sera appliquée aux <strong className="text-mf-marron-glace">{activeSlots.length - 1} autres créneaux</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <MfButton fullWidth onClick={handleAutoFill}>⚡ Appliquer à tous</MfButton>
            <MfButton variant="outline" fullWidth onClick={() => { setAutoFillDone(true); setShowAutoFill(false); setMenuSlotIdx(1); }}>
              Non, je choisis pour chaque
            </MfButton>
          </div>
        </MfBlurModal>

        {/* ─── Sticky footer (step 2) ─── */}
        {step === 2 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-between items-center bg-white border-t border-mf-border px-5 py-3 shadow-[0_-3px_16px_rgba(57,45,49,0.05)]">
            <div>
              <div className="font-body text-[10px] uppercase tracking-[0.06em] text-mf-muted">
                {doneSlots}/{activeSlots.length} créneaux
              </div>
              <div className="font-serif text-[20px] italic text-mf-rose">
                {menuTotal.toFixed(2)} €
              </div>
            </div>
            <div className="flex gap-2">
              <MfButton
                variant="outline"
                size="sm"
                onClick={() => menuSlotIdx > 0 ? setMenuSlotIdx((i) => i - 1) : goToStep(1)}
              >
                ←
              </MfButton>
              {allSlotsDone && (
                <MfButton onClick={() => goToStep(3)}>
                  Récapitulatif →
                </MfButton>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: RECAP + BILLING ═══ */}
        {step === 3 && (
          <div className="space-y-4">

            {/* 1. Title */}
            <MfCard>
              <h2 className="font-serif text-[22px] font-normal italic text-mf-rose mb-4">
                Récapitulatif
              </h2>

              {/* 2. Client block */}
              <div className="p-3 rounded-[14px] bg-mf-blanc-casse mb-4">
                <div className="font-body text-[10px] uppercase tracking-[0.1em] text-mf-vieux-rose mb-1">Client</div>
                <div className="font-body text-[14px] font-medium text-mf-marron-glace">
                  Famille {formData.last_name}
                </div>
                <div className="font-body text-[12px] text-mf-muted">
                  Stand {formData.stand} · {formData.email} · {formData.phone}
                </div>
              </div>

              {/* 3. Slots recap */}
              <div className="space-y-3">
                {activeSlots.map((slot) => {
                  const cv = slotConvives[slot.id] || [];
                  const price = Number(slot.slot_type === 'soir' ? ev.menu_price_soir : ev.menu_price_midi) || 0;
                  const allItems = [...entrees, ...plats, ...desserts, ...boissons];

                  return (
                    <div key={slot.id}>
                      {/* Slot header */}
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-body text-[11px] uppercase tracking-[0.08em] font-medium text-mf-rose">
                          {formatSlotPill(slot)}
                        </span>
                        <span className="font-body text-[12px] font-medium text-mf-vert-olive">
                          {cv.length * price}€
                        </span>
                      </div>

                      {/* Convive rows */}
                      {cv.map((name) => {
                        const sel = getSel(slot.id, name);
                        const allSel = getSel(slot.id, '__all__');
                        const finalSel = catConfig.some((c) => sel[c.key]) ? sel : allSel;

                        return (
                          <div key={name} className="p-2 px-2.5 rounded-[10px] bg-mf-blanc-casse/80 mb-1">
                            <div className="font-body text-[12px] font-medium text-mf-marron-glace mb-1">
                              👤 {name}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {catConfig.map((cat) => {
                                const item = allItems.find((i) => i.id === finalSel[cat.key]);
                                return item ? (
                                  <span key={cat.key} className="font-body text-[10px] px-2 py-0.5 rounded-pill bg-white border border-mf-border text-mf-marron-glace">
                                    {cat.emoji} {item.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Separator */}
                      <div className="h-px bg-mf-border mt-2" />
                    </div>
                  );
                })}
              </div>

              {/* 5. Total */}
              <div className="flex items-baseline justify-between pt-3 mt-3 border-t-2 border-mf-rose">
                <div>
                  <span className="font-body text-[12px] uppercase tracking-[0.1em] text-mf-rose font-medium">Total</span>
                  <div className="font-body text-[11px] text-mf-muted">{v4TotalMeals} repas</div>
                </div>
                <span className="font-serif text-[28px] italic text-mf-rose">
                  {v4FinalTotal.toFixed(2)} €
                </span>
              </div>
            </MfCard>

            {/* 4. Billing */}
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

            {/* 6. RGPD */}
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

            {/* 7. Action buttons */}
            <div className="flex gap-3">
              <MfButton variant="outline" onClick={() => goToStep(2)} className="flex-1">
                ← Menus
              </MfButton>
              <MfButton
                variant="green"
                disabled={!isStep3Valid || createOrder.isPending}
                onClick={handleSubmit}
                className={`flex-[2] ${createOrder.isPending ? 'opacity-70' : ''}`}
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
