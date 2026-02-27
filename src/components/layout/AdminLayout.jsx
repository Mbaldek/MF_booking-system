import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  TrendingUp, Calendar, UtensilsCrossed, ShoppingBag, MapPin,
  History, BarChart3, Mail, Users, Home, Menu, X, LogOut,
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Tableau de bord', icon: TrendingUp, end: true },
  { path: '/admin/events', label: 'Événements', icon: Calendar },
  { path: '/admin/menu', label: 'Menus', icon: UtensilsCrossed },
  { path: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
  { path: '/admin/delivery', label: 'Suivi livraisons', icon: MapPin },
  { path: '/admin/history', label: 'Historique', icon: History },
  { path: '/admin/stats', label: 'Statistiques', icon: BarChart3 },
  { path: '/admin/reminders', label: 'Rappels email', icon: Mail },
  { path: '/admin/users', label: 'Accès & droits', icon: Users },
];

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();

  function isActive(item) {
    if (item.end) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#8B3A43] rounded-lg flex items-center justify-center p-1.5">
              <img src="/monogram-white.svg" alt="MF" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 font-brand">Maison Félicien</h1>
              <p className="text-xs text-gray-500">Administration</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t bg-white pb-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">Retour accueil</span>
            </Link>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b ${
                    active ? 'bg-[#8B3A43]/10 text-[#8B3A43] font-semibold' : 'text-gray-700'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B3A43] rounded-lg flex items-center justify-center p-2">
              <img src="/monogram-white.svg" alt="MF" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-brand">Maison Félicien</h1>
              <p className="text-xs text-gray-500">Administration</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Retour accueil</span>
          </Link>

          <div className="pt-4 pb-2 px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Administration
            </p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-[#8B3A43] text-white font-semibold shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-gray-600">
                {(profile?.display_name || profile?.email || '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.display_name || profile?.email}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
}
