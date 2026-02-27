import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, CheckCircle, Settings, UserCog } from "lucide-react";
import DaySelector from '../components/order/DaySelector';
import MenuSelector from '../components/order/MenuSelector';
import OrderQRCode from '../components/order/OrderQRCode';
import InvoiceGenerator from '../components/invoice/InvoiceGenerator';
import { sendOrderConfirmationEmail } from '../components/email/EmailService';
import { format, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

export default function OrderPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    stand: '',
    phone: '',
    email: ''
  });

  const [selectedDays, setSelectedDays] = useState([]);
  const [dayMenus, setDayMenus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [createdOrderItems, setCreatedOrderItems] = useState([]);

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ is_active: true }),
    initialData: []
  });

  const activeEvent = events[0];

  const { data: menuItems } = useQuery({
    queryKey: ['menuItems', activeEvent?.id],
    queryFn: () => base44.entities.MenuItem.filter({
      event_id: activeEvent.id,
      available: true
    }),
    enabled: !!activeEvent,
    initialData: []
  });

  const eventDays = activeEvent ? eachDayOfInterval({
    start: new Date(activeEvent.start_date),
    end: new Date(activeEvent.end_date)
  }).map((d) => format(d, 'yyyy-MM-dd')) : [];

  const entrees = menuItems.filter((item) => item.type === 'entree');
  const plats = menuItems.filter((item) => item.type === 'plat');
  const desserts = menuItems.filter((item) => item.type === 'dessert');
  const boissons = menuItems.filter((item) => item.type === 'boisson');

  const handleToggleDay = React.useCallback((day) => {
    setSelectedDays((prev) => {
      const isSelected = prev.includes(day);
      if (isSelected) {
        setDayMenus((current) => {
          const { [day]: removed, ...rest } = current;
          return rest;
        });
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  }, []);

  const handleMenuSelection = React.useCallback((day, type, itemId) => {
    setDayMenus((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [type]: itemId
      }
    }));
  }, []);

  const calculateTotal = () => {
    let total = 0;
    selectedDays.forEach((day) => {
      const dayMenu = dayMenus[day] || {};
      ['entree', 'plat', 'dessert', 'boisson'].forEach((type) => {
        const itemId = dayMenu[type];
        if (itemId) {
          const item = menuItems.find((m) => m.id === itemId);
          if (item) total += item.price;
        }
      });
    });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderNumber = `CMD-${Date.now()}`;
      const totalAmount = calculateTotal();

      const order = await base44.entities.Order.create({
        ...formData,
        event_id: activeEvent.id,
        total_amount: totalAmount,
        order_number: orderNumber,
        status: 'paid'
      });

      const orderItemsPromises = selectedDays.map((day) => {
        const dayMenu = dayMenus[day] || {};
        const entree = menuItems.find((m) => m.id === dayMenu.entree);
        const plat = menuItems.find((m) => m.id === dayMenu.plat);
        const dessert = menuItems.find((m) => m.id === dayMenu.dessert);
        const boisson = menuItems.find((m) => m.id === dayMenu.boisson);

        let dayTotal = 0;
        if (entree) dayTotal += entree.price;
        if (plat) dayTotal += plat.price;
        if (dessert) dayTotal += dessert.price;
        if (boisson) dayTotal += boisson.price;

        return base44.entities.OrderItem.create({
          order_id: order.id,
          day_date: day,
          entree_id: dayMenu.entree || null,
          plat_id: dayMenu.plat || null,
          dessert_id: dayMenu.dessert || null,
          boisson_id: dayMenu.boisson || null,
          entree_name: entree?.name || null,
          plat_name: plat?.name || null,
          dessert_name: dessert?.name || null,
          boisson_name: boisson?.name || null,
          day_total: dayTotal
        });
      });

      const createdItems = await Promise.all(orderItemsPromises);

      // Envoi email de confirmation
      await sendOrderConfirmationEmail(order, createdItems, activeEvent);

      setCreatedOrder(order);
      setCreatedOrderItems(createdItems);
      setOrderSuccess(true);
      setFormData({ first_name: '', last_name: '', stand: '', phone: '', email: '' });
      setSelectedDays([]);
      setDayMenus({});
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert('Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Aucun événement actif pour le moment.</p>
          </CardContent>
        </Card>
      </div>);

  }

  if (orderSuccess && createdOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <Card className="shadow-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Commande confirmée !</h2>
              <p className="text-gray-600">
                Votre commande a été enregistrée avec succès. Vous recevrez un email de confirmation.
              </p>
            </CardContent>
          </Card>

          <OrderQRCode orderId={createdOrder.id} orderNumber={createdOrder.order_number} />

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <InvoiceGenerator
                order={createdOrder}
                orderItems={createdOrderItems}
                menuItems={menuItems}
                event={activeEvent} />

            </CardContent>
          </Card>

          <Button
            onClick={() => {
              setOrderSuccess(false);
              setCreatedOrder(null);
              setCreatedOrderItems([]);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg">

            Nouvelle commande
          </Button>
        </div>
      </div>);

  }

  const total = calculateTotal();
  const isFormValid = formData.first_name && formData.last_name && formData.stand &&
  formData.phone && formData.email && selectedDays.length > 0 &&
  selectedDays.every((day) => {
    const menu = dayMenus[day];
    return menu && (menu.entree || menu.plat || menu.dessert || menu.boisson);
  });

  return (
    <div className="bg-slate-50 px-3 py-4 sm:px-4 sm:py-8 min-h-screen from-blue-50 to-indigo-50 relative">
      {/* Boutons Admin & Staff - Position fixe en haut à droite */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link to={createPageUrl('StaffDashboard')}>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm hover:bg-purple-50 border-purple-200 shadow-lg hover:shadow-xl transition-all">

            <UserCog className="w-4 h-4 mr-2" />
            Staff
          </Button>
        </Link>
        <Link to={createPageUrl('AdminDashboard')}>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm hover:bg-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-all">

            <Settings className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Section */}
        <Card className="bg-white shadow-sm border-b">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Maison Félicien</h1>
            <p className="text-sm text-gray-500">
              {activeEvent.name} • {format(new Date(activeEvent.start_date), "d MMM", { locale: fr })} - {format(new Date(activeEvent.end_date), "d MMM yyyy", { locale: fr })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required />

                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required />

                </div>
                <div className="space-y-2">
                  <Label htmlFor="stand">Stand *</Label>
                  <Input
                    id="stand"
                    value={formData.stand}
                    onChange={(e) => setFormData({ ...formData, stand: e.target.value })}
                    required />

                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required />

                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required />

                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Sélectionnez vos jours</h3>
                <DaySelector
                  days={eventDays}
                  selectedDays={selectedDays}
                  onToggleDay={handleToggleDay} />

              </div>

              {selectedDays.length > 0 &&
              <div className="space-y-4">
                  {selectedDays.map((day) =>
                <Card key={day} className="border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium">
                          {format(new Date(day), "EEEE d MMMM", { locale: fr })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        {entrees.length > 0 &&
                    <MenuSelector
                      type="entree"
                      items={entrees}
                      selectedId={dayMenus[day]?.entree}
                      onSelect={(id) => handleMenuSelection(day, 'entree', id)} />

                    }
                        {plats.length > 0 &&
                    <MenuSelector
                      type="plat"
                      items={plats}
                      selectedId={dayMenus[day]?.plat}
                      onSelect={(id) => handleMenuSelection(day, 'plat', id)} />

                    }
                        {desserts.length > 0 &&
                    <MenuSelector
                      type="dessert"
                      items={desserts}
                      selectedId={dayMenus[day]?.dessert}
                      onSelect={(id) => handleMenuSelection(day, 'dessert', id)} />

                    }
                        {boissons.length > 0 &&
                    <MenuSelector
                      type="boisson"
                      items={boissons}
                      selectedId={dayMenus[day]?.boisson}
                      onSelect={(id) => handleMenuSelection(day, 'boisson', id)} />

                    }
                      </CardContent>
                    </Card>
                )}
                </div>
              }

              {selectedDays.length > 0 &&
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {selectedDays.length} jour{selectedDays.length > 1 ? 's' : ''}
                </span>
                <span className="text-2xl font-semibold">{total.toFixed(2)}€</span>
              </div>
              }

              <Button
                type="submit"
                disabled={!isFormValid || submitting}
                className="w-full bg-blue-600 hover:bg-blue-700">

                {submitting ?
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Traitement en cours...
                  </> :

                <>Valider et payer {total.toFixed(2)}€</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>);

}