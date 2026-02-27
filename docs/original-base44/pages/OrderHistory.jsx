import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, Calendar, User, Package, Eye, Download, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: []
  });

  const { data: orderItems } = useQuery({
    queryKey: ['orderItems'],
    queryFn: () => base44.entities.OrderItem.list(),
    initialData: []
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => base44.entities.MenuItem.list(),
    initialData: []
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Recherche par nom, numéro ou stand
      const matchesSearch = !searchTerm || 
        order.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.stand.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtre par statut
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      // Filtre par date
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_date);
        const today = new Date();
        const diffTime = today - orderDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (dateFilter === 'today') matchesDate = diffDays < 1;
        else if (dateFilter === 'week') matchesDate = diffDays < 7;
        else if (dateFilter === 'month') matchesDate = diffDays < 30;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const getOrderItems = (orderId) => {
    return orderItems.filter(item => item.order_id === orderId);
  };

  const statusLabels = {
    pending: 'En attente',
    paid: 'Payé',
    preparing: 'En préparation',
    delivered: 'Livré'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    paid: 'bg-green-100 text-green-800',
    preparing: 'bg-blue-100 text-blue-800',
    delivered: 'bg-purple-100 text-purple-800'
  };

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-6 h-6 lg:w-8 lg:h-8" />
            Historique des commandes
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">
            Consultation et recherche de toutes les commandes
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <Card>
            <CardContent className="p-3 lg:p-4 text-center">
              <Package className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 text-gray-600" />
              <div className="text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs lg:text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl font-bold text-green-900">{stats.paid}</div>
              <div className="text-xs lg:text-sm text-green-700">Payées</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl font-bold text-blue-900">{stats.preparing}</div>
              <div className="text-xs lg:text-sm text-blue-700">Préparation</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl font-bold text-purple-900">{stats.delivered}</div>
              <div className="text-xs lg:text-sm text-purple-700">Livrées</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 col-span-2 lg:col-span-1">
            <CardContent className="p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl font-bold text-amber-900">{stats.totalRevenue.toFixed(2)}€</div>
              <div className="text-xs lg:text-sm text-amber-700">Revenu total</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="grid md:grid-cols-3 gap-3 lg:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, numéro, stand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="preparing">En préparation</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des commandes */}
        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Chargement...
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Aucune commande trouvée
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map(order => {
              const items = getOrderItems(order.id);
              const isExpanded = expandedOrder === order.id;

              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className="bg-indigo-600 text-white">
                            {order.order_number}
                          </Badge>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {format(new Date(order.created_date), "d MMM yyyy HH:mm", { locale: fr })}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span 
                              className="font-semibold hover:text-blue-600 cursor-pointer transition-colors"
                              onClick={() => navigate(createPageUrl('CustomerProfile') + `?email=${encodeURIComponent(order.email)}`)}
                            >
                              {order.first_name} {order.last_name}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            Stand {order.stand}
                          </div>
                          <div className="text-gray-600">
                            {order.phone}
                          </div>
                          <div className="font-bold text-green-700">
                            {order.total_amount.toFixed(2)}€
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(createPageUrl('CustomerProfile') + `?email=${encodeURIComponent(order.email)}`)}
                        >
                          <UserCircle className="w-4 h-4 mr-2" />
                          Profil
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {isExpanded ? 'Masquer' : 'Détails'}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && items.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700">Détails de la commande</h4>
                        {items.map(item => (
                          <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium text-sm">
                                {format(new Date(item.day_date), "EEEE d MMMM", { locale: fr })}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-700">
                                  {item.day_total.toFixed(2)}€
                                </span>
                                {item.delivered && (
                                  <Badge className="bg-green-600 text-white text-xs">Livré</Badge>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 text-xs text-gray-600">
                              {item.entree_name && <div>• Entrée: {item.entree_name}</div>}
                              {item.plat_name && <div>• Plat: {item.plat_name}</div>}
                              {item.dessert_name && <div>• Dessert: {item.dessert_name}</div>}
                              {item.boisson_name && <div>• Boisson: {item.boisson_name}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}