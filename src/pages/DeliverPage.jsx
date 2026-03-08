import { useParams } from 'react-router-dom';

export default function DeliverPage() {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-mf-border p-8 max-w-sm w-full text-center space-y-4">
        <img src="/brand/Symbole-Rose.svg" alt="" className="h-10 mx-auto opacity-60" />
        <h1 className="font-display text-2xl italic text-mf-rose">Confirmation livraison</h1>
        <p className="font-body text-sm text-mf-muted">
          Commande : <span className="font-medium text-mf-marron-glace">{orderId?.slice(0, 8)}…</span>
        </p>
        <p className="font-body text-xs text-mf-muted">Page en cours de construction.</p>
      </div>
    </div>
  );
}
