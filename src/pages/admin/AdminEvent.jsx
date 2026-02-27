import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Pencil, Trash2, X, Check, Calendar } from 'lucide-react';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';

function EventForm({ initialData, onSubmit, onCancel, isPending }) {
  const [name, setName] = useState(initialData?.name || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, start_date: startDate, end_date: endDate });
  };

  const isValid = name.trim() && startDate && endDate && endDate >= startDate;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">
          Nom de l'événement
        </label>
        <input
          id="event-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Salon de la Gastronomie 2026"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
            Date de début
          </label>
          <input
            id="start-date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
            Date de fin
          </label>
          <input
            id="end-date"
            type="date"
            required
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {startDate && endDate && endDate < startDate && (
        <p className="text-sm text-red-500">La date de fin doit être après la date de début.</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!isValid || isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Enregistrer
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

export default function AdminEvent() {
  const { data: events = [], isLoading, error } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  const handleDelete = async (event) => {
    const confirmed = window.confirm(
      `Supprimer l'événement "${event.name}" ? Cette action est irréversible et supprimera tous les créneaux associés.`
    );
    if (!confirmed) return;

    try {
      await deleteEvent.mutateAsync(event.id);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression de l\'événement.');
    }
  };

  const handleToggleActive = async (event) => {
    try {
      await updateEvent.mutateAsync({ id: event.id, is_active: !event.is_active });
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      alert('Erreur lors du changement de statut.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center space-y-3">
          <p className="text-red-600 font-medium">Erreur lors du chargement des événements</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen px-3 py-4 sm:px-4 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Événements</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez vos salons, foires et congrès
            </p>
          </div>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Créer un événement
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Nouvel événement</h2>
            <p className="text-sm text-gray-500 mb-4">
              Les créneaux repas (midi et soir) seront automatiquement générés pour chaque jour de l'événement.
            </p>
            <EventForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              isPending={createEvent.isPending}
            />
          </div>
        )}

        {/* Event list */}
        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun événement</p>
            <p className="text-sm text-gray-400 mt-1">
              Créez votre premier événement pour commencer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                {editingId === event.id ? (
                  /* Edit mode */
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Modifier l'événement</h3>
                    <EventForm
                      initialData={event}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingId(null)}
                      isPending={updateEvent.isPending}
                    />
                  </div>
                ) : (
                  /* Display mode */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {event.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.start_date + 'T00:00:00'), 'd MMMM yyyy', { locale: fr })}
                        {' — '}
                        {format(new Date(event.end_date + 'T00:00:00'), 'd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(event)}
                        disabled={updateEvent.isPending}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          event.is_active
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {event.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => setEditingId(event.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        disabled={deleteEvent.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
