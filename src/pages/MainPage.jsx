import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';
import ClientHeader from '@/components/layout/ClientHeader';
import MfButton from '@/components/ui/MfButton';
import { useActiveEvents } from '@/hooks/useEvents';
import { useMealSlots } from '@/hooks/useMealSlots';
import { useEventMenuItems } from '@/hooks/useMenuItems';
import { useEventSlotMenuItems } from '@/hooks/useSlotMenuItems';

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
const TYPE_ORDER = ['entree', 'plat', 'dessert', 'boisson'];

/* ─── Animations (scoped) ─── */
const scopedStyles = `
  @keyframes mf-float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
  @keyframes mf-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.55; } }
  @keyframes mf-fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mf-dot-glow { 0%, 100% { box-shadow: 0 0 4px rgba(150,138,66,0.3); transform: scale(1); } 50% { box-shadow: 0 0 10px rgba(150,138,66,0.6); transform: scale(1.3); } }
  .mf-float { animation: mf-float 6s ease-in-out infinite; }
  .mf-pulse { animation: mf-pulse 4s ease-in-out infinite; }
  .mf-fade-in-up { animation: mf-fadeInUp 0.5s ease-out both; }
  .mf-dot-pulse { animation: mf-dot-glow 2s ease-in-out infinite; }
`;

