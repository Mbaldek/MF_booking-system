import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  TrendingUp, Calendar, UtensilsCrossed, ShoppingBag,
  ClipboardList, BarChart3, Mail, Users, Home, LogOut, ChefHat, BookOpen,
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Tableau de bord', icon: TrendingUp, end: true },
  { path: '/admin/events', label: 'Événements', icon: Calendar },
  { path: '/admin/menu', label: 'La Carte', icon: UtensilsCrossed },
  { path: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
  { path: '/admin/operations', label: 'Prépa & Livraison', icon: ClipboardList },
  { path: '/admin/restaurant', label: 'Réservations', icon: BookOpen },
  { path: '/admin/stats', label: 'Statistiques', icon: BarChart3 },
  { path: '/admin/reminders', label: 'Rappels email', icon: Mail },
  { path: '/admin/users', label: 'Accès & droits', icon: Users },
];

export default function AdminSidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  function isActive(item) {
    if (item.end) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  }

  return (
    <aside className="fixed left-0 top-0 w-[220px] min-h-screen bg-white border-r border-mf-border flex flex-col z-40">
      {/* Logo + Admin badge */}
      <div className="text-center py-6 px-5 mb-2">
        <div className="font-body text-[9px] uppercase tracking-[0.3em] text-mf-vieux-rose">
          Maison
        </div>
        <div className="font-serif text-[22px] italic text-mf-rose">
          Félicien
        </div>
        <span className="inline-block mt-1.5 font-body text-[9px] uppercase tracking-[0.1em] text-mf-rose bg-mf-rose/8 rounded-pill px-3 py-1">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1">
        <Link
          to="/"
          className="flex items-center gap-2.5 w-full px-6 py-2.5 text-mf-muted hover:text-mf-rose transition-all duration-200 font-body text-[13px] border-r-[2.5px] border-transparent"
        >
          <Home className="w-4 h-4" />
          Accueil
        </Link>
        <Link
          to="/staff/kitchen"
          className="flex items-center gap-2.5 w-full px-6 py-2.5 text-mf-muted hover:text-mf-rose transition-all duration-200 font-body text-[13px] border-r-[2.5px] border-transparent"
        >
          <ChefHat className="w-4 h-4" />
          Espace Staff
        </Link>

        <div className="h-px bg-mf-border mx-5 my-2" />

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 w-full px-6 py-2.5 transition-all duration-200 font-body text-[13px] border-r-[2.5px] ${
                active
                  ? 'bg-mf-poudre/20 border-mf-rose text-mf-rose'
                  : 'border-transparent text-mf-muted hover:text-mf-marron-glace'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-mf-border">
        <div className="font-body text-[12px] font-medium text-mf-marron-glace truncate">
          {profile?.display_name || 'Admin'}
        </div>
        <div className="font-body text-[11px] text-mf-muted truncate">
          {profile?.email}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 mt-3 font-body text-[12px] text-mf-muted hover:text-mf-rose transition-colors cursor-pointer bg-transparent border-none"
        >
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
