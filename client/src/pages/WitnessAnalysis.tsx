import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { apiRequest } from "@/lib/queryClient";
import type { Accident, Witness, Fragment } from "@shared/schema";

interface FragmentWithSelection {
  id?: number;
  content: string;
  type: "verified_fact" | "opinion" | "to_verify" | "other";
  witnessId?: number;
  startIndex: number;
  endIndex: number;
}

export default function WitnessAnalysis() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const accidentId = parseInt(params.id!);
  
  const [selectedWitnessId, setSelectedWitnessId] = useState<number | null>(null);
  const [testimony, setTestimony] = useState("");
  const [fragments, setFragments] = useState<FragmentWithSelection[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { isRecording, transcript, startRecording, stopRecording, resetTranscript } = useVoiceRecording();

  const { data: accident, isLoading: accidentLoading } = useQuery<Accident>({
    queryKey: [`/api/accidents/${accidentId}`],
  });

  const { data: witnesses, isLoading: witnessesLoading } = useQuery<Witness[]>({
    queryKey: [`/api/accidents/${accidentId}/witnesses`],
  });

  const { data: existingFragments, isLoading: fragmentsLoading } = useQuery<Fragment[]>({
    queryKey: [`/api/accidents/${accidentId}/fragments`],
  });

  useEffect(() => {
    if (transcript) {
      setTestimony(prev => prev + " " + transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (existingFragments) {
      setFragments(existingFragments.map(f => ({
        id: f.id,
        content: f.content,
        type: f.type as any,
        witnessId: f.witnessId || undefined,
        startIndex: 0,
        endIndex: f.content.length,
      })));
    }
  }, [existingFragments]);

  const analyzeWithAIMutation = useMutation({
    mutationFn: async ({ testimony, witnessId }: { testimony: string; witnessId?: number }) => {
      const response = await apiRequest("POST", "/api/ai/analyze-testimony", {
        accidentId,
        testimony,
        witnessId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setFragments(prev => [...prev, ...data.fragments]);
      toast({
        title: "Analyse IA terminée",
        description: "Les fragments ont été analysés et classifiés.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser le témoignage avec l'IA.",
        variant: "destructive",
      });
    },
  });

  const saveFragmentsMutation = useMutation({
    mutationFn: async (fragments: FragmentWithSelection[]) => {
      const response = await apiRequest("POST", `/api/accidents/${accidentId}/fragments`, {
        fragments: fragments.map(f => ({
          content: f.content,
          type: f.type,
          witnessId: f.witnessId || null,
        }))
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accidents/${accidentId}/fragments`] });
      toast({
        title: "Fragments sauvegardés",
        description: "Les fragments ont été enregistrés avec succès.",
      });
      setLocation(`/accident/${accidentId}/summary`);
    },
    onError: () => {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les fragments.",
        variant: "destructive",
      });
    },
  });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      const newFragment: FragmentWithSelection = {
        content: selectedText,
        type: "other",
        witnessId: selectedWitnessId || undefined,
        startIndex: 0,
        endIndex: selectedText.length,
      };
      setFragments(prev => [...prev, newFragment]);
      selection.removeAllRanges();
    }
  };

  const updateFragmentType = (index: number, type: FragmentWithSelection["type"]) => {
    setFragments(prev => prev.map((f, i) => i === index ? { ...f, type } : f));
  };

  const removeFragment = (index: number) => {
    setFragments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAIAnalysis = () => {
    if (!testimony.trim()) {
      toast({
        title: "Témoignage vide",
        description: "Veuillez saisir un témoignage avant l'analyse.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    analyzeWithAIMutation.mutate({ 
      testimony, 
      witnessId: selectedWitnessId || undefined 
    });
  };

  const getFragmentsByType = (type: string) => {
    return fragments.filter(f => f.type === type);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      verified_fact: "Fait avéré",
      opinion: "Opinion",
      to_verify: "Élément à vérifier",
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

  if (accidentLoading || witnessesLoading || fragmentsLoading) {
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
                <i className="fas fa-users text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Étape 2 - Analyse des témoins</h1>
                <p className="text-white text-opacity-80">Classification des témoignages en fragments analysés</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">2/4</span>
              <div className="w-16 bg-white bg-opacity-20 rounded-full h-2">
                <div className="w-2/4 bg-white rounded-full h-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Testimony Input */}
        <div className="lg:col-span-2 space-y-6">
          {/* Victim Testimony */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-user text-primary-orange mr-3"></i>
                Témoignage de la victime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-medium-gray mb-2">
                  Saisissez le témoignage détaillé de la victime
                </p>
                <Textarea
                  rows={6}
                  value={testimony}
                  onChange={(e) => setTestimony(e.target.value)}
                  onMouseUp={handleTextSelection}
                  placeholder="Décrivez en détail ce qui s'est passé selon la victime..."
                  className="min-h-[150px]"
                />
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className={`flex items-center ${isRecording ? 'recording bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} mr-2`}></i>
                  {isRecording ? 'Arrêter' : 'Enregistrer'}
                </Button>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleAIAnalysis}
                  disabled={analyzeWithAIMutation.isPending || !testimony.trim()}
                >
                  {analyzeWithAIMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-robot mr-2"></i>Lancer l'analyse IA
                    </>
                  )}
                </Button>
                {transcript && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetTranscript}
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Effacer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Witnesses Testimonies */}
          {witnesses && witnesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-users text-primary-orange mr-3"></i>
                  Témoignages des témoins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {witnesses.map((witness) => (
                    <div key={witness.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">
                          {witness.firstName} {witness.lastName} - {witness.position}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWitnessId(witness.id)}
                          className={selectedWitnessId === witness.id ? "bg-primary-orange text-white" : ""}
                        >
                          Sélectionner
                        </Button>
                      </div>
                      <Textarea
                        rows={3}
                        placeholder={`Témoignage de ${witness.firstName}...`}
                        defaultValue={witness.testimony || ""}
                        onMouseUp={handleTextSelection}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fragment Classification */}
          {fragments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Classification des fragments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fragments.map((fragment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-dark-gray mb-2">{fragment.content}</p>
                        <div className="flex space-x-2">
                          {["verified_fact", "opinion", "to_verify", "other"].map((type) => (
                            <Button
                              key={type}
                              variant="outline"
                              size="sm"
                              onClick={() => updateFragmentType(index, type as any)}
                              className={fragment.type === type ? "bg-primary-orange text-white" : ""}
                            >
                              {getTypeLabel(type)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFragment(index)}
                      >
                        <i className="fas fa-times text-red-500"></i>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-chart-pie text-primary-orange mr-3"></i>
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {getFragmentsByType("verified_fact").length}
                    </div>
                    <div className="text-xs text-green-700">Faits avérés</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {getFragmentsByType("opinion").length}
                    </div>
                    <div className="text-xs text-blue-700">Opinions</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {getFragmentsByType("to_verify").length}
                    </div>
                    <div className="text-xs text-yellow-700">À vérifier</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {getFragmentsByType("other").length}
                    </div>
                    <div className="text-xs text-gray-700">Autres</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fragment Lists by Type */}
          {["verified_fact", "opinion", "to_verify", "other"].map((type) => {
            const typeFragments = getFragmentsByType(type);
            if (typeFragments.length === 0) return null;

            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Badge className={`mr-2 ${getTypeBadgeColor(type)}`}>
                      {getTypeLabel(type)}
                    </Badge>
                    ({typeFragments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typeFragments.map((fragment, index) => (
                      <div key={index} className="text-xs p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                        {fragment.content}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/accident/${accidentId}/edit`)}
        >
          <i className="fas fa-arrow-left mr-2"></i>Retour: Déclaration
        </Button>
        
        <div className="flex space-x-4">
          <Button 
            variant="outline"
            onClick={() => saveFragmentsMutation.mutate(fragments)}
            disabled={saveFragmentsMutation.isPending}
          >
            {saveFragmentsMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
            <i className="fas fa-save mr-2"></i>Enregistrer brouillon
          </Button>
          <Button 
            className="bg-primary-orange hover:bg-orange-600"
            onClick={() => saveFragmentsMutation.mutate(fragments)}
            disabled={saveFragmentsMutation.isPending || fragments.length === 0}
          >
            {saveFragmentsMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
            Suivant: Résumé de l'accident <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
