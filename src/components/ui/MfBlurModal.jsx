export default function MfBlurModal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-5">
      <style>{`
        @keyframes mf-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mf-modal-in { from { opacity: 0; transform: scale(0.92) translateY(16px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: 'rgba(57,45,49,0.35)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'mf-backdrop-in 0.3s ease',
        }}
      />

      {/* Card */}
      <div
        className="relative bg-white rounded-3xl max-w-[380px] w-full text-center"
        style={{
          padding: '30px 24px 24px',
          boxShadow: '0 24px 80px rgba(57,45,49,0.18)',
          animation: 'mf-modal-in 0.4s ease both',
        }}
      >
        {children}
      </div>
    </div>
  );
}
