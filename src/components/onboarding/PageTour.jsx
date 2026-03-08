import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight } from 'lucide-react';
import { TOUR_STEPS } from './tourSteps';

const STORAGE_PREFIX = 'mf_tour_seen_';

function getSeenKey(page) {
  return `${STORAGE_PREFIX}${page}`;
}

/**
 * Custom tour overlay — replaces react-joyride (incompatible React 19).
 * Renders a spotlight + tooltip for each step, targeting `data-tour="X"` elements.
 *
 * Usage:
 *   <PageTour page="dashboard" />
 *   <PageTour page="dashboard" run={true} /> // force re-run
 */
export default function PageTour({ page, run: forceRun }) {
  const steps = TOUR_STEPS[page];
  const [currentStep, setCurrentStep] = useState(0);
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  // Auto-start on first visit (unless already seen)
  useEffect(() => {
    if (!steps?.length) return;
    const seen = localStorage.getItem(getSeenKey(page));
    if (!seen || forceRun) {
      // Small delay for DOM to render
      const t = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(t);
    }
  }, [page, steps, forceRun]);

  // Track target element position
  const updateRect = useCallback(() => {
    if (!active || !steps?.[currentStep]) return;
    const el = document.querySelector(`[data-tour="${steps[currentStep].target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setRect(null);
    }
    rafRef.current = requestAnimationFrame(updateRect);
  }, [active, currentStep, steps]);

  useEffect(() => {
    if (active) {
      rafRef.current = requestAnimationFrame(updateRect);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [active, updateRect]);

  const close = useCallback(() => {
    setActive(false);
    setCurrentStep(0);
    localStorage.setItem(getSeenKey(page), '1');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [page]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      close();
    }
  }, [currentStep, steps, close]);

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // Keyboard nav
  useEffect(() => {
    if (!active) return;
    const handler = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, close, next, prev]);

  if (!active || !steps?.length) return null;

  const step = steps[currentStep];
  const pad = 8;

  // Tooltip position: below the target by default, above if no room
  let tooltipStyle = {};
  if (rect) {
    const below = rect.top + rect.height + pad + 16;
    const spaceBelow = window.innerHeight - below;
    if (spaceBelow > 180) {
      tooltipStyle = {
        top: below,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 340)),
      };
    } else {
      tooltipStyle = {
        top: Math.max(16, rect.top - pad - 180),
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 340)),
      };
    }
  } else {
    // Fallback: center
    tooltipStyle = { top: '30%', left: '50%', transform: 'translateX(-50%)' };
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
      {/* Overlay with cutout */}
      <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - pad}
                y={rect.top - pad}
                width={rect.width + pad * 2}
                height={rect.height + pad * 2}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(57, 45, 49, 0.45)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={close}
        />
      </svg>

      {/* Spotlight border */}
      {rect && (
        <div
          className="fixed rounded-xl border-2 border-mf-rose/60 transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            pointerEvents: 'none',
            boxShadow: '0 0 0 4px rgba(139, 58, 67, 0.15)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed bg-[#FDFAF7] rounded-2xl border border-[#E5B7B3] shadow-lg max-w-[320px] w-[320px] transition-all duration-300"
        style={{ ...tooltipStyle, pointerEvents: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="font-body text-[10px] uppercase tracking-[0.15em] text-mf-rose font-medium">
            {step.title}
          </span>
          <button
            onClick={close}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-mf-poudre/30 transition-colors bg-transparent border-none cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-mf-muted" />
          </button>
        </div>

        {/* Body */}
        <p className="px-5 pb-3 font-body text-[13px] text-mf-marron-glace leading-relaxed">
          {step.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-4">
          <span className="font-body text-[11px] text-mf-muted">
            {currentStep + 1}/{steps.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={prev}
                className="font-body text-[12px] text-mf-muted hover:text-mf-rose transition-colors bg-transparent border-none cursor-pointer px-2 py-1"
              >
                Retour
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 font-body text-[12px] text-mf-blanc-casse bg-mf-rose px-4 py-2 rounded-pill hover:opacity-90 transition-opacity border-none cursor-pointer"
            >
              {currentStep < steps.length - 1 ? (
                <>Suivant <ChevronRight className="w-3.5 h-3.5" /></>
              ) : (
                'Terminer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Reset a page tour so it runs again on next visit.
 */
export function resetTour(page) {
  localStorage.removeItem(getSeenKey(page));
}

/**
 * Reset all tours.
 */
export function resetAllTours() {
  Object.keys(TOUR_STEPS).forEach((page) => {
    localStorage.removeItem(getSeenKey(page));
  });
}
