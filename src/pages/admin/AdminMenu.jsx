import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, UtensilsCrossed } from 'lucide-react';
import { useMenuCatalog, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useMenuItems';

const TYPES = [
  { value: 'entree', label: 'Entrée' },
  { value: 'plat', label: 'Plat' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'boisson', label: 'Boisson' },
];

const TAG_OPTIONS = ['Vegan', 'Végétarien', 'Sans gluten', 'Sans lactose', 'Bio', 'Épicé'];

const TAG_COLORS = {
  Vegan: 'bg-green-100 text-green-700',
  'Végétarien': 'bg-emerald-100 text-emerald-700',
  'Sans gluten': 'bg-amber-100 text-amber-700',
  'Sans lactose': 'bg-orange-100 text-orange-700',
  Bio: 'bg-lime-100 text-lime-700',
  'Épicé': 'bg-red-100 text-red-700',
};

const COLUMN_CONFIG = [
  { type: 'entree', title: 'Entrées' },
  { type: 'plat', title: 'Plats' },
  { type: 'dessert', title: 'Desserts' },
  { type: 'boisson', title: 'Boissons' },
];

const EMPTY_FORM = {
  name: '',
  type: 'entree',
  price: '',
  description: '',
  available: true,
  tags: [],
};

export default function AdminMenu() {
  const { data: menuItems = [], isLoading: itemsLoading } = useMenuCatalog();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      price: String(item.price),
      description: item.description || '',
      available: item.available,
      tags: item.tags || [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleTagToggle = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      type: form.type,
      price: parseFloat(form.price),
      description: form.description.trim(),
      available: form.available,
      tags: form.tags,
    };

    try {
      if (editingId) {
        await updateMenuItem.mutateAsync({ id: editingId, ...payload });
      } else {
        await createMenuItem.mutateAsync(payload);
      }
      closeForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer "${item.name}" ? Cette action est irréversible.`)) return;

    try {
      await deleteMenuItem.mutateAsync(item.id);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression. Veuillez réessayer.');
    }
  };

  const isSaving = createMenuItem.isPending || updateMenuItem.isPending;

  const itemsByType = (type) => menuItems.filter((item) => item.type === type);

  return (
    <div className="bg-slate-50 min-h-screen px-3 py-4 sm:px-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Catalogue menu</h1>
            <p className="text-sm text-gray-500 mt-1">Articles disponibles pour tous les événements</p>
          </div>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un article
          </button>
        </div>

        {/* Loading items */}
        {itemsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          /* 4-column grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMN_CONFIG.map((col) => {
              const items = itemsByType(col.type);
              return (
                <div key={col.type} className="space-y-3">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {col.title}
                    </h2>
                    <span className="text-xs text-gray-400 font-medium">
                      {items.length} article{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Items */}
                  {items.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200 p-6 text-center">
                      <p className="text-sm text-gray-400">Aucun article</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl shadow-sm p-4 space-y-3 border border-gray-100"
                      >
                        {/* Name + price */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                            {item.name}
                          </h3>
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                            {Number(item.price).toFixed(2)}€
                          </span>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* Availability badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.available ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                              <Check className="w-3 h-3" />
                              Disponible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                              <X className="w-3 h-3" />
                              Indisponible
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-600'}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                          <button
                            onClick={() => openEditForm(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deleteMenuItem.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Modifier l\'article' : 'Nouvel article'}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">
                  Nom *
                </label>
                <input
                  id="item-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Salade César"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label htmlFor="item-type" className="block text-sm font-medium text-gray-700">
                  Type *
                </label>
                <select
                  id="item-type"
                  required
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <label htmlFor="item-price" className="block text-sm font-medium text-gray-700">
                  Prix (€) *
                </label>
                <input
                  id="item-price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="item-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="item-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du plat..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Available */}
              <div className="flex items-center gap-2">
                <input
                  id="item-available"
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="item-available" className="text-sm font-medium text-gray-700">
                  Disponible à la commande
                </label>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <span className="block text-sm font-medium text-gray-700">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => {
                    const isSelected = form.tags.includes(tag);
                    return (
                      <label
                        key={tag}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTagToggle(tag)}
                          className="sr-only"
                        />
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {tag}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingId ? 'Enregistrer' : 'Créer l\'article'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
