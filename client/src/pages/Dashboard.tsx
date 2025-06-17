import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import type { Accident } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: accidents, isLoading } = useQuery<Accident[]>({
    queryKey: ["/api/accidents"],
    enabled: !!user,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalAnalyses: number;
    inProgress: number;
    completed: number;
    monthlyUsage: number;
  }>({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

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

  const getSeverityIcon = (severity: string | null) => {
    switch (severity) {
      case "severe":
        return <i className="fas fa-exclamation-triangle text-red-600"></i>;
      case "moderate":
        return <i className="fas fa-tools text-orange-600"></i>;
      case "minor":
        return <i className="fas fa-info-circle text-blue-600"></i>;
      default:
        return <i className="fas fa-question-circle text-gray-600"></i>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-gray mb-2">
          Bonjour {user?.firstName || user?.email} 👋
        </h1>
        <p className="text-medium-gray">
          Voici un aperçu de vos analyses d'accidents du travail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Analyses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <i className="fas fa-history mr-2 text-primary-orange"></i>
                  Analyses Récentes
                </CardTitle>
                <Button asChild className="bg-primary-orange hover:bg-orange-600">
                  <Link href="/accident/new">
                    <i className="fas fa-plus mr-2"></i>Nouvelle Analyse
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {accidents && accidents.length > 0 ? (
                <div className="space-y-4">
                  {accidents.slice(0, 5).map((accident) => (
                    <div key={accident.id} className="flex items-center justify-between p-4 bg-light-gray rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          {getSeverityIcon(accident.severity)}
                        </div>
                        <div>
                          <h4 className="font-medium text-dark-gray">
                            {accident.accidentNumber} - {accident.location}
                          </h4>
                          <p className="text-sm text-medium-gray">
                            {new Date(accident.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(accident.status)}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/accident/${accident.id}/edit`}>
                            <i className="fas fa-edit"></i>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
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
        </div>

        {/* Statistics and Quick Actions */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-chart-bar mr-2 text-primary-orange"></i>
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-medium-gray">Analyses totales</span>
                  <span className="font-semibold text-dark-gray">
                    {stats?.totalAnalyses || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-gray">En cours</span>
                  <span className="font-semibold text-yellow-600">
                    {stats?.inProgress || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-medium-gray">Terminées</span>
                  <span className="font-semibold text-green-600">
                    {stats?.completed || 0}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-medium-gray">Plan actuel</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {user?.plan === "premium" ? "Premium" : "Gratuit"}
                    </Badge>
                  </div>
                  {user?.plan === "free" && (
                    <p className="text-xs text-medium-gray mt-2">
                      {stats?.monthlyUsage || 0}/3 analyses utilisées ce mois
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-bolt mr-2 text-primary-orange"></i>
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full bg-primary-orange hover:bg-orange-600">
                  <Link href="/accident/new">
                    <i className="fas fa-plus mr-2"></i>Nouvelle Analyse
                  </Link>
                </Button>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-upload mr-2"></i>Importer des Données
                </Button>
                <Button variant="outline" className="w-full">
                  <i className="fas fa-download mr-2"></i>Exporter Rapport
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
