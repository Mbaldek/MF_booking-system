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
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-200',
  },
  {
    title: 'Menus',
    description: 'Composer les menus et gérer les plats disponibles',
    to: '/admin/menu',
    icon: UtensilsCrossed,
    gradient: 'from-green-500 to-green-600',
    shadow: 'shadow-green-200',
  },
  {
    title: 'Commandes',
    description: 'Suivre et gérer toutes les commandes clients',
    to: '/admin/orders',
    icon: ShoppingBag,
    gradient: 'from-purple-500 to-purple-600',
    shadow: 'shadow-purple-200',
  },
  {
    title: 'Suivi livraisons',
    description: 'Gérer la préparation et la livraison des repas',
    to: '/admin/delivery',
    icon: MapPin,
    gradient: 'from-orange-500 to-orange-600',
    shadow: 'shadow-orange-200',
  },
  {
    title: 'Statistiques',
    description: 'Analyser les ventes, revenus et tendances',
    to: '/admin/stats',
    icon: BarChart3,
    gradient: 'from-pink-500 to-pink-600',
    shadow: 'shadow-pink-200',
  },
  {
    title: 'Accès & droits',
    description: 'Gérer les utilisateurs, rôles et permissions',
    to: '/admin/users',
    icon: Users,
    gradient: 'from-indigo-500 to-indigo-600',
    shadow: 'shadow-indigo-200',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MF</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
                <p className="text-sm text-gray-500">Maison Félicien — Administration</p>
              </div>
            </div>
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Événements actifs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Commandes totales</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Revenu total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalRevenue.toFixed(2).replace('.', ',')} €
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Module cards */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Modules</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.to}
                  to={mod.to}
                  className={`group bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${mod.shadow}`}
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${mod.gradient} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
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
