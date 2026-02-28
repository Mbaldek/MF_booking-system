import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useActiveEvents } from '@/hooks/useEvents';
import { useMealSlots, useSlotMenuCounts } from '@/hooks/useMealSlots';
import { useEventMenuItems } from '@/hooks/useMenuItems';

/* ─── DESIGN TOKENS ─── */
const C = {
  rose: '#8B3A43', vr: '#BF646D', poudre: '#E5B7B3',
  olive: '#968A42', cream: '#F0F0E6', dark: '#392D31',
  white: '#FDFAF7', border: '#E5D9D0', muted: '#9A8A7C',
};

const TYPE_LABELS = { entree: 'Entrées', plat: 'Plats', dessert: 'Desserts', boisson: 'Boissons' };

export default function MainPageTest() {
  const { isAuthenticated, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);

  // Real data
  const { data: activeEvents = [] } = useActiveEvents();
  const ev = activeEvents.length > 0 ? activeEvents[0] : null;
  const eventId = ev?.id;
  const { data: mealSlots = [] } = useMealSlots(eventId);
  const { data: slotCounts = {} } = useSlotMenuCounts(eventId);
  const { data: menuItems = [] } = useEventMenuItems(eventId);

  // Compute event details
  const eventDates = ev
    ? `${format(new Date(ev.start_date + 'T00:00:00'), 'd', { locale: fr })} — ${format(new Date(ev.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}`
    : '';

  const serviceLabel = !ev?.meal_service || ev.meal_service === 'both' ? 'Midi & Soir' : ev.meal_service === 'midi' ? 'Midi' : 'Soir';

  const totalRemaining = useMemo(() => {
    let total = 0;
    mealSlots.forEach((s) => {
      if (s.max_orders != null) {
        const used = slotCounts[s.id] || 0;
        total += Math.max(0, s.max_orders - used);
      }
    });
    return total;
  }, [mealSlots, slotCounts]);

  const hasCapacity = mealSlots.some((s) => s.max_orders != null);

  // Group menu items by category
  const menuByCategory = useMemo(() => {
    const groups = {};
    menuItems.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      const order = ['entree', 'plat', 'dessert', 'boisson'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [menuItems]);

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: C.cream }}>

      {/* ═══ NAVBAR ═══ */}
      <nav
        className="flex justify-between items-center sticky top-0 z-50"
        style={{ padding: '18px 28px', background: 'white', borderBottom: `1px solid ${C.border}` }}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-transparent border-none cursor-pointer"
          style={{ fontFamily: "'Questrial', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.rose }}
        >
          {menuOpen ? 'Fermer' : 'Menu'}
        </button>
        <div className="text-center">
          <div style={{ fontFamily: "'Questrial', sans-serif", fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: C.vr, marginBottom: 1 }}>
            Maison
          </div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontStyle: 'italic', color: C.rose, lineHeight: 1 }}>
            Félicien
          </div>
        </div>
        <Link
          to="/order"
          style={{ fontFamily: "'Questrial', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.rose, textDecoration: 'none' }}
        >
          Commander
        </Link>
      </nav>

      {/* Side menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div onClick={() => setMenuOpen(false)} className="absolute inset-0" style={{ background: 'rgba(57,45,49,0.3)' }} />
          <div
            className="relative z-[1] flex flex-col gap-7"
            style={{ width: 320, background: 'white', padding: '48px 36px' }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-5 right-5 bg-transparent border-none cursor-pointer"
              style={{ fontFamily: "'Questrial', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.rose }}
            >
              Fermer
            </button>
            {[
              { label: 'Commander', to: '/order' },
              { label: 'Mes Commandes', to: '/my-orders' },
              { label: 'Connexion', to: '/login' },
            ].map(({ label, to }) => (
              <Link key={label} to={to} onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                <span style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: 'italic', color: C.rose, lineHeight: 1.3 }}>
                  {label}
                </span>
              </Link>
            ))}
            <a
              href="https://maisonfelicien.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
              style={{ textDecoration: 'none' }}
            >
              <span style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: 'italic', color: C.rose, lineHeight: 1.3 }}>
                Boutique
              </span>
              <ExternalLink className="w-4 h-4" style={{ color: C.vr }} />
            </a>
            {isAuthenticated && (
              <>
                {profile?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: 'italic', color: C.rose }}>Administration</span>
                  </Link>
                )}
                {(profile?.role === 'admin' || profile?.role === 'staff') && (
                  <Link to="/staff/kitchen" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: 'italic', color: C.rose }}>Espace Staff</span>
                  </Link>
                )}
              </>
            )}
            <div className="mt-auto pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'Questrial', sans-serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
                Traiteur événementiel
              </div>
              {isAuthenticated ? (
                <div>
                  <p className="text-[13px]" style={{ color: C.dark }}>{profile?.display_name || profile?.email}</p>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="text-[12px] bg-transparent border-none cursor-pointer mt-1"
                    style={{ color: C.vr }}
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-[13px]" style={{ color: C.dark, textDecoration: 'none' }}>
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className="relative text-center overflow-hidden" style={{ padding: '72px 24px 56px', background: 'white' }}>
        {/* Decorative faded ornaments via CSS */}
        <div className="absolute top-4 left-4 w-24 h-24 rounded-full opacity-10" style={{ background: C.poudre }} />
        <div className="absolute top-16 right-0 w-20 h-20 rounded-full opacity-10" style={{ background: C.poudre }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-5" style={{ background: C.poudre }} />

        <div className="relative z-[1]">
          <p
            className="mb-4"
            style={{ fontFamily: "'Questrial', sans-serif", fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.olive }}
          >
            Traiteur événementiel
          </p>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: C.vr, marginBottom: 4 }}>
            Maison
          </p>
          <h1
            className="m-0 leading-tight"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 56, fontWeight: 400, fontStyle: 'italic', color: C.rose, marginBottom: 16 }}
          >
            Félicien
          </h1>
          <p
            className="mx-auto"
            style={{ fontFamily: "'Questrial', sans-serif", fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 380, marginBottom: 28 }}
          >
            Des repas d'exception livrés directement sur votre stand.
            Commandez pour votre équipe, nous nous occupons du reste.
          </p>
          <Link
            to="/order"
            className="inline-block no-underline"
            style={{
              fontFamily: "'Questrial', sans-serif", fontSize: 12, letterSpacing: '0.14em',
              textTransform: 'uppercase', padding: '15px 40px', borderRadius: 50,
              background: C.rose, color: C.cream, fontWeight: 500,
            }}
          >
            Commander maintenant
          </Link>
        </div>
      </section>

      {/* ═══ EVENT CARD (real data) ═══ */}
      {ev && (
        <section className="px-5 max-w-[520px] mx-auto -mt-6 relative z-[2]">
          <div
            className="rounded-3xl p-7"
            style={{ background: 'white', border: `1px solid ${C.border}`, boxShadow: '0 8px 40px rgba(57,45,49,0.06)' }}
          >
            {/* Badge + title */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span
                  className="inline-block mb-2"
                  style={{
                    fontFamily: "'Questrial', sans-serif", fontSize: 9, letterSpacing: '0.16em',
                    textTransform: 'uppercase', color: C.olive, padding: '3px 10px',
                    borderRadius: 50, background: `${C.olive}15`,
                  }}
                >
                  Prochain événement
                </span>
                <h2
                  className="m-0 leading-snug"
                  style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontStyle: 'italic', fontWeight: 400, color: C.rose }}
                >
                  {ev.name}
                </h2>
                {ev.description && (
                  <p className="mt-1" style={{ fontFamily: "'Questrial', sans-serif", fontSize: 13, color: C.muted }}>
                    {ev.description}
                  </p>
                )}
              </div>
            </div>

            {/* Details grid */}
            <div
              className="grid grid-cols-3 gap-3 py-4 mb-5"
              style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
            >
              {[
                { label: 'Dates', value: eventDates, icon: '◷' },
                { label: 'Services', value: serviceLabel, icon: '☀ ☽' },
                { label: 'Plats', value: `${menuItems.length} choix`, icon: '❋' },
              ].map((d) => (
                <div key={d.label} className="text-center">
                  <div className="text-base mb-1" style={{ color: C.poudre }}>{d.icon}</div>
                  <div style={{ fontFamily: "'Questrial', sans-serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 3 }}>
                    {d.label}
                  </div>
                  <div style={{ fontFamily: "'Questrial', sans-serif", fontSize: 13, fontWeight: 500, color: C.dark }}>
                    {d.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Remaining spots */}
            {hasCapacity && (
              <div
                className="flex items-center justify-between mb-5 rounded-xl p-3"
                style={{ background: `${C.poudre}18` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: C.olive, boxShadow: `0 0 6px ${C.olive}60` }} />
                  <span style={{ fontFamily: "'Questrial', sans-serif", fontSize: 13, color: C.dark }}>
                    Commandes ouvertes
                  </span>
                </div>
                <span style={{ fontFamily: "'Questrial', sans-serif", fontSize: 12, color: C.vr, fontWeight: 500 }}>
                  {totalRemaining} places restantes
                </span>
              </div>
            )}

            {/* CTA */}
            <Link
              to="/order"
              className="block text-center no-underline w-full"
              style={{
                fontFamily: "'Questrial', sans-serif", fontSize: 13, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '15px 0', borderRadius: 50,
                background: C.rose, color: C.cream, fontWeight: 500,
              }}
            >
              Réserver mes repas →
            </Link>
          </div>
        </section>
      )}

      {/* ═══ FLEURON DIVIDER ═══ */}
      <div className="flex items-center gap-4 justify-center my-8">
        <div className="w-[60px] h-px" style={{ background: C.border }} />
        <div className="w-2 h-2 rounded-full" style={{ background: C.poudre }} />
        <div className="w-[60px] h-px" style={{ background: C.border }} />
      </div>

      {/* ═══ MENU PREVIEW (real data) ═══ */}
      {menuByCategory.length > 0 && (
        <section className="px-5 pb-10 max-w-[520px] mx-auto">
          <div className="text-center mb-7">
            <span style={{ fontFamily: "'Questrial', sans-serif", fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.olive }}>
              La carte
            </span>
            <h2 className="m-0 mt-1" style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 400, color: C.rose }}>
              Notre menu
            </h2>
          </div>

          <div className="flex flex-col">
            {menuByCategory.map(([type, items], ci) => (
              <div
                key={type}
                onMouseEnter={() => setHoveredCat(ci)}
                onMouseLeave={() => setHoveredCat(null)}
                className="cursor-pointer transition-all duration-300"
                style={{
                  padding: '20px 22px',
                  background: hoveredCat === ci ? 'white' : 'transparent',
                  borderRadius: hoveredCat === ci ? 16 : 0,
                  border: `1px solid ${hoveredCat === ci ? C.border : 'transparent'}`,
                }}
              >
                <div className="flex justify-between items-center" style={{ marginBottom: hoveredCat === ci ? 10 : 0 }}>
                  <h3
                    className="m-0"
                    style={{ fontFamily: "'Questrial', sans-serif", fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.rose }}
                  >
                    {TYPE_LABELS[type] || type}
                  </h3>
                  <span
                    className="inline-block transition-transform duration-300"
                    style={{ fontFamily: "'Questrial', sans-serif", fontSize: 11, color: C.muted, transform: hoveredCat === ci ? 'rotate(90deg)' : 'rotate(0)' }}
                  >
                    →
                  </span>
                </div>
                <div
                  className="overflow-hidden transition-all duration-400"
                  style={{ maxHeight: hoveredCat === ci ? items.length * 40 : 0, opacity: hoveredCat === ci ? 1 : 0 }}
                >
                  {items.map((item) => (
                    <div key={item.id} className="py-1.5" style={{ fontFamily: "'Questrial', sans-serif", fontSize: 14, color: C.dark, borderBottom: `1px solid ${C.cream}` }}>
                      {item.name}
                      {item.description && (
                        <span className="text-[12px] ml-2" style={{ color: C.muted }}>— {item.description}</span>
                      )}
                    </div>
                  ))}
                </div>
                {ci < menuByCategory.length - 1 && hoveredCat !== ci && (
                  <div className="mt-5" style={{ borderBottom: `1px solid ${C.border}` }} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ background: 'white', padding: '48px 20px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-[520px] mx-auto text-center">
          <span style={{ fontFamily: "'Questrial', sans-serif", fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.olive }}>
            Simple & rapide
          </span>
          <h2 className="mt-1 mb-8" style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: 'italic', fontWeight: 400, color: C.rose }}>
            Comment ça marche
          </h2>
          <div className="grid grid-cols-3 gap-5">
            {[
              { num: '01', title: 'Choisissez', desc: 'Sélectionnez vos jours et composez votre menu' },
              { num: '02', title: 'Payez', desc: 'Réglez en ligne de façon sécurisée via Stripe' },
              { num: '03', title: 'Savourez', desc: 'Vos repas livrés chaque jour sur votre stand' },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div
                  className="w-11 h-11 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${C.poudre}30`, fontFamily: "'Georgia', serif", fontSize: 18, fontStyle: 'italic', color: C.rose }}
                >
                  {s.num}
                </div>
                <div style={{ fontFamily: "'Questrial', sans-serif", fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.rose, fontWeight: 500, marginBottom: 6 }}>
                  {s.title}
                </div>
                <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST QUOTE ═══ */}
      <section className="py-12 px-5 text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-10" style={{ background: C.poudre }} />
        <div className="max-w-[420px] mx-auto relative z-[1]">
          <div className="text-[32px] mb-3" style={{ color: C.poudre }}>"</div>
          <p style={{ fontFamily: "'Georgia', serif", fontSize: 20, fontStyle: 'italic', color: C.rose, lineHeight: 1.6, marginBottom: 16 }}>
            Chaque saison, un chapitre. La gourmandise éclot, organique mais maîtrisée.
          </p>
          <div style={{ fontFamily: "'Questrial', sans-serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.muted }}>
            — Maison Félicien
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="text-center" style={{ background: C.rose, padding: '40px 20px 28px', borderTop: `3px solid ${C.dark}22` }}>
        <div style={{ fontFamily: "'Questrial', sans-serif", fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: C.poudre, marginBottom: 2 }}>
          Maison
        </div>
        <div style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontStyle: 'italic', color: C.cream, marginBottom: 20 }}>
          Félicien
        </div>

        <div className="flex justify-center gap-6 mb-6 flex-wrap">
          {[
            { label: 'Commander', to: '/order' },
            { label: 'Mes Commandes', to: '/my-orders' },
            { label: 'Connexion', to: '/login' },
          ].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="no-underline"
              style={{ fontFamily: "'Questrial', sans-serif", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.poudre }}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://maisonfelicien.com"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline flex items-center gap-1"
            style={{ fontFamily: "'Questrial', sans-serif", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.poudre }}
          >
            Boutique <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="w-10 h-px mx-auto mb-4" style={{ background: `${C.poudre}40` }} />

        <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 11, color: `${C.poudre}80`, lineHeight: 1.6 }}>
          Traiteur événementiel · Salons & Foires<br />
          © 2026 Maison Félicien — Tous droits réservés
        </p>
      </footer>

      {/* ─── TEST BADGE ─── */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link to="/" className="px-3 py-1.5 text-[10px] uppercase tracking-wider rounded-full no-underline" style={{ background: `${C.rose}15`, color: C.rose, border: `1px solid ${C.rose}30` }}>
          Version actuelle
        </Link>
      </div>
    </div>
  );
}
