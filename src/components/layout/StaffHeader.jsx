import { Link } from 'react-router-dom';

export default function StaffHeader({
  role = 'kitchen',
  slotFilter = 'all',
  onSlotFilterChange,
  progress,
  children,
}) {
  const roleConfig = {
    kitchen: { label: '🍳 Cuisine', color: 'status-orange' },
    delivery: { label: '🚚 Livraisons', color: 'status-green' },
  };

  const cfg = roleConfig[role] || roleConfig.kitchen;

  const slotOptions = [
    { key: 'all', label: 'Tous' },
    { key: 'midi', label: '☀ Midi' },
    { key: 'soir', label: '☽ Soir' },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white border-b border-mf-border">
      {/* Left — Logo + Role badge */}
      <div className="flex items-center gap-4">
        <Link to="/" className="block">
          <div className="font-body text-[9px] uppercase tracking-[0.3em] text-mf-vieux-rose">
            Maison
          </div>
          <div className="font-serif text-[18px] italic text-mf-rose leading-none">
            Félicien
          </div>
        </Link>

        <div className="w-px h-8 bg-mf-border" />

        <span
          className={`font-body text-[10px] uppercase tracking-[0.1em] text-${cfg.color} bg-${cfg.color}/8 rounded-pill px-3 py-1`}
        >
          {cfg.label}
        </span>
      </div>

      {/* Right — Progress + Slot filter + extra children */}
      <div className="flex items-center gap-3">
        {/* Progress bar */}
        {progress != null && (
          <div className="flex items-center gap-2 mr-2">
            <div className="w-28 h-1.5 rounded-full bg-mf-blanc-casse">
              <div
                className="h-full rounded-full bg-status-green transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-body text-[12px] font-medium text-status-green">
              {Math.round(progress)}%
            </span>
          </div>
        )}

        {/* Slot filter */}
        {onSlotFilterChange && (
          <div className="inline-flex rounded-pill border border-mf-border overflow-hidden">
            {slotOptions.map((s) => (
              <button
                key={s.key}
                onClick={() => onSlotFilterChange(s.key)}
                className={`px-3.5 py-1.5 font-body text-[11px] uppercase tracking-[0.06em] cursor-pointer transition-all duration-200 border-none ${
                  slotFilter === s.key
                    ? 'bg-mf-rose text-mf-blanc-casse'
                    : 'bg-transparent text-mf-muted hover:text-mf-vieux-rose'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Extra controls (view toggle, etc.) */}
        {children}
      </div>
    </header>
  );
}
