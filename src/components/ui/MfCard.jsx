export default function MfCard({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-mf-white border border-mf-border p-10 ${className}`}
      style={{
        borderRadius: 0,
        transition: 'border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(139,58,67,0.2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      {...props}
    >
      {children}
    </div>
  );
}
