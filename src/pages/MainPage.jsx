import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';
import ClientHeader from '@/components/layout/ClientHeader';
import MfButton from '@/components/ui/MfButton';
import MfBadge from '@/components/ui/MfBadge';
import { useActiveEvents } from '@/hooks/useEvents';
import { useMealSlots, useSlotMenuCounts } from '@/hooks/useMealSlots';
import { useEventMenuItems } from '@/hooks/useMenuItems';

/* ─── Decorative SVG Components ─── */

const Ornament = ({ size = 120, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    className={`opacity-35 ${className}`}
  >
    <path d="M60 10 C60 10, 75 30, 75 50 C75 62, 68 70, 60 70 C52 70, 45 62, 45 50 C45 30, 60 10, 60 10Z" fill="currentColor" />
    <path d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill="currentColor" transform="rotate(72 60 55)" />
    <path d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill="currentColor" transform="rotate(144 60 55)" />
    <path d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill="currentColor" transform="rotate(216 60 55)" />
    <path d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill="currentColor" transform="rotate(288 60 55)" />
    <circle cx="60" cy="55" r="8" fill="currentColor" opacity="0.6" />
  </svg>
);

const Vine = ({ side = 'left' }) => (
  <svg
    width="60"
    height="300"
    viewBox="0 0 60 300"
    fill="none"
    className={`opacity-20 ${side === 'right' ? '-scale-x-100' : ''}`}
  >
    <path d="M30 0 C30 60, 10 80, 10 120 C10 160, 50 180, 50 220 C50 260, 30 280, 30 300" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <ellipse cx="10" cy="120" rx="8" ry="12" fill="currentColor" opacity="0.4" transform="rotate(-20 10 120)" />
    <ellipse cx="50" cy="220" rx="8" ry="12" fill="currentColor" opacity="0.4" transform="rotate(20 50 220)" />
    <ellipse cx="18" cy="80" rx="6" ry="10" fill="currentColor" opacity="0.3" transform="rotate(-30 18 80)" />
    <ellipse cx="42" cy="180" rx="6" ry="10" fill="currentColor" opacity="0.3" transform="rotate(30 42 180)" />
    <circle cx="30" cy="150" r="3" fill="currentColor" opacity="0.5" />
  </svg>
);

const FleuronDivider = () => (
  <div className="flex items-center gap-4 justify-center my-8">
    <div className="w-[60px] h-px bg-mf-border" />
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-mf-rose">
      <path d="M10 2 C10 2, 14 6, 14 10 C14 12.5, 12 14, 10 14 C8 14, 6 12.5, 6 10 C6 6, 10 2, 10 2Z" fill="currentColor" opacity="0.6" />
      <path d="M10 2 C10 2, 6 6, 6 10 C6 12.5, 8 14, 10 14 C12 14, 14 12.5, 14 10 C14 6, 10 2, 10 2Z" fill="currentColor" opacity="0.4" transform="rotate(90 10 10)" />
      <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.8" />
    </svg>
    <div className="w-[60px] h-px bg-mf-border" />
  </div>
);

const Fleuron = () => (
  <svg width="40" height="48" viewBox="0 0 40 48" fill="none" className="text-mf-rose">
    <path d="M20 4 C20 4, 28 14, 28 22 C28 27, 24 30, 20 30 C16 30, 12 27, 12 22 C12 14, 20 4, 20 4Z" fill="currentColor" opacity="0.7" />
    <path d="M20 4 C20 4, 12 14, 12 22 C12 27, 16 30, 20 30 C24 30, 28 27, 28 22 C28 14, 20 4, 20 4Z" fill="currentColor" opacity="0.5" transform="rotate(60 20 22)" />
    <path d="M20 4 C20 4, 12 14, 12 22 C12 27, 16 30, 20 30 C24 30, 28 27, 28 22 C28 14, 20 4, 20 4Z" fill="currentColor" opacity="0.5" transform="rotate(-60 20 22)" />
    <line x1="20" y1="30" x2="20" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M20 36 C24 33, 30 34, 30 34" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <path d="M20 40 C16 37, 10 38, 10 38" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
  </svg>
);

/* ─── Labels ─── */
const TYPE_LABELS = { entree: 'Entrées', plat: 'Plats', dessert: 'Desserts', boisson: 'Boissons' };

/* ─── Animations (scoped) ─── */
const scopedStyles = `
  @keyframes mf-float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
  @keyframes mf-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.55; } }
  .mf-float { animation: mf-float 6s ease-in-out infinite; }
  .mf-pulse { animation: mf-pulse 4s ease-in-out infinite; }
`;

/* ═══════════════════════════════════════════════════════
   MainPage
   ═══════════════════════════════════════════════════════ */

export default function MainPage() {
  const [openCat, setOpenCat] = useState(null);

  /* ─── Data ─── */
  const { data: activeEvents = [] } = useActiveEvents();
  const ev = activeEvents[0] ?? null;
  const eventId = ev?.id;
  const { data: mealSlots = [] } = useMealSlots(eventId);
  const { data: slotCounts = {} } = useSlotMenuCounts(eventId);
  const { data: menuItems = [] } = useEventMenuItems(eventId);

  const eventDates = ev
    ? `${format(new Date(ev.start_date + 'T00:00:00'), 'd', { locale: fr })} — ${format(new Date(ev.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}`
    : '';

  const serviceLabel =
    !ev?.meal_service || ev.meal_service === 'both'
      ? 'Midi & Soir'
      : ev.meal_service === 'midi'
        ? 'Midi'
        : 'Soir';

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
    <div className="min-h-screen bg-mf-blanc-casse overflow-hidden">
      <style>{scopedStyles}</style>

      {/* ─── Header ─── */}
      <ClientHeader />

      {/* ═══ HERO ═══ */}
      <section className="relative text-center overflow-hidden bg-white pt-[72px] pb-14 px-6">
        {/* Botanical ornaments */}
        <div className="mf-float mf-pulse absolute top-5 -left-5 text-mf-poudre">
          <Ornament size={100} />
        </div>
        <div className="mf-float mf-pulse absolute top-10 -right-4 text-mf-poudre" style={{ animationDelay: '2s' }}>
          <Ornament size={80} />
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-mf-poudre">
          <Vine side="left" />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-mf-poudre">
          <Vine side="right" />
        </div>

        <div className="relative z-[1] animate-fade-up">
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-mf-vert-olive mb-4">
            Traiteur événementiel
          </p>

          <div className="mb-4 opacity-60 flex justify-center">
            <Fleuron />
          </div>

          <p className="font-body text-[10px] tracking-[0.35em] uppercase text-mf-vieux-rose mb-1">
            Maison
          </p>
          <h1 className="font-serif text-[56px] font-normal italic text-mf-rose leading-[1.05] tracking-tight mb-4">
            Félicien
          </h1>

          <p className="font-body text-[15px] text-mf-muted leading-[1.7] max-w-[380px] mx-auto mb-7">
            Des repas d'exception livrés directement sur votre stand.
            Commandez pour votre équipe, nous nous occupons du reste.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link to="/order">
              <MfButton size="lg" className="px-10">
                Commander maintenant
              </MfButton>
            </Link>
            <a
              href="https://maisonfelicien.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-body text-[11px] tracking-[0.1em] uppercase text-mf-vieux-rose"
            >
              Découvrir la boutique <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ EVENT CARD ═══ */}
      {ev && (
        <section className="px-5 max-w-[520px] mx-auto -mt-6 relative z-[2]">
          <div className="bg-white rounded-card border border-mf-border p-7 shadow-[0_8px_40px_rgba(57,45,49,0.06)] animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {/* Badge + title */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <MfBadge variant="olive" className="mb-2">
                  Prochain événement
                </MfBadge>
                <h2 className="font-serif text-[24px] italic font-normal text-mf-rose leading-snug">
                  {ev.name}
                </h2>
                {ev.description && (
                  <p className="font-body text-[13px] text-mf-muted mt-1">
                    {ev.description}
                  </p>
                )}
              </div>
              {/* Mini floral ornament */}
              <div className="mt-1 opacity-40 text-mf-rose">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4 C16 4, 21 10, 21 15 C21 18, 19 20, 16 20 C13 20, 11 18, 11 15 C11 10, 16 4, 16 4Z" fill="currentColor" />
                  <line x1="16" y1="20" x2="16" y2="28" stroke="currentColor" strokeWidth="1" />
                  <path d="M16 23 C18 21.5, 21 22, 21 22" stroke="currentColor" strokeWidth="0.8" fill="none" />
                  <path d="M16 25.5 C14 24, 11 24.5, 11 24.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
                </svg>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-3 gap-3 py-4 mb-5 border-t border-b border-mf-border">
              {[
                { label: 'Dates', value: eventDates, icon: '◷' },
                { label: 'Services', value: serviceLabel, icon: '☀ ☽' },
                { label: 'Plats', value: `${menuItems.length} choix`, icon: '❋' },
              ].map((d) => (
                <div key={d.label} className="text-center">
                  <div className="text-base mb-1 text-mf-poudre">{d.icon}</div>
                  <div className="font-body text-[9px] tracking-[0.12em] uppercase text-mf-muted mb-0.5">
                    {d.label}
                  </div>
                  <div className="font-body text-[13px] font-medium text-mf-marron-glace">
                    {d.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Remaining spots */}
            {hasCapacity && (
              <div className="flex items-center justify-between mb-5 rounded-xl p-3 bg-mf-poudre/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-mf-vert-olive shadow-[0_0_6px_rgba(150,138,66,0.4)]" />
                  <span className="font-body text-[13px] text-mf-marron-glace">
                    Commandes ouvertes
                  </span>
                </div>
                <span className="font-body text-[12px] text-mf-vieux-rose font-medium">
                  {totalRemaining} places restantes
                </span>
              </div>
            )}

            {/* CTA */}
            <Link to="/order">
              <MfButton fullWidth>
                Réserver mes repas →
              </MfButton>
            </Link>
          </div>
        </section>
      )}

      {/* ═══ DIVIDER ═══ */}
      <FleuronDivider />

      {/* ═══ MENU PREVIEW ═══ */}
      {menuByCategory.length > 0 && (
        <section className="px-5 pb-10 max-w-[520px] mx-auto">
          <div className="text-center mb-7">
            <span className="font-body text-[10px] tracking-[0.2em] uppercase text-mf-vert-olive">
              La carte
            </span>
            <h2 className="font-serif text-[28px] italic font-normal text-mf-rose mt-1.5">
              Notre menu
            </h2>
          </div>

          <div className="flex flex-col gap-1">
            {menuByCategory.map(([type, items], ci) => {
              const isOpen = openCat === ci;
              return (
                <div
                  key={type}
                  onClick={() => setOpenCat(isOpen ? null : ci)}
                  className={`px-[22px] py-5 cursor-pointer transition-all duration-300 ${
                    isOpen
                      ? 'bg-white rounded-2xl border border-mf-border'
                      : 'border border-transparent'
                  }`}
                >
                  <div className={`flex justify-between items-center ${isOpen ? 'mb-2.5' : ''}`}>
                    <h3 className="font-body text-[11px] tracking-[0.16em] uppercase text-mf-rose">
                      {TYPE_LABELS[type] || type}
                    </h3>
                    <span
                      className={`font-body text-[11px] text-mf-muted inline-block transition-transform duration-300 ${
                        isOpen ? 'rotate-90' : ''
                      }`}
                    >
                      →
                    </span>
                  </div>
                  <div
                    className="overflow-hidden transition-all duration-400"
                    style={{
                      maxHeight: isOpen ? items.length * 40 : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="font-body text-[14px] text-mf-marron-glace py-1.5 border-b border-mf-blanc-casse"
                      >
                        {item.name}
                        {item.description && (
                          <span className="text-[12px] text-mf-muted ml-2">— {item.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {ci < menuByCategory.length - 1 && !isOpen && (
                    <div className="mt-5 border-b border-mf-border" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="bg-white border-t border-b border-mf-border py-12 px-5">
        <div className="max-w-[520px] mx-auto text-center">
          <span className="font-body text-[10px] tracking-[0.2em] uppercase text-mf-vert-olive">
            Simple & rapide
          </span>
          <h2 className="font-serif text-[28px] italic font-normal text-mf-rose mt-1.5 mb-8">
            Comment ça marche
          </h2>

          <div className="grid grid-cols-3 gap-5">
            {[
              { num: '01', title: 'Choisissez', desc: 'Sélectionnez vos jours et composez votre menu' },
              { num: '02', title: 'Payez', desc: 'Réglez en ligne de façon sécurisée via Stripe' },
              { num: '03', title: 'Savourez', desc: 'Vos repas livrés chaque jour sur votre stand' },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-11 h-11 rounded-full mx-auto mb-3 flex items-center justify-center bg-mf-poudre/30 font-serif text-[18px] italic text-mf-rose">
                  {s.num}
                </div>
                <div className="font-body text-[12px] tracking-[0.1em] uppercase text-mf-rose font-medium mb-1.5">
                  {s.title}
                </div>
                <p className="font-body text-[13px] text-mf-muted leading-normal">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST QUOTE ═══ */}
      <section className="py-12 px-5 text-center relative overflow-hidden">
        <div className="mf-pulse absolute -bottom-8 left-1/2 -translate-x-1/2 text-mf-poudre">
          <Ornament size={160} />
        </div>
        <div className="max-w-[420px] mx-auto relative z-[1]">
          <div className="text-[32px] text-mf-poudre mb-3">"</div>
          <p className="font-serif text-[20px] italic text-mf-rose leading-relaxed mb-4">
            Chaque saison, un chapitre. La gourmandise éclot, organique mais maîtrisée.
          </p>
          <div className="font-body text-[10px] tracking-[0.16em] uppercase text-mf-muted">
            — Maison Félicien
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-mf-rose text-center pt-10 pb-7 px-5 border-t-[3px] border-mf-marron-glace/10">
        <div className="font-body text-[9px] tracking-[0.35em] uppercase text-mf-poudre mb-0.5">
          Maison
        </div>
        <div className="font-serif text-[28px] italic text-mf-blanc-casse mb-5">
          Félicien
        </div>

        <div className="flex justify-center gap-6 mb-6 flex-wrap">
          <Link to="/order" className="font-body text-[11px] tracking-[0.1em] uppercase text-mf-poudre">
            Commander
          </Link>
          <Link to="/my-orders" className="font-body text-[11px] tracking-[0.1em] uppercase text-mf-poudre">
            Mes Commandes
          </Link>
          <a
            href="https://maisonfelicien.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-body text-[11px] tracking-[0.1em] uppercase text-mf-poudre"
          >
            Boutique <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="w-10 h-px bg-mf-poudre/40 mx-auto mb-4" />

        <p className="font-body text-[11px] text-mf-poudre/60 leading-relaxed">
          Traiteur événementiel · Salons & Foires<br />
          © 2026 Maison Félicien — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
