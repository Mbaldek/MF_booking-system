import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import ClientHeader from '@/components/layout/ClientHeader';
import MfButton from '@/components/ui/MfButton';

/* ─── Hero video sources ─── */
const HERO_VIDEOS = [
  '/brand/Cinematic_Tea_House_Montage.mp4',
  '/brand/Cinematic_Tea_House_Montage_Generation.mp4',
  '/brand/Vidéo_Générée_Après_Commande.mp4',
];
const VIDEO_MAX_TIME = { 0: 4 };
const VIDEO_CUT_BEFORE_END = 1.5;

/* ─── Scroll Reveal Hook ─── */
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.mf-reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════
   MainPageV2 — Full Dark Mode (mf-pro template style)
   ═══════════════════════════════════════════════════════ */

export default function MainPageV2() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [videoIdx, setVideoIdx] = useState(0);
  const [videoFading, setVideoFading] = useState(false);
  const videoRef = useRef(null);

  /* ─── Split panel hover state ─── */
  const [splitHover, setSplitHover] = useState(null); // 'left' | 'right' | null

  useScrollReveal();
  useEffect(() => { setTimeout(() => setHeroLoaded(true), 100); }, []);

  /* ─── Hero video rotation ─── */
  const goNextVideo = useCallback(() => {
    setVideoFading(true);
    setTimeout(() => { setVideoIdx((i) => (i + 1) % HERO_VIDEOS.length); setVideoFading(false); }, 600);
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const maxTime = VIDEO_MAX_TIME[videoIdx];
    if (maxTime && v.currentTime >= maxTime) { v.pause(); goNextVideo(); }
    else if (!maxTime && v.currentTime >= v.duration - VIDEO_CUT_BEFORE_END) { v.pause(); goNextVideo(); }
  }, [goNextVideo, videoIdx]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [videoIdx]);

  /* ─── Hero stagger ─── */
  const heroEl = (delay, children) => (
    <div style={{
      opacity: heroLoaded ? 1 : 0,
      transform: heroLoaded ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
    }}>
      {children}
    </div>
  );

  /* ─── Newsletter form state ─── */
  const [nlEmail, setNlEmail] = useState('');

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: '#0e0b0c', color: '#F0F0E6' }}>
      <ClientHeader />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden" style={{ minHeight: '100vh', marginTop: -64 }}>
        <video
          ref={videoRef}
          src={HERO_VIDEOS[videoIdx]}
          autoPlay muted playsInline
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={goNextVideo}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: videoFading ? 0 : 1, transition: 'opacity 0.6s ease-in-out' }}
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(14,11,12,0.45) 0%, rgba(14,11,12,0.65) 50%, rgba(14,11,12,0.88) 100%)' }} />

        <div className="relative z-[2] flex flex-col items-center justify-center text-center px-6" style={{ minHeight: '85vh', paddingTop: 80, paddingBottom: 60 }}>
          {heroEl(0.3, <p className="font-body text-[9.5px] tracking-[0.35em] uppercase mb-6" style={{ color: 'rgba(240,240,230,0.4)' }}>Traiteur événementiel</p>)}
          {heroEl(0.45, <p className="font-body text-[10px] tracking-[0.35em] uppercase text-mf-poudre mb-1">Maison</p>)}
          {heroEl(0.6, <h1 className="font-display font-light text-mf-blanc-casse leading-[1.05] tracking-tight mb-5" style={{ fontSize: 'clamp(42px, 8vw, 64px)' }}>Félicien</h1>)}
          {heroEl(0.75, <p className="font-body text-[15px] leading-[1.7] max-w-[400px] mx-auto mb-8" style={{ color: 'rgba(240,240,230,0.55)' }}>Des repas d'exception livrés directement sur votre stand. Commandez pour votre équipe, nous nous occupons du reste.</p>)}
          {heroEl(0.9, (
            <div className="flex gap-3 flex-wrap justify-center">
              <Link to="/order"><MfButton variant="light" size="md">Réserver mes repas →</MfButton></Link>
              <a href="https://maisonfelicien.com" target="_blank" rel="noopener noreferrer">
                <MfButton variant="outline-dark" size="md">Découvrir la boutique</MfButton>
              </a>
            </div>
          ))}
          {heroEl(1.05, (
            <div className="flex justify-center gap-2 mt-8">
              {HERO_VIDEOS.map((_, i) => (
                <button key={i} onClick={() => { if (i !== videoIdx) { setVideoFading(true); setTimeout(() => { setVideoIdx(i); setVideoFading(false); }, 600); } }}
                  className="rounded-full border-none cursor-pointer"
                  style={{ width: i === videoIdx ? 24 : 6, height: 6, background: i === videoIdx ? 'rgba(240,240,230,0.8)' : 'rgba(240,240,230,0.2)', transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[2]">
          <div className="font-body text-[8px] tracking-[0.3em] uppercase" style={{ color: 'rgba(240,240,230,0.25)' }}>Scroll</div>
          <div className="w-px h-6 overflow-hidden" style={{ background: 'rgba(240,240,230,0.1)' }}>
            <div className="w-full" style={{ height: '100%', background: 'rgba(240,240,230,0.4)', animation: 'scrollDrop 2.2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ═══ COMMENT ÇA MARCHE — LIGHT section ═══ */}
      <section style={{ background: '#F0F0E6', padding: '120px 0' }}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <h2 className="font-display font-light text-center mb-16 mf-reveal" style={{ fontSize: 'clamp(32px, 4vw, 48px)', color: '#8B3A43' }}>
            Comment ça <em className="text-mf-poudre">fonctionne</em>&thinsp;?
          </h2>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-0">
            {/* Connector line */}
            <div className="hidden md:block absolute" style={{ top: 28, left: '10%', right: '10%', height: 1, background: 'linear-gradient(to right, transparent, rgba(150,138,66,0.3) 20%, rgba(150,138,66,0.3) 80%, transparent)' }} />

            {[
              { n: '1', title: 'Commandez', body: 'Choisissez votre événement, vos jours, vos menus pour chaque convive.', delay: 'Sous 24h' },
              { n: '2', title: 'Payez', body: 'Réglez en ligne de façon sécurisée via Stripe. Facture instantanée.', delay: 'Paiement sécurisé' },
              { n: '3', title: 'On prépare', body: 'Notre cuisine prépare vos repas avec des produits frais et de saison.', delay: 'Fait maison' },
              { n: '4', title: 'Savourez', body: 'Vos repas livrés chaque jour directement sur votre stand, ou disponibles en retrait chez nous si vous préférez passer nous voir\u00A0:)', delay: 'Livré au stand' },
            ].map((s, i) => (
              <div key={s.n} className={`text-center px-4 md:px-6 relative z-[1] mf-reveal mf-delay-${i + 1}`}>
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center font-display text-[22px]"
                  style={{
                    border: '1px solid rgba(150,138,66,0.35)',
                    color: '#968A42',
                    background: '#F0F0E6',
                    transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#968A42'; e.currentTarget.style.color = '#F0F0E6'; e.currentTarget.style.borderColor = '#968A42'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F0E6'; e.currentTarget.style.color = '#968A42'; e.currentTarget.style.borderColor = 'rgba(150,138,66,0.35)'; }}
                >
                  {s.n}
                </div>
                <div className="font-display font-light text-[20px] mb-2.5" style={{ color: '#392D31' }}><em>{s.title}</em></div>
                <p className="font-body text-[12px] leading-[1.7] mb-3" style={{ color: 'rgba(57,45,49,0.55)' }}>{s.body}</p>
                <span className="font-body text-[9px] tracking-[0.2em] uppercase" style={{ color: 'rgba(150,138,66,0.7)' }}>{s.delay}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MANIFESTE — brand story split (LIGHT section) ═══ */}
      <section style={{ background: '#F0F0E6', padding: '0' }}>
        <div className="flex flex-col md:flex-row" style={{ minHeight: 600 }}>
          {/* Photo side (~55%) */}
          <div className="relative overflow-hidden mf-reveal" style={{ minHeight: 400, flex: '0 0 55%' }}>
            <img
              src="/brand/pro2.png"
              alt="Créations Maison Félicien"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            {/* Fade overlay towards light side */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 60%, #F0F0E6 100%)' }} />
            {/* Date strip — vertical along left edge */}
            <div className="absolute left-0 top-0 bottom-0 z-[2] flex items-end" style={{ writingMode: 'vertical-rl', padding: '24px 14px' }}>
              <span className="font-body text-[8px] tracking-[0.35em] uppercase" style={{ color: 'rgba(240,240,230,0.55)', transform: 'rotate(180deg)' }}>
                Maison Félicien — Paris — Fondée 2023
              </span>
            </div>
          </div>

          {/* Text side (~45%) — light bg, dark text */}
          <div className="flex flex-col justify-center px-8 md:px-14 lg:px-20 py-16 md:py-20 relative" style={{ background: '#F0F0E6', flex: '1 1 45%' }}>
            {/* Decorative vertical line */}
            <div className="hidden md:block absolute left-0 top-[15%] bottom-[15%]" style={{ width: 1, background: 'linear-gradient(to bottom, transparent, rgba(139,58,67,0.18), transparent)' }} />
            <div className="flex items-center gap-3 mb-5 mf-reveal">
              <div style={{ width: 32, height: 1, background: '#968A42' }} />
              <span className="font-body text-[9.5px] tracking-[0.36em] uppercase" style={{ color: '#968A42' }}>
                La Maison
              </span>
            </div>
            <h2 className="font-display font-light leading-[1.06] mb-12 mf-reveal mf-delay-1" style={{ fontSize: 'clamp(34px, 4vw, 52px)', color: '#8B3A43' }}>
              Un jardin<br />
              <em>façonné</em><br />
              <strong className="font-display">à la main.</strong>
            </h2>
            <p className="font-body text-[13px] leading-[1.8] mb-8 mf-reveal mf-delay-2" style={{ color: 'rgba(57,45,49,0.65)' }}>
              Maison Félicien est née d'une conviction : que la gourmandise peut être un acte de soin.
              Chaque création naît en atelier, au rythme des saisons, avec des matières choisies
              pour leur caractère et leur sincérité.
            </p>
            {/* Quote block */}
            <div className="mb-8 mf-reveal mf-delay-3" style={{ borderLeft: '2px solid #8B3A43', paddingLeft: 20 }}>
              <p className="font-display text-[15px] italic leading-[1.5] mb-2" style={{ color: '#8B3A43' }}>
                "La nature n'est pas brute. Elle est cultivée, dessinée, sublimée."
              </p>
              <span className="font-body text-[9px] tracking-[0.2em] uppercase" style={{ color: 'rgba(57,45,49,0.45)' }}>
                — La fondatrice
              </span>
            </div>
            {/* CTA */}
            <div className="mf-reveal mf-delay-4">
              <div className="mb-4" style={{ width: 40, height: 1, background: '#8B3A43' }} />
              <a
                href="https://maisonfelicien.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[9.5px] tracking-[0.2em] uppercase inline-flex items-center gap-2"
                style={{ color: '#8B3A43', transition: 'color 0.3s, gap 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#BF646D'; e.currentTarget.style.gap = '14px'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8B3A43'; e.currentTarget.style.gap = '8px'; }}
              >
                Découvrir la Maison →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SPLIT B2C / B2B — grid 2 colonnes, photos + Ken Burns ═══ */}
      <section className="mf-reveal relative">
        {/* Divider line */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 z-10 pointer-events-none" style={{ width: 1, background: 'rgba(240,240,230,0.12)' }} />
        {/* Center "ou" label */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div
            className="flex items-center justify-center rounded-full font-display text-[11px] italic"
            style={{
              width: 72, height: 72,
              background: '#F0F0E6',
              boxShadow: '0 8px 40px rgba(57,45,49,0.35)',
              color: '#8B3A43',
              letterSpacing: '0.05em',
              transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            ou
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: '85vh' }}>
          {/* ─── Panel B2C ─── */}
          <div
            className="relative overflow-hidden cursor-pointer flex flex-col justify-end"
            style={{ padding: '72px 48px 80px 64px', minHeight: 400, transition: 'flex-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
            onMouseEnter={(e) => { setSplitHover('left'); e.currentTarget.querySelector('.p-desc').style.opacity = '1'; e.currentTarget.querySelector('.p-desc').style.transform = 'none'; e.currentTarget.querySelector('.p-svcs').style.opacity = '1'; e.currentTarget.querySelector('.p-svcs').style.transform = 'none'; }}
            onMouseLeave={(e) => { setSplitHover(null); e.currentTarget.querySelector('.p-desc').style.opacity = '0'; e.currentTarget.querySelector('.p-desc').style.transform = 'translateY(10px)'; e.currentTarget.querySelector('.p-svcs').style.opacity = '0'; e.currentTarget.querySelector('.p-svcs').style.transform = 'translateY(8px)'; }}
          >
            {/* Photo with Ken Burns */}
            <img src="/brand/split-b2c.jpg" alt="" className="absolute object-cover pointer-events-none" style={{ inset: '-8%', width: '116%', height: '116%', animation: 'kbB2c 26s ease-in-out infinite alternate' }} />
            {/* Overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(57,45,49,0.75) 0%, rgba(57,45,49,0.45) 50%, rgba(139,58,67,0.25) 100%)', transition: 'background 0.6s' }} />

            {/* Tag top */}
            <div className="absolute flex items-center gap-2.5" style={{ top: 40, left: 64 }}>
              <span className="font-body text-[8.5px] tracking-[0.3em] uppercase" style={{ color: 'rgba(240,240,230,0.5)' }}>Particuliers</span>
              <span style={{ width: 24, height: 1, background: 'rgba(240,240,230,0.3)' }} />
            </div>
            {/* Logo center */}
            <img src="/brand/Logo_Blanc-cassé.svg" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ height: 80, opacity: 0.18, transition: 'opacity 0.5s' }} />
            {/* Number deco */}
            <div className="absolute font-display font-light leading-none" style={{ top: 32, right: 56, fontSize: 96, color: '#F0F0E6', opacity: 0.04 }}>01</div>

            {/* Content */}
            <div className="relative z-[2]">
              <span className="font-body text-[9px] tracking-[0.34em] uppercase block mb-4" style={{ color: '#E5B7B3', opacity: 0.65, transition: 'letter-spacing 0.4s' }}>
                Boutique en ligne
              </span>
              <h3 className="font-display font-light leading-[1.1] mb-5" style={{ fontSize: 'clamp(32px, 3.8vw, 58px)', color: '#F0F0E6' }}>
                Pour vous,<br /><em>pour offrir.</em>
              </h3>
              <p className="p-desc font-body text-[13.5px] leading-[1.75] mb-8 max-w-[340px]" style={{ color: 'rgba(240,240,230,0.62)', opacity: 0, transform: 'translateY(10px)', transition: 'opacity 0.45s 0.05s, transform 0.45s 0.05s' }}>
                Commandez nos pâtisseries artisanales, nos coffrets cadeaux et nos douceurs de saison.
                Livraison fraîche, façonnées le matin même.
              </p>
              <div className="p-svcs flex flex-wrap gap-2 mb-9" style={{ opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.4s 0.1s, transform 0.4s 0.1s' }}>
                {['Click & collect', 'Livraison Paris', 'Coffrets cadeaux'].map((tag) => (
                  <span key={tag} className="font-body text-[8.5px] tracking-[0.18em] uppercase" style={{ color: 'rgba(240,240,230,0.7)', border: '1px solid rgba(240,240,230,0.2)', padding: '5px 13px', transition: 'border-color 0.3s, color 0.3s' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href="https://maisonfelicien.com/collections"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center font-body text-[10px] tracking-[0.24em] uppercase"
                style={{ color: '#F0F0E6', border: '1px solid rgba(240,240,230,0.35)', padding: '14px 28px', gap: 14, transition: 'gap 0.35s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s, color 0.3s', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F0E6'; e.currentTarget.style.color = '#8B3A43'; e.currentTarget.style.gap = '22px'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F0F0E6'; e.currentTarget.style.gap = '14px'; }}
              >
                Commander <span style={{ transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}>→</span>
              </a>
            </div>
          </div>

          {/* ─── Panel B2B ─── */}
          <div
            className="relative overflow-hidden cursor-pointer flex flex-col justify-end"
            style={{ padding: '72px 48px 80px 64px', minHeight: 400, transition: 'flex-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
            onMouseEnter={(e) => { setSplitHover('right'); e.currentTarget.querySelector('.p-desc').style.opacity = '1'; e.currentTarget.querySelector('.p-desc').style.transform = 'none'; e.currentTarget.querySelector('.p-svcs').style.opacity = '1'; e.currentTarget.querySelector('.p-svcs').style.transform = 'none'; }}
            onMouseLeave={(e) => { setSplitHover(null); e.currentTarget.querySelector('.p-desc').style.opacity = '0'; e.currentTarget.querySelector('.p-desc').style.transform = 'translateY(10px)'; e.currentTarget.querySelector('.p-svcs').style.opacity = '0'; e.currentTarget.querySelector('.p-svcs').style.transform = 'translateY(8px)'; }}
          >
            {/* Photo with Ken Burns */}
            <img src="/brand/pro1.png" alt="" className="absolute object-cover pointer-events-none" style={{ inset: '-8%', width: '116%', height: '116%', animation: 'kbB2b 30s ease-in-out infinite alternate' }} />
            {/* Overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(57,45,49,0.82) 0%, rgba(57,45,49,0.55) 50%, rgba(150,138,66,0.2) 100%)', transition: 'background 0.6s' }} />

            {/* Tag top */}
            <div className="absolute flex items-center gap-2.5" style={{ top: 40, left: 64 }}>
              <span className="font-body text-[8.5px] tracking-[0.3em] uppercase" style={{ color: 'rgba(240,240,230,0.5)' }}>Professionnels</span>
              <span style={{ width: 24, height: 1, background: 'rgba(240,240,230,0.3)' }} />
            </div>
            {/* Logo center */}
            <img src="/brand/Logo_Blanc-cassé.svg" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ height: 80, opacity: 0.18, transition: 'opacity 0.5s' }} />
            {/* Number deco */}
            <div className="absolute font-display font-light leading-none" style={{ top: 32, right: 56, fontSize: 96, color: '#F0F0E6', opacity: 0.04 }}>02</div>

            {/* Content */}
            <div className="relative z-[2]">
              <span className="font-body text-[9px] tracking-[0.34em] uppercase block mb-4" style={{ color: '#968A42', opacity: 0.8, transition: 'letter-spacing 0.4s' }}>
                Maison Félicien Pro
              </span>
              <h3 className="font-display font-light leading-[1.1] mb-5" style={{ fontSize: 'clamp(32px, 3.8vw, 58px)', color: '#F0F0E6' }}>
                Pour vos<br /><em>événements.</em>
              </h3>
              <p className="p-desc font-body text-[13.5px] leading-[1.75] mb-8 max-w-[340px]" style={{ color: 'rgba(240,240,230,0.62)', opacity: 0, transform: 'translateY(10px)', transition: 'opacity 0.45s 0.05s, transform 0.45s 0.05s' }}>
                Mariages, séminaires, salons professionnels — un service traiteur sur-mesure,
                pensé pour vos ambitions. Un interlocuteur unique, du brief à la livraison.
              </p>
              <div className="p-svcs flex flex-wrap gap-2 mb-9" style={{ opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.4s 0.1s, transform 0.4s 0.1s' }}>
                {['Mariages & réceptions', 'Entreprises', 'Sur-mesure', 'Grand volume'].map((tag) => (
                  <span key={tag} className="font-body text-[8.5px] tracking-[0.18em] uppercase" style={{ color: 'rgba(240,240,230,0.65)', border: '1px solid rgba(150,138,66,0.3)', padding: '5px 13px', transition: 'border-color 0.3s, color 0.3s' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                to="/order"
                className="inline-flex items-center font-body text-[10px] tracking-[0.24em] uppercase"
                style={{ color: '#F0F0E6', border: '1px solid rgba(150,138,66,0.5)', padding: '14px 28px', gap: 14, transition: 'gap 0.35s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s, color 0.3s', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#968A42'; e.currentTarget.style.color = '#F0F0E6'; e.currentTarget.style.gap = '22px'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F0F0E6'; e.currentTarget.style.gap = '14px'; }}
              >
                Faire une demande <span style={{ transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BRIDGE BAND ═══ */}
      <div className="mf-reveal" style={{ background: '#392D31', padding: '36px 48px' }}>
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {['Paris & Île-de-France', 'Commande 48h à l\'avance', 'Devis pro sous 24h', 'Recettes de saison'].map((item, i) => (
            <span key={item} className="flex items-center gap-2">
              {i > 0 && <span className="hidden md:block" style={{ width: 1, height: 24, background: 'rgba(240,240,230,0.1)' }} />}
              <span className="flex items-center gap-2.5 font-body text-[9px] tracking-[0.18em] uppercase" style={{ color: 'rgba(240,240,230,0.35)' }}>
                <span className="shrink-0" style={{ width: 5, height: 5, borderRadius: '50%', background: '#8B3A43' }} />
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══ NEWSLETTER — prefooter (ROSE section) ═══ */}
      <section className="relative overflow-hidden" style={{ background: '#8B3A43', padding: '96px 48px' }}>
        {/* Decorative monogram */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
          <img
            src="/brand/Monogramme-Blanc-cassé.svg"
            alt=""
            className="opacity-[0.04]"
            style={{ width: 'clamp(300px, 40vw, 500px)', height: 'auto' }}
          />
        </div>

        <div className="max-w-[500px] mx-auto px-6 text-center relative z-[1]">
          <span className="font-body text-[9.5px] tracking-[0.36em] uppercase block mb-5 mf-reveal" style={{ color: 'rgba(240,240,230,0.5)' }}>
            La lettre de la maison
          </span>
          <h2 className="font-display font-light mb-4 mf-reveal mf-delay-1" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}>
            Restez dans <em>le jardin.</em>
          </h2>
          <p className="font-body text-[13px] leading-[1.75] mb-8 mf-reveal mf-delay-2" style={{ color: 'rgba(240,240,230,0.45)' }}>
            Nouvelles recettes, saisons, histoires d'atelier. Une lettre rare, jamais banale.
          </p>

          {/* Form */}
          <form
            className="flex gap-2 mb-4 mf-reveal mf-delay-3"
            onSubmit={(e) => { e.preventDefault(); /* TODO: wire newsletter signup */ }}
          >
            <input
              type="email"
              value={nlEmail}
              onChange={(e) => setNlEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="flex-1 font-body text-[13px] px-6 py-3 rounded-full outline-none"
              style={{
                background: 'rgba(240,240,230,0.06)',
                border: '1px solid rgba(240,240,230,0.1)',
                color: '#F0F0E6',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(240,240,230,0.55)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(240,240,230,0.1)'; }}
            />
            <button
              type="submit"
              className="font-body text-[11px] tracking-[0.15em] uppercase px-6 py-3 rounded-full shrink-0 cursor-pointer"
              style={{
                background: '#F0F0E6',
                color: '#8B3A43',
                border: 'none',
                transition: 'background 0.3s, transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#E5B7B3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F0E6'; }}
            >
              S'inscrire
            </button>
          </form>
          <p className="font-body text-[10px] mf-reveal mf-delay-4" style={{ color: 'rgba(240,240,230,0.2)' }}>
            Pas de spam. Désinscription en un clic.
          </p>
        </div>
      </section>

      {/* ═══ FOOTER — multi-column (DARK marron) ═══ */}
      <footer style={{ background: '#392D31', borderTop: '1px solid rgba(229,183,179,0.15)' }}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 pt-16 pb-10">
          {/* 4-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-14">

            {/* Col 1: Brand */}
            <div>
              <Link to="/" className="inline-block mb-5">
                <img src="/brand/Logo_Blanc-cassé.svg" alt="Maison Félicien" className="h-6 opacity-70" />
              </Link>
              <p className="font-body text-[11.5px] leading-[1.7] mb-5" style={{ color: 'rgba(240,240,230,0.35)' }}>
                La nature cultivée, dessinée, sublimée. Un atelier parisien.
              </p>
              <div className="flex gap-4">
                {[
                  { label: 'Ig', href: 'https://instagram.com/maisonfelicien' },
                  { label: 'Fb', href: 'https://facebook.com/maisonfelicien' },
                  { label: 'Pi', href: 'https://pinterest.com/maisonfelicien' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-[9px] tracking-[0.15em] uppercase flex items-center justify-center rounded-full"
                    style={{
                      width: 32, height: 32,
                      border: '1px solid rgba(240,240,230,0.1)',
                      color: 'rgba(240,240,230,0.35)',
                      transition: 'border-color 0.25s, color 0.25s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(240,240,230,0.25)'; e.currentTarget.style.color = 'rgba(240,240,230,0.6)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(240,240,230,0.1)'; e.currentTarget.style.color = 'rgba(240,240,230,0.35)'; }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2: Boutique */}
            <div>
              <h4 className="font-body text-[9.5px] tracking-[0.25em] uppercase mb-5" style={{ color: 'rgba(240,240,230,0.5)' }}>Boutique</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Toutes les créations', href: 'https://maisonfelicien.com/collections' },
                  { label: 'Nouveautés', href: 'https://maisonfelicien.com/collections/nouveautes' },
                  { label: 'Coffrets cadeaux', href: 'https://maisonfelicien.com/collections/coffrets' },
                  { label: 'Click & collect', href: 'https://maisonfelicien.com/pages/click-and-collect' },
                  { label: 'Livraison', href: 'https://maisonfelicien.com/pages/livraison' },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-[11.5px]"
                      style={{ color: 'rgba(240,240,230,0.3)', transition: 'color 0.25s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.6)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.3)')}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: La Maison */}
            <div>
              <h4 className="font-body text-[9.5px] tracking-[0.25em] uppercase mb-5" style={{ color: 'rgba(240,240,230,0.5)' }}>La Maison</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Notre histoire', href: 'https://maisonfelicien.com/pages/notre-histoire', ext: true },
                  { label: "L'atelier", href: 'https://maisonfelicien.com/pages/atelier', ext: true },
                  { label: 'Recettes de saison', href: 'https://maisonfelicien.com/blogs/recettes', ext: true },
                  { label: 'Espace pro →', to: '/order' },
                  { label: 'Presse', href: 'https://maisonfelicien.com/pages/presse', ext: true },
                ].map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link
                        to={l.to}
                        className="font-body text-[11.5px]"
                        style={{ color: 'rgba(240,240,230,0.3)', transition: 'color 0.25s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.6)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.3)')}
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body text-[11.5px]"
                        style={{ color: 'rgba(240,240,230,0.3)', transition: 'color 0.25s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.6)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.3)')}
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div>
              <h4 className="font-body text-[9.5px] tracking-[0.25em] uppercase mb-5" style={{ color: 'rgba(240,240,230,0.5)' }}>Contact</h4>
              <ul className="space-y-3">
                <li className="font-body text-[11.5px]" style={{ color: 'rgba(240,240,230,0.3)' }}>
                  Paris Île-de-France
                </li>
                <li>
                  <a href="mailto:contact@maisonfelicien.com" className="font-body text-[11.5px]"
                    style={{ color: 'rgba(240,240,230,0.3)', transition: 'color 0.25s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.6)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.3)')}
                  >
                    contact@maisonfelicien.com
                  </a>
                </li>
                <li>
                  <a href="mailto:pro@maisonfelicien.com" className="font-body text-[11.5px]"
                    style={{ color: 'rgba(240,240,230,0.3)', transition: 'color 0.25s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.6)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.3)')}
                  >
                    pro@maisonfelicien.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-7 pb-2" style={{ borderTop: '1px solid rgba(240,240,230,0.05)' }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <span className="font-body text-[9.5px]" style={{ color: 'rgba(240,240,230,0.18)', letterSpacing: '0.08em' }}>
                © 2026 Maison Félicien — Tous droits réservés
              </span>
              <div className="flex gap-4 flex-wrap justify-center">
                {[
                  { to: '/mentions-legales', label: 'Mentions légales' },
                  { to: '/cgv', label: 'CGV' },
                  { to: '/privacy', label: 'Confidentialité' },
                ].map((l) => (
                  <Link key={l.to} to={l.to} className="font-body text-[9.5px]"
                    style={{ color: 'rgba(240,240,230,0.18)', letterSpacing: '0.08em', transition: 'color 0.25s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.18)')}
                  >{l.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer signature watermark */}
        <div className="overflow-hidden select-none" style={{ borderTop: '1px solid rgba(240,240,230,0.03)' }}>
          <div className="max-w-[1200px] mx-auto text-center py-6">
            <span className="font-display text-[11px] tracking-[0.3em] uppercase" style={{ color: 'rgba(240,240,230,0.06)' }}>
              Maison Félicien
            </span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes scrollDrop { 0% { transform: translateY(-100%); } 50% { transform: translateY(0); } 100% { transform: translateY(100%); } }
        @keyframes kbB2c { 0% { transform: scale(1) translate(0,0); } 50% { transform: scale(1.07) translate(-2%,1.5%); } 100% { transform: scale(1.04) translate(1.5%,-2%); } }
        @keyframes kbB2b { 0% { transform: scale(1.02) translate(0,0); } 50% { transform: scale(1.06) translate(2%,-1.5%); } 100% { transform: scale(1.09) translate(-1.5%,2%); } }
      `}</style>
    </div>
  );
}
