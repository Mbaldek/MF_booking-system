import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Pencil, Trash2, X, Check, Calendar, Image, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useMenuCatalog, useAllEventMenuItems, useLinkMenuToEvent, useUnlinkMenuFromEvent, useUpdateEventMenuItem } from '@/hooks/useMenuItems';
import { supabase } from '@/api/supabase';

const TYPE_LABELS = { entree: 'Entrées', plat: 'Plats', dessert: 'Desserts', boisson: 'Boissons' };
const TYPE_ORDER = ['entree', 'plat', 'dessert', 'boisson'];

function EventForm({ initialData, onSubmit, onCancel, isPending }) {
  const [name, setName] = useState(initialData?.name || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [mealService, setMealService] = useState(initialData?.meal_service || 'both');
  const [menuPriceMidi, setMenuPriceMidi] = useState(initialData?.menu_price_midi ?? '');
  const [menuPriceSoir, setMenuPriceSoir] = useState(initialData?.menu_price_soir ?? '');

  const showMidi = mealService === 'midi' || mealService === 'both';
  const showSoir = mealService === 'soir' || mealService === 'both';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      start_date: startDate,
      end_date: endDate,
      description: description.trim() || null,
      meal_service: mealService,
      menu_price_midi: showMidi ? (parseFloat(menuPriceMidi) || 0) : 0,
      menu_price_soir: showSoir ? (parseFloat(menuPriceSoir) || 0) : 0,
    });
  };

  const hasPrices = (showMidi ? parseFloat(menuPriceMidi) > 0 : true) && (showSoir ? parseFloat(menuPriceSoir) > 0 : true);
  const isValid = name.trim() && startDate && endDate && endDate >= startDate && hasPrices;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">Nom *</label>
        <input id="event-name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Salon de la Gastronomie 2026"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Date de début *</label>
          <input id="start-date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div className="space-y-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Date de fin *</label>
          <input id="end-date" type="date" required value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="event-desc" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="event-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de l'événement..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
      </div>

      {/* Meal service type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Service repas *</label>
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
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
            <label htmlFor="price-midi" className="block text-sm font-medium text-gray-700">Prix menu midi (€) *</label>
            <input id="price-midi" type="number" min="0" step="0.01" value={menuPriceMidi}
              onChange={(e) => setMenuPriceMidi(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        )}
        {showSoir && (
          <div className="space-y-1">
            <label htmlFor="price-soir" className="block text-sm font-medium text-gray-700">Prix menu soir (€) *</label>
            <input id="price-soir" type="number" min="0" step="0.01" value={menuPriceSoir}
              onChange={(e) => setMenuPriceSoir(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        )}
      </div>

      {startDate && endDate && endDate < startDate && (
        <p className="text-sm text-red-500">La date de fin doit être après la date de début.</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={!isValid || isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isPending ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Enregistrement...</>
          ) : (
            <><Check className="w-4 h-4" /> Enregistrer</>
          )}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" /> Annuler
          </button>
        )}
      </div>
    </form>
  );
}

function EventMenuConfig({ eventId }) {
  const { data: catalog = [] } = useMenuCatalog();
  const { data: linked = [] } = useAllEventMenuItems(eventId);
  const linkMutation = useLinkMenuToEvent();
  const unlinkMutation = useUnlinkMenuFromEvent();
  const updateEmi = useUpdateEventMenuItem();

  const linkedMap = {};
  linked.forEach((emi) => { linkedMap[emi.menu_item_id] = emi; });

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
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{TYPE_LABELS[type]}</h4>
            <div className="space-y-1.5">
              {items.map((item) => {
                const emi = linkedMap[item.id];
                const isLinked = !!emi;
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isLinked ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white'}`}>
                    <button type="button" onClick={() => handleToggle(item)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isLinked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {isLinked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{Number(item.price).toFixed(2)}€</span>
                    </div>
                    {isLinked && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={Number(item.price).toFixed(2)}
                        defaultValue={emi.custom_price ?? ''}
                        onBlur={(e) => handlePriceChange(emi, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <p className="text-sm text-gray-400 text-center py-4">Aucun article dans le catalogue. Ajoutez des articles dans "Menu" d'abord.</p>
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
          className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 transition-colors disabled:opacity-50">
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          ) : (
            <><Image className="w-5 h-5 text-gray-400" /><span className="text-[10px] text-gray-400 mt-1">Photo</span></>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
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

  const handleDelete = async (event) => {
    if (!window.confirm(`Supprimer l'événement "${event.name}" ? Cette action est irréversible.`)) return;
    try {
      await deleteEvent.mutateAsync(event.id);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center space-y-3">
          <p className="text-red-600 font-medium">Erreur lors du chargement</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen px-3 py-4 sm:px-4 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Événements</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez vos salons, foires et congrès</p>
          </div>
          {!showCreateForm && (
            <button onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Créer un événement
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Nouvel événement</h2>
            <p className="text-sm text-gray-500 mb-4">Les créneaux repas seront auto-générés pour chaque jour.</p>
            <EventForm onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} isPending={createEvent.isPending} />
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun événement</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre premier événement pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  {editingId === event.id ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Modifier l'événement</h3>
                      <EventForm initialData={event} onSubmit={handleUpdate} onCancel={() => setEditingId(null)} isPending={updateEvent.isPending} />
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <EventImageUpload event={event} onUpdate={handleImageUpdate} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {event.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.start_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })} — {format(new Date(event.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}
                          </p>
                          {event.description && <p className="text-xs text-gray-400 mt-1">{event.description}</p>}
                          {(Number(event.menu_price_midi) > 0 || Number(event.menu_price_soir) > 0) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {Number(event.menu_price_midi) > 0 && <span>Midi : {Number(event.menu_price_midi).toFixed(2)}€</span>}
                              {Number(event.menu_price_midi) > 0 && Number(event.menu_price_soir) > 0 && <span> · </span>}
                              {Number(event.menu_price_soir) > 0 && <span>Soir : {Number(event.menu_price_soir).toFixed(2)}€</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleToggleActive(event)} disabled={updateEvent.isPending}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${event.is_active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                          {event.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => setEditingId(event.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
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

                {/* Menu config toggle */}
                <div className="border-t">
                  <button
                    type="button"
                    onClick={() => setExpandedMenuId(expandedMenuId === event.id ? null : event.id)}
                    className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
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
    </div>
  );
}
