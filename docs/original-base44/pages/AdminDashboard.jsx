import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, UtensilsCrossed, ShoppingBag, ArrowRight, BarChart3, Mail, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminDashboard() {
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list(),
    initialData: []
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
    initialData: []
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
    initialData: []
  });

  const activeEvents = events.filter(e => e.is_active);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const todayRevenue = orders
    .filter(o => o.status !== 'pending')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const modules = [
    {
      title: 'Événements',
      description: 'Créer et gérer les événements',
      icon: Calendar,
      link: 'AdminEvent',
      color: 'from-blue-500 to-blue-600',
      stats: `${activeEvents.length} actif${activeEvents.length > 1 ? 's' : ''}`
    },
    {
      title: 'Menus',
      description: 'Gérer les produits et prix',
      icon: UtensilsCrossed,
      link: 'AdminMenu',
      color: 'from-orange-500 to-orange-600',
      stats: `${menuItems.length} produits`
    },
    {
      title: 'Commandes',
      description: 'Consulter et valider les commandes',
      icon: ShoppingBag,
      link: 'AdminOrders',
      color: 'from-green-500 to-green-600',
      stats: `${pendingOrders.length} en attente`
    },
    {
      title: 'Statistiques',
      description: 'Analyses et graphiques détaillés',
      icon: BarChart3,
      link: 'AdminStats',
      color: 'from-purple-500 to-purple-600',
      stats: 'Revenus & produits'
    },
    {
      title: 'Rappels email',
      description: 'Envoyer des rappels de livraison',
      icon: Mail,
      link: 'AdminEmailReminders',
      color: 'from-pink-500 to-pink-600',
      stats: 'Notifications'
    },
    {
      title: 'Accès & droits',
      description: 'Gérer les utilisateurs et permissions',
      icon: Users,
      link: 'AdminUsers',
      color: 'from-indigo-500 to-indigo-600',
      stats: 'Admin & Staff'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <span className="text-white text-2xl lg:text-3xl font-bold">MF</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Panneau d'administration
          </h1>
          <p className="text-gray-600 text-sm lg:text-base max-w-2xl mx-auto">
            Gérez vos événements, menus et commandes depuis ce tableau de bord central
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">Événements actifs</p>
                  <p className="text-3xl lg:text-4xl font-bold text-blue-900 mt-1">{activeEvents.length}</p>
                </div>
                <Calendar className="w-10 h-10 lg:w-12 lg:h-12 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-semibold uppercase tracking-wide">Commandes totales</p>
                  <p className="text-3xl lg:text-4xl font-bold text-orange-900 mt-1">{orders.length}</p>
                </div>
                <ShoppingBag className="w-10 h-10 lg:w-12 lg:h-12 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">Chiffre d'affaires</p>
                  <p className="text-3xl lg:text-4xl font-bold text-green-900 mt-1">{todayRevenue.toFixed(0)}€</p>
                </div>
                <BarChart3 className="w-10 h-10 lg:w-12 lg:h-12 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.link} to={createPageUrl(module.link)}>
                <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 hover:border-blue-400 cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl lg:text-2xl flex items-center justify-between">
                      {module.title}
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
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
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm lg:text-base"
          >
            ← Retour à la page de commande
          </Link>
        </div>
      </div>
    </div>
  );
}