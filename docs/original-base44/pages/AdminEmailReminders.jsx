import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, CheckCircle, Loader2, Calendar } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { sendDeliveryReminderEmail } from '../components/email/EmailService';
import { toast } from "sonner";

export default function AdminEmailRemindersPage() {
  const [sending, setSending] = useState(false);
  const [sentEmails, setSentEmails] = useState(new Set());

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

  // Filtrer les items pour aujourd'hui et demain
  const todayItems = orderItems.filter(item => isToday(new Date(item.day_date)) && !item.delivered);
  const tomorrowItems = orderItems.filter(item => isTomorrow(new Date(item.day_date)) && !item.delivered);

  const getOrderInfo = (orderId) => orders.find(o => o.id === orderId);

  const sendReminder = async (orderItem) => {
    const order = getOrderInfo(orderItem.order_id);
    if (!order) return;

    setSending(true);
    try {
      await sendDeliveryReminderEmail(order, orderItem, activeEvent);
      setSentEmails(prev => new Set([...prev, orderItem.id]));
      toast.success(`Email envoyé à ${order.email}`);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const sendBulkReminders = async (items) => {
    setSending(true);
    let successCount = 0;
    
    for (const item of items) {
      const order = getOrderInfo(item.order_id);
      if (!order || sentEmails.has(item.id)) continue;
      
      try {
        await sendDeliveryReminderEmail(order, item, activeEvent);
        setSentEmails(prev => new Set([...prev, item.id]));
        successCount++;
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
    
    setSending(false);
    toast.success(`${successCount} email(s) envoyé(s)`);
  };

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

  const renderItemsList = (items, title, date) => {
    const unsentItems = items.filter(item => !sentEmails.has(item.id));

    return (
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {title}
            </CardTitle>
            {unsentItems.length > 0 && (
              <Button
                onClick={() => sendBulkReminders(items)}
                disabled={sending}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer tout ({unsentItems.length})
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {format(date, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Aucune commande pour cette date
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const order = getOrderInfo(item.order_id);
                if (!order) return null;
                const isSent = sentEmails.has(item.id);

                return (
                  <div key={item.id} className="p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-blue-600 text-white">Stand {order.stand}</Badge>
                          <span className="font-semibold text-sm">
                            {order.first_name} {order.last_name}
                          </span>
                          {isSent && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Envoyé
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{order.email}</div>
                      </div>
                      <Button
                        onClick={() => sendReminder(item)}
                        disabled={sending || isSent}
                        variant={isSent ? "outline" : "default"}
                        size="sm"
                        className={isSent ? "" : "bg-blue-600 hover:bg-blue-700"}
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isSent ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Envoyé
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Envoyer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-6 h-6 lg:w-8 lg:h-8" />
            Rappels email de livraison
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">
            Événement : {activeEvent.name}
          </p>
        </div>

        <div className="grid gap-4">
          {renderItemsList(todayItems, "Livraisons aujourd'hui", new Date())}
          {renderItemsList(tomorrowItems, "Livraisons demain", new Date(Date.now() + 86400000))}
        </div>
      </div>
    </div>
  );
}