import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, UtensilsCrossed, CheckSquare, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import BulkEditDialog from '../components/menu/BulkEditDialog';

export default function AdminMenuPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'entree',
    price: '',
    description: '',
    available: true,
    tags: []
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ is_active: true }),
    initialData: []
  });

  const activeEvent = events[0];

  const { data: menuItems } = useQuery({
    queryKey: ['menuItems', activeEvent?.id],
    queryFn: () => base44.entities.MenuItem.filter({ event_id: activeEvent.id }),
    enabled: !!activeEvent,
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setShowForm(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setShowForm(false);
      setEditingItem(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'entree',
      price: '',
      description: '',
      available: true,
      tags: []
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      event_id: activeEvent.id
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      price: item.price.toString(),
      description: item.description || '',
      available: item.available,
      tags: item.tags || []
    });
    setShowForm(true);
  };

  const handleBulkUpdate = async (updates) => {
    const promises = selectedItems.map(item => {
      let newData = {};
      
      if (updates.price !== undefined) {
        newData.price = updates.price;
      } else if (updates.priceIncrease !== undefined) {
        newData.price = item.price + updates.priceIncrease;
      } else if (updates.priceDecrease !== undefined) {
        newData.price = Math.max(0, item.price - updates.priceDecrease);
      }
      
      if (updates.available !== undefined) {
        newData.available = updates.available;
      }

      return base44.entities.MenuItem.update(item.id, newData);
    });

    await Promise.all(promises);
    queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    setSelectedItems([]);
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const toggleAllItems = () => {
    if (selectedItems.length === menuItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...menuItems]);
    }
  };

  const typeLabels = {
    entree: 'Entrées',
    plat: 'Plats',
    dessert: 'Desserts',
    boisson: 'Boissons'
  };

  const typeColors = {
    entree: 'bg-blue-100 text-blue-800',
    plat: 'bg-orange-100 text-orange-800',
    dessert: 'bg-pink-100 text-pink-800',
    boisson: 'bg-green-100 text-green-800'
  };

  const tagLabels = {
    vegan: 'Vegan',
    vegetarien: 'Végétarien',
    sans_gluten: 'Sans gluten',
    sans_lactose: 'Sans lactose',
    bio: 'Bio',
    epice: 'Épicé',
    allergenes_fruits_a_coque: '⚠️ Fruits à coque',
    allergenes_arachides: '⚠️ Arachides',
    allergenes_oeuf: '⚠️ Œuf',
    allergenes_poisson: '⚠️ Poisson',
    allergenes_crustaces: '⚠️ Crustacés'
  };

  const tagColors = {
    vegan: 'bg-green-100 text-green-800 border-green-300',
    vegetarien: 'bg-lime-100 text-lime-800 border-lime-300',
    sans_gluten: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    sans_lactose: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    bio: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    epice: 'bg-red-100 text-red-800 border-red-300',
    allergenes_fruits_a_coque: 'bg-orange-100 text-orange-800 border-orange-300',
    allergenes_arachides: 'bg-orange-100 text-orange-800 border-orange-300',
    allergenes_oeuf: 'bg-orange-100 text-orange-800 border-orange-300',
    allergenes_poisson: 'bg-orange-100 text-orange-800 border-orange-300',
    allergenes_crustaces: 'bg-orange-100 text-orange-800 border-orange-300'
  };

  if (!activeEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-6 lg:p-8 text-center">
              <p className="text-sm lg:text-base text-gray-600">Aucun événement actif. Créez d'abord un événement.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 lg:w-8 lg:h-8" />
              Gestion des menus
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mt-1">Événement : {activeEvent.name}</p>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            {selectedItems.length > 0 && (
              <Button
                onClick={() => setShowBulkEdit(true)}
                className="bg-purple-600 hover:bg-purple-700 flex-1 lg:flex-none"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Modifier ({selectedItems.length})
              </Button>
            )}
            <Button
              onClick={() => {
                setShowForm(!showForm);
                setEditingItem(null);
                resetForm();
              }}
              className="bg-blue-600 hover:bg-blue-700 flex-1 lg:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>
        </div>

        {menuItems.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAllItems}
                  className="flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-700"
                >
                  {selectedItems.length === menuItems.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedItems.length === menuItems.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <p className="text-sm text-blue-700">
                  {selectedItems.length} / {menuItems.length} produit{menuItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingItem ? 'Modifier le produit' : 'Nouveau produit'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du produit *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entree">Entrée</SelectItem>
                        <SelectItem value="plat">Plat</SelectItem>
                        <SelectItem value="dessert">Dessert</SelectItem>
                        <SelectItem value="boisson">Boisson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prix (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Disponible</Label>
                    <Select
                      value={formData.available.toString()}
                      onValueChange={(v) => setFormData({ ...formData, available: v === 'true' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tags spéciaux (régimes, allergènes)</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                      {Object.entries(tagLabels).map(([key, label]) => {
                        const isSelected = formData.tags.includes(key);
                        return (
                          <Badge
                            key={key}
                            className={`cursor-pointer transition-all ${
                              isSelected 
                                ? tagColors[key] + ' border-2' 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                tags: isSelected
                                  ? formData.tags.filter(t => t !== key)
                                  : [...formData.tags, key]
                              });
                            }}
                          >
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingItem ? 'Mettre à jour' : 'Créer'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {['entree', 'plat', 'dessert', 'boisson'].map(type => {
            const items = menuItems.filter(item => item.type === type);
            return (
              <Card key={type}>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">{typeLabels[type]}</CardTitle>
                  <p className="text-sm text-gray-500">{items.length} produit{items.length > 1 ? 's' : ''}</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {items.map(item => {
                      const isSelected = selectedItems.find(i => i.id === item.id);
                      return (
                        <div 
                          key={item.id} 
                          className={`p-3 border rounded-lg hover:border-gray-400 transition-all ${
                            isSelected ? 'border-blue-500 bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Checkbox
                              checked={!!isSelected}
                              onCheckedChange={() => toggleItemSelection(item)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                  )}
                                </div>
                                <Badge className={typeColors[type]}>{item.price.toFixed(2)}€</Badge>
                              </div>
                              
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className={`text-xs ${tagColors[tag]}`}>
                                      {tagLabels[tag]}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            {!item.available && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                Indisponible
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="h-7 px-2"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Supprimer ce produit ?')) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              className="h-7 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Aucun produit</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <BulkEditDialog
          isOpen={showBulkEdit}
          onClose={() => setShowBulkEdit(false)}
          selectedItems={selectedItems}
          onBulkUpdate={handleBulkUpdate}
        />
      </div>
    </div>
  );
}