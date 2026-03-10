import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="border-t border-mf-poudre/30 bg-mf-blanc-casse">
      <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col items-center gap-3">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
          <Link to="/mentions-legales" className="font-body text-[11px] text-mf-muted hover:text-mf-rose transition-colors">
            Mentions légales
          </Link>
          <span className="text-mf-poudre select-none">·</span>
          <Link to="/privacy" className="font-body text-[11px] text-mf-muted hover:text-mf-rose transition-colors">
            Politique de confidentialité
          </Link>
          <span className="text-mf-poudre select-none">·</span>
          <Link to="/cgv" className="font-body text-[11px] text-mf-muted hover:text-mf-rose transition-colors">
            CGV
          </Link>
        </nav>
        <p className="font-body text-[10px] text-mf-muted/60 text-center">
          © 2026 Maison Félicien — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