/* ─── 3D Carousel ─── */
function EventCarousel({ events, activeIdx, onChangeIdx }) {
  const touchRef = useRef(null);

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowLeft') onChangeIdx((activeIdx - 1 + events.length) % events.length);
    if (e.key === 'ArrowRight') onChangeIdx((activeIdx + 1) % events.length);
  }, [activeIdx, events.length, onChangeIdx]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleTouchStart = (e) => { touchRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchRef.current;
    if (Math.abs(diff) > 40) {
      onChangeIdx(diff > 0
        ? (activeIdx - 1 + events.length) % events.length
        : (activeIdx + 1) % events.length
      );
    }
    touchRef.current = null;
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      onChangeIdx((activeIdx - 1 + events.length) % events.length);
    } else {
      onChangeIdx((activeIdx + 1) % events.length);
    }
  };

  // Card width responsive
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  const CARD_W = isMobile ? 260 : 300;
  const SPREAD_X = isMobile ? 180 : 220;

  return (
    <div className="relative">
      <div
        className="relative mx-auto cursor-pointer select-none"
        style={{ perspective: '1000px', height: 300 }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {events.map((ev, i) => {
          const offset = ((i - activeIdx + events.length) % events.length);
          const norm = offset > events.length / 2 ? offset - events.length : offset;
          const isActive = norm === 0;
          const absNorm = Math.abs(norm);

          const tx = norm * SPREAD_X;
          const tz = -absNorm * 150;
          const ty = absNorm * 12;
          const ry = norm * -12;
          const scale = isActive ? 1 : Math.max(0.75, 1 - absNorm * 0.15);
          const opacity = isActive ? 1 : Math.max(0.4, 1 - absNorm * 0.35);
          const zIndex = events.length - absNorm;
          const blur = isActive ? 0 : Math.min(absNorm * 2, 4);

          return (
            <div
              key={ev.id}
              className="absolute left-1/2 top-0"
              style={{
                width: CARD_W,
                marginLeft: -CARD_W / 2,
                transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`,
                opacity,
                zIndex,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                transition: 'all 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <EventCard ev={ev} isActive={isActive} cardWidth={CARD_W} />
            </div>
          );
        })}
      </div>

      {/* Dots */}
      {events.length > 1 && (
        <div className="flex justify-center gap-2" style={{ marginTop: 20 }}>
          {events.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); onChangeIdx(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === activeIdx
                  ? 'w-6 h-2 bg-mf-rose'
                  : 'w-2 h-2 bg-mf-poudre hover:bg-mf-vieux-rose'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Event Card ─── */
function EventCard({ ev, isActive, cardWidth }) {
  const imgH = isActive ? 150 : 120;
  const eventDates = `${format(new Date(ev.start_date + 'T00:00:00'), 'd', { locale: fr })} — ${format(new Date(ev.end_date + 'T00:00:00'), 'd MMM yyyy', { locale: fr })}`;

  return (
    <div
      className={`bg-white rounded-[20px] border overflow-hidden transition-shadow duration-500 ${
        isActive
          ? 'border-mf-border shadow-[0_16px_48px_rgba(57,45,49,0.12)]'
          : 'border-mf-border/50 shadow-[0_4px_16px_rgba(57,45,49,0.04)]'
      }`}
    >
      {/* Image zone */}
      <div className="relative overflow-hidden transition-all duration-500" style={{ height: imgH }}>
        {ev.image_url ? (
          <img src={ev.image_url} alt={ev.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(150deg, rgba(229,183,179,0.4), #F0F0E6, rgba(229,183,179,0.25))' }}
          >
            <img src="/brand/Symbole-Rose.svg" alt="" className="h-16 w-auto opacity-10" />
          </div>
        )}

        {/* Date badge */}
        <div className="absolute top-2.5 left-2.5 bg-white/80 backdrop-blur-[6px] rounded-[10px] px-2.5 py-1 text-center">
          <div className="font-display text-[16px] font-bold text-mf-rose leading-none">
            {format(new Date(ev.start_date + 'T00:00:00'), 'd', { locale: fr })}
          </div>
          <div className="font-body text-[8px] uppercase tracking-[0.1em] text-mf-muted">
            {format(new Date(ev.start_date + 'T00:00:00'), 'MMM', { locale: fr })}
          </div>
        </div>

        {/* Status badge — top-right */}
        <div className="absolute top-2.5 right-2.5 z-[1]">
          {ev.is_active ? (
            <div className="bg-white/90 backdrop-blur-[6px] rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(57,45,49,0.06)]">
              <div className={`w-1.5 h-1.5 rounded-full bg-mf-vert-olive ${isActive ? 'mf-dot-pulse' : ''}`} />
              <span className="font-body text-[9px] uppercase tracking-[0.08em] text-mf-vert-olive whitespace-nowrap">
                Commandes ouvertes
              </span>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-[6px] rounded-full px-2.5 py-1">
              <span className="font-body text-[9px] uppercase tracking-[0.08em] text-mf-muted whitespace-nowrap">
                Prochainement
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-4 pb-5">
        <h3 className="font-display text-[20px] italic font-normal text-mf-rose leading-snug mb-1">
          {ev.name}
        </h3>
        <p className="font-body text-[12px] text-mf-muted mb-4">
          {eventDates}
        </p>

        {isActive && ev.is_active && (
          <Link to="/order" onClick={(e) => e.stopPropagation()}>
            <MfButton fullWidth size="sm">
              Réserver mes repas →
            </MfButton>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── Dynamic Menu Section ─── */
function DynamicMenu({ eventId, eventName }) {
  const [openCat, setOpenCat] = useState(null);
  const { data: slotItems = [] } = useEventSlotMenuItems(eventId);
  const { data: eventItems = [] } = useEventMenuItems(eventId);

  // Use slot items if configured, fallback to event items
  const displayItems = slotItems.length > 0 ? slotItems : eventItems;

  const menuByCategory = useMemo(() => {
    const groups = {};
    displayItems.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return TYPE_ORDER
      .filter((t) => groups[t])
      .map((t) => [t, groups[t]]);
  }, [displayItems]);

  // Reset open category when event changes
  useEffect(() => { setOpenCat(null); }, [eventId]);

  if (menuByCategory.length === 0) return null;

  return (
    <section className="px-5 pb-10 max-w-[520px] mx-auto">
      <div className="text-center mb-7 mf-fade-in-up" key={eventId}>
        <span className="font-body text-[10px] tracking-[0.2em] uppercase text-mf-vert-olive">
          La carte
        </span>
        <h2 className="font-serif text-[28px] italic font-normal text-mf-rose mt-1.5">
          Notre menu
        </h2>
        {eventName && (
          <p className="font-body text-[11px] text-mf-muted mt-1">{eventName}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 mf-fade-in-up" key={`menu-${eventId}`}>
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

      <p className="font-body text-[10px] text-mf-muted text-center mt-5 italic">
        Le menu peut varier selon les créneaux. Détails lors de la réservation.
      </p>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   MainPage
   ═══════════════════════════════════════════════════════ */

export default function MainPage() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeEventIdx, setActiveEventIdx] = useState(0);

  useEffect(() => { setTimeout(() => setHeroLoaded(true), 100); }, []);

  /* ─── Data ─── */
  const { data: activeEvents = [] } = useActiveEvents();
  const ev = activeEvents[activeEventIdx] ?? null;
  const eventId = ev?.id;

  return (
    <div className="min-h-screen bg-mf-blanc-casse overflow-hidden">
      <style>{scopedStyles}</style>

      {/* ─── Header ─── */}
      <ClientHeader />

      {/* ═══ HERO ═══ */}
      <section
        className="relative text-center overflow-hidden bg-white pt-[72px] pb-14 px-6"
        style={{
          opacity: heroLoaded ? 1 : 0,
          transform: heroLoaded ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
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

          <a
            href="https://maisonfelicien.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MfButton size="lg" className="px-10">
              Découvrir la boutique
            </MfButton>
          </a>
        </div>
      </section>

      {/* ═══ EVENTS ═══ */}
      {activeEvents.length === 0 ? (
        <section className="px-5 py-16 text-center">
          <p className="font-serif text-[22px] italic text-mf-rose">
            Aucun événement en cours.
          </p>
          <p className="font-body text-[14px] text-mf-muted mt-2">Revenez bientôt !</p>
        </section>
      ) : activeEvents.length === 1 ? (
        /* Single event — no carousel */
        <section className="px-5 max-w-[520px] mx-auto -mt-6 relative z-[2]">
          <div style={{ animationDelay: '0.3s' }} className="animate-fade-up">
            <EventCard ev={activeEvents[0]} isActive={true} cardWidth={300} />
          </div>
        </section>
      ) : (
        /* Multi-event carousel */
        <section className="max-w-[700px] mx-auto -mt-6 relative z-[2] px-2">
          <EventCarousel
            events={activeEvents}
            activeIdx={activeEventIdx}
            onChangeIdx={setActiveEventIdx}
          />
        </section>
      )}

      {/* ═══ DIVIDER ═══ */}
      <FleuronDivider />

      {/* ═══ MENU PREVIEW ═══ */}
      {ev && (
        <DynamicMenu
          eventId={eventId}
          eventName={activeEvents.length > 1 ? ev.name : null}
        />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
