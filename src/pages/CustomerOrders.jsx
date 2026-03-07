import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShoppingBag, FileText, Search } from 'lucide-react';
import { useMyOrders, useLookupOrders } from '@/hooks/useOrders';
import { useAuth } from '@/lib/AuthContext';
import ClientHeader from '@/components/layout/ClientHeader';

const statusLabels = {
  pending: 'En attente',
  paid: 'Payée',
  refunded: 'Remboursée',
  cancelled: 'Annulée',
};

const statusColors = {
  pending: 'bg-mf-poudre/30 text-status-orange',
  paid: 'bg-mf-vert-olive/15 text-status-green',
  refunded: 'bg-mf-blanc-casse text-mf-muted',
  cancelled: 'bg-mf-poudre/20 text-status-red',
};

function OrderList({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="bg-mf-white rounded-card border border-mf-border p-8 text-center">
        <ShoppingBag className="w-12 h-12 text-mf-border mx-auto mb-3" />
        <p className="font-body text-[13px] text-mf-muted mb-4">Aucune commande trouvée</p>
        <Link
          to="/order"
          className="inline-flex items-center px-5 py-2.5 bg-mf-rose text-mf-blanc-casse font-body text-[12px] uppercase tracking-widest rounded-pill hover:opacity-90 transition-opacity"
        >
          Commander maintenant
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/order/success/${order.id}`}
          className="block bg-mf-white rounded-card border border-mf-border p-4 hover:border-mf-rose/30 transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-body text-[13px] font-medium text-mf-rose">
                  {order.order_number}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-pill font-body text-[10px] font-medium ${
                    statusColors[order.payment_status] || 'bg-mf-blanc-casse text-mf-muted'
                  }`}
                >
                  {statusLabels[order.payment_status] || order.payment_status}
                </span>
              </div>
              {order.event?.name && (
                <p className="font-body text-[12px] text-mf-muted mt-1">{order.event.name}</p>
              )}
              <p className="font-body text-[11px] text-mf-muted-light mt-1">
                {format(new Date(order.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="font-serif text-[18px] italic text-mf-marron-glace">
                {Number(order.total_amount).toFixed(2)}€
              </span>
              <FileText className="w-4 h-4 text-mf-muted-light" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function GuestLookup() {
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const lookup = useLookupOrders();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!email && !orderNumber) return;
    lookup.mutate({
      email: email.trim() || undefined,
      orderNumber: orderNumber.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-mf-white rounded-card border border-mf-border p-6">
        <h2 className="font-serif text-[20px] italic text-mf-rose mb-1">Retrouver mes commandes</h2>
        <p className="font-body text-[13px] text-mf-muted mb-5">
          Entrez votre email ou numéro de commande pour consulter vos commandes.
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="font-body text-[11px] uppercase tracking-widest text-mf-rose mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean@entreprise.com"
              className="w-full px-4 py-3 border border-mf-border rounded-pill font-body text-[14px] text-mf-marron-glace bg-white outline-none focus:border-mf-rose transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-mf-border" />
            <span className="font-body text-[11px] text-mf-muted uppercase">ou</span>
            <div className="flex-1 h-px bg-mf-border" />
          </div>

          <div>
            <label className="font-body text-[11px] uppercase tracking-widest text-mf-rose mb-1.5 block">
              Numéro de commande
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="CMD-001"
              className="w-full px-4 py-3 border border-mf-border rounded-pill font-body text-[14px] text-mf-marron-glace bg-white outline-none focus:border-mf-rose transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={(!email && !orderNumber) || lookup.isPending}
            className="w-full py-3 rounded-pill bg-mf-rose text-mf-blanc-casse font-body text-[12px] uppercase tracking-widest font-medium border-none cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {lookup.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mf-blanc-casse" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Rechercher
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="font-body text-[11px] text-mf-vieux-rose hover:text-mf-rose transition-colors">
            Vous avez un compte ? Se connecter →
          </Link>
        </div>
      </div>

      {lookup.isError && (
        <div className="bg-mf-poudre/20 border border-status-red/20 rounded-card p-4 text-center">
          <p className="font-body text-[13px] text-status-red">Erreur lors de la recherche. Veuillez réessayer.</p>
        </div>
      )}

      {lookup.data && <OrderList orders={lookup.data} />}
    </div>
  );
}

export default function CustomerOrders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: orders = [], isLoading: ordersLoading } = useMyOrders();

  const isLoading = authLoading || (isAuthenticated && ordersLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mf-rose" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mf-blanc-casse">
      <ClientHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {isAuthenticated ? (
          <OrderList orders={orders} />
        ) : (
          <GuestLookup />
        )}
      </main>
    </div>
  );
}
