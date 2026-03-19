const base =
  'inline-flex items-center justify-center gap-2 font-body text-[11px] uppercase tracking-[0.22em] rounded-[6px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';

const variants = {
  primary: 'bg-mf-rose text-mf-blanc-casse hover:bg-mf-marron-glace',
  secondary: 'bg-transparent border border-[rgba(57,45,49,0.2)] text-mf-marron-glace hover:border-mf-rose hover:text-mf-rose',
  outline: 'bg-transparent border-[1.5px] border-mf-border text-mf-marron-glace hover:border-mf-rose hover:text-mf-rose',
  green: 'bg-status-green text-white hover:opacity-90',
  ghost: 'bg-transparent text-mf-rose hover:bg-mf-poudre/20',
  light: 'bg-mf-blanc-casse text-mf-dark hover:bg-white',
  'outline-dark': 'bg-transparent border border-[rgba(240,240,230,0.15)] text-[#F0F0E6] hover:border-[#E5B7B3] hover:text-[#E5B7B3]',
};

const sizes = {
  sm: 'px-5 py-2.5',
  md: 'px-7 py-3.5',
  lg: 'px-8 py-4',
};

export default function MfButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
