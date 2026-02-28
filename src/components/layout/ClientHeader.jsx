import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ClientHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, profile, signOut } = useAuth();

  const menuLinks = [
    { to: '/order', label: 'Commander' },
    { to: '/my-orders', label: 'Mes Commandes' },
  ];

  return (
    <>
      {/* ─── Sticky Navbar ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-7 py-4 bg-white border-b border-mf-border">
        {/* Left — Menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="font-body text-[11px] uppercase tracking-[0.14em] text-mf-rose cursor-pointer py-1 bg-transparent border-none"
        >
          {menuOpen ? 'Fermer' : 'Menu'}
        </button>

        {/* Center — Logo */}
        <Link to="/" className="text-center">
          <div className="font-body text-[9px] tracking-[0.35em] uppercase text-mf-vieux-rose mb-0.5">
            Maison
          </div>
          <div className="font-serif text-[22px] italic text-mf-rose leading-none">
            Félicien
          </div>
        </Link>

        {/* Right — Commander */}
        <Link
          to="/order"
          className="font-body text-[11px] uppercase tracking-[0.14em] text-mf-rose py-1"
        >
          Commander
        </Link>
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
          <div className="relative w-80 bg-white p-12 flex flex-col gap-7 z-10 animate-fade-up">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-5 right-5 font-body text-[11px] uppercase tracking-[0.14em] text-mf-rose cursor-pointer bg-transparent border-none"
            >
              Fermer
            </button>

            {/* Nav links */}
            {menuLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="font-serif text-[28px] italic text-mf-rose leading-snug hover:text-mf-vieux-rose transition-colors duration-300"
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
              className="font-serif text-[28px] italic text-mf-rose leading-snug hover:text-mf-vieux-rose transition-colors duration-300"
            >
              Boutique
            </a>

            {/* Auth links */}
            {isAuthenticated && profile?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="font-serif text-[22px] italic text-mf-muted leading-snug hover:text-mf-rose transition-colors"
              >
                Administration
              </Link>
            )}
            {isAuthenticated && (profile?.role === 'admin' || profile?.role === 'staff') && (
              <Link
                to="/staff/kitchen"
                onClick={() => setMenuOpen(false)}
                className="font-serif text-[22px] italic text-mf-muted leading-snug hover:text-mf-rose transition-colors"
              >
                Espace Staff
              </Link>
            )}

            {/* Footer */}
            <div className="mt-auto pt-5 border-t border-mf-border">
              <div className="font-body text-[10px] uppercase tracking-[0.14em] text-mf-muted mb-1.5">
                Traiteur événementiel
              </div>
              <div className="font-body text-[13px] text-mf-marron-glace leading-relaxed">
                Repas livrés sur stand,<br />salons & événements
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="mt-4 font-body text-[11px] uppercase tracking-[0.1em] text-mf-muted hover:text-mf-rose bg-transparent border-none cursor-pointer"
                >
                  Déconnexion
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 inline-block font-body text-[11px] uppercase tracking-[0.1em] text-mf-rose"
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
