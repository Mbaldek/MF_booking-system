export default function MfInput({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[10px] uppercase tracking-[0.12em] text-mf-rose font-body pl-1">
          {label}
        </label>
      )}
      <input
        className={`rounded-pill border px-5 py-3 font-body text-[15px] text-mf-marron-glace bg-mf-white placeholder:text-mf-muted-light outline-none transition-colors duration-200 ${
          error
            ? 'border-status-red focus:border-status-red'
            : 'border-mf-border focus:border-mf-rose'
        }`}
        {...props}
      />
      {error && (
        <p className="text-[11px] text-status-red pl-2">{error}</p>
      )}
    </div>
  );
}
