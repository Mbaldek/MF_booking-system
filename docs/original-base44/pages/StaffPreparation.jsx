import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Search, CheckCircle, Clock, Package } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

export default function StaffPreparationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');

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

  const updateOrderItemMutation = useMutation({
    mutationFn: ({ id, delivered }) => base44.entities.OrderItem.update(id, { delivered }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
    }
  });

  const eventDays = activeEvent ? eachDayOfInterval({
    start: new Date(activeEvent.start_date),
    end: new Date(activeEvent.end_date)
  }).map(d => format(d, 'yyyy-MM-dd')) : [];

  // Grouper par jour au lieu de par commande
  const getDayItems = () => {
    const dayGroups = {};
    
    orderItems.forEach(item => {
      const order = orders.find(o => o.id === item.order_id);
      if (!order) return;
      
      const key = `${item.day_date}_${order.id}`;
      if (!dayGroups[key]) {
        dayGroups[key] = {
          day_date: item.day_date,
          order,
          items: []
        };
      }
      dayGroups[key].items.push(item);
    });
    
    return Object.values(dayGroups);
  };

  const allDayItems = getDayItems();

  const filteredDayItems = allDayItems.filter(dayItem => {
    const matchesSearch = 
      dayItem.order.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dayItem.order.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dayItem.order.stand.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedDate === 'all') return matchesSearch;
    return matchesSearch && dayItem.day_date === selectedDate;
  });

  const handleToggleDelivered = (dayItems) => {
    const allDelivered = dayItems.every(item => item.delivered);
    dayItems.forEach(item => {
      updateOrderItemMutation.mutate({ id: item.id, delivered: !allDelivered });
    });
  };

  const stats = {
    pending: allDayItems.filter(d => d.items.some(i => !i.delivered)).length,
    delivered: allDayItems.filter(d => d.items.every(i => i.delivered)).length
  };

  if (!activeEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Aucun événement actif.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 lg:w-8 lg:h-8" />
            Préparation des commandes
          </h1>
          <p className="text-sm lg:text-base text-gray-600">Événement : {activeEvent.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-3 lg:p-4 text-center">
              <Clock className="w-5 h-5 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 text-amber-600" />
              <div className="text-xl lg:text-2xl font-bold text-amber-900">{stats.pending}</div>
              <div className="text-xs lg:text-sm text-amber-700">Jours à préparer</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 lg:p-4 text-center">
              <CheckCircle className="w-5 h-5 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 text-green-600" />
              <div className="text-xl lg:text-2xl font-bold text-green-900">{stats.delivered}</div>
              <div className="text-xs lg:text-sm text-green-700">Jours prêts</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou stand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-full lg:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les jours</SelectItem>
                  {eventDays.map(day => (
                    <SelectItem key={day} value={day}>
                      {format(new Date(day), "EEEE d MMMM", { locale: fr })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Day Items List */}
        <div className="space-y-3 lg:space-y-4">
          {filteredDayItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Aucune commande trouvée
              </CardContent>
            </Card>
          ) : (
            filteredDayItems.map(dayItem => {
              const allDelivered = dayItem.items.every(item => item.delivered);
              const order = dayItem.order;

              return (
                <Card key={`${order.id}_${dayItem.day_date}`} className={`border-2 ${allDelivered ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 lg:gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className="bg-purple-600 text-white">
                            {format(new Date(dayItem.day_date), "EEEE d MMM", { locale: fr })}
                          </Badge>
                          <Badge className="bg-blue-600 text-white">Stand {order.stand}</Badge>
                          <span className="font-semibold text-sm lg:text-base">
                            {order.first_name} {order.last_name}
                          </span>
                        </div>
                        <div className="text-xs lg:text-sm text-gray-600">
                          <div>N° {order.order_number}</div>
                          <div>{order.phone}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allDelivered ? (
                          <>
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Prêt
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleDelivered(dayItem.items)}
                              className="text-xs lg:text-sm"
                            >
                              Annuler
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleToggleDelivered(dayItem.items)}
                            className="bg-green-600 hover:bg-green-700 text-xs lg:text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marquer prêt
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs lg:text-sm">
                        {dayItem.items.map(item => (
                          <React.Fragment key={item.id}>
                            {item.entree_name && (
                              <div>
                                <span className="text-gray-500">Entrée:</span> {item.entree_name}
                              </div>
                            )}
                            {item.plat_name && (
                              <div>
                                <span className="text-gray-500">Plat:</span> {item.plat_name}
                              </div>
                            )}
                            {item.dessert_name && (
                              <div>
                                <span className="text-gray-500">Dessert:</span> {item.dessert_name}
                              </div>
                            )}
                            {item.boisson_name && (
                              <div>
                                <span className="text-gray-500">Boisson:</span> {item.boisson_name}
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
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