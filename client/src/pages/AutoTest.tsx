// client/src/pages/AutoTest.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface TestStep {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "error";
  details?: string;
  error?: string;
}

export default function AutoTest() {
  const [steps, setSteps] = useState<TestStep[]>([
    { id: "create-accident", name: "Création d'un accident de travail", status: "pending" },
    { id: "add-temoin", name: "Ajout d'un témoin", status: "pending" },
    { id: "analyse-temoignage", name: "Analyse du témoignage", status: "pending" },
    { id: "construction-arbre", name: "Construction de l'arbre des causes", status: "pending" },
    { id: "validation-arbre", name: "Validation de l'arbre par les rôles", status: "pending" },
    { id: "export-pdf", name: "Export du rapport PDF", status: "pending" },
    { id: "nettoyage", name: "Nettoyage des données test", status: "pending" }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const updateStepStatus = (id: string, status: TestStep["status"], details?: string, error?: string) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status, details, error } : step));
  };

  const runTest = async () => {
    setIsRunning(true);
    setCurrentStep(0);

    // Étape 1 : Création accident
    updateStepStatus("create-accident", "running");
    let accidentId = "";
    try {
      const { data, error } = await supabase.from("accidents").insert([
        {
          numero: "ACC-TEST-001",
          date: "2025-06-17",
          heure: "14:00:00",
          lieu: "Zone test automatique",
          etablissement: "Démo InnovaCSE",
          gravite: "mineur",
          faits_ultimes: JSON.stringify(["glissade", "sol mouillé"]),
          victime: JSON.stringify({ nom: "Jean", fonction: "Cariste" })
        }
      ]).select();
      if (error) throw error;
      accidentId = data[0].id;
      updateStepStatus("create-accident", "success", `Accident ID : ${accidentId}`);
    } catch (err: any) {
      updateStepStatus("create-accident", "error", undefined, err.message);
    }

    // Étape 2 : Ajout témoin
    updateStepStatus("add-temoin", "running");
    try {
      const { error } = await supabase.from("temoins").insert([
        { accident_id: accidentId, nom: "Julie", fonction: "SST" }
      ]);
      if (error) throw error;
      updateStepStatus("add-temoin", "success");
    } catch (err: any) {
      updateStepStatus("add-temoin", "error", undefined, err.message);
    }

    // Étape 3 : Analyse témoignage
    updateStepStatus("analyse-temoignage", "running");
    try {
      const { error } = await supabase.from("temoignages").insert([
        {
          accident_id: accidentId,
          transcription_brute: "Julie a vu Jean glisser sur une flaque.",
          texte_corrige: "Julie a vu Jean glisser.",
          statut: "validé",
          nom_analyste: "IA"
        }
      ]);
      if (error) throw error;
      updateStepStatus("analyse-temoignage", "success");
    } catch (err: any) {
      updateStepStatus("analyse-temoignage", "error", undefined, err.message);
    }

    // Étape 4 : Construction arbre
    updateStepStatus("construction-arbre", "running");
    try {
      const { error } = await supabase.from("faits").insert([
        { accident_id: accidentId, texte: "Sol mouillé", type: "nécessaire" },
        { accident_id: accidentId, texte: "Jean a glissé", type: "nécessaire" }
      ]);
      if (error) throw error;
      updateStepStatus("construction-arbre", "success");
    } catch (err: any) {
      updateStepStatus("construction-arbre", "error", undefined, err.message);
    }

    // Étape 5 : Validation arbre
    updateStepStatus("validation-arbre", "running");
    try {
      const { error } = await supabase.from("validations").insert([
        {
          accident_id: accidentId,
          role: "CSE",
          nom: "Alice",
          commentaire: "Analyse conforme",
          date_validation: new Date().toISOString()
        }
      ]);
      if (error) throw error;
      updateStepStatus("validation-arbre", "success");
    } catch (err: any) {
      updateStepStatus("validation-arbre", "error", undefined, err.message);
    }

    // Étape 6 : Export PDF (simulé)
    updateStepStatus("export-pdf", "running");
    try {
      await new Promise(r => setTimeout(r, 1000)); // Simulation
      updateStepStatus("export-pdf", "success", "Simulation OK (PDF non généré dans test)");
    } catch (err: any) {
      updateStepStatus("export-pdf", "error", undefined, err.message);
    }

    // Étape 7 : Nettoyage
    updateStepStatus("nettoyage", "running");
    try {
      await supabase.from("validations").delete().eq("accident_id", accidentId);
      await supabase.from("faits").delete().eq("accident_id", accidentId);
      await supabase.from("temoignages").delete().eq("accident_id", accidentId);
      await supabase.from("temoins").delete().eq("accident_id", accidentId);
      await supabase.from("accidents").delete().eq("id", accidentId);
      updateStepStatus("nettoyage", "success", "Nettoyage effectué avec succès");
    } catch (err: any) {
      updateStepStatus("nettoyage", "error", undefined, err.message);
    }

    setIsRunning(false);
  };

  const getStepIcon = (status: TestStep["status"]) => {
    switch (status) {
      case "success": return <CheckCircle className="text-green-500" />;
      case "error": return <XCircle className="text-red-500" />;
      case "running": return <Clock className="text-blue-500 animate-spin" />;
      default: return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  const getBadge = (status: TestStep["status"]) => {
    const label = {
      pending: "En attente",
      running: "En cours",
      success: "Réussi",
      error: "Échec"
    }[status];

    const variant = status === "error" ? "destructive" : "default";
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test automatique Arbre des Causes</h1>
      <Button onClick={runTest} disabled={isRunning} className="mb-6">
        {isRunning ? "Test en cours..." : "Lancer le Test Complet"}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Étapes du test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {getStepIcon(step.status)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{index + 1}. {step.name}</span>
                  {getBadge(step.status)}
                </div>
                {step.details && <p className="text-sm text-gray-600">{step.details}</p>}
                {step.error && <p className="text-sm text-red-600">{step.error}</p>}
              </div>
            </div>
          ))}

          {isRunning && <Progress value={(currentStep / steps.length) * 100} className="mt-4" />}
        </CardContent>
      </Card>
    </div>
  );
}
