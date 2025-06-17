// Client-side OpenAI utilities
// Note: Actual API calls should be made from the server for security

export interface TestimonyAnalysisResult {
  fragments: Array<{
    content: string;
    type: "verified_fact" | "opinion" | "to_verify" | "other";
    confidence: number;
    reasoning: string;
  }>;
  summary: string;
  recommendations: string[];
}

export interface CauseTreeGenerationResult {
  nodes: Array<{
    id: string;
    content: string;
    type: "necessary" | "unusual" | "normal";
    x: number;
    y: number;
    connections: Array<{
      to: string;
      type: "sequence" | "conjunction" | "disjunction";
    }>;
  }>;
  preventiveMeasures: Array<{
    factId: string;
    factContent: string;
    canEliminate: boolean;
    canReduce: boolean;
    measure: string;
    priority: "high" | "medium" | "low";
  }>;
}

// These are client-side utility functions for handling OpenAI responses
export function parseTestimonyAnalysis(response: string): TestimonyAnalysisResult {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse testimony analysis:", error);
    return {
      fragments: [],
      summary: "Erreur lors de l'analyse du témoignage",
      recommendations: [],
    };
  }
}

export function parseCauseTreeGeneration(response: string): CauseTreeGenerationResult {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse cause tree generation:", error);
    return {
      nodes: [],
      preventiveMeasures: [],
    };
  }
}

// Utility functions for formatting prompts (used on server)
export function createTestimonyAnalysisPrompt(testimony: string, accidentContext?: string): string {
  return `
Analysez le témoignage suivant concernant un accident du travail selon la méthode INRS. 
Classifiez chaque élément en tant que : fait avéré, opinion, élément à vérifier, ou autre.

${accidentContext ? `Contexte de l'accident: ${accidentContext}` : ''}

Témoignage à analyser:
"${testimony}"

Répondez au format JSON avec la structure suivante:
{
  "fragments": [
    {
      "content": "texte du fragment",
      "type": "verified_fact|opinion|to_verify|other",
      "confidence": 0.8,
      "reasoning": "explication du classement"
    }
  ],
  "summary": "résumé de l'analyse",
  "recommendations": ["recommandation 1", "recommandation 2"]
}
`;
}

export function createCauseTreePrompt(facts: string[], accidentDescription: string): string {
  return `
Créez un arbre des causes selon la méthode INRS pour l'accident suivant.

Description de l'accident: ${accidentDescription}

Faits avérés identifiés:
${facts.map((fact, index) => `${index + 1}. ${fact}`).join('\n')}

Générez un arbre des causes en identifiant:
- Les faits nécessaires (sans lesquels l'accident n'aurait pas eu lieu)
- Les faits inhabituels (qui sortent de l'ordinaire)
- Les faits habituels (conditions normales de travail)

Proposez également des mesures de prévention pour chaque fait nécessaire.

Répondez au format JSON avec la structure suivante:
{
  "nodes": [
    {
      "id": "node-1",
      "content": "description du fait",
      "type": "necessary|unusual|normal",
      "x": 100,
      "y": 100,
      "connections": [
        {
          "to": "node-2",
          "type": "sequence|conjunction|disjunction"
        }
      ]
    }
  ],
  "preventiveMeasures": [
    {
      "factId": "node-1",
      "factContent": "description du fait",
      "canEliminate": true,
      "canReduce": false,
      "measure": "mesure de prévention proposée",
      "priority": "high|medium|low"
    }
  ]
}
`;
}
