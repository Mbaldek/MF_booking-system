import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Shield, ChefHat, User, ChevronDown, Plus, X, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useProfiles, useUpdateProfile, useCreateUser, useDeleteUser } from '@/hooks/useProfiles';
import MfButton from '@/components/ui/MfButton';
import MfInput from '@/components/ui/MfInput';

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-mf-poudre/40 text-mf-rose' },
  staff: { label: 'Staff', icon: ChefHat, color: 'bg-mf-vert-olive/15 text-mf-vert-olive' },
  customer: { label: 'Client', icon: User, color: 'bg-mf-marron-glace/10 text-mf-marron-glace' },
};

/* ── Role Dropdown ── */
function RoleSelect({ currentRole, profileId, onUpdate, isPending }) {
  const [open, setOpen] = useState(false);

  const handleChange = (newRole) => {
    if (newRole !== currentRole) onUpdate({ id: profileId, role: newRole });
    setOpen(false);
  };

  const config = ROLE_CONFIG[currentRole] || ROLE_CONFIG.customer;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-body uppercase tracking-wider rounded-full ${config.color} hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer border-none`}
      >
        <config.icon className="w-3 h-3" />
        {config.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-mf-border py-1 z-20 min-w-35">
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
              <button
                key={role}
                onClick={() => handleChange(role)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-body hover:bg-mf-blanc-casse text-left cursor-pointer border-none bg-transparent ${role === currentRole ? 'font-medium text-mf-rose' : 'text-mf-marron-glace'}`}
              >
                <cfg.icon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Create User Modal ── */
function CreateUserModal({ onClose }) {
  const createUser = useCreateUser();
  const [form, setForm] = useState({ display_name: '', email: '', phone: '', password: '', role: 'staff' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await createUser.mutateAsync(form);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-mf-marron-glace/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-mf-border shadow-lg w-full max-w-md mx-4 p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-mf-muted hover:text-mf-rose cursor-pointer bg-transparent border-none p-1">
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-serif text-[22px] italic text-mf-rose mb-5">Nouvel utilisateur</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {error && (
            <div className="bg-status-red/10 text-status-red font-body text-[13px] p-3 rounded-xl">{error}</div>
          )}

          <MfInput label="Nom complet" required value={form.display_name} onChange={set('display_name')} placeholder="Jean Dupont" />
          <MfInput label="Email" type="email" required value={form.email} onChange={set('email')} placeholder="jean@exemple.com" />
          <MfInput label="Telephone" type="tel" value={form.phone} onChange={set('phone')} placeholder="06 12 34 56 78" />

          <div className="relative">
            <MfInput
              label="Mot de passe"
              type={showPw ? 'text' : 'password'}
              required
              value={form.password}
              onChange={set('password')}
              placeholder="Min. 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-8.5 text-mf-muted hover:text-mf-rose bg-transparent border-none cursor-pointer p-0"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">Role</label>
            <div className="flex gap-2">
              {['staff', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`flex-1 py-2.5 rounded-full font-body text-[13px] uppercase tracking-wider border cursor-pointer transition-colors ${
                    form.role === r
                      ? 'bg-mf-rose text-white border-mf-rose'
                      : 'bg-white text-mf-marron-glace border-mf-border hover:border-mf-rose/40'
                  }`}
                >
                  {r === 'staff' ? 'Staff' : 'Admin'}
                </button>
              ))}
            </div>
          </div>

          <MfButton type="submit" fullWidth disabled={createUser.isPending} className="mt-2">
            {createUser.isPending ? 'Creation...' : 'Creer le compte'}
          </MfButton>
        </form>
      </div>
    </div>
  );
}

