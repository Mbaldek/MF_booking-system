import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminEventPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-created_date'),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
      setEditingEvent(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      start_date: event.start_date,
      end_date: event.end_date,
      is_active: event.is_active
    });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-5xl mx-auto space-y-4 lg:space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 lg:w-8 lg:h-8" />
              Gestion des événements
            </h1>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingEvent(null);
              resetForm();
            }}
            className="bg-blue-600 hover:bg-blue-700 w-full lg:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un événement
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingEvent ? "Modifier l'événement" : "Nouvel événement"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom de l'événement *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Salon du Bâtiment 2026"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de début *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin *</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingEvent ? 'Mettre à jour' : 'Créer'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEvent(null);
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

        <div className="space-y-3 lg:space-y-4">
          {events.map(event => (
            <Card key={event.id} className={event.is_active ? 'border-2 border-green-300' : ''}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                      <h3 className="text-lg lg:text-xl font-semibold">{event.name}</h3>
                      {event.is_active && (
                        <Badge className="bg-green-600 text-white text-xs">Actif</Badge>
                      )}
                    </div>
                    <div className="text-sm lg:text-base text-gray-600">
                      Du {format(new Date(event.start_date), "d MMMM yyyy", { locale: fr })} au{' '}
                      {format(new Date(event.end_date), "d MMMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Supprimer cet événement ?')) {
                          deleteMutation.mutate(event.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {events.length === 0 && (
            <Card>
              <CardContent className="p-6 lg:p-8 text-center text-gray-500 text-sm lg:text-base">
                Aucun événement créé. Créez votre premier événement pour commencer.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}