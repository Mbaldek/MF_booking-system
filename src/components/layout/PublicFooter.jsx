import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer style={{ background: '#0e0b0c', borderTop: '1px solid rgba(240,240,230,0.06)' }}>
      <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col items-center gap-3">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
          {[
            { to: '/mentions-legales', label: 'Mentions légales' },
            { to: '/privacy', label: 'Politique de confidentialité' },
            { to: '/cgv', label: 'CGV' },
          ].map((l, i) => (
            <span key={l.to} className="flex items-center gap-5">
              {i > 0 && <span style={{ color: 'rgba(240,240,230,0.12)' }} className="select-none">·</span>}
              <Link
                to={l.to}
                className="font-body text-[11px]"
                style={{
                  color: 'rgba(240,240,230,0.3)',
                  transition: 'color 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E5B7B3')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,230,0.3)')}
              >
                {l.label}
              </Link>
            </span>
          ))}
        </nav>
        <p className="font-body text-[10px] text-center" style={{ color: 'rgba(240,240,230,0.18)' }}>
          © 2026 Maison Félicien — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
