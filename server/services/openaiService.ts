import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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

class OpenAIService {
  async analyzeTestimony(testimony: string, accidentContext?: string): Promise<TestimonyAnalysisResult> {
    try {
      const prompt = this.createTestimonyAnalysisPrompt(testimony, accidentContext);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Vous êtes un expert en analyse d'accidents du travail selon la méthode INRS. Analysez les témoignages avec précision et objectivité."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return this.validateTestimonyAnalysis(result);
    } catch (error) {
      console.error("OpenAI testimony analysis error:", error);
      throw new Error("Failed to analyze testimony with AI");
    }
  }

  async generateCauseTree(facts: string[], accidentDescription: string): Promise<CauseTreeGenerationResult> {
    try {
      const prompt = this.createCauseTreePrompt(facts, accidentDescription);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Vous êtes un expert en méthode d'analyse d'accidents INRS. Créez des arbres des causes structurés et des mesures de prévention pertinentes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return this.validateCauseTreeGeneration(result);
    } catch (error) {
      console.error("OpenAI cause tree generation error:", error);
      throw new Error("Failed to generate cause tree with AI");
    }
  }

  private createTestimonyAnalysisPrompt(testimony: string, accidentContext?: string): string {
    return `
Analysez le témoignage suivant concernant un accident du travail selon la méthode INRS. 
Classifiez chaque élément significatif en tant que : fait avéré, opinion, élément à vérifier, ou autre.

${accidentContext ? `Contexte de l'accident: ${accidentContext}` : ''}

Témoignage à analyser:
"${testimony}"

Instructions:
- Identifiez tous les éléments factuels distincts
- Distinguez clairement les faits observés des opinions et interprétations
- Identifiez les éléments qui nécessitent une vérification supplémentaire
- Évaluez la confiance de classification (0-1)

Répondez au format JSON avec la structure suivante:
{
  "fragments": [
    {
      "content": "texte exact du fragment identifié",
      "type": "verified_fact|opinion|to_verify|other",
      "confidence": 0.8,
      "reasoning": "explication du classement choisi"
    }
  ],
  "summary": "résumé objectif de l'analyse du témoignage",
  "recommendations": ["recommandation 1 pour l'enquête", "recommandation 2"]
}
`;
  }

  private createCauseTreePrompt(facts: string[], accidentDescription: string): string {
    return `
Créez un arbre des causes selon la méthode INRS pour l'accident suivant.

Description de l'accident: ${accidentDescription}

Faits avérés identifiés:
${facts.map((fact, index) => `${index + 1}. ${fact}`).join('\n')}

Instructions INRS:
- Identifiez les faits NÉCESSAIRES (sans lesquels l'accident n'aurait pas eu lieu)
- Identifiez les faits INHABITUELS (variations par rapport à la normale)
- Identifiez les faits HABITUELS (conditions normales de travail)
- Établissez les liaisons logiques: enchaînement (→), conjonction (+), disjonction (×)
- Proposez des mesures de prévention pour chaque fait nécessaire

Répondez au format JSON avec la structure suivante:
{
  "nodes": [
    {
      "id": "node-1",
      "content": "description précise du fait",
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
      "factContent": "description du fait nécessaire",
      "canEliminate": true,
      "canReduce": false,
      "measure": "mesure de prévention spécifique et réalisable",
      "priority": "high|medium|low"
    }
  ]
}
`;
  }

  private validateTestimonyAnalysis(result: any): TestimonyAnalysisResult {
    if (!result.fragments || !Array.isArray(result.fragments)) {
      throw new Error("Invalid testimony analysis result format");
    }

    return {
      fragments: result.fragments.map((f: any) => ({
        content: f.content || "",
        type: f.type || "other",
        confidence: Math.max(0, Math.min(1, f.confidence || 0.5)),
        reasoning: f.reasoning || "",
      })),
      summary: result.summary || "Analyse non disponible",
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
    };
  }

  private validateCauseTreeGeneration(result: any): CauseTreeGenerationResult {
    if (!result.nodes || !Array.isArray(result.nodes)) {
      throw new Error("Invalid cause tree generation result format");
    }

    return {
      nodes: result.nodes.map((node: any, index: number) => ({
        id: node.id || `node-${index + 1}`,
        content: node.content || "Fait non spécifié",
        type: node.type || "normal",
        x: Math.max(0, node.x || 100 + index * 150),
        y: Math.max(0, node.y || 100 + (index % 3) * 100),
        connections: Array.isArray(node.connections) ? node.connections : [],
      })),
      preventiveMeasures: Array.isArray(result.preventiveMeasures) 
        ? result.preventiveMeasures.map((measure: any) => ({
            factId: measure.factId || "",
            factContent: measure.factContent || "",
            canEliminate: Boolean(measure.canEliminate),
            canReduce: Boolean(measure.canReduce),
            measure: measure.measure || "",
            priority: measure.priority || "medium",
          }))
        : [],
    };
  }
}

export const openaiService = new OpenAIService();
