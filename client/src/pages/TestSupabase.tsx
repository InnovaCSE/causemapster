// client/src/pages/TestSupabase.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Accident {
  id: string;
  date: string;
  lieu: string;
  description: string;
}

export default function TestSupabase() {
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAccidents = async () => {
    const { data, error } = await supabase.from("accidents").select("*").order("date", { ascending: false });

    if (error) {
      setError(error.message);
      console.error("Erreur Supabase :", error);
    } else {
      setAccidents(data || []);
      setError(null);
    }
  };

  const insertTestAccident = async () => {
    setLoading(true);
    const { error } = await supabase.from("accidents").insert([
      {
        numero: `ACC-${new Date().getFullYear()}-TEST-${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString().split("T")[0],
        heure: "14:00:00",
        lieu: "Zone de test",
        etablissement: "Replit Debug",
        gravite: "mineur",
        faits_ultimes: [],
        victime: { nom: "Testeur", fonction: "simulateur" },
      },
    ]);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      fetchAccidents();
    }
  };

  useEffect(() => {
    fetchAccidents();
  }, []);

  return (
    <div className="p-4 font-sans">
      <h1 className="text-xl font-bold mb-2">🔌 Test Supabase</h1>

      <button
        onClick={insertTestAccident}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Ajout en cours..." : "📥 Ajouter un accident test"}
      </button>

      {error && <p className="text-red-500 mt-4">❌ Erreur : {error}</p>}

      <div className="mt-4">
        <h2 className="font-semibold">📋 Derniers accidents</h2>
        <ul className="list-disc ml-6 mt-2">
          {accidents.map((accident) => (
            <li key={accident.id}>
              {accident.date} – {accident.lieu} : {accident.description || "Pas de description"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
