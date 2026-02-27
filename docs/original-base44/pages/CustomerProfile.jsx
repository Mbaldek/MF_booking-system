import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Calendar, Package, Edit, Save, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Récupérer l'email depuis les paramètres URL
  const urlParams = new URLSearchParams(window.location.search);
  const customerEmail = urlParams.get('email');

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    notes: '',
    preferences: ''
  });

  // Charger le profil client
  const { data: profiles } = useQuery({
    queryKey: ['customerProfile', customerEmail],
    queryFn: () => base44.entities.CustomerProfile.filter({ email: customerEmail }),
    enabled: !!customerEmail,
    initialData: []
  });

  const profile = profiles[0];

  // Charger toutes les commandes du client
  const { data: allOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: []
  });

  const customerOrders = allOrders.filter(order => order.email === customerEmail);

  // Charger les items de commande
  const { data: orderItems } = useQuery({
    queryKey: ['orderItems'],
    queryFn: () => base44.entities.OrderItem.list(),
    initialData: []
  });

  // Mutation pour créer/mettre à jour le profil
  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return base44.entities.CustomerProfile.update(profile.id, data);
      } else {
        // Créer un nouveau profil avec les infos de la première commande
        const firstOrder = customerOrders[0];
        return base44.entities.CustomerProfile.create({
          email: customerEmail,
          first_name: firstOrder?.first_name || '',
          last_name: firstOrder?.last_name || '',
          phone: firstOrder?.phone || '',
          stand: firstOrder?.stand || '',
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customerProfile', customerEmail]);
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        notes: profile.notes || '',
        preferences: profile.preferences || ''
      });
    }
  }, [profile]);

  if (!customerEmail) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Email client manquant</p>
            <Button onClick={() => navigate(createPageUrl('OrderHistory'))} className="mt-4">
              Retour à l'historique
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstOrder = customerOrders[0];
  const totalSpent = customerOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = customerOrders.length;

  const handleSave = () => {
    saveProfileMutation.mutate(profileData);
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-6 h-6 lg:w-8 lg:h-8" />
              Profil Client
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mt-1">
              Informations et historique des commandes
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(createPageUrl('OrderHistory'))}>
            Retour
          </Button>
        </div>

        {/* Informations du client */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Informations de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-semibold">
                    {profile?.first_name || firstOrder?.first_name} {profile?.last_name || firstOrder?.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{customerEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-semibold">{profile?.phone || firstOrder?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Stand</p>
                  <p className="font-semibold">{profile?.stand || firstOrder?.stand}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900">{totalOrders}</div>
                <div className="text-sm text-blue-700">Commandes</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{totalSpent.toFixed(2)}€</div>
                <div className="text-sm text-green-700">Total dépensé</div>
              </div>
              {firstOrder && (
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                  <div className="text-xs text-purple-700">Client depuis</div>
                  <div className="text-sm font-semibold text-purple-900">
                    {format(new Date(firstOrder.created_date), "MMM yyyy", { locale: fr })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes et préférences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notes et Préférences
            </CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saveProfileMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Préférences alimentaires
              </label>
              {isEditing ? (
                <Textarea
                  value={profileData.preferences}
                  onChange={(e) => setProfileData({ ...profileData, preferences: e.target.value })}
                  placeholder="Allergies, régimes spéciaux, préférences..."
                  rows={3}
                />
              ) : (
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {profileData.preferences || "Aucune préférence enregistrée"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notes administratives
              </label>
              {isEditing ? (
                <Textarea
                  value={profileData.notes}
                  onChange={(e) => setProfileData({ ...profileData, notes: e.target.value })}
                  placeholder="Notes internes sur le client..."
                  rows={4}
                />
              ) : (
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {profileData.notes || "Aucune note"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Historique des commandes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historique des commandes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customerOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune commande</p>
            ) : (
              customerOrders.map(order => {
                const items = getOrderItems(order.id);
                return (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-indigo-600 text-white">
                          {order.order_number}
                        </Badge>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(order.created_date), "d MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      <span className="font-bold text-green-700">
                        {order.total_amount.toFixed(2)}€
                      </span>
                    </div>
                    {items.length > 0 && (
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <div className="font-medium mb-1">
                              {format(new Date(item.day_date), "EEEE d MMMM", { locale: fr })}
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {item.entree_name && <div>• {item.entree_name}</div>}
                              {item.plat_name && <div>• {item.plat_name}</div>}
                              {item.dessert_name && <div>• {item.dessert_name}</div>}
                              {item.boisson_name && <div>• {item.boisson_name}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}