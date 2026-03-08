import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useUnseenOrderCount } from '@/hooks/useOrders';
import {
  TrendingUp, Calendar, UtensilsCrossed, ShoppingBag,
  ClipboardList, BarChart3, Mail, Users, Home, LogOut, ChefHat, BookOpen, Bell, HelpCircle,
} from 'lucide-react';
import { resetTour } from '@/components/onboarding/PageTour';

// Map route paths to tour page keys
const TOUR_PAGE_MAP = {
  '/admin': 'dashboard',
  '/admin/events': 'events',
  '/admin/menu': 'menu',
  '/admin/orders': 'orders',
  '/admin/users': 'users',
};

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
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminSidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const { data: unseenCount } = useUnseenOrderCount();

  function isActive(item) {
    if (item.end) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  }

  return (
    <aside className="fixed left-0 top-0 w-[220px] min-h-screen bg-white border-r border-mf-border flex flex-col z-40">
      {/* Logo + Admin badge */}
      <div className="flex flex-col items-center py-6 px-5 mb-2">
        <img src="/brand/Monogramme-Rose.svg" alt="MF" className="h-10 w-auto" />
        <span className="inline-block mt-2 font-body text-[9px] uppercase tracking-[0.1em] text-mf-rose bg-mf-rose/8 rounded-pill px-3 py-1">
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
              {item.path === '/admin/orders' && unseenCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-mf-rose text-white font-body text-[10px] font-medium">
                  {unseenCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Help button */}
      {TOUR_PAGE_MAP[location.pathname] && (
        <div className="px-5 pb-2">
          <button
            onClick={() => {
              const page = TOUR_PAGE_MAP[location.pathname];
              resetTour(page);
              window.dispatchEvent(new CustomEvent('mf-tour-restart', { detail: page }));
              // Force re-render by navigating to same page
              window.location.reload();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-mf-muted hover:text-mf-rose hover:bg-mf-poudre/15 transition-all duration-200 font-body text-[12px] bg-transparent border-none cursor-pointer"
            title="Relancer le guide de cette page"
          >
            <HelpCircle className="w-4 h-4" />
            Guide de la page
          </button>
        </div>
      )}

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
