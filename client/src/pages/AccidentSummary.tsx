import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Accident, Fragment, MaterialEvidence } from "@shared/schema";

export default function AccidentSummary() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const accidentId = parseInt(params.id!);
  
  const [newFact, setNewFact] = useState("");
  const [newEvidence, setNewEvidence] = useState({ description: "", isUseful: false });

  const { data: accident, isLoading: accidentLoading } = useQuery<Accident>({
    queryKey: [`/api/accidents/${accidentId}`],
  });

  const { data: fragments, isLoading: fragmentsLoading } = useQuery<Fragment[]>({
    queryKey: [`/api/accidents/${accidentId}/fragments`],
  });

  const { data: evidence, isLoading: evidenceLoading } = useQuery<MaterialEvidence[]>({
    queryKey: [`/api/accidents/${accidentId}/evidence`],
  });

  const updateFragmentMutation = useMutation({
    mutationFn: async ({ fragmentId, isUnusual }: { fragmentId: number; isUnusual: boolean }) => {
      const response = await apiRequest("PATCH", `/api/fragments/${fragmentId}`, {
        isUnusual,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accidents/${accidentId}/fragments`] });
    },
  });

  const addFactMutation = useMutation({
    mutationFn: async (fact: string) => {
      const response = await apiRequest("POST", `/api/accidents/${accidentId}/fragments`, {
        fragments: [{
          content: fact,
          type: "verified_fact",
          witnessId: null,
        }]
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accidents/${accidentId}/fragments`] });
      setNewFact("");
      toast({
        title: "Fait ajouté",
        description: "Le fait manuel a été ajouté avec succès.",
      });
    },
  });

  const addEvidenceMutation = useMutation({
    mutationFn: async (evidence: { description: string; isUseful: boolean }) => {
      const response = await apiRequest("POST", `/api/accidents/${accidentId}/evidence`, evidence);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accidents/${accidentId}/evidence`] });
      setNewEvidence({ description: "", isUseful: false });
      toast({
        title: "Preuve ajoutée",
        description: "La preuve matérielle a été ajoutée avec succès.",
      });
    },
  });

  const updateEvidenceMutation = useMutation({
    mutationFn: async ({ evidenceId, isUseful }: { evidenceId: number; isUseful: boolean }) => {
      const response = await apiRequest("PATCH", `/api/evidence/${evidenceId}`, {
        isUseful,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accidents/${accidentId}/evidence`] });
    },
  });

  const getTypeLabel = (type: string) => {
    const labels = {
      verified_fact: "Fait avéré",
      opinion: "Opinion",
      to_verify: "À vérifier",
      other: "Autre"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      verified_fact: "bg-green-100 text-green-800",
      opinion: "bg-blue-100 text-blue-800",
      to_verify: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleAddFact = () => {
    if (newFact.trim()) {
      addFactMutation.mutate(newFact.trim());
    }
  };

  const handleAddEvidence = () => {
    if (newEvidence.description.trim()) {
      addEvidenceMutation.mutate(newEvidence);
    }
  };

  if (accidentLoading || fragmentsLoading || evidenceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-primary-orange to-orange-400 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Étape 3 - Résumé de l'accident analysé</h1>
                <p className="text-white text-opacity-80">Validation des éléments et ajout des preuves matérielles</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">3/4</span>
              <div className="w-16 bg-white bg-opacity-20 rounded-full h-2">
                <div className="w-3/4 bg-white rounded-full h-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Analyzed Elements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-table text-primary-orange mr-3"></i>
                Éléments analysés
              </div>
              <div>
                <Input
                  placeholder="Ajouter un fait manuel..."
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  className="w-64 mr-2 inline-block"
                />
                <Button 
                  onClick={handleAddFact}
                  disabled={!newFact.trim() || addFactMutation.isPending}
                  className="bg-primary-orange hover:bg-orange-600"
                >
                  {addFactMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                  <i className="fas fa-plus mr-2"></i>Ajouter
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Élément</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fait inhabituel ?</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fragments?.map((fragment, index) => (
                    <TableRow key={fragment.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{fragment.content}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(fragment.type)}>
                          {getTypeLabel(fragment.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={fragment.isUnusual}
                          onCheckedChange={(checked) => 
                            updateFragmentMutation.mutate({
                              fragmentId: fragment.id,
                              isUnusual: !!checked
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <i className="fas fa-edit text-primary-orange"></i>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!fragments || fragments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                        <p className="text-medium-gray">Aucun élément analysé trouvé</p>
                        <p className="text-sm text-medium-gray">
                          Retournez à l'analyse des témoins pour créer des fragments
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Material Evidence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-box text-primary-orange mr-3"></i>
              Preuves matérielles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add New Evidence */}
            <div className="mb-6 p-4 border rounded-lg bg-light-gray">
              <h4 className="font-medium text-dark-gray mb-3">Ajouter une preuve matérielle</h4>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Textarea
                    placeholder="Description de la preuve matérielle..."
                    value={newEvidence.description}
                    onChange={(e) => setNewEvidence(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={newEvidence.isUseful}
                      onCheckedChange={(checked) => setNewEvidence(prev => ({ ...prev, isUseful: !!checked }))}
                    />
                    <label className="text-sm">Utile pour l'analyse</label>
                  </div>
                  <Button 
                    onClick={handleAddEvidence}
                    disabled={!newEvidence.description.trim() || addEvidenceMutation.isPending}
                    className="bg-primary-orange hover:bg-orange-600"
                  >
                    {addEvidenceMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                    <i className="fas fa-plus mr-2"></i>Ajouter
                  </Button>
                </div>
              </div>
            </div>

            {/* Evidence Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">N°</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Utile pour l'analyse ?</TableHead>
                    <TableHead>Validation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evidence?.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">E{(index + 1).toString().padStart(3, '0')}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{item.description}</p>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={item.isUseful}
                          onCheckedChange={(checked) => 
                            updateEvidenceMutation.mutate({
                              evidenceId: item.id,
                              isUseful: !!checked
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {item.isUseful ? (
                          <Badge className="bg-green-100 text-green-800">
                            <i className="fas fa-check mr-1"></i>Validé
                          </Badge>
                        ) : (
                          <Badge variant="outline">En attente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-edit text-primary-orange"></i>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-paperclip text-blue-600"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!evidence || evidence.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <i className="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
                        <p className="text-medium-gray">Aucune preuve matérielle ajoutée</p>
                        <p className="text-sm text-medium-gray">
                          Utilisez le formulaire ci-dessus pour ajouter des preuves
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {fragments?.filter(f => f.type === "verified_fact").length || 0}
              </div>
              <p className="text-sm text-medium-gray">Faits avérés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {fragments?.filter(f => f.isUnusual).length || 0}
              </div>
              <p className="text-sm text-medium-gray">Faits inhabituels</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {evidence?.length || 0}
              </div>
              <p className="text-sm text-medium-gray">Preuves matérielles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {evidence?.filter(e => e.isUseful).length || 0}
              </div>
              <p className="text-sm text-medium-gray">Preuves validées</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/accident/${accidentId}/witness-analysis`)}
        >
          <i className="fas fa-arrow-left mr-2"></i>Retour: Analyse des témoins
        </Button>
        
        <div className="flex space-x-4">
          <Button variant="outline">
            <i className="fas fa-save mr-2"></i>Enregistrer brouillon
          </Button>
          <Button variant="destructive">
            <i className="fas fa-trash mr-2"></i>Supprimer cette analyse
          </Button>
          <Button 
            className="bg-primary-orange hover:bg-orange-600"
            onClick={() => setLocation(`/accident/${accidentId}/cause-tree`)}
          >
            Suivant: Construire l'arbre des causes <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