/* ── Edit User Modal ── */
function EditUserModal({ profile, onClose }) {
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({
    display_name: profile.display_name || '',
    phone: profile.phone || '',
  });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await updateProfile.mutateAsync({ id: profile.id, ...form });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-mf-marron-glace/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-mf-border shadow-lg w-full max-w-md mx-4 p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-mf-muted hover:text-mf-rose cursor-pointer bg-transparent border-none p-1">
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-serif text-[22px] italic text-mf-rose mb-1">Modifier l'utilisateur</h2>
        <p className="font-body text-[13px] text-mf-muted mb-5">{profile.email}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {error && (
            <div className="bg-status-red/10 text-status-red font-body text-[13px] p-3 rounded-xl">{error}</div>
          )}

          <MfInput label="Nom complet" value={form.display_name} onChange={set('display_name')} placeholder="Jean Dupont" />
          <MfInput label="Telephone" type="tel" value={form.phone} onChange={set('phone')} placeholder="06 12 34 56 78" />

          <MfButton type="submit" fullWidth disabled={updateProfile.isPending} className="mt-2">
            {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </MfButton>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AdminUsers() {
  const { data: profiles = [], isLoading, error } = useProfiles();
  const updateProfile = useUpdateProfile();
  const deleteUser = useDeleteUser();
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = filter === 'all'
    ? profiles
    : profiles.filter((p) => p.role === filter);

  const counts = {
    all: profiles.length,
    admin: profiles.filter((p) => p.role === 'admin').length,
    staff: profiles.filter((p) => p.role === 'staff').length,
    customer: profiles.filter((p) => p.role === 'customer').length,
  };

  function handleDelete(profileId) {
    deleteUser.mutate(profileId, { onSuccess: () => setConfirmDelete(null) });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-status-red font-body">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-mf-marron-glace">Utilisateurs</h1>
          <p className="text-sm text-mf-muted mt-1 font-body">Gerez les roles et acces</p>
        </div>
        <MfButton size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          Ajouter
        </MfButton>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'admin', label: 'Admins' },
          { key: 'staff', label: 'Staff' },
          { key: 'customer', label: 'Clients' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 text-[12px] font-body uppercase tracking-wider rounded-full transition-colors cursor-pointer border-none ${
              filter === tab.key
                ? 'bg-mf-rose text-white'
                : 'bg-mf-blanc-casse text-mf-marron-glace hover:bg-mf-poudre/30'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="bg-white rounded-2xl border border-mf-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-mf-poudre mx-auto mb-4" />
            <p className="text-mf-muted font-body">Aucun utilisateur dans cette categorie.</p>
          </div>
        ) : (
          <div className="divide-y divide-mf-border/50">
            {filtered.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between px-5 py-4 hover:bg-mf-blanc-casse/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-mf-poudre/50 flex items-center justify-center text-mf-rose text-sm font-body font-medium shrink-0">
                    {(profile.display_name || profile.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-body font-medium text-mf-marron-glace truncate">
                      {profile.display_name || 'Sans nom'}
                    </p>
                    <p className="text-[12px] text-mf-muted font-body truncate">{profile.email || '—'}</p>
                    {profile.phone && (
                      <p className="text-[11px] text-mf-muted font-body">{profile.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-mf-muted font-body hidden sm:block">
                    {format(new Date(profile.created_at), 'd MMM yyyy', { locale: fr })}
                  </span>
                  <RoleSelect
                    currentRole={profile.role}
                    profileId={profile.id}
                    onUpdate={updateProfile.mutate}
                    isPending={updateProfile.isPending}
                  />
                  <button
                    onClick={() => setEditingProfile(profile)}
                    className="p-1.5 text-mf-muted hover:text-mf-rose transition-colors bg-transparent border-none cursor-pointer"
                    title="Modifier"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(profile)}
                    className="p-1.5 text-mf-muted hover:text-status-red transition-colors bg-transparent border-none cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editingProfile && <EditUserModal profile={editingProfile} onClose={() => setEditingProfile(null)} />}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-mf-marron-glace/30" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl border border-mf-border shadow-lg w-full max-w-sm mx-4 p-6 z-10 text-center">
            <Trash2 className="w-10 h-10 text-status-red mx-auto mb-3" />
            <h3 className="font-serif text-[18px] italic text-mf-marron-glace mb-2">Supprimer cet utilisateur ?</h3>
            <p className="font-body text-[13px] text-mf-muted mb-5">
              {confirmDelete.display_name || confirmDelete.email}
            </p>
            <div className="flex gap-3">
              <MfButton variant="secondary" fullWidth onClick={() => setConfirmDelete(null)}>
                Annuler
              </MfButton>
              <MfButton
                fullWidth
                className="bg-status-red! hover:opacity-90!"
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Suppression...' : 'Supprimer'}
              </MfButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
