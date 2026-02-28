import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, ShoppingBag, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { supabase } from '@/api/supabase';

const PAYMENT_LABELS = {
  pending: 'En attente',
  paid: 'Payé',
  refunded: 'Remboursé',
  cancelled: 'Annulé',
};
const PAYMENT_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderHistory() {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*, event:events(id, name, start_date, end_date)')
        .eq('customer_email', email.trim().toLowerCase())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0E6] px-3 py-4 sm:px-4 sm:py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl text-[#8B3A43]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>Mes commandes</h1>
          <p className="text-sm text-[#9A8A7C]">Retrouvez vos commandes en saisissant votre email</p>
        </div>

        <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="flex-1 px-4 py-2.5 border border-[#E5D9D0] rounded-full text-sm text-[#392D31] placeholder-[#C4B5A8] focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B3A43] text-[#F0F0E6] text-[13px] font-medium rounded-full hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-wider"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Rechercher
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">{error}</div>
        )}

        {orders !== null && orders.length === 0 && (
          <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-[#E5D9D0] mx-auto mb-4" />
            <p className="text-[#392D31] font-medium">Aucune commande trouvée</p>
            <p className="text-sm text-[#C4B5A8] mt-1">Vérifiez l'adresse email saisie.</p>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/order/success/${order.id}`}
                className="block bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-5 hover:border-[#8B3A43] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-[#392D31]">{order.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                        {PAYMENT_LABELS[order.payment_status] || order.payment_status}
                      </span>
                    </div>
                    {order.event && (
                      <div className="flex items-center gap-2 text-sm text-[#9A8A7C]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{order.event.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[#C4B5A8]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Stand {order.stand}
                      </span>
                      <span>{format(new Date(order.created_at), 'd MMM yyyy à HH:mm', { locale: fr })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-lg font-semibold text-[#392D31]">{Number(order.total_amount).toFixed(2)}€</span>
                    <ArrowRight className="w-4 h-4 text-[#E5D9D0] group-hover:text-[#8B3A43] transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link to="/order" className="text-sm text-[#8B3A43] hover:underline">Passer une nouvelle commande</Link>
        </div>
      </div>
    </div>
  );
}
