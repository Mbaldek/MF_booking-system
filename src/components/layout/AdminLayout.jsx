import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import AdminSidebar from './AdminSidebar';
import {
  TrendingUp, Calendar, UtensilsCrossed, ShoppingBag,
  ClipboardList, BarChart3, Mail, Users, Home, Menu, X, LogOut, ChefHat,
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Tableau de bord', icon: TrendingUp, end: true },
  { path: '/admin/events', label: 'Événements', icon: Calendar },
  { path: '/admin/menu', label: 'La Carte', icon: UtensilsCrossed },
  { path: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
  { path: '/admin/operations', label: 'Prépa & Livraison', icon: ClipboardList },
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
    <div className="min-h-screen bg-mf-blanc-casse">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-mf-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-body text-[8px] uppercase tracking-[0.3em] text-mf-vieux-rose">Maison</div>
              <div className="font-serif text-[18px] italic text-mf-rose leading-none">Félicien</div>
            </div>
            <span className="font-body text-[8px] uppercase tracking-[0.1em] text-mf-rose bg-mf-rose/8 rounded-pill px-2 py-0.5">
              Admin
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-card hover:bg-mf-poudre/20 transition-colors cursor-pointer border-none bg-transparent"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-mf-marron-glace" /> : <Menu className="w-5 h-5 text-mf-marron-glace" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-mf-border bg-white pb-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-5 py-3 hover:bg-mf-poudre/10 border-b border-mf-border text-mf-muted font-body text-[13px]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              Retour accueil
            </Link>
            <Link
              to="/staff/kitchen"
              className="flex items-center gap-3 px-5 py-3 hover:bg-mf-poudre/10 border-b border-mf-border text-mf-muted font-body text-[13px]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ChefHat className="w-4 h-4" />
              Espace Staff
            </Link>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-5 py-3 border-b border-mf-border font-body text-[13px] transition-colors ${
                    active ? 'bg-mf-poudre/20 text-mf-rose' : 'text-mf-muted hover:text-mf-marron-glace'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { signOut(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-5 py-3 w-full text-mf-muted hover:text-mf-rose font-body text-[13px] cursor-pointer bg-transparent border-none"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <main className="lg:ml-[220px]">
        <Outlet />
      </main>
    </div>
  );
}
