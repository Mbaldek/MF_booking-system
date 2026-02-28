const variants = {
  rose: 'bg-mf-rose/12 text-mf-rose',
  poudre: 'bg-mf-poudre/30 text-mf-rose',
  olive: 'bg-mf-vert-olive/12 text-mf-vert-olive',
  green: 'bg-status-green/12 text-status-green',
  orange: 'bg-status-orange/12 text-status-orange',
  red: 'bg-status-red/12 text-status-red',
};

export default function MfBadge({ variant = 'rose', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill text-[9px] uppercase tracking-wide px-2.5 py-0.5 font-body ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
