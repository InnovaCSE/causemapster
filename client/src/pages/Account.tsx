import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User, Accident } from "@shared/schema";
import { Link } from "wouter";

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Email invalide"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(1, "Confirmation requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Account() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { data: userAccidents, isLoading: accidentsLoading } = useQuery<Accident[]>({
    queryKey: ["/api/user/accidents"],
    enabled: !!user,
  });

  const { data: userStats, isLoading: statsLoading } = useQuery<{
    totalAnalyses: number;
    inProgress: number;
    completed: number;
    monthlyUsage: number;
    storageUsed: number;
  }>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
      setIsUpdatingProfile(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiRequest("PATCH", "/api/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      setIsUpdatingPassword(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le mot de passe. Vérifiez votre mot de passe actuel.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/user/account");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès.",
      });
      // Redirect to home page
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte.",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    setIsUpdatingPassword(true);
    updatePasswordMutation.mutate(data);
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      deleteAccountMutation.mutate();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    return plan === "premium" ? (
      <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">Gratuit</Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-gray mb-2">Mon Compte</h1>
        <p className="text-medium-gray">
          Gérez vos informations personnelles et vos analyses d'accidents
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="analyses">Mes Analyses</TabsTrigger>
          <TabsTrigger value="plan">Plan & Facturation</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-user text-primary-orange mr-3"></i>
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      {...profileForm.register("firstName")}
                      disabled={isUpdatingProfile}
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      {...profileForm.register("lastName")}
                      disabled={isUpdatingProfile}
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register("email")}
                    disabled={isUpdatingProfile}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="bg-primary-orange hover:bg-orange-600"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Mettre à jour
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-lock text-primary-orange mr-3"></i>
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                      disabled={isUpdatingPassword}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register("newPassword")}
                      disabled={isUpdatingPassword}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                      disabled={isUpdatingPassword}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-primary-orange hover:bg-orange-600"
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-key mr-2"></i>
                        Changer le mot de passe
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <i className="fas fa-exclamation-triangle mr-3"></i>
                  Zone de danger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    La suppression de votre compte est irréversible. Toutes vos analyses seront définitivement perdues.
                  </AlertDescription>
                </Alert>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash mr-2"></i>
                      Supprimer mon compte
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analyses Tab */}
        <TabsContent value="analyses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className="fas fa-list text-primary-orange mr-3"></i>
                  Mes analyses d'accidents
                </div>
                <Button asChild className="bg-primary-orange hover:bg-orange-600">
                  <Link href="/accident/new">
                    <i className="fas fa-plus mr-2"></i>Nouvelle analyse
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accidentsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingSpinner size="lg" />
                </div>
              ) : userAccidents && userAccidents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Lieu</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Gravité</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userAccidents.map((accident) => (
                        <TableRow key={accident.id}>
                          <TableCell className="font-medium">
                            {accident.accidentNumber}
                          </TableCell>
                          <TableCell>{accident.location}</TableCell>
                          <TableCell>
                            {new Date(accident.date).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>{getStatusBadge(accident.status)}</TableCell>
                          <TableCell>
                            {accident.severity && (
                              <Badge variant="outline">
                                {accident.severity === "severe" ? "Grave" : 
                                 accident.severity === "moderate" ? "Modéré" : "Mineur"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/accident/${accident.id}/edit`}>
                                  <i className="fas fa-edit text-primary-orange"></i>
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <i className="fas fa-download text-blue-600"></i>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <i className="fas fa-trash text-red-600"></i>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                  <p className="text-medium-gray mb-4">Aucune analyse trouvée</p>
                  <Button asChild className="bg-primary-orange hover:bg-orange-600">
                    <Link href="/accident/new">
                      <i className="fas fa-plus mr-2"></i>Créer votre première analyse
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-crown text-primary-orange mr-3"></i>
                    Plan actuel
                  </div>
                  {getPlanBadge(user?.plan || "free")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-orange mb-2">
                      {userStats?.totalAnalyses || 0}
                    </div>
                    <p className="text-sm text-medium-gray">Analyses totales</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {userStats?.monthlyUsage || 0}/{user?.plan === "premium" ? "∞" : "3"}
                    </div>
                    <p className="text-sm text-medium-gray">Analyses ce mois</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {((userStats?.storageUsed || 0) / 1024 / 1024).toFixed(1)} MB
                    </div>
                    <p className="text-sm text-medium-gray">Stockage utilisé</p>
                  </div>
                </div>
                
                {user?.plan === "free" && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">
                      Passez au plan Premium
                    </h4>
                    <ul className="text-sm text-orange-700 space-y-1 mb-4">
                      <li>• Analyses illimitées</li>
                      <li>• Stockage étendu</li>
                      <li>• Support prioritaire</li>
                      <li>• Fonctionnalités avancées</li>
                    </ul>
                    <Button className="bg-primary-orange hover:bg-orange-600">
                      <i className="fas fa-crown mr-2"></i>
                      Passer au Premium
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
