import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { useMenuCatalog, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useMenuItems';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import MfButton from '@/components/ui/MfButton';
import MfInput from '@/components/ui/MfInput';
import MfBadge from '@/components/ui/MfBadge';
import PageTour from '@/components/onboarding/PageTour';

const CATEGORIES = [
  { key: 'entree', label: 'Entrées', icon: '🥗' },
  { key: 'plat', label: 'Plats', icon: '🍽' },
  { key: 'dessert', label: 'Desserts', icon: '🍰' },
  { key: 'boisson', label: 'Boissons', icon: '🥤' },
];

const TAG_OPTIONS = ['Vegan', 'Végétarien', 'Sans gluten', 'Sans lactose', 'Bio', 'Épicé'];

const EMPTY_FORM = {
  name: '',
  type: 'entree',
  price: '',
  description: '',
  available: true,
  tags: [],
};

export default function AdminMenu() {
  const { data: menuItems = [], isLoading } = useMenuCatalog();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  const [activeCat, setActiveCat] = useState('entree');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteModal, setDeleteModal] = useState(null);

  // ─── Computed ───
  const catCounts = CATEGORIES.map((c) => ({
    ...c,
    count: menuItems.filter((i) => i.type === c.key).length,
  }));

  const filtered = menuItems.filter(
    (i) =>
      i.type === activeCat &&
      i.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Form handlers ───
  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type: activeCat });
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
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await updateMenuItem.mutateAsync({ id: item.id, available: !item.available });
    } catch (error) {
      console.error('Erreur toggle disponibilité:', error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteMenuItem.mutateAsync(deleteModal.id);
      setDeleteModal(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const isSaving = createMenuItem.isPending || updateMenuItem.isPending;

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose mx-auto" />
          <p className="font-body text-[13px] text-mf-muted">Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1000px]">
      <PageTour page="menu" />
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-[28px] italic text-mf-rose">La Carte</h1>
          <p className="font-body text-[13px] text-mf-muted mt-0.5">
            {menuItems.length} plat{menuItems.length !== 1 ? 's' : ''} au catalogue
          </p>
        </div>
        <MfButton onClick={openCreateForm} size="sm" data-tour="add-menu-item">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Ajouter un plat
        </MfButton>
      </div>

      {/* ─── Category Tabs ─── */}
      <div className="flex gap-2 flex-wrap" data-tour="category-tabs">
        {catCounts.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCat(c.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-pill font-body text-[12px] border transition-all duration-200 cursor-pointer ${
              activeCat === c.key
                ? 'bg-mf-rose border-mf-rose text-mf-blanc-casse'
                : 'bg-mf-white border-mf-border text-mf-marron-glace hover:border-mf-rose/40'
            }`}
          >
            <span>{c.icon}</span>
            {c.label}
            <span
              className={`text-[10px] px-1.5 rounded-pill ${
                activeCat === c.key
                  ? 'text-mf-poudre bg-mf-marron-glace/30'
                  : 'text-mf-muted bg-mf-blanc-casse'
              }`}
            >
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Search ─── */}
      <div className="relative max-w-xs">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-muted-light" />
        <input
          placeholder="Rechercher un plat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-pill border border-mf-border bg-mf-white font-body text-[13px] text-mf-marron-glace placeholder:text-mf-muted-light outline-none focus:border-mf-rose transition-colors"
        />
      </div>

      {/* ─── Items List ─── */}
      <div className="flex flex-col gap-2.5">
        {filtered.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onEdit={openEditForm}
            onToggle={toggleAvailability}
            onDelete={setDeleteModal}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-[28px] opacity-30 mb-2">❋</div>
            <p className="font-body text-[13px] text-mf-muted">Aucun plat dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* ─── Edit / Create Modal ─── */}
      {showForm && (
        <EditModal
          editingId={editingId}
          form={form}
          setForm={setForm}
          onTagToggle={handleTagToggle}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSaving={isSaving}
        />
      )}

      {/* ─── Delete Modal ─── */}
      {deleteModal && (
        <ConfirmDeleteModal
          title="Supprimer l'article"
          description={`L'article "${deleteModal.name}" sera définitivement supprimé du catalogue. Cette action est irréversible.`}
          confirmText={deleteModal.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
          loading={deleteMenuItem.isPending}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Item Card
// ─────────────────────────────────────────
function ItemCard({ item, onEdit, onToggle, onDelete }) {
  return (
    <div
      className={`flex items-center gap-3 p-4 bg-mf-white rounded-[14px] border border-mf-border transition-all duration-200 hover:border-mf-rose/30 ${
        !item.available ? 'opacity-55' : ''
      }`}
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-body text-[14px] font-medium text-mf-marron-glace">{item.name}</span>
          {!item.available && <MfBadge variant="red">Indisponible</MfBadge>}
        </div>
        {item.description && (
          <p className="font-body text-[12px] text-mf-muted leading-relaxed line-clamp-1">{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map((tag) => (
              <MfBadge key={tag} variant="olive">{tag}</MfBadge>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="text-right shrink-0 min-w-[70px]">
        <span className="font-body text-[15px] font-medium text-mf-rose">
          {Number(item.price).toFixed(2)} €
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onToggle(item)}
          title={item.available ? 'Rendre indisponible' : 'Rendre disponible'}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[13px] transition-all duration-200 cursor-pointer ${
            item.available
              ? 'border-status-green/30 text-status-green hover:bg-status-green/8'
              : 'border-mf-border text-mf-muted hover:border-mf-rose/30'
          }`}
        >
          {item.available ? '●' : '○'}
        </button>
        <button
          onClick={() => onEdit(item)}
          title="Modifier"
          className="w-8 h-8 rounded-lg border border-mf-border flex items-center justify-center text-mf-rose hover:bg-mf-poudre/20 transition-all duration-200 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item)}
          title="Supprimer"
          className="w-8 h-8 rounded-lg border border-mf-border flex items-center justify-center text-status-red hover:bg-status-red/8 transition-all duration-200 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Edit / Create Modal
// ─────────────────────────────────────────
function EditModal({ editingId, form, setForm, onTagToggle, onSubmit, onClose, isSaving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-mf-marron-glace/30" />
      <div className="relative bg-mf-white rounded-card w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-mf-border">
          <h2 className="font-serif text-[22px] italic text-mf-rose">
            {editingId ? 'Modifier' : 'Nouveau plat'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-mf-muted hover:text-mf-rose rounded-lg transition-colors cursor-pointer bg-transparent border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <MfInput
            label="Nom du plat"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Velouté de butternut"
          />

          <MfInput
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Noisettes torréfiées, crème d'estragon"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">
                Catégorie
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-pill border border-mf-border px-5 py-3 font-body text-[15px] text-mf-marron-glace bg-mf-white outline-none focus:border-mf-rose transition-colors cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <MfInput
              label="Prix (€)"
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <ToggleSwitch
            value={form.available}
            onChange={(v) => setForm({ ...form, available: v })}
            label="Disponible à la commande"
          />

          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">Tags</span>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const isSelected = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-pill font-body text-[11px] border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-mf-vert-olive/12 border-mf-vert-olive/30 text-mf-vert-olive'
                        : 'bg-mf-white border-mf-border text-mf-muted hover:border-mf-vert-olive/30'
                    }`}
                  >
                    {isSelected && '✓ '}{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-mf-border">
            <MfButton type="button" variant="secondary" onClick={onClose} className="flex-1">
              Annuler
            </MfButton>
            <MfButton
              type="submit"
              disabled={isSaving || !form.name.trim() || !form.price}
              className="flex-[2]"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </MfButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Toggle Switch
// ─────────────────────────────────────────
function ToggleSwitch({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
    >
      <div
        className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors duration-200 ${
          value ? 'bg-mf-rose' : 'bg-mf-border'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      <span className={`font-body text-[12px] ${value ? 'text-mf-marron-glace' : 'text-mf-muted'}`}>
        {label}
      </span>
    </button>
  );
}
