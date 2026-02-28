import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  UtensilsCrossed,
  ShoppingBag,
  MapPin,
  BarChart3,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useOrders } from '@/hooks/useOrders';

const modules = [
  {
    title: 'Événements',
    description: 'Créer et gérer vos événements, salons et foires',
    to: '/admin/events',
    icon: Calendar,
    bg: 'bg-[#8B3A43]/10',
    iconColor: 'text-[#8B3A43]',
  },
  {
    title: 'Menus',
    description: 'Composer les menus et gérer les plats disponibles',
    to: '/admin/menu',
    icon: UtensilsCrossed,
    bg: 'bg-[#968A42]/15',
    iconColor: 'text-[#968A42]',
  },
  {
    title: 'Commandes',
    description: 'Suivre et gérer toutes les commandes clients',
    to: '/admin/orders',
    icon: ShoppingBag,
    bg: 'bg-[#BF646D]/15',
    iconColor: 'text-[#BF646D]',
  },
  {
    title: 'Suivi livraisons',
    description: 'Gérer la préparation et la livraison des repas',
    to: '/admin/delivery',
    icon: MapPin,
    bg: 'bg-[#E5B7B3]/40',
    iconColor: 'text-[#8B3A43]',
  },
  {
    title: 'Statistiques',
    description: 'Analyser les ventes, revenus et tendances',
    to: '/admin/stats',
    icon: BarChart3,
    bg: 'bg-[#8B3A43]/10',
    iconColor: 'text-[#8B3A43]',
  },
  {
    title: 'Accès & droits',
    description: 'Gérer les utilisateurs, rôles et permissions',
    to: '/admin/users',
    icon: Users,
    bg: 'bg-[#392D31]/10',
    iconColor: 'text-[#392D31]',
  },
];

export default function AdminDashboard() {
  const { data: events = [], isLoading: eventsLoading } = useEvents();

  const activeEvents = useMemo(
    () => events.filter((e) => e.is_active),
    [events]
  );

  const activeEventId = activeEvents.length > 0 ? activeEvents[0].id : null;

  const { data: orders = [], isLoading: ordersLoading } = useOrders(activeEventId);

  const isLoading = eventsLoading || ordersLoading;

  const stats = useMemo(() => {
    const activeCount = activeEvents.length;
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return { activeCount, totalOrders, totalRevenue };
  }, [activeEvents, orders]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F0E6] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#8B3A43] mx-auto" />
          <p className="text-sm text-[#9A8A7C]">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0E6]">
      {/* Header */}
      <div className="bg-[#FDFAF7] border-b border-[#E5D9D0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8B3A43] rounded-2xl flex items-center justify-center">
                <span className="text-[#F0F0E6] font-bold text-sm">MF</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#392D31]">Tableau de bord</h1>
                <p className="text-sm text-[#9A8A7C]">Maison Félicien — Administration</p>
              </div>
            </div>
            <Link
              to="/"
              className="text-sm text-[#9A8A7C] hover:text-[#392D31] transition-colors"
            >
              Retour au site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Active events */}
          <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-[#9A8A7C] uppercase tracking-wider">Événements actifs</p>
                <p className="text-3xl font-bold text-[#392D31] mt-1">{stats.activeCount}</p>
              </div>
              <div className="w-12 h-12 bg-[#E5B7B3]/30 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#8B3A43]" />
              </div>
            </div>
          </div>

          {/* Total orders */}
          <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-[#9A8A7C] uppercase tracking-wider">Commandes totales</p>
                <p className="text-3xl font-bold text-[#392D31] mt-1">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-[#8B3A43]/10 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[#BF646D]" />
              </div>
            </div>
          </div>

          {/* Total revenue */}
          <div className="bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-[#9A8A7C] uppercase tracking-wider">Revenu total</p>
                <p className="text-3xl font-bold text-[#392D31] mt-1" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                  {stats.totalRevenue.toFixed(2).replace('.', ',')} €
                </p>
              </div>
              <div className="w-12 h-12 bg-[#968A42]/15 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#968A42]" />
              </div>
            </div>
          </div>
        </div>

        {/* Module cards */}
        <div>
          <h2 className="text-[11px] font-medium text-[#BF646D] uppercase tracking-[0.18em] mb-4">Modules</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.to}
                  to={mod.to}
                  className="group bg-[#FDFAF7] rounded-2xl border border-[#E5D9D0] p-5 sm:p-6 hover:border-[#8B3A43] transition-colors duration-200"
                >
                  <div
                    className={`w-12 h-12 ${mod.bg} rounded-2xl flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-6 h-6 ${mod.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-[#392D31] group-hover:text-[#8B3A43] transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-[#9A8A7C] mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
