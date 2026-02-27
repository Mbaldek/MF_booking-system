import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Mail, Shield, User as UserIcon, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [inviting, setInviting] = useState(false);

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => base44.entities.User.update(userId, { role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Rôle modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification du rôle');
    }
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;

    setInviting(true);
    try {
      await base44.users.inviteUser(email, role);
      toast.success(`Invitation envoyée à ${email}`);
      setEmail('');
      setRole('user');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error('Erreur lors de l\'invitation');
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateRoleMutation.mutate({ userId, newRole });
  };

  const adminUsers = users.filter(u => u.role === 'admin');
  const staffUsers = users.filter(u => u.role === 'user');

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 lg:w-8 lg:h-8" />
            Gestion des accès
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">
            Invitez et gérez les accès admin et staff
          </p>
        </div>

        {/* Formulaire d'invitation */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Inviter un nouvel utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="utilisateur@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle *</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Staff (utilisateur)</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={inviting || !email}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {inviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </form>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Note :</strong> L'utilisateur recevra un email d'invitation pour créer son compte.
                Les <strong>Staff</strong> auront accès aux pages de préparation et livraison.
                Les <strong>Admin</strong> ont accès à toutes les fonctionnalités.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Liste des administrateurs */}
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Administrateurs ({adminUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {adminUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Aucun administrateur
              </div>
            ) : (
              <div className="space-y-2">
                {adminUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{user.full_name || 'Sans nom'}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600 text-white">Admin</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangeRole(user.id, user.role)}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Staff
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste du staff */}
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Staff / Personnel ({staffUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {staffUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Aucun membre du staff
              </div>
            ) : (
              <div className="space-y-2">
                {staffUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{user.full_name || 'Sans nom'}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 text-white">Staff</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangeRole(user.id, user.role)}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Admin
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}