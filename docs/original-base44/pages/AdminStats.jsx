import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';
import AdvancedStats from '../components/stats/AdvancedStats';

export default function AdminStatsPage() {
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
    queryKey: ['menuItems', activeEvent?.id],
    queryFn: () => base44.entities.MenuItem.filter({ event_id: activeEvent.id }),
    enabled: !!activeEvent,
    initialData: []
  });

  if (!activeEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Aucun événement actif.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8" />
            Statistiques avancées
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">
            Événement : {activeEvent.name}
          </p>
        </div>

        <AdvancedStats 
          orders={orders} 
          orderItems={orderItems} 
          menuItems={menuItems} 
        />
      </div>
    </div>
  );
}