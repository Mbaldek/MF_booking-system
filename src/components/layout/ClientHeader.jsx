import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { User, ChevronDown, LogOut, Shield, ChefHat, Menu, X } from 'lucide-react';

export default function ClientHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const { isAuthenticated, profile, signOut } = useAuth();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!userDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userDropdown]);

  const menuLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/order', label: 'Commander' },
    { to: '/my-orders', label: 'Mes Commandes' },
  ];

  return (
    <>
      {/* ─── Sticky Navbar ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-7 py-3 bg-white border-b border-mf-border">
        {/* Left — Menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-mf-rose cursor-pointer p-1.5 bg-transparent border-none w-10"
          aria-label="Menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Center — SVG Logo */}
        <Link to="/" className="flex items-center justify-center">
          <img src="/brand/Logo_Rose.svg" alt="Maison Félicien" className="h-10" />
        </Link>

        {/* Right — Auth area */}
        <div className="w-20 flex justify-end" ref={dropdownRef}>
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[0.1em] text-mf-rose cursor-pointer bg-transparent border-none py-1"
              >
                <User className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-mf-border shadow-lg py-2 z-50">
                  <div className="px-3 py-2 border-b border-mf-border">
                    <p className="font-body text-[12px] text-mf-marron-glace truncate">
                      {profile?.display_name || profile?.email}
                    </p>
                    <p className="font-body text-[10px] text-mf-muted capitalize">{profile?.role}</p>
                  </div>

                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 font-body text-[12px] text-mf-marron-glace hover:bg-mf-blanc-casse transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-mf-muted" />
                      Administration
                    </Link>
                  )}
                  {(profile?.role === 'admin' || profile?.role === 'staff') && (
                    <Link
                      to="/staff/kitchen"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 font-body text-[12px] text-mf-marron-glace hover:bg-mf-blanc-casse transition-colors"
                    >
                      <ChefHat className="w-3.5 h-3.5 text-mf-muted" />
                      Espace Staff
                    </Link>
                  )}

                  <button
                    onClick={() => { signOut(); setUserDropdown(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 font-body text-[12px] text-mf-vieux-rose hover:bg-mf-blanc-casse transition-colors bg-transparent border-none cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="font-body text-[11px] uppercase tracking-[0.14em] text-mf-rose py-1"
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>

      {/* ─── Side Menu Overlay ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-mf-marron-glace/30"
          />

          {/* Panel */}
          <div className="relative w-72 bg-white p-8 pt-14 flex flex-col gap-5 z-10 animate-fade-up">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 text-mf-rose cursor-pointer bg-transparent border-none p-1"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Nav links */}
            {menuLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="font-serif text-[20px] italic text-mf-rose leading-snug hover:text-mf-vieux-rose transition-colors duration-300"
              >
                {item.label}
              </Link>
            ))}

            {/* External link */}
            <a
              href="https://maisonfelicien.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="font-serif text-[20px] italic text-mf-rose leading-snug hover:text-mf-vieux-rose transition-colors duration-300"
            >
              Boutique
            </a>

            {/* Footer */}
            <div className="mt-auto pt-5 border-t border-mf-border">
              <div className="font-body text-[10px] uppercase tracking-[0.14em] text-mf-muted mb-1.5">
                Traiteur événementiel
              </div>
              <div className="font-body text-[13px] text-mf-marron-glace leading-relaxed">
                Repas livrés sur stand,<br />salons & événements
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
