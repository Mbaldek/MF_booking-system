import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Pencil, Trash2, X, Check, Calendar, Image, UtensilsCrossed, ChevronDown, Copy, CopyPlus } from 'lucide-react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useMenuCatalog, useAllEventMenuItems, useLinkMenuToEvent, useUnlinkMenuFromEvent, useUpdateEventMenuItem, useUpdateMenuItem } from '@/hooks/useMenuItems';
import { useMealSlots, useUpdateSlotCapacity } from '@/hooks/useMealSlots';
import { useSlotMenuItems, useLinkMenuToSlot, useUnlinkMenuFromSlot, useCopySlotMenu, useSetSlotMenuItems } from '@/hooks/useSlotMenuItems';
import { supabase } from '@/api/supabase';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import PageTour from '@/components/onboarding/PageTour';

const TYPE_LABELS = { entree: 'Entrées', plat: 'Plats', dessert: 'Desserts', boisson: 'Boissons' };

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}
const TYPE_ORDER = ['entree', 'plat', 'dessert', 'boisson'];

function EventForm({ initialData, onSubmit, onCancel, isPending }) {
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugDirty, setSlugDirty] = useState(!!initialData?.slug);
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [mealService, setMealService] = useState(initialData?.meal_service || 'both');
  const [menuPriceMidi, setMenuPriceMidi] = useState(initialData?.menu_price_midi ?? '');
  const [menuPriceSoir, setMenuPriceSoir] = useState(initialData?.menu_price_soir ?? '');
  const [menuCategories, setMenuCategories] = useState(
    initialData?.menu_categories || ['entree', 'plat', 'dessert', 'boisson']
  );

  const showMidi = mealService === 'midi' || mealService === 'both';
  const showSoir = mealService === 'soir' || mealService === 'both';

  const toggleCategory = (cat) => {
    setMenuCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      slug: slug.trim() || null,
      start_date: startDate,
      end_date: endDate,
      description: description.trim() || null,
      meal_service: mealService,
      menu_price_midi: showMidi ? (parseFloat(menuPriceMidi) || 0) : 0,
      menu_price_soir: showSoir ? (parseFloat(menuPriceSoir) || 0) : 0,
      menu_categories: menuCategories,
    });
  };

  const hasPrices = (showMidi ? parseFloat(menuPriceMidi) > 0 : true) && (showSoir ? parseFloat(menuPriceSoir) > 0 : true);
  const isValid = name.trim() && startDate && endDate && endDate >= startDate && hasPrices;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="event-name" className="block text-sm font-medium text-mf-marron-glace">Nom *</label>
        <input id="event-name" type="text" required value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugDirty) setSlug(slugify(e.target.value));
          }}
          placeholder="Ex : Salon de la Gastronomie 2026"
          className="w-full px-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose focus:border-transparent" />
      </div>

      <div className="space-y-1">
        <label htmlFor="event-slug" className="block text-sm font-medium text-mf-marron-glace">
          Slug URL <span className="font-normal text-mf-muted">(lien partageable)</span>
        </label>
        <div className="flex items-center gap-0">
          <span className="px-3 py-2 bg-mf-blanc-casse border border-r-0 border-mf-border rounded-l-lg text-xs text-mf-muted whitespace-nowrap">/reservation/</span>
          <input id="event-slug" type="text" value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugDirty(true); }}
            placeholder="salon-gastronomie-2026"
            className="flex-1 px-3 py-2 border border-mf-border rounded-r-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mf-rose focus:border-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-mf-marron-glace">Date de début *</label>
          <input id="start-date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose focus:border-transparent" />
        </div>
        <div className="space-y-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-mf-marron-glace">Date de fin *</label>
          <input id="end-date" type="date" required value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose focus:border-transparent" />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="event-desc" className="block text-sm font-medium text-mf-marron-glace">Description</label>
        <textarea id="event-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de l'événement..."
          className="w-full px-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose focus:border-transparent resize-none" />
      </div>

      {/* Meal service type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-mf-marron-glace">Service repas *</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'midi', label: 'Midi uniquement' },
            { value: 'soir', label: 'Soir uniquement' },
            { value: 'both', label: 'Midi & Soir' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMealService(opt.value)}
              className={`px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-colors ${
                mealService === opt.value
                  ? 'border-mf-rose bg-mf-poudre/20 text-mf-rose'
                  : 'border-mf-border bg-white text-mf-muted hover:border-mf-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional price fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {showMidi && (
          <div className="space-y-1">
            <label htmlFor="price-midi" className="block text-sm font-medium text-mf-marron-glace">Prix menu midi (€) *</label>
            <input id="price-midi" type="number" min="0" step="0.01" value={menuPriceMidi}
              onChange={(e) => setMenuPriceMidi(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose focus:border-transparent" />
          </div>
        )}
        {showSoir && (
          <div className="space-y-1">
            <label htmlFor="price-soir" className="block text-sm font-medium text-mf-marron-glace">Prix menu soir (€) *</label>
            <input id="price-soir" type="number" min="0" step="0.01" value={menuPriceSoir}
              onChange={(e) => setMenuPriceSoir(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose focus:border-transparent" />
          </div>
        )}
      </div>

      {/* Menu categories */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-mf-marron-glace">Composition du menu</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: 'entree', label: 'Entrée' },
            { value: 'plat', label: 'Plat' },
            { value: 'dessert', label: 'Dessert' },
            { value: 'boisson', label: 'Boisson' },
          ].map((cat) => {
            const active = menuCategories.includes(cat.value);
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                  active
                    ? 'border-mf-rose bg-mf-poudre/20 text-mf-rose'
                    : 'border-mf-border bg-white text-mf-muted hover:border-mf-border'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {startDate && endDate && endDate < startDate && (
        <p className="text-sm text-red-500">La date de fin doit être après la date de début.</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={!isValid || isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-mf-rose text-white text-sm font-medium rounded-pill hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isPending ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Enregistrement...</>
          ) : (
            <><Check className="w-4 h-4" /> Enregistrer</>
          )}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-mf-blanc-casse text-mf-marron-glace text-sm font-medium rounded-lg hover:bg-mf-poudre/20 transition-colors">
            <X className="w-4 h-4" /> Annuler
          </button>
        )}
      </div>
    </form>
  );
}

