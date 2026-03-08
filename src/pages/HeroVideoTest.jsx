import { useState, useRef, useCallback, useEffect } from 'react';

/* ─── Video sources ─── */
const VIDEOS = [
  '/brand/Cinematic_Tea_House_Montage.mp4',
  '/brand/Cinematic_Tea_House_Montage_Generation.mp4',
  '/brand/Vidéo_Générée_Après_Commande.mp4',
];

/* Cut: stop each video 1.5s before end to hide bad logo */
const CUT_BEFORE_END = 1.5;

/* ─── Decorative SVGs (from MainPage) ─── */

const Ornament = ({ size = 120, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={`opacity-35 ${className}`}>
    {[0, 72, 144, 216, 288].map((r) => (
      <path key={r} d="M60 10 C60 10, 45 30, 45 50 C45 62, 52 70, 60 70 C68 70, 75 62, 75 50 C75 30, 60 10, 60 10Z" fill="currentColor" transform={r ? `rotate(${r} 60 55)` : undefined} />
    ))}
    <circle cx="60" cy="55" r="8" fill="currentColor" opacity="0.6" />
  </svg>
);

const Fleuron = () => (
  <svg width="40" height="48" viewBox="0 0 40 48" fill="none" className="text-white/70">
    <path d="M20 4 C20 4, 28 14, 28 22 C28 27, 24 30, 20 30 C16 30, 12 27, 12 22 C12 14, 20 4, 20 4Z" fill="currentColor" opacity="0.7" />
    <path d="M20 4 C20 4, 12 14, 12 22 C12 27, 16 30, 20 30 C24 30, 28 27, 28 22 C28 14, 20 4, 20 4Z" fill="currentColor" opacity="0.5" transform="rotate(60 20 22)" />
    <path d="M20 4 C20 4, 12 14, 12 22 C12 27, 16 30, 20 30 C24 30, 28 27, 28 22 C28 14, 20 4, 20 4Z" fill="currentColor" opacity="0.5" transform="rotate(-60 20 22)" />
    <line x1="20" y1="30" x2="20" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M20 36 C24 33, 30 34, 30 34" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <path d="M20 40 C16 37, 10 38, 10 38" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
  </svg>
);

/* ─── Styles ─── */
const styles = `
  @keyframes hero-float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
  @keyframes hero-pulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.45; } }
  .hero-float { animation: hero-float 6s ease-in-out infinite; }
  .hero-pulse { animation: hero-pulse 4s ease-in-out infinite; }
`;

/* ═══════════════════════════════════════════
   HeroVideoTest — Page de test hero vidéo
   ═══════════════════════════════════════════ */
export default function HeroVideoTest() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const videoRef = useRef(null);

  /* Advance to next video with crossfade */
  const goNext = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCurrentIdx((i) => (i + 1) % VIDEOS.length);
      setFading(false);
    }, 600); // match CSS transition duration
  }, []);

  /* Cut video before the bad logo at the end */
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    if (v.currentTime >= v.duration - CUT_BEFORE_END) {
      v.pause();
      goNext();
    }
  }, [goNext]);

  /* Auto-play when source changes */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    v.play().catch(() => {});
  }, [currentIdx]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-mf-marron-glace">
      <style>{styles}</style>

      {/* ─── Video ─── */}
      <video
        ref={videoRef}
        src={VIDEOS[currentIdx]}
        autoPlay
        muted
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={goNext}
        className="absolute inset-0 w-full h-full transition-opacity duration-[600ms] ease-in-out"
        style={{
          objectFit: 'cover',
          objectPosition: 'center 20%', /* push down = crop bottom logo */
          opacity: fading ? 0 : 1,
        }}
      />

      {/* ─── Bottom crop mask (hides logo at bottom) ─── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[15%] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, #392D31)',
        }}
      />

      {/* ─── Overlay gradient ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(57,45,49,0.45) 0%,
              rgba(57,45,49,0.15) 40%,
              rgba(57,45,49,0.10) 60%,
              rgba(57,45,49,0.50) 100%
            )
          `,
        }}
      />

      {/* ─── Decorative ornaments ─── */}
      <div className="hero-float hero-pulse absolute top-8 -left-4 text-white/20 pointer-events-none">
        <Ornament size={90} />
      </div>
      <div className="hero-float hero-pulse absolute top-12 -right-3 text-white/20 pointer-events-none" style={{ animationDelay: '2s' }}>
        <Ornament size={70} />
      </div>

      {/* ─── Content overlay ─── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
        <p className="font-body text-[10px] tracking-[0.3em] uppercase text-mf-poudre mb-4">
          Traiteur événementiel
        </p>

        <div className="mb-4 opacity-70 flex justify-center">
          <Fleuron />
        </div>

        <p className="font-body text-[10px] tracking-[0.35em] uppercase text-mf-poudre/80 mb-1">
          Maison
        </p>
        <h1 className="font-serif text-[56px] font-normal italic text-white leading-[1.05] tracking-tight mb-4 drop-shadow-lg">
          Félicien
        </h1>

        <p className="font-body text-[15px] text-white/80 leading-[1.7] max-w-[380px] mx-auto mb-8 drop-shadow-sm">
          Des repas d'exception livrés directement sur votre stand.
          Commandez pour votre équipe, nous nous occupons du reste.
        </p>

        <a
          href="https://maisonfelicien.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-body text-[14px] tracking-wide px-8 py-3 rounded-full hover:bg-white/25 transition-all duration-300"
        >
          Découvrir la boutique
        </a>
      </div>

      {/* ─── Video indicator dots ─── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {VIDEOS.map((_, i) => (
          <button
            key={i}
            onClick={() => { if (i !== currentIdx) { setFading(true); setTimeout(() => { setCurrentIdx(i); setFading(false); }, 600); } }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentIdx ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
