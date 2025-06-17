import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-dark-gray mb-4">
          Analysez les accidents du travail avec la méthode INRS
        </h2>
        <p className="text-xl text-medium-gray mb-8 max-w-3xl mx-auto">
          CauseMapster vous accompagne dans l'analyse méthodique des accidents du travail grâce à l'arbre des causes, 
          avec l'assistance de l'intelligence artificielle.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="bg-primary-orange text-white hover:bg-orange-600 px-8 py-4 text-lg">
            <Link href={user ? "/accident/new" : "/register"}>
              <i className="fas fa-plus mr-3"></i>Nouvelle Analyse d'Accident
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
            <i className="fas fa-play-circle mr-3"></i>Voir la démonstration
          </Button>
        </div>
      </div>

      {/* Workflow Steps */}
      <section className="mb-16">
        <h3 className="text-2xl font-bold text-dark-gray text-center mb-12">
          Processus d'analyse en 4 étapes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-orange rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-clipboard-list text-white text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">
                1. Déclaration d'accident
              </h4>
              <p className="text-medium-gray text-sm">
                Collecte des informations générales, témoignages et pièces jointes
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary-orange text-primary-orange">
                  <i className="fas fa-microphone mr-1"></i>Enregistrement vocal
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-orange rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-users text-white text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">
                2. Analyse des témoins
              </h4>
              <p className="text-medium-gray text-sm">
                Classification des témoignages en faits avérés, opinions et éléments à vérifier
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <i className="fas fa-robot mr-1"></i>Analyse IA
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-orange rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-file-alt text-white text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">
                3. Résumé analysé
              </h4>
              <p className="text-medium-gray text-sm">
                Validation des éléments analysés et ajout des preuves matérielles
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <i className="fas fa-check mr-1"></i>Validation
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-orange rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-sitemap text-white text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">
                4. Arbre des causes
              </h4>
              <p className="text-medium-gray text-sm">
                Construction de l'arbre des causes avec identification des mesures préventives
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  <i className="fas fa-download mr-1"></i>Export PDF
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="mb-16">
        <h3 className="text-2xl font-bold text-dark-gray text-center mb-12">
          Fonctionnalités Avancées
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-robot text-blue-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">Analyse IA Avancée</h4>
              <p className="text-medium-gray text-sm">
                Notre IA GPT-4 analyse automatiquement les témoignages et suggère des classifications pour accélérer votre travail.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-microphone text-green-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">Enregistrement Vocal</h4>
              <p className="text-medium-gray text-sm">
                Dictez vos observations directement dans l'application grâce à la reconnaissance vocale intégrée.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-project-diagram text-purple-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">Arbre Interactif</h4>
              <p className="text-medium-gray text-sm">
                Construisez et modifiez votre arbre des causes avec une interface intuitive et exportez-le en PDF.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-cloud text-yellow-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">Stockage Sécurisé</h4>
              <p className="text-medium-gray text-sm">
                Toutes vos données sont stockées de manière sécurisée avec Supabase et accessibles partout.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-file-pdf text-red-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">Export Professionnel</h4>
              <p className="text-medium-gray text-sm">
                Générez des rapports PDF professionnels prêts à être partagés avec votre hiérarchie.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-users-cog text-indigo-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-dark-gray mb-3">Gestion d'Équipe</h4>
              <p className="text-medium-gray text-sm">
                Collaborez avec votre équipe, partagez les analyses et gérez les accès selon les rôles.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