/* ── Slot menu tab panel (items for one slot) ── */
function SlotMenuPanel({ slotId, catalog, linkedMap }) {
  const { data: slotLinks = [] } = useSlotMenuItems(slotId);
  const linkMut = useLinkMenuToSlot();
  const unlinkMut = useUnlinkMenuFromSlot();
  const setAllMut = useSetSlotMenuItems();

  const slotLinkedIds = new Set(slotLinks.map((sl) => sl.menu_item_id));
  // Only show items that are in the event catalog
  const eventItemIds = new Set(Object.keys(linkedMap));
  const availableCatalog = catalog.filter((i) => eventItemIds.has(i.id));

  const handleToggle = (item) => {
    if (slotLinkedIds.has(item.id)) {
      unlinkMut.mutate({ slotId, menuItemId: item.id });
    } else {
      linkMut.mutate({ slotId, menuItemId: item.id });
    }
  };

  const handleCheckAll = () => {
    const allIds = availableCatalog.map((i) => i.id);
    setAllMut.mutate({ slotId, menuItemIds: allIds });
  };

  const handleUncheckAll = () => {
    setAllMut.mutate({ slotId, menuItemIds: [] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={handleCheckAll}
          className="px-3 py-1 text-xs font-medium text-mf-rose bg-mf-poudre/20 rounded-full hover:bg-mf-poudre/40 transition-colors">
          Tout cocher
        </button>
        <button type="button" onClick={handleUncheckAll}
          className="px-3 py-1 text-xs font-medium text-mf-muted bg-mf-blanc-casse rounded-full hover:bg-mf-poudre/20 transition-colors">
          Tout décocher
        </button>
      </div>

      {TYPE_ORDER.map((type) => {
        const items = availableCatalog.filter((i) => i.type === type);
        if (items.length === 0) return null;
        return (
          <div key={type}>
            <h4 className="text-xs font-semibold text-mf-muted uppercase tracking-wide mb-2">{TYPE_LABELS[type]}</h4>
            <div className="space-y-1.5">
              {items.map((item) => {
                const isLinked = slotLinkedIds.has(item.id);
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isLinked ? 'border-mf-rose/30 bg-mf-poudre/10' : 'border-mf-border bg-white'}`}>
                    <button type="button" onClick={() => handleToggle(item)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isLinked ? 'bg-mf-rose border-mf-rose' : 'border-mf-border'}`}>
                      {isLinked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-mf-marron-glace">{item.name}</span>
                      <span className="text-xs text-mf-muted ml-2">{Number(item.price).toFixed(2)}€</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {availableCatalog.length === 0 && (
        <p className="text-sm text-mf-muted text-center py-4">Aucun article dans le catalogue de l'événement. Cochez des articles ci-dessus d'abord.</p>
      )}
    </div>
  );
}

/* ── Supplements section ── */
function SupplementsConfig({ catalog, linkedMap }) {
  const updateItem = useUpdateMenuItem();
  // Only event catalog items
  const eventItemIds = new Set(Object.keys(linkedMap));
  const items = catalog.filter((i) => eventItemIds.has(i.id));

  const handleToggleSupplement = (item) => {
    updateItem.mutate({ id: item.id, is_supplement: !item.is_supplement });
  };

  const handleUnitPriceChange = (item, value) => {
    const unitPrice = value === '' ? null : parseFloat(value);
    updateItem.mutate({ id: item.id, unit_price: unitPrice });
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-mf-marron-glace">Suppléments à la carte</h3>
      <p className="text-xs text-mf-muted">Activez les articles disponibles en supplément hors formule, avec leur prix unitaire.</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${item.is_supplement ? 'border-mf-vert-olive/30 bg-mf-vert-olive/5' : 'border-mf-border bg-white'}`}>
            <button type="button" onClick={() => handleToggleSupplement(item)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${item.is_supplement ? 'bg-mf-vert-olive border-mf-vert-olive' : 'border-mf-border'}`}>
              {item.is_supplement && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-mf-marron-glace">{item.name}</span>
              <span className="text-xs text-mf-muted ml-2">{TYPE_LABELS[item.type]}</span>
            </div>
            {item.is_supplement && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-mf-muted">Prix :</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={Number(item.price).toFixed(2)}
                  defaultValue={item.unit_price ?? ''}
                  onBlur={(e) => handleUnitPriceChange(item, e.target.value)}
                  className="w-20 px-2 py-1 border border-mf-border rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-mf-vert-olive"
                  title="Prix supplément (vide = prix catalogue)"
                />
                <span className="text-xs text-mf-muted">€</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Same menu for all slots — unified checkbox list ── */
function SameMenuForAllSlots({ slots, catalog, linkedMap }) {
  const setAllMut = useSetSlotMenuItems();
  // Use first slot as reference
  const refSlotId = slots[0]?.id;
  const { data: refLinks = [] } = useSlotMenuItems(refSlotId);
  const refLinkedIds = new Set(refLinks.map((sl) => sl.menu_item_id));
  const eventItemIds = new Set(Object.keys(linkedMap));
  const availableCatalog = catalog.filter((i) => eventItemIds.has(i.id));

  const handleToggle = (item) => {
    const newIds = refLinkedIds.has(item.id)
      ? [...refLinkedIds].filter((id) => id !== item.id)
      : [...refLinkedIds, item.id];
    // Apply to ALL slots
    slots.forEach((slot) => {
      setAllMut.mutate({ slotId: slot.id, menuItemIds: newIds });
    });
  };

  const handleCheckAll = () => {
    const allIds = availableCatalog.map((i) => i.id);
    slots.forEach((slot) => {
      setAllMut.mutate({ slotId: slot.id, menuItemIds: allIds });
    });
  };

  const handleUncheckAll = () => {
    slots.forEach((slot) => {
      setAllMut.mutate({ slotId: slot.id, menuItemIds: [] });
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-mf-muted">Les changements s'appliquent à tous les créneaux ({slots.length}).</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={handleCheckAll}
          className="px-3 py-1 text-xs font-medium text-mf-rose bg-mf-poudre/20 rounded-full hover:bg-mf-poudre/40 transition-colors">
          Tout cocher
        </button>
        <button type="button" onClick={handleUncheckAll}
          className="px-3 py-1 text-xs font-medium text-mf-muted bg-mf-blanc-casse rounded-full hover:bg-mf-poudre/20 transition-colors">
          Tout décocher
        </button>
      </div>

      {TYPE_ORDER.map((type) => {
        const items = availableCatalog.filter((i) => i.type === type);
        if (items.length === 0) return null;
        return (
          <div key={type}>
            <h4 className="text-xs font-semibold text-mf-muted uppercase tracking-wide mb-2">{TYPE_LABELS[type]}</h4>
            <div className="space-y-1.5">
              {items.map((item) => {
                const isLinked = refLinkedIds.has(item.id);
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isLinked ? 'border-mf-rose/30 bg-mf-poudre/10' : 'border-mf-border bg-white'}`}>
                    <button type="button" onClick={() => handleToggle(item)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isLinked ? 'bg-mf-rose border-mf-rose' : 'border-mf-border'}`}>
                      {isLinked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-mf-marron-glace">{item.name}</span>
                      <span className="text-xs text-mf-muted ml-2">{Number(item.price).toFixed(2)}€</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {availableCatalog.length === 0 && (
        <p className="text-sm text-mf-muted text-center py-4">Aucun article dans le catalogue de l'événement.</p>
      )}
    </div>
  );
}

/* ── Main menu config with slot tabs ── */
function EventMenuConfig({ eventId }) {
  const { data: catalog = [] } = useMenuCatalog();
  const { data: linked = [] } = useAllEventMenuItems(eventId);
  const { data: slots = [] } = useMealSlots(eventId);
  const copySlotMenu = useCopySlotMenu();
  const setAllMut = useSetSlotMenuItems();

  const [activeSlotId, setActiveSlotId] = useState(null);
  const [copyDropdownOpen, setCopyDropdownOpen] = useState(false);
  const [sameMenuMode, setSameMenuMode] = useState(null); // null = auto-detect

  // Auto-select first slot
  const selectedSlotId = activeSlotId || (slots.length > 0 ? slots[0].id : null);

  const linkedMap = {};
  linked.forEach((emi) => { linkedMap[emi.menu_item_id] = emi; });

  // Detect if all slots share the same menu (auto-detect on first render)
  const isSameMenu = sameMenuMode ?? true; // default to "same menu" mode

  const formatSlotLabel = (slot) => {
    const icon = slot.slot_type === 'midi' ? '☀' : '☽';
    const day = format(new Date(slot.slot_date + 'T00:00:00'), 'EEE d', { locale: fr });
    const type = slot.slot_type === 'midi' ? 'Midi' : 'Soir';
    return `${icon} ${day} ${type}`;
  };

  const handleCopyFrom = (sourceSlotId) => {
    if (!selectedSlotId || sourceSlotId === selectedSlotId) return;
    copySlotMenu.mutate({ sourceSlotId, targetSlotId: selectedSlotId });
    setCopyDropdownOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Catalogue global (event_menu_items) — kept for compatibility */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-mf-marron-glace">Catalogue de l'événement</h3>
        <p className="text-xs text-mf-muted">Sélectionnez les articles disponibles pour cet événement. Ensuite configurez chaque créneau ci-dessous.</p>
        <EventCatalogConfig eventId={eventId} catalog={catalog} linked={linked} linkedMap={linkedMap} />
      </div>

      <div className="border-t border-mf-border" />

      {/* Slot tabs */}
      {slots.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-mf-marron-glace">Menu par créneau (formule)</h3>
            {!isSameMenu && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCopyDropdownOpen(!copyDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mf-muted bg-mf-blanc-casse rounded-full hover:bg-mf-poudre/20 transition-colors"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                  Copier depuis…
                </button>
                {copyDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCopyDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-mf-border py-1 min-w-[180px]">
                      {slots.filter((s) => s.id !== selectedSlotId).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleCopyFrom(s.id)}
                          className="w-full text-left px-3 py-2 text-xs text-mf-marron-glace hover:bg-mf-poudre/10 transition-colors"
                        >
                          {formatSlotLabel(s)}
                        </button>
                      ))}
                      {slots.filter((s) => s.id !== selectedSlotId).length === 0 && (
                        <p className="px-3 py-2 text-xs text-mf-muted">Aucun autre créneau</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Same menu toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-mf-blanc-casse">
            <button
              type="button"
              onClick={() => setSameMenuMode(!isSameMenu)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isSameMenu ? 'bg-mf-rose' : 'bg-mf-border'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isSameMenu ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-xs font-medium text-mf-marron-glace">
              {isSameMenu ? 'Même menu pour tous les créneaux' : 'Menu différent par créneau'}
            </span>
          </div>

          {isSameMenu ? (
            /* Unified menu — applies to all slots */
            <SameMenuForAllSlots slots={slots} catalog={catalog} linkedMap={linkedMap} />
          ) : (
            <>
              {/* Slot pill tabs */}
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setActiveSlotId(slot.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      selectedSlotId === slot.id
                        ? 'bg-mf-rose text-white'
                        : 'bg-mf-blanc-casse text-mf-muted hover:bg-mf-poudre/20'
                    }`}
                  >
                    {formatSlotLabel(slot)}
                  </button>
                ))}
              </div>

              {/* Active slot panel */}
              {selectedSlotId && (
                <SlotMenuPanel slotId={selectedSlotId} catalog={catalog} linkedMap={linkedMap} />
              )}
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-mf-muted text-center py-4">Aucun créneau pour cet événement.</p>
      )}

      <div className="border-t border-mf-border" />

      {/* Supplements section */}
      <SupplementsConfig catalog={catalog} linkedMap={linkedMap} />
    </div>
  );
}

/* ── Event catalog checkboxes (event_menu_items — global) ── */
function EventCatalogConfig({ eventId, catalog, linked, linkedMap }) {
  const linkMutation = useLinkMenuToEvent();
  const unlinkMutation = useUnlinkMenuFromEvent();
  const updateEmi = useUpdateEventMenuItem();

  const handleToggle = (item) => {
    if (linkedMap[item.id]) {
      unlinkMutation.mutate({ eventId, menuItemId: item.id });
    } else {
      linkMutation.mutate({ eventId, menuItemId: item.id });
    }
  };

  const handlePriceChange = (emi, value) => {
    const customPrice = value === '' ? null : parseFloat(value);
    updateEmi.mutate({ id: emi.id, custom_price: customPrice });
  };

  return (
    <div className="space-y-4">
      {TYPE_ORDER.map((type) => {
        const items = catalog.filter((i) => i.type === type);
        if (items.length === 0) return null;
        return (
          <div key={type}>
            <h4 className="text-xs font-semibold text-mf-muted uppercase tracking-wide mb-2">{TYPE_LABELS[type]}</h4>
            <div className="space-y-1.5">
              {items.map((item) => {
                const emi = linkedMap[item.id];
                const isLinked = !!emi;
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isLinked ? 'border-mf-rose/30 bg-mf-poudre/10' : 'border-mf-border bg-white'}`}>
                    <button type="button" onClick={() => handleToggle(item)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isLinked ? 'bg-mf-rose border-mf-rose' : 'border-mf-border'}`}>
                      {isLinked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-mf-marron-glace">{item.name}</span>
                      <span className="text-xs text-mf-muted ml-2">{Number(item.price).toFixed(2)}€</span>
                    </div>
                    {isLinked && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={Number(item.price).toFixed(2)}
                        defaultValue={emi.custom_price ?? ''}
                        onBlur={(e) => handlePriceChange(emi, e.target.value)}
                        className="w-20 px-2 py-1 border border-mf-border rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-mf-rose"
                        title="Prix personnalisé (laisser vide = prix catalogue)"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {catalog.length === 0 && (
        <p className="text-sm text-mf-muted text-center py-4">Aucun article dans le catalogue. Ajoutez des articles dans "Menu" d'abord.</p>
      )}
    </div>
  );
}

function EventImageUpload({ event, onUpdate }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${event.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('event-images').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
      await onUpdate({ id: event.id, image_url: urlData.publicUrl });
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors de l\'upload de l\'image.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    await onUpdate({ id: event.id, image_url: null });
  };

  return (
    <div className="flex items-center gap-4">
      {event.image_url ? (
        <div className="relative">
          <img src={event.image_url} alt={event.name} className="w-20 h-20 object-cover rounded-lg" />
          <button onClick={handleRemove} className="absolute -top-2 -right-2 p-0.5 bg-red-500 text-white rounded-full">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-20 h-20 border-2 border-dashed border-mf-border rounded-lg flex flex-col items-center justify-center hover:border-mf-rose/40 transition-colors disabled:opacity-50">
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mf-rose" />
          ) : (
            <><Image className="w-5 h-5 text-mf-muted" /><span className="text-[10px] text-mf-muted mt-1">Photo</span></>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}

function SlotCapacityConfig({ eventId }) {
  const { data: slots = [] } = useMealSlots(eventId);
  const updateCapacity = useUpdateSlotCapacity();
  const currentMax = slots.length > 0 ? slots[0].max_orders : null;
  const [value, setValue] = useState(currentMax ?? '');

  const handleSave = () => {
    updateCapacity.mutate({ eventId, maxOrders: value });
  };

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-mf-muted whitespace-nowrap">Capacité max par créneau :</label>
      <input
        type="number"
        min="1"
        placeholder="Illimité"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 px-2 py-1.5 border border-mf-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mf-rose focus:border-transparent"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={updateCapacity.isPending}
        className="px-3 py-1.5 text-xs font-medium bg-mf-rose text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
      >
        {updateCapacity.isPending ? '...' : 'Appliquer'}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => { setValue(''); updateCapacity.mutate({ eventId, maxOrders: null }); }}
          className="text-xs text-mf-muted hover:text-mf-muted"
        >
          Retirer la limite
        </button>
      )}
    </div>
  );
}

export default function AdminEvent() {
  const { data: events = [], isLoading, error } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedMenuId, setExpandedMenuId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // event to delete
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (formData) => {
    try {
      await createEvent.mutateAsync(formData);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      alert('Erreur lors de la création de l\'événement.');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateEvent.mutateAsync({ id: editingId, ...formData });
      setEditingId(null);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      alert('Erreur lors de la mise à jour de l\'événement.');
    }
  };

  const handleImageUpdate = async (data) => {
    try {
      await updateEvent.mutateAsync(data);
    } catch (err) {
      console.error('Erreur image:', err);
    }
  };

  const handleDelete = (event) => {
    setDeleteModal(event);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteEvent.mutateAsync(deleteModal.id);
      setDeleteModal(null);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleToggleActive = async (event) => {
    try {
      await updateEvent.mutateAsync({ id: event.id, is_active: !event.is_active });
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center space-y-3">
          <p className="text-red-600 font-medium">Erreur lors du chargement</p>
          <p className="text-sm text-mf-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen px-3 py-4 sm:px-4 sm:py-8">
      <PageTour page="events" />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-mf-marron-glace">Événements</h1>
            <p className="text-sm text-mf-muted mt-1">Gérez vos salons, foires et congrès</p>
          </div>
          {!showCreateForm && (
            <button onClick={() => setShowCreateForm(true)} data-tour="create-event-btn"
              className="inline-flex items-center gap-2 px-4 py-2 bg-mf-rose text-white text-sm font-medium rounded-pill hover:opacity-90 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Créer un événement
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-mf-poudre p-6">
            <h2 className="text-lg font-medium text-mf-marron-glace mb-2">Nouvel événement</h2>
            <p className="text-sm text-mf-muted mb-4">Les créneaux repas seront auto-générés pour chaque jour.</p>
            <EventForm onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} isPending={createEvent.isPending} />
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-mf-muted mx-auto mb-4" />
            <p className="text-mf-muted font-medium">Aucun événement</p>
            <p className="text-sm text-mf-muted mt-1">Créez votre premier événement pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, idx) => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-mf-border overflow-hidden" {...(idx === 0 ? { 'data-tour': 'event-card' } : {})}>
                <div className="p-6">
                  {editingId === event.id ? (
                    <div>
                      <h3 className="text-sm font-medium text-mf-muted mb-3">Modifier l'événement</h3>
                      <EventForm initialData={event} onSubmit={handleUpdate} onCancel={() => setEditingId(null)} isPending={updateEvent.isPending} />
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <EventImageUpload event={event} onUpdate={handleImageUpdate} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-mf-marron-glace">{event.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.is_active ? 'bg-status-green/15 text-status-green' : 'bg-mf-blanc-casse text-mf-muted'}`}>
                              {event.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                          <p className="text-sm text-mf-muted flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.start_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })} — {format(new Date(event.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}
                          </p>
                          {event.description && <p className="text-xs text-mf-muted mt-1">{event.description}</p>}
                          {(Number(event.menu_price_midi) > 0 || Number(event.menu_price_soir) > 0) && (
                            <p className="text-xs text-mf-muted mt-1">
                              {Number(event.menu_price_midi) > 0 && <span>Midi : {Number(event.menu_price_midi).toFixed(2)}€</span>}
                              {Number(event.menu_price_midi) > 0 && Number(event.menu_price_soir) > 0 && <span> · </span>}
                              {Number(event.menu_price_soir) > 0 && <span>Soir : {Number(event.menu_price_soir).toFixed(2)}€</span>}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-xs text-mf-muted font-mono truncate max-w-[260px]">
                              /reservation/{event.slug || event.id}
                            </span>
                            <button
                              type="button"
                              title="Copier le lien de réservation"
                              onClick={() => handleCopy(event.id, `${window.location.origin}/reservation/${event.slug || event.id}`)}
                              className="shrink-0 text-mf-muted hover:text-mf-rose transition-colors"
                            >
                              {copiedId === event.id
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleToggleActive(event)} disabled={updateEvent.isPending}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${event.is_active ? 'bg-mf-blanc-casse text-mf-muted hover:bg-mf-poudre/20' : 'bg-status-green/10 text-status-green hover:bg-status-green/20'}`}>
                          {event.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => setEditingId(event.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mf-muted bg-mf-blanc-casse rounded-lg hover:bg-mf-poudre/20 transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Modifier
                        </button>
                        <button onClick={() => handleDelete(event)} disabled={deleteEvent.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slot capacity */}
                <div className="border-t px-6 py-3">
                  <SlotCapacityConfig eventId={event.id} />
                </div>

                {/* Menu config toggle */}
                <div className="border-t">
                  <button
                    type="button"
                    onClick={() => setExpandedMenuId(expandedMenuId === event.id ? null : event.id)}
                    className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-mf-muted hover:bg-mf-blanc-casse transition-colors"
                    data-tour="menu-config"
                  >
                    <span className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      Configurer le menu
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenuId === event.id ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedMenuId === event.id && (
                    <div className="px-6 pb-6">
                      <EventMenuConfig eventId={event.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete modal (double validation) */}
      {deleteModal && (
        <ConfirmDeleteModal
          title="Supprimer l'événement"
          description={`L'événement "${deleteModal.name}" et toutes ses données (créneaux, commandes) seront définitivement supprimés. Cette action est irréversible.`}
          confirmText={deleteModal.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
          loading={deleteEvent.isPending}
        />
      )}
    </div>
  );
}
