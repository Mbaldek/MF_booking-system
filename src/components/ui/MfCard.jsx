export default function MfCard({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-mf-white rounded-card border border-mf-border p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
