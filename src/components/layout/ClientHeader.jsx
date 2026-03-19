import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { User, ChevronDown, LogOut, Shield, ChefHat, Menu, X } from 'lucide-react';

const NAV_HEIGHT = 64;

export default function ClientHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const { isAuthenticated, profile, signOut } = useAuth();
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!userDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userDropdown]);

  const menuLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/order', label: 'Commander' },
    { to: '/my-orders', label: 'Mes Commandes' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ─── Fixed Dark Glassmorphism Navbar ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
        style={{
          height: NAV_HEIGHT,
          padding: '0 48px',
          background: 'rgba(14,11,12,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(240,240,230,0.06)',
        }}
      >
        {/* Left — Logo + Wordmark */}
        <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <img src="/brand/Logo_Blanc-cassé.svg" alt="Maison Félicien" style={{ height: 36 }} />
        </Link>

        {/* Center — Desktop nav links (hidden mobile) */}
        <div className="hidden md:flex items-center" style={{ gap: 32 }}>
          {menuLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="font-body text-[10px] uppercase"
              style={{
                letterSpacing: '0.2em',
                color: isActive(item.to) ? '#F0F0E6' : 'rgba(240,240,230,0.45)',
                textDecoration: 'none',
                transition: 'color 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F0F0E6'; }}
              onMouseLeave={(e) => { if (!isActive(item.to)) e.currentTarget.style.color = 'rgba(240,240,230,0.45)'; }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right — CTA + Auth */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          {/* Desktop CTA */}
          <Link
            to="/order"
            className="hidden md:inline-flex items-center font-body text-[9.5px] uppercase"
            style={{
              letterSpacing: '0.22em',
              color: '#F0F0E6',
              border: '1px solid rgba(150,138,66,0.5)',
              padding: '9px 20px',
              textDecoration: 'none',
              transition: 'background 0.25s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#968A42'; e.currentTarget.style.borderColor = '#968A42'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(150,138,66,0.5)'; }}
          >
            Réserver
          </Link>

          {/* Auth area */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-1.5 font-body text-[9.5px] uppercase tracking-[0.2em] cursor-pointer bg-transparent border-none py-1"
                style={{ color: 'rgba(240,240,230,0.55)', transition: 'color 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F0F0E6')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.55)')}
              >
                <User className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-[8px] border border-mf-border shadow-lg py-2 z-50">
                  <div className="px-3 py-2 border-b border-mf-border">
                    <p className="font-body text-[12px] text-mf-marron-glace truncate">{profile?.display_name || profile?.email}</p>
                    <p className="font-body text-[10px] text-mf-muted capitalize">{profile?.role}</p>
                  </div>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setUserDropdown(false)} className="flex items-center gap-2 px-3 py-2 font-body text-[12px] text-mf-marron-glace hover:bg-mf-blanc-casse transition-colors">
                      <Shield className="w-3.5 h-3.5 text-mf-muted" /> Administration
                    </Link>
                  )}
                  {(profile?.role === 'admin' || profile?.role === 'staff') && (
                    <Link to="/staff/kitchen" onClick={() => setUserDropdown(false)} className="flex items-center gap-2 px-3 py-2 font-body text-[12px] text-mf-marron-glace hover:bg-mf-blanc-casse transition-colors">
                      <ChefHat className="w-3.5 h-3.5 text-mf-muted" /> Espace Staff
                    </Link>
                  )}
                  <button onClick={() => { signOut(); setUserDropdown(false); }} className="flex items-center gap-2 w-full px-3 py-2 font-body text-[12px] text-mf-vieux-rose hover:bg-mf-blanc-casse transition-colors bg-transparent border-none cursor-pointer text-left">
                    <LogOut className="w-3.5 h-3.5" /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="font-body text-[9.5px] uppercase tracking-[0.2em] py-1"
              style={{ color: 'rgba(240,240,230,0.55)', transition: 'color 0.3s cubic-bezier(0.22, 1, 0.36, 1)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F0F0E6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.55)')}
            >
              Connexion
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden cursor-pointer p-1.5 bg-transparent border-none"
            style={{ color: '#F0F0E6', transition: 'color 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div style={{ height: NAV_HEIGHT }} />

      {/* ─── Mobile Side Menu Overlay ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[99] flex md:hidden">
          <div onClick={() => setMenuOpen(false)} className="absolute inset-0" style={{ background: 'rgba(14,11,12,0.6)' }} />
          <div className="relative w-72 p-8 pt-14 flex flex-col gap-6 z-10 animate-fade-up" style={{ background: '#0e0b0c', borderRight: '1px solid rgba(240,240,230,0.06)' }}>
            <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 cursor-pointer bg-transparent border-none p-1" style={{ color: 'rgba(240,240,230,0.45)' }} aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>

            {menuLinks.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="font-display text-[22px] leading-snug"
                style={{ color: '#F0F0E6', transition: 'color 0.35s cubic-bezier(0.22, 1, 0.36, 1)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E5B7B3')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#F0F0E6')}
              >{item.label}</Link>
            ))}

            <a href="https://maisonfelicien.com" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="font-display text-[22px] leading-snug"
              style={{ color: '#F0F0E6', transition: 'color 0.35s cubic-bezier(0.22, 1, 0.36, 1)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E5B7B3')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#F0F0E6')}
            >Boutique</a>

            <div className="mt-auto pt-5" style={{ borderTop: '1px solid rgba(240,240,230,0.08)' }}>
              <div className="font-body text-[9.5px] uppercase tracking-[0.2em] mb-1.5" style={{ color: 'rgba(240,240,230,0.35)' }}>Traiteur événementiel</div>
              <div className="font-body text-[13px] leading-relaxed" style={{ color: 'rgba(240,240,230,0.55)' }}>Repas livrés sur stand,<br />salons & événements</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
