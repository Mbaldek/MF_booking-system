import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShoppingBag, ArrowLeft, FileText } from 'lucide-react';
import { useMyOrders } from '@/hooks/useOrders';
import { useAuth } from '@/lib/AuthContext';

const statusLabels = {
  pending: 'En attente',
  paid: 'Payée',
  refunded: 'Remboursée',
  cancelled: 'Annulée',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
};

export default function CustomerOrders() {
  const { profile } = useAuth();
  const { data: orders = [], isLoading } = useMyOrders();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf6f5] to-[#f0e6e4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B3A43]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6f5] to-[#f0e6e4]">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/monogram.svg" alt="MF" className="w-8 h-8" />
            <h1 className="text-lg font-bold text-gray-900 font-brand">Mes commandes</h1>
          </div>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Aucune commande trouvée</p>
            <Link
              to="/order"
              className="inline-flex items-center px-4 py-2 bg-[#8B3A43] text-white text-sm font-medium rounded-lg hover:bg-[#7a3039] transition-colors"
            >
              Commander maintenant
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/order/success/${order.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-[#8B3A43]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {order.order_number}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.payment_status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {statusLabels[order.payment_status] || order.payment_status}
                      </span>
                    </div>
                    {order.event?.name && (
                      <p className="text-sm text-gray-500 mt-1">{order.event.name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(order.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-lg font-semibold text-gray-900">
                      {Number(order.total_amount).toFixed(2)}€
                    </span>
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
