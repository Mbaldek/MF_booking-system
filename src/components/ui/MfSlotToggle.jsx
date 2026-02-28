const slots = [
  { key: 'midi', label: '☀ Midi' },
  { key: 'soir', label: '☽ Soir' },
];

export default function MfSlotToggle({ value, onChange, className = '' }) {
  return (
    <div
      className={`inline-flex rounded-pill border border-mf-border overflow-hidden ${className}`}
    >
      {slots.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onChange?.(s.key)}
          className={`px-4 py-2 text-[11px] uppercase tracking-[0.06em] font-body cursor-pointer transition-all duration-200 ${
            value === s.key
              ? 'bg-mf-rose text-mf-blanc-casse'
              : 'bg-transparent text-mf-muted hover:text-mf-vieux-rose'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
