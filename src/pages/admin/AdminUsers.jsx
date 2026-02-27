import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Shield, ChefHat, User, ChevronDown } from 'lucide-react';
import { useProfiles, useUpdateProfile } from '@/hooks/useProfiles';

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-red-100 text-red-700' },
  staff: { label: 'Staff', icon: ChefHat, color: 'bg-blue-100 text-blue-700' },
  customer: { label: 'Client', icon: User, color: 'bg-gray-100 text-gray-600' },
};

function RoleSelect({ currentRole, profileId, onUpdate, isPending }) {
  const [open, setOpen] = useState(false);

  const handleChange = (newRole) => {
    if (newRole !== currentRole) {
      onUpdate({ id: profileId, role: newRole });
    }
    setOpen(false);
  };

  const config = ROLE_CONFIG[currentRole] || ROLE_CONFIG.customer;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.color} hover:opacity-80 transition-opacity disabled:opacity-50`}
      >
        <config.icon className="w-3 h-3" />
        {config.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
              <button
                key={role}
                onClick={() => handleChange(role)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left ${role === currentRole ? 'font-medium text-blue-600' : 'text-gray-700'}`}
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

export default function AdminUsers() {
  const { data: profiles = [], isLoading, error } = useProfiles();
  const updateProfile = useUpdateProfile();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? profiles
    : profiles.filter((p) => p.role === filter);

  const counts = {
    all: profiles.length,
    admin: profiles.filter((p) => p.role === 'admin').length,
    staff: profiles.filter((p) => p.role === 'staff').length,
    customer: profiles.filter((p) => p.role === 'customer').length,
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
      <div className="p-6 text-center">
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez les rôles et accès</p>
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
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur dans cette catégorie.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {(profile.display_name || profile.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile.display_name || 'Sans nom'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{profile.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {format(new Date(profile.created_at), 'd MMM yyyy', { locale: fr })}
                  </span>
                  <RoleSelect
                    currentRole={profile.role}
                    profileId={profile.id}
                    onUpdate={updateProfile.mutate}
                    isPending={updateProfile.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
