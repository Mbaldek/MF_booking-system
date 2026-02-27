import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Truck, ArrowRight, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function StaffDashboard() {
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
    initialData: []
  });

  const { data: orderItems } = useQuery({
    queryKey: ['orderItems'],
    queryFn: () => base44.entities.OrderItem.list(),
    initialData: []
  });

  const preparingOrders = orders.filter(o => o.status === 'paid' || o.status === 'preparing');
  const todayDeliveries = orderItems.filter(item => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return item.day_date === today && !item.delivered;
  });

  const modules = [
    {
      title: 'Préparation',
      description: 'Gérer la préparation des commandes',
      icon: ChefHat,
      link: 'StaffPreparation',
      color: 'from-purple-500 to-purple-600',
      stats: `${preparingOrders.length} commande${preparingOrders.length > 1 ? 's' : ''}`,
      badge: preparingOrders.length > 0 ? 'Actif' : null
    },
    {
      title: 'Livraison',
      description: 'Confirmer les livraisons du jour',
      icon: Truck,
      link: 'Delivery',
      color: 'from-green-500 to-green-600',
      stats: `${todayDeliveries.length} à livrer aujourd'hui`,
      badge: todayDeliveries.length > 0 ? `${todayDeliveries.length}` : null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Package className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Espace Staff
          </h1>
          <p className="text-gray-600 text-sm lg:text-base max-w-2xl mx-auto">
            Gérez la préparation et la livraison des commandes
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md text-sm font-medium text-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4 lg:p-6">
              <div className="text-center">
                <ChefHat className="w-8 h-8 lg:w-10 lg:h-10 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-purple-700 font-semibold uppercase tracking-wide">En préparation</p>
                <p className="text-3xl lg:text-4xl font-bold text-purple-900 mt-1">{preparingOrders.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4 lg:p-6">
              <div className="text-center">
                <Truck className="w-8 h-8 lg:w-10 lg:h-10 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">À livrer</p>
                <p className="text-3xl lg:text-4xl font-bold text-green-900 mt-1">{todayDeliveries.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.link} to={createPageUrl(module.link)}>
                <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 hover:border-purple-400 cursor-pointer h-full relative overflow-hidden">
                  {module.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg animate-pulse">
                        {module.badge}
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl lg:text-2xl flex items-center justify-between">
                      {module.title}
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </CardTitle>
                    <CardDescription className="text-sm lg:text-base">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs lg:text-sm font-medium">
                      {module.stats}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Retour à l'accueil */}
        <div className="text-center pt-6">
          <Link 
            to={createPageUrl('Order')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors text-sm lg:text-base"
          >
            ← Retour à la page de commande
          </Link>
        </div>
      </div>
    </div>
  );
}