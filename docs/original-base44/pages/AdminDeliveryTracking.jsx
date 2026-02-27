import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Truck, Search, Calendar, User, CheckCircle, Clock, Package, Camera } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminDeliveryTrackingPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [deliveryPerson, setDeliveryPerson] = useState('');

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: []
  });

  const { data: orderItems } = useQuery({
    queryKey: ['orderItems'],
    queryFn: () => base44.entities.OrderItem.list('day_date'),
    initialData: []
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-created_date'),
    initialData: []
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OrderItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orderItems']);
      toast.success('Statut de livraison mis à jour');
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: ({ id, deliveryPerson }) => {
      const user = base44.auth.me();
      return base44.entities.OrderItem.update(id, {
        delivered: true,
        delivered_at: new Date().toISOString(),
        delivered_by: deliveryPerson || user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orderItems']);
      toast.success('Marqué comme livré');
      setSelectedItem(null);
      setDeliveryPerson('');
    }
  });

  // Grouper les items par jour et commande
  const getOrderById = (orderId) => orders.find(o => o.id === orderId);

  const filteredItems = orderItems.filter(item => {
    const order = getOrderById(item.order_id);
    if (!order) return false;

    // Filtre par recherche (nom client, stand, numéro commande)
    const matchesSearch = !searchTerm || 
      order.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.stand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.delivered_by && item.delivered_by.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtre par date
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const itemDate = new Date(item.day_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        matchesDate = itemDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        matchesDate = itemDate.toDateString() === tomorrow.toDateString();
      } else if (dateFilter === 'week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        matchesDate = itemDate >= today && itemDate <= weekFromNow;
      }
    }

    // Filtre par statut de livraison
    const matchesDelivery = deliveryFilter === 'all' || 
      (deliveryFilter === 'delivered' && item.delivered) ||
      (deliveryFilter === 'pending' && !item.delivered);

    return matchesSearch && matchesDate && matchesDelivery;
  });

  // Grouper par jour
  const itemsByDay = filteredItems.reduce((acc, item) => {
    const dayKey = item.day_date;
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(item);
    return acc;
  }, {});

  const stats = {
    total: orderItems.length,
    delivered: orderItems.filter(i => i.delivered).length,
    pending: orderItems.filter(i => !i.delivered).length,
    today: orderItems.filter(i => {
      const itemDate = new Date(i.day_date);
      const today = new Date();
      return itemDate.toDateString() === today.toDateString();
    }).length
  };

  const handleMarkAsDelivered = (item, withDialog = false) => {
    if (withDialog) {
      setSelectedItem(item);
    } else {
      markAsDeliveredMutation.mutate({ id: item.id, deliveryPerson: '' });
    }
  };

  const handleUnmarkDelivered = (item) => {
    updateItemMutation.mutate({
      id: item.id,
      data: {
        delivered: false,
        delivered_at: null,
        delivered_by: null,
        delivery_photo_url: null
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 lg:w-8 lg:h-8" />
            Suivi des Livraisons
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">
            Gestion détaillée des livraisons par commande et par jour
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card>
            <CardContent className="p-3 lg:p-4 text-center">
              <Package className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 text-gray-600" />
              <div className="text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs lg:text-sm text-gray-600">Total livraisons</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-3 lg:p-4 text-center">
              <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 text-green-600" />
              <div className="text-xl lg:text-2xl font-bold text-green-900">{stats.delivered}</div>
              <div className="text-xs lg:text-sm text-green-700">Livrées</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50">
            <CardContent className="p-3 lg:p-4 text-center">
              <Clock className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 text-orange-600" />
              <div className="text-xl lg:text-2xl font-bold text-orange-900">{stats.pending}</div>
              <div className="text-xs lg:text-sm text-orange-700">En attente</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="p-3 lg:p-4 text-center">
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 text-blue-600" />
              <div className="text-xl lg:text-2xl font-bold text-blue-900">{stats.today}</div>
              <div className="text-xs lg:text-sm text-blue-700">Aujourd'hui</div>
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
                  placeholder="Rechercher par client, livreur, stand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="tomorrow">Demain</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                </SelectContent>
              </Select>
              <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="delivered">Livrées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des livraisons par jour */}
        <div className="space-y-4">
          {Object.keys(itemsByDay).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Aucune livraison trouvée
              </CardContent>
            </Card>
          ) : (
            Object.keys(itemsByDay).sort().map(dayKey => {
              const items = itemsByDay[dayKey];
              const dayDate = new Date(dayKey);
              const deliveredCount = items.filter(i => i.delivered).length;

              return (
                <Card key={dayKey}>
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span>{format(dayDate, "EEEE d MMMM yyyy", { locale: fr })}</span>
                      </div>
                      <Badge className={deliveredCount === items.length ? "bg-green-600" : "bg-orange-600"}>
                        {deliveredCount} / {items.length} livrées
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {items.map(item => {
                      const order = getOrderById(item.order_id);
                      if (!order) return null;

                      return (
                        <div 
                          key={item.id}
                          className={`border rounded-lg p-4 ${item.delivered ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge className="bg-indigo-600 text-white">
                                  {order.order_number}
                                </Badge>
                                {item.delivered ? (
                                  <Badge className="bg-green-600 text-white">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Livré
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-500 text-white">
                                    <Clock className="w-3 h-3 mr-1" />
                                    En attente
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold">{order.first_name} {order.last_name}</span>
                                  <span className="text-gray-500">- Stand {order.stand}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mt-2">
                                  {item.entree_name && <div>• {item.entree_name}</div>}
                                  {item.plat_name && <div>• {item.plat_name}</div>}
                                  {item.dessert_name && <div>• {item.dessert_name}</div>}
                                  {item.boisson_name && <div>• {item.boisson_name}</div>}
                                </div>

                                {item.delivered && item.delivered_by && (
                                  <div className="flex items-center gap-2 mt-2 text-xs text-green-700">
                                    <Truck className="w-3 h-3" />
                                    <span>Livré par {item.delivered_by}</span>
                                    {item.delivered_at && (
                                      <span>le {format(new Date(item.delivered_at), "d/MM/yyyy à HH:mm", { locale: fr })}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {!item.delivered ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsDelivered(item, false)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Livré
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" onClick={() => setSelectedItem(item)}>
                                        <User className="w-4 h-4 mr-2" />
                                        Assigner
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Assigner un livreur</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div>
                                          <label className="text-sm font-medium mb-2 block">
                                            Nom du livreur (optionnel)
                                          </label>
                                          <Input
                                            placeholder="Ex: Jean Dupont ou email"
                                            value={deliveryPerson}
                                            onChange={(e) => setDeliveryPerson(e.target.value)}
                                          />
                                          <p className="text-xs text-gray-500 mt-1">
                                            Laissez vide pour utiliser votre email
                                          </p>
                                        </div>
                                        <Button
                                          onClick={() => markAsDeliveredMutation.mutate({ 
                                            id: selectedItem.id, 
                                            deliveryPerson 
                                          })}
                                          className="w-full"
                                          disabled={markAsDeliveredMutation.isPending}
                                        >
                                          Confirmer la livraison
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnmarkDelivered(item)}
                                >
                                  Annuler
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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