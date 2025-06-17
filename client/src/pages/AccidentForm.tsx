import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { apiRequest } from "@/lib/queryClient";
import { insertAccidentSchema, type Accident, type Witness } from "@shared/schema";

const formSchema = insertAccidentSchema.extend({
  witnesses: z.array(z.object({
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().min(1, "Nom requis"),
    position: z.string().min(1, "Fonction requise"),
  })).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AccidentForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [witnesses, setWitnesses] = useState<Array<{firstName: string, lastName: string, position: string}>>([]);
  const [files, setFiles] = useState<File[]>([]);
  const { isRecording, transcript, startRecording, stopRecording, resetTranscript } = useVoiceRecording();

  const isEdit = !!params.id;
  const accidentId = params.id ? parseInt(params.id) : null;

  const { data: accident, isLoading } = useQuery<Accident>({
    queryKey: [`/api/accidents/${accidentId}`],
    enabled: isEdit && !!accidentId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      location: "",
      establishment: "",
      description: "",
      severity: "minor",
      victimName: "",
      victimFirstName: "",
      victimPosition: "",
      isAnonymized: false,
    },
  });

  useEffect(() => {
    if (accident) {
      form.reset({
        userId: accident.userId,
        date: new Date(accident.date),
        time: accident.time,
        location: accident.location,
        establishment: accident.establishment,
        description: accident.description || "",
        severity: accident.severity as "minor" | "moderate" | "severe",
        victimName: accident.victimName || "",
        victimFirstName: accident.victimFirstName || "",
        victimPosition: accident.victimPosition || "",
        isAnonymized: accident.isAnonymized || false,
      });
    }
  }, [accident, form]);

  useEffect(() => {
    if (transcript) {
      const currentDescription = form.getValues("description") || "";
      form.setValue("description", currentDescription + " " + transcript);
    }
  }, [transcript, form]);

  const saveAccidentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isEdit ? `/api/accidents/${accidentId}` : "/api/accidents";
      const method = isEdit ? "PATCH" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accidents"] });
      toast({
        title: "Accident enregistré",
        description: isEdit ? "L'accident a été mis à jour." : "L'accident a été créé avec succès.",
      });
      setLocation(`/accident/${data.id}/witness-analysis`);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'accident.",
        variant: "destructive",
      });
    },
  });

  const addWitness = () => {
    setWitnesses([...witnesses, { firstName: "", lastName: "", position: "" }]);
  };

  const updateWitness = (index: number, field: string, value: string) => {
    const updated = [...witnesses];
    updated[index] = { ...updated[index], [field]: value };
    setWitnesses(updated);
  };

  const removeWitness = (index: number) => {
    setWitnesses(witnesses.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const onSubmit = (data: FormData) => {
    const formData = {
      ...data,
      witnesses: witnesses.filter(w => w.firstName && w.lastName && w.position),
    };
    saveAccidentMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
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
                <i className="fas fa-clipboard-list text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Étape 1 - Déclaration d'accident</h1>
                <p className="text-white text-opacity-80">Complétez les informations générales sur l'accident</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">1/4</span>
              <div className="w-16 bg-white bg-opacity-20 rounded-full h-2">
                <div className="w-1/4 bg-white rounded-full h-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* General Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-info-circle text-primary-orange mr-3"></i>
                  Informations Générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Numéro d'accident</Label>
                  <Input 
                    value={accident?.accidentNumber || "Sera généré automatiquement"} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      {...form.register("date", { valueAsDate: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Heure</Label>
                    <Input
                      id="time"
                      type="time"
                      {...form.register("time")}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Lieu de l'accident</Label>
                  <Input
                    id="location"
                    placeholder="Ex: Atelier de production, Zone 3"
                    {...form.register("location")}
                  />
                </div>
                <div>
                  <Label htmlFor="establishment">Établissement</Label>
                  <Input
                    id="establishment"
                    placeholder="Nom de l'établissement"
                    {...form.register("establishment")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Victim Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-user text-primary-orange mr-3"></i>
                    Données Victime
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAnonymized"
                      checked={form.watch("isAnonymized")}
                      onCheckedChange={(checked) => form.setValue("isAnonymized", !!checked)}
                    />
                    <Label htmlFor="isAnonymized" className="text-sm">Anonymiser</Label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="victimFirstName">Prénom</Label>
                    <Input
                      id="victimFirstName"
                      disabled={form.watch("isAnonymized")}
                      {...form.register("victimFirstName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="victimName">Nom</Label>
                    <Input
                      id="victimName"
                      disabled={form.watch("isAnonymized")}
                      {...form.register("victimName")}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="victimPosition">Fonction</Label>
                  <Input
                    id="victimPosition"
                    placeholder="Ex: Opérateur machine"
                    {...form.register("victimPosition")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Accident Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-file-alt text-primary-orange mr-3"></i>
                  Description de l'Accident
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Faits ultimes</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Décrivez les faits ultimes de l'accident..."
                    {...form.register("description")}
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
                  <span className="text-sm text-medium-gray">ou dictez à voix haute</span>
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

            {/* Severity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-exclamation-triangle text-primary-orange mr-3"></i>
                  Gravité Perçue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={form.watch("severity")}
                  onValueChange={(value) => form.setValue("severity", value as "minor" | "moderate" | "severe")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minor" id="minor" />
                    <Label htmlFor="minor" className="flex items-center">
                      <i className="fas fa-circle text-green-500 mr-2"></i>Mineur
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate" className="flex items-center">
                      <i className="fas fa-circle text-yellow-500 mr-2"></i>Modéré
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="severe" id="severe" />
                    <Label htmlFor="severe" className="flex items-center">
                      <i className="fas fa-circle text-red-500 mr-2"></i>Grave
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-paperclip text-primary-orange mr-3"></i>
                  Pièces Jointes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="file-upload-area border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <i className="fas fa-cloud-upload-alt text-4xl text-medium-gray mb-3"></i>
                  <p className="text-medium-gray mb-2">Glissez vos fichiers ici ou</p>
                  <Button type="button" variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
                    parcourez vos fichiers
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <p className="text-xs text-medium-gray mt-2">PDF, Images, Documents (max 10MB)</p>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-light-gray rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Witnesses Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-users text-primary-orange mr-3"></i>
                Témoins
              </div>
              <Button type="button" variant="outline" onClick={addWitness}>
                <i className="fas fa-plus mr-2"></i>Ajouter un témoin
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {witnesses.length === 0 ? (
              <p className="text-medium-gray text-center py-4">
                Aucun témoin ajouté. Cliquez sur "Ajouter un témoin" pour commencer.
              </p>
            ) : (
              <div className="space-y-4">
                {witnesses.map((witness, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label>Prénom</Label>
                      <Input
                        value={witness.firstName}
                        onChange={(e) => updateWitness(index, 'firstName', e.target.value)}
                        placeholder="Prénom"
                      />
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input
                        value={witness.lastName}
                        onChange={(e) => updateWitness(index, 'lastName', e.target.value)}
                        placeholder="Nom"
                      />
                    </div>
                    <div>
                      <Label>Fonction</Label>
                      <Input
                        value={witness.position}
                        onChange={(e) => updateWitness(index, 'position', e.target.value)}
                        placeholder="Fonction"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeWitness(index)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => setLocation("/dashboard")}>
            <i className="fas fa-arrow-left mr-2"></i>Retour au tableau de bord
          </Button>
          
          <div className="flex space-x-4">
            <Button 
              type="submit" 
              variant="outline"
              disabled={saveAccidentMutation.isPending}
            >
              {saveAccidentMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
              <i className="fas fa-save mr-2"></i>Enregistrer
            </Button>
            <Button 
              type="submit"
              className="bg-primary-orange hover:bg-orange-600"
              disabled={saveAccidentMutation.isPending}
            >
              {saveAccidentMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
              Suivant: Analyser les témoignages <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
