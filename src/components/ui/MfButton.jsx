const base =
  'inline-flex items-center justify-center font-body uppercase tracking-wider transition-all duration-200 rounded-pill cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';

const variants = {
  primary: 'bg-mf-rose text-mf-blanc-casse hover:opacity-90',
  secondary: 'bg-mf-white border border-mf-border text-mf-marron-glace hover:border-mf-rose/40',
  ghost: 'bg-transparent text-mf-rose hover:bg-mf-poudre/20',
};

const sizes = {
  sm: 'text-[11px] px-4 py-2',
  md: 'text-[13px] px-6 py-3',
  lg: 'text-[13px] px-8 py-3.5',
};

export default function MfButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
