export default function MfInput({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="font-body text-[9.5px] uppercase tracking-[0.2em] pl-0.5"
          style={{ color: 'rgba(57,45,49,0.45)' }}
        >
          {label}
        </label>
      )}
      <input
        className="font-body text-[15px] text-mf-marron-glace outline-none"
        style={{
          background: 'rgba(57,45,49,0.03)',
          border: error ? '1px solid #A63D40' : '1px solid rgba(57,45,49,0.1)',
          borderRadius: 0,
          padding: '16px 18px',
          transition: 'border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1), background 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          color: '#392D31',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#968A42'; e.target.style.background = 'rgba(57,45,49,0.05)'; }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#A63D40' : 'rgba(57,45,49,0.1)';
          e.target.style.background = 'rgba(57,45,49,0.03)';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <p className="font-body text-[11px] pl-0.5" style={{ color: '#A63D40' }}>{error}</p>
      )}
    </div>
  );
}
