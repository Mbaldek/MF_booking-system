import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Search, CheckCircle, Package, Camera, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function DeliveryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedItemForPhoto, setSelectedItemForPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
    initialData: []
  });

  const { data: orderItems } = useQuery({
    queryKey: ['orderItems'],
    queryFn: () => base44.entities.OrderItem.list(),
    initialData: []
  });

  const deliverMutation = useMutation({
    mutationFn: async ({ id, photoUrl }) => {
      const user = await base44.auth.me();
      return base44.entities.OrderItem.update(id, { 
        delivered: true,
        delivery_photo_url: photoUrl,
        delivered_at: new Date().toISOString(),
        delivered_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
      setSelectedItemForPhoto(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success('Livraison confirmée avec photo');
    }
  });

  const todayItems = orderItems.filter(item => 
    item.day_date === selectedDate && !item.delivered
  );

  const deliveredItems = orderItems.filter(item => 
    item.day_date === selectedDate && item.delivered
  );

  const getOrderInfo = (orderId) => {
    return orders.find(o => o.id === orderId);
  };

  const filteredItems = todayItems.filter(item => {
    const order = getOrderInfo(item.order_id);
    if (!order) return false;
    
    return (
      order.stand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeliverWithPhoto = async () => {
    if (!photoFile || !selectedItemForPhoto) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      await deliverMutation.mutateAsync({ id: selectedItemForPhoto, photoUrl: file_url });
    } catch (error) {
      toast.error('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const openPhotoDialog = (itemId) => {
    setSelectedItemForPhoto(itemId);
  };

  const closePhotoDialog = () => {
    setSelectedItemForPhoto(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 lg:p-6">
            <CardTitle className="text-xl lg:text-2xl flex items-center gap-2">
              <Truck className="w-5 h-5 lg:w-6 lg:h-6" />
              Module de livraison
            </CardTitle>
            <p className="text-green-100 text-xs lg:text-sm mt-2">
              {format(new Date(selectedDate), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="mb-4 lg:mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par stand ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 lg:p-4 text-center">
                  <Package className="w-5 h-5 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 text-blue-600" />
                  <div className="text-xl lg:text-2xl font-bold text-blue-900">{todayItems.length}</div>
                  <div className="text-xs lg:text-sm text-blue-700">À livrer</div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3 lg:p-4 text-center">
                  <CheckCircle className="w-5 h-5 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 text-green-600" />
                  <div className="text-xl lg:text-2xl font-bold text-green-900">{deliveredItems.length}</div>
                  <div className="text-xs lg:text-sm text-green-700">Livrés</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-3 lg:p-4 text-center">
                  <Truck className="w-5 h-5 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 text-gray-600" />
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">
                    {todayItems.length + deliveredItems.length}
                  </div>
                  <div className="text-xs lg:text-sm text-gray-700">Total</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base lg:text-lg mb-3 lg:mb-4">Commandes à livrer</h3>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {todayItems.length === 0 ? 'Toutes les commandes sont livrées !' : 'Aucune commande trouvée'}
                </div>
              ) : (
                filteredItems.map(item => {
                  const order = getOrderInfo(item.order_id);
                  if (!order) return null;

                  return (
                    <Card key={item.id} className="border-2 hover:border-green-300 transition-colors">
                      <CardContent className="p-3 lg:p-4">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge className="bg-blue-600 text-white text-xs">Stand {order.stand}</Badge>
                              <span className="font-semibold text-sm lg:text-base">{order.first_name} {order.last_name}</span>
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600">{order.phone}</div>
                          </div>
                          <Button
                            onClick={() => openPhotoDialog(item.id)}
                            className="bg-green-600 hover:bg-green-700 w-full lg:w-auto text-sm"
                            size="sm"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Livrer avec photo
                          </Button>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border-2 border-blue-200">
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {item.entree_name && (
                              <div className="bg-white p-2 rounded border-l-4 border-blue-500">
                                <div className="text-xs font-bold text-blue-700 uppercase mb-1">🥗 Entrée</div>
                                <div className="text-sm font-medium text-gray-800">{item.entree_name}</div>
                              </div>
                            )}
                            {item.plat_name && (
                              <div className="bg-white p-2 rounded border-l-4 border-orange-500">
                                <div className="text-xs font-bold text-orange-700 uppercase mb-1">🍽️ Plat</div>
                                <div className="text-sm font-medium text-gray-800">{item.plat_name}</div>
                              </div>
                            )}
                            {item.dessert_name && (
                              <div className="bg-white p-2 rounded border-l-4 border-pink-500">
                                <div className="text-xs font-bold text-pink-700 uppercase mb-1">🍰 Dessert</div>
                                <div className="text-sm font-medium text-gray-800">{item.dessert_name}</div>
                              </div>
                            )}
                            {item.boisson_name && (
                              <div className="bg-white p-2 rounded border-l-4 border-green-500">
                                <div className="text-xs font-bold text-green-700 uppercase mb-1">🥤 Boisson</div>
                                <div className="text-sm font-medium text-gray-800">{item.boisson_name}</div>
                              </div>
                            )}
                          </div>
                          <div className="pt-2 border-t-2 border-blue-300 flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-700">Total :</span>
                            <span className="text-base font-bold text-gray-900">{item.day_total.toFixed(2)}€</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Dialog pour la photo de livraison */}
            {selectedItemForPhoto && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md">
                  <CardHeader className="bg-green-50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Preuve de livraison
                      </CardTitle>
                      <Button variant="ghost" size="icon" onClick={closePhotoDialog}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                      Prenez une photo pour confirmer la livraison
                    </p>

                    {!photoPreview ? (
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Prendre une photo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full rounded-lg border-2 border-gray-300"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                            }}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <Button
                          onClick={handleDeliverWithPhoto}
                          disabled={isUploading || deliverMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          {isUploading || deliverMutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Confirmer la livraison
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}