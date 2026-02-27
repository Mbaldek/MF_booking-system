import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Package, Users, CheckCircle } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminAnalyticsDashboard() {
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: []
  });

  const { data: orderItems } = useQuery({
    queryKey: ['orderItems'],
    queryFn: () => base44.entities.OrderItem.list(),
    initialData: []
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.CustomerProfile.list(),
    initialData: []
  });

  // Calcul des métriques principales
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const activeCustomers = new Set(orders.map(o => o.email)).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      activeCustomers,
      averageOrderValue
    };
  }, [orders]);

  // Données pour le graphique de volume de commandes dans le temps (7 derniers jours)
  const orderVolumeData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayOrders = orders.filter(order => {
        const orderDate = format(parseISO(order.created_date), 'yyyy-MM-dd');
        return orderDate === dayStr;
      });

      return {
        date: format(day, 'EEE dd', { locale: fr }),
        commandes: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0)
      };
    });
  }, [orders]);

  // Données pour le graphique de répartition des revenus par statut
  const revenueByStatus = useMemo(() => {
    const statuses = {
      pending: { label: 'En attente', value: 0, color: '#f59e0b' },
      paid: { label: 'Payé', value: 0, color: '#3b82f6' },
      preparing: { label: 'En préparation', value: 0, color: '#8b5cf6' },
      delivered: { label: 'Livré', value: 0, color: '#10b981' }
    };

    orders.forEach(order => {
      if (statuses[order.status]) {
        statuses[order.status].value += order.total_amount;
      }
    });

    return Object.values(statuses).filter(s => s.value > 0);
  }, [orders]);

  // Données pour les produits les plus populaires
  const popularItems = useMemo(() => {
    const itemCounts = {};

    orderItems.forEach(item => {
      ['entree_name', 'plat_name', 'dessert_name', 'boisson_name'].forEach(key => {
        if (item[key]) {
          itemCounts[item[key]] = (itemCounts[item[key]] || 0) + 1;
        }
      });
    });

    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [orderItems]);

  // Statut des commandes (graphique en camembert)
  const ordersByStatus = useMemo(() => {
    const statuses = [
      { name: 'En attente', value: 0, color: '#f59e0b' },
      { name: 'Payé', value: 0, color: '#3b82f6' },
      { name: 'En préparation', value: 0, color: '#8b5cf6' },
      { name: 'Livré', value: 0, color: '#10b981' }
    ];

    const statusMap = { pending: 0, paid: 1, preparing: 2, delivered: 3 };
    orders.forEach(order => {
      const idx = statusMap[order.status];
      if (idx !== undefined) statuses[idx].value++;
    });

    return statuses.filter(s => s.value > 0);
  }, [orders]);

  const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Tableau de Bord Analytique
          </h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble des performances et métriques clés
          </p>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Commandes totales</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {metrics.totalOrders}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {metrics.pendingOrders} en attente
                  </p>
                </div>
                <ShoppingCart className="w-12 h-12 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Chiffre d'affaires</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {metrics.totalRevenue.toFixed(0)}€
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Moy: {metrics.averageOrderValue.toFixed(2)}€
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Clients actifs</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">
                    {metrics.activeCustomers}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Clients uniques
                  </p>
                </div>
                <Users className="w-12 h-12 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">En attente</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">
                    {metrics.pendingOrders}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    À traiter
                  </p>
                </div>
                <Package className="w-12 h-12 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Livrées</p>
                  <p className="text-3xl font-bold text-emerald-900 mt-1">
                    {metrics.deliveredOrders}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Terminées
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-emerald-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Livraisons totales</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-1">
                    {orderItems.length}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {orderItems.filter(i => i.delivered).length} complétées
                  </p>
                </div>
                <Package className="w-12 h-12 text-indigo-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Volume de commandes */}
          <Card>
            <CardHeader>
              <CardTitle>Volume de commandes (7 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={orderVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="commandes" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Commandes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenus sur 7 jours */}
          <Card>
            <CardHeader>
              <CardTitle>Revenus (7 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="#10b981" 
                    name="Revenus (€)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition par statut */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des commandes par statut</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenus par statut */}
          <Card>
            <CardHeader>
              <CardTitle>Revenus par statut de commande</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="label" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="Revenus (€)">
                    {revenueByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Produits populaires */}
        {popularItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 5 des produits les plus commandés</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Nombre de commandes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}