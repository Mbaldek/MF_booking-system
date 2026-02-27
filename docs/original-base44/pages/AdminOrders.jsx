import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Search, Filter, Receipt, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import InvoiceGenerator from '../components/invoice/InvoiceGenerator';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState('invoices'); // 'invoices' ou 'daily'
  
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ is_active: true }),
    initialData: []
  });

  const activeEvent = events[0];

  const { data: orders } = useQuery({
    queryKey: ['orders', activeEvent?.id],
    queryFn: () => base44.entities.Order.filter({ event_id: activeEvent.id }),
    enabled: !!activeEvent,
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

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    preparing: 'bg-blue-100 text-blue-800',
    delivered: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    pending: 'En attente',
    paid: 'Payé',
    preparing: 'En préparation',
    delivered: 'Livré'
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.stand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getOrderItems = (orderId) => {
    return orderItems.filter(item => item.order_id === orderId);
  };

  // Regrouper les items par jour pour la vue opérationnelle
  const getDailyOrders = () => {
    const dailyMap = {};
    
    orderItems.forEach(item => {
      const order = orders.find(o => o.id === item.order_id);
      if (!order) return;
      
      if (!dailyMap[item.day_date]) {
        dailyMap[item.day_date] = [];
      }
      
      dailyMap[item.day_date].push({
        ...item,
        order: order
      });
    });
    
    return Object.entries(dailyMap).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  };

  const dailyOrders = getDailyOrders();

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }) => base44.entities.Order.update(orderId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Statut mis à jour');
    }
  });

  const handleStatusUpdate = (orderId, currentStatus) => {
    let newStatus;
    if (currentStatus === 'pending') newStatus = 'paid';
    else if (currentStatus === 'paid') newStatus = 'preparing';
    else if (currentStatus === 'preparing') newStatus = 'delivered';
    else return;

    updateOrderStatusMutation.mutate({ orderId, newStatus });
  };

  if (!activeEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 lg:p-8 text-center">
            <p className="text-sm lg:text-base text-gray-600">Aucun événement actif.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 lg:w-8 lg:h-8" />
            Gestion des commandes
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">Événement : {activeEvent.name}</p>
        </div>

        {/* Tabs pour switcher entre les deux vues */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Factures globales
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Commandes quotidiennes
            </TabsTrigger>
          </TabsList>

          {/* Vue Factures globales */}
          <TabsContent value="invoices" className="mt-4">{/* ... existing content ... */}

        <Card className="border-2 border-blue-200">
          <CardHeader className="p-4 lg:p-6 bg-blue-50">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Vue Factures - Gestion financière
            </h3>
            <p className="text-sm text-gray-600 mt-1">Gérez les paiements et les factures globales des exposants</p>
          </CardHeader>
          <CardHeader className="p-4 lg:p-6 border-t">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, stand, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="preparing">En préparation</SelectItem>
                    <SelectItem value="delivered">Livré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 lg:p-6">
            {/* Mobile View */}
            <div className="lg:hidden space-y-2 p-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aucune commande trouvée
                </div>
              ) : (
                filteredOrders.map(order => (
                  <Card 
                    key={order.id} 
                    className="border cursor-pointer hover:border-blue-400"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">{order.order_number}</div>
                          <div className="text-sm">{order.first_name} {order.last_name}</div>
                        </div>
                        <Badge className={statusColors[order.status]} className="text-xs">
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Stand {order.stand}</div>
                        <div>{order.email}</div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-semibold">{order.total_amount.toFixed(2)}€</span>
                          <span>{format(new Date(order.created_date), "d MMM yyyy", { locale: fr })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Exposant</TableHead>
                    <TableHead>Stand</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.first_name} {order.last_name}</TableCell>
                      <TableCell>{order.stand}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{order.email}</div>
                          <div className="text-gray-500">{order.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{order.total_amount.toFixed(2)}€</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(order.created_date), "d MMM yyyy HH:mm", { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucune commande trouvée
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedOrder && (
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50 p-4 lg:p-6">
              <CardTitle className="text-lg lg:text-xl">Détails de la commande {selectedOrder.order_number}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-sm lg:text-base">Informations exposant</h3>
                  <div className="space-y-2 text-xs lg:text-sm">
                    <div><span className="text-gray-500">Nom :</span> {selectedOrder.first_name} {selectedOrder.last_name}</div>
                    <div><span className="text-gray-500">Stand :</span> {selectedOrder.stand}</div>
                    <div><span className="text-gray-500">Email :</span> {selectedOrder.email}</div>
                    <div><span className="text-gray-500">Téléphone :</span> {selectedOrder.phone}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-sm lg:text-base">Détails commande</h3>
                  <div className="space-y-2 text-xs lg:text-sm">
                    <div><span className="text-gray-500">Montant total :</span> <span className="font-semibold">{selectedOrder.total_amount.toFixed(2)}€</span></div>
                    <div>
                      <span className="text-gray-500">Statut :</span> 
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={statusColors[selectedOrder.status]} className="text-xs">
                          {statusLabels[selectedOrder.status]}
                        </Badge>
                        {selectedOrder.status !== 'delivered' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(selectedOrder.id, selectedOrder.status)}
                            disabled={updateOrderStatusMutation.isPending}
                            className="h-7 text-xs"
                          >
                            {selectedOrder.status === 'pending' && 'Marquer Payé'}
                            {selectedOrder.status === 'paid' && 'En préparation'}
                            {selectedOrder.status === 'preparing' && 'Marquer Livré'}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div><span className="text-gray-500">Date :</span> {format(new Date(selectedOrder.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 lg:mt-6">
                <h3 className="font-semibold mb-3 text-sm lg:text-base flex justify-between items-center">
                  <span>Détail des commandes par jour</span>
                  <InvoiceGenerator 
                    order={selectedOrder} 
                    orderItems={getOrderItems(selectedOrder.id)} 
                    menuItems={menuItems}
                    event={activeEvent}
                  />
                </h3>
                <div className="space-y-3">
                  {getOrderItems(selectedOrder.id).map(item => (
                    <div key={item.id} className="p-3 lg:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-bold text-sm lg:text-base text-gray-800">
                          {format(new Date(item.day_date), "EEEE d MMMM yyyy", { locale: fr })}
                        </p>
                        <Badge variant={item.delivered ? "default" : "secondary"} className="text-xs">
                          {item.delivered ? '✓ Livré' : 'Non livré'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                        {item.entree_id && (
                          <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                            <div>
                              <span className="text-xs text-gray-500 uppercase font-semibold">Entrée</span>
                              <p className="text-sm font-medium text-gray-800">{item.entree_name}</p>
                            </div>
                            <span className="text-sm font-bold text-blue-600">
                              {(() => {
                                const menuItem = menuItems.find(mi => mi.id === item.entree_id);
                                return menuItem ? `${menuItem.price.toFixed(2)}€` : '-';
                              })()}
                            </span>
                          </div>
                        )}
                        {item.plat_id && (
                          <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                            <div>
                              <span className="text-xs text-gray-500 uppercase font-semibold">Plat</span>
                              <p className="text-sm font-medium text-gray-800">{item.plat_name}</p>
                            </div>
                            <span className="text-sm font-bold text-orange-600">
                              {(() => {
                                const menuItem = menuItems.find(mi => mi.id === item.plat_id);
                                return menuItem ? `${menuItem.price.toFixed(2)}€` : '-';
                              })()}
                            </span>
                          </div>
                        )}
                        {item.dessert_id && (
                          <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                            <div>
                              <span className="text-xs text-gray-500 uppercase font-semibold">Dessert</span>
                              <p className="text-sm font-medium text-gray-800">{item.dessert_name}</p>
                            </div>
                            <span className="text-sm font-bold text-pink-600">
                              {(() => {
                                const menuItem = menuItems.find(mi => mi.id === item.dessert_id);
                                return menuItem ? `${menuItem.price.toFixed(2)}€` : '-';
                              })()}
                            </span>
                          </div>
                        )}
                        {item.boisson_id && (
                          <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                            <div>
                              <span className="text-xs text-gray-500 uppercase font-semibold">Boisson</span>
                              <p className="text-sm font-medium text-gray-800">{item.boisson_name}</p>
                            </div>
                            <span className="text-sm font-bold text-green-600">
                              {(() => {
                                const menuItem = menuItems.find(mi => mi.id === item.boisson_id);
                                return menuItem ? `${menuItem.price.toFixed(2)}€` : '-';
                              })()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t-2 border-gray-300 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Total du jour :</span>
                        <span className="text-lg font-bold text-gray-900">{item.day_total.toFixed(2)}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </TabsContent>

        {/* Vue Commandes quotidiennes */}
        <TabsContent value="daily" className="mt-4">
          <Card className="border-2 border-green-200">
            <CardHeader className="p-4 lg:p-6 bg-green-50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Vue Opérationnelle - Commandes par jour
              </h3>
              <p className="text-sm text-gray-600 mt-1">Suivez les commandes quotidiennes à préparer et livrer</p>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              {dailyOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucune commande quotidienne
                </div>
              ) : (
                <div className="space-y-6">
                  {dailyOrders.map(([date, items]) => (
                    <Card key={date} className="border-2 border-gray-300">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg lg:text-xl">
                            📅 {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
                          </CardTitle>
                          <Badge className="bg-green-600 text-white text-sm">
                            {items.length} commande{items.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 lg:p-6">
                        <div className="space-y-3">
                          {items.map(item => (
                            <div key={item.id} className="p-3 lg:p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-400 transition-colors">
                              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mb-3">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <Badge className="bg-blue-600 text-white">Stand {item.order.stand}</Badge>
                                    <span className="font-semibold text-sm lg:text-base">
                                      {item.order.first_name} {item.order.last_name}
                                    </span>
                                    <Badge variant={item.delivered ? "default" : "secondary"} className="text-xs">
                                      {item.delivered ? '✓ Livré' : '⏳ À livrer'}
                                    </Badge>
                                  </div>
                                  <div className="text-xs lg:text-sm text-gray-600">
                                    📞 {item.order.phone} • ✉️ {item.order.email}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {item.entree_id && (
                                  <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                                    <div className="text-xs font-bold text-blue-700 uppercase">🥗 Entrée</div>
                                    <div className="text-sm font-medium text-gray-800">{item.entree_name}</div>
                                    <div className="text-xs font-semibold text-blue-600">
                                      {(() => {
                                        const mi = menuItems.find(m => m.id === item.entree_id);
                                        return mi ? `${mi.price.toFixed(2)}€` : '';
                                      })()}
                                    </div>
                                  </div>
                                )}
                                {item.plat_id && (
                                  <div className="bg-orange-50 p-2 rounded border-l-4 border-orange-500">
                                    <div className="text-xs font-bold text-orange-700 uppercase">🍽️ Plat</div>
                                    <div className="text-sm font-medium text-gray-800">{item.plat_name}</div>
                                    <div className="text-xs font-semibold text-orange-600">
                                      {(() => {
                                        const mi = menuItems.find(m => m.id === item.plat_id);
                                        return mi ? `${mi.price.toFixed(2)}€` : '';
                                      })()}
                                    </div>
                                  </div>
                                )}
                                {item.dessert_id && (
                                  <div className="bg-pink-50 p-2 rounded border-l-4 border-pink-500">
                                    <div className="text-xs font-bold text-pink-700 uppercase">🍰 Dessert</div>
                                    <div className="text-sm font-medium text-gray-800">{item.dessert_name}</div>
                                    <div className="text-xs font-semibold text-pink-600">
                                      {(() => {
                                        const mi = menuItems.find(m => m.id === item.dessert_id);
                                        return mi ? `${mi.price.toFixed(2)}€` : '';
                                      })()}
                                    </div>
                                  </div>
                                )}
                                {item.boisson_id && (
                                  <div className="bg-green-50 p-2 rounded border-l-4 border-green-500">
                                    <div className="text-xs font-bold text-green-700 uppercase">🥤 Boisson</div>
                                    <div className="text-sm font-medium text-gray-800">{item.boisson_name}</div>
                                    <div className="text-xs font-semibold text-green-600">
                                      {(() => {
                                        const mi = menuItems.find(m => m.id === item.boisson_id);
                                        return mi ? `${mi.price.toFixed(2)}€` : '';
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                <span className="text-xs lg:text-sm font-semibold text-gray-700">Total commande du jour :</span>
                                <span className="text-base lg:text-lg font-bold text-gray-900">{item.day_total.toFixed(2)}€</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}