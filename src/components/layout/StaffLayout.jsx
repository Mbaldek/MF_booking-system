import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ChefHat, Truck, Home, Menu, X, LogOut } from 'lucide-react';

const navItems = [
  { path: '/staff/kitchen', label: 'Préparation', icon: ChefHat },
  { path: '/staff/delivery', label: 'Livraison', icon: Truck },
];

export default function StaffLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();

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
            <span className="font-body text-[8px] uppercase tracking-[0.1em] text-mf-vert-olive bg-mf-vert-olive/8 rounded-pill px-2 py-0.5">
              Staff
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-5 py-3 border-b border-mf-border font-body text-[13px] transition-colors ${
                    active ? 'bg-mf-vert-olive/10 text-mf-vert-olive' : 'text-mf-muted hover:text-mf-marron-glace'
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

      {/* Desktop: full width — pages use StaffHeader themselves */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
