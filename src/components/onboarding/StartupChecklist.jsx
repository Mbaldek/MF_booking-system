import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, X, Rocket } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useMenuCatalog, useAllEventMenuItems } from '@/hooks/useMenuItems';
import { useProfiles } from '@/hooks/useProfiles';
import { useOrders } from '@/hooks/useOrders';
import { CHECKLIST_STEPS } from './tourSteps';
import MfCard from '@/components/ui/MfCard';

const DISMISSED_KEY = 'mf_checklist_dismissed';

export default function StartupChecklist({ activeEventId }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1');

  const { data: events = [] } = useEvents();
  const { data: menuItems = [] } = useMenuCatalog();
  const { data: eventMenuItems = [] } = useAllEventMenuItems(activeEventId);
  const { data: profiles = [] } = useProfiles();
  const { data: orders = [] } = useOrders(activeEventId);

  if (dismissed) return null;

  const data = { events, menuItems, eventMenuItems, profiles, orders };
  const completed = CHECKLIST_STEPS.filter((s) => s.check(data));
  const progress = completed.length;
  const total = CHECKLIST_STEPS.length;

  // Hide if all done
  if (progress === total) return null;

  const pct = Math.round((progress / total) * 100);

  return (
    <MfCard className="relative">
      {/* Dismiss button */}
      <button
        onClick={() => { localStorage.setItem(DISMISSED_KEY, '1'); setDismissed(true); }}
        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-mf-poudre/30 transition-colors bg-transparent border-none cursor-pointer"
        title="Masquer"
      >
        <X className="w-4 h-4 text-mf-muted" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-mf-rose/10 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-mf-rose" />
        </div>
        <div>
          <h3 className="font-serif text-[18px] italic text-mf-rose">Mise en route</h3>
          <p className="font-body text-[11px] text-mf-muted">{progress}/{total} terminé</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-mf-blanc-casse mb-5">
        <div
          className="h-full rounded-full bg-mf-rose transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-1">
        {CHECKLIST_STEPS.map((step) => {
          const done = step.check(data);
          return (
            <Link
              key={step.id}
              to={step.link}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                done
                  ? 'opacity-60'
                  : 'hover:bg-mf-poudre/15'
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-mf-rose flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-mf-muted flex-shrink-0" />
              )}
              <span className={`flex-1 font-body text-[13px] ${
                done ? 'text-mf-muted line-through' : 'text-mf-marron-glace'
              }`}>
                {step.label}
              </span>
              {!done && (
                <ChevronRight className="w-4 h-4 text-mf-muted group-hover:text-mf-rose transition-colors" />
              )}
            </Link>
          );
        })}
      </div>
    </MfCard>
  );
}
