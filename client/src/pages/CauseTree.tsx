import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Accident, Fragment, CauseTree as CauseTreeType } from "@shared/schema";

interface CauseTreeNode {
  id: string;
  content: string;
  type: "necessary" | "unusual" | "normal";
  x: number;
  y: number;
  connections: Array<{
    to: string;
    type: "sequence" | "conjunction" | "disjunction";
  }>;
}

interface PreventiveMeasure {
  factId: string;
  factContent: string;
  canEliminate: boolean;
  canReduce: boolean;
  measure: string;
  priority: "high" | "medium" | "low";
}

export default function CauseTree() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const accidentId = parseInt(params.id!);
  
  const [treeNodes, setTreeNodes] = useState<CauseTreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [preventiveMeasures, setPreventiveMeasures] = useState<PreventiveMeasure[]>([]);
  const [isGeneratingTree, setIsGeneratingTree] = useState(false);

  const { data: accident, isLoading: accidentLoading } = useQuery<Accident>({
    queryKey: [`/api/accidents/${accidentId}`],
  });

  const { data: fragments, isLoading: fragmentsLoading } = useQuery<Fragment[]>({
    queryKey: [`/api/accidents/${accidentId}/fragments`],
  });

  const { data: existingTree, isLoading: treeLoading } = useQuery<CauseTreeType>({
    queryKey: [`/api/accidents/${accidentId}/cause-tree`],
  });

  useEffect(() => {
    if (existingTree) {
      const treeData = existingTree.treeData as any;
      if (treeData.nodes) {
        setTreeNodes(treeData.nodes);
      }
      if (existingTree.preventiveMeasures) {
        setPreventiveMeasures(existingTree.preventiveMeasures as PreventiveMeasure[]);
      }
    }
  }, [existingTree]);

  const generateTreeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/ai/generate-cause-tree`, {
        accidentId,
        fragments: fragments?.filter(f => f.type === "verified_fact") || [],
      });
      return response.json();
    },
    onSuccess: (data) => {
      setTreeNodes(data.nodes);
      setPreventiveMeasures(data.preventiveMeasures || []);
      toast({
        title: "Arbre des causes généré",
        description: "L'arbre des causes a été généré automatiquement par l'IA.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer l'arbre des causes automatiquement.",
        variant: "destructive",
      });
    },
  });

  const saveCauseTreeMutation = useMutation({
    mutationFn: async (data: { nodes: CauseTreeNode[]; measures: PreventiveMeasure[] }) => {
      const response = await apiRequest("POST", `/api/accidents/${accidentId}/cause-tree`, {
        treeData: { nodes: data.nodes },
        preventiveMeasures: data.measures,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/accidents/${accidentId}/cause-tree`] });
      toast({
        title: "Arbre des causes sauvegardé",
        description: "L'arbre des causes a été enregistré avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder l'arbre des causes.",
        variant: "destructive",
      });
    },
  });

  const exportPDFMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/accidents/${accidentId}/export-pdf`, {
        includeTree: true,
        includeMeasures: true,
      });
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accident-${accident?.accidentNumber}-cause-tree.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export PDF réussi",
        description: "Le rapport PDF a été téléchargé.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le PDF.",
        variant: "destructive",
      });
    },
  });

  const addNode = () => {
    const newNode: CauseTreeNode = {
      id: `node-${Date.now()}`,
      content: "Nouveau fait",
      type: "normal",
      x: Math.random() * 500 + 100,
      y: Math.random() * 400 + 100,
      connections: [],
    };
    setTreeNodes([...treeNodes, newNode]);
  };

  const updateNode = (nodeId: string, updates: Partial<CauseTreeNode>) => {
    setTreeNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    setTreeNodes(nodes => nodes.filter(node => node.id !== nodeId));
    // Remove connections to deleted node
    setTreeNodes(nodes => 
      nodes.map(node => ({
        ...node,
        connections: node.connections.filter(conn => conn.to !== nodeId)
      }))
    );
  };

  const addConnection = (fromId: string, toId: string, type: "sequence" | "conjunction" | "disjunction") => {
    setTreeNodes(nodes =>
      nodes.map(node =>
        node.id === fromId
          ? { ...node, connections: [...node.connections, { to: toId, type }] }
          : node
      )
    );
  };

  const updatePreventiveMeasure = (index: number, updates: Partial<PreventiveMeasure>) => {
    setPreventiveMeasures(measures =>
      measures.map((measure, i) => 
        i === index ? { ...measure, ...updates } : measure
      )
    );
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "necessary":
        return "bg-red-500 text-white border-red-600";
      case "unusual":
        return "bg-primary-orange text-white border-orange-600";
      case "normal":
        return "bg-green-500 text-white border-green-600";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case "sequence":
        return "→";
      case "conjunction":
        return "+";
      case "disjunction":
        return "×";
      default:
        return "→";
    }
  };

  const handleGenerateTree = () => {
    if (!fragments || fragments.filter(f => f.type === "verified_fact").length === 0) {
      toast({
        title: "Faits insuffisants",
        description: "Vous devez avoir des faits avérés pour générer l'arbre des causes.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingTree(true);
    generateTreeMutation.mutate();
  };

  const handleSave = () => {
    saveCauseTreeMutation.mutate({ nodes: treeNodes, measures: preventiveMeasures });
  };

  if (accidentLoading || fragmentsLoading || treeLoading) {
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
                <i className="fas fa-sitemap text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Étape 4 - Arbre des causes</h1>
                <p className="text-white text-opacity-80">Construction de l'arbre des causes et mesures préventives</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">4/4</span>
              <div className="w-16 bg-white bg-opacity-20 rounded-full h-2">
                <div className="w-full bg-white rounded-full h-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Tree Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-sitemap text-primary-orange mr-3"></i>
                Arbre des causes
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleGenerateTree}
                  disabled={generateTreeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {generateTreeMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-robot mr-2"></i>Analyser automatiquement
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={addNode}>
                  <i className="fas fa-plus mr-2"></i>Ajouter un fait
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="mb-6 flex space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm">Faits nécessaires</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-primary-orange rounded-full"></div>
                <span className="text-sm">Faits inhabituels</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Faits habituels</span>
              </div>
            </div>

            {/* Tree Canvas */}
            <div className="relative bg-gray-50 border-2 border-gray-200 rounded-lg min-h-[500px] overflow-hidden">
              {treeNodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-sitemap text-6xl text-gray-300 mb-4"></i>
                    <p className="text-medium-gray mb-4">Aucun arbre des causes créé</p>
                    <Button 
                      onClick={handleGenerateTree}
                      className="bg-primary-orange hover:bg-orange-600"
                    >
                      <i className="fas fa-robot mr-2"></i>Générer automatiquement
                    </Button>
                  </div>
                </div>
              ) : (
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                  {/* Render connections */}
                  {treeNodes.map(node => 
                    node.connections.map((connection, connIndex) => {
                      const targetNode = treeNodes.find(n => n.id === connection.to);
                      if (!targetNode) return null;
                      
                      return (
                        <g key={`${node.id}-${connIndex}`}>
                          <line
                            x1={node.x + 60}
                            y1={node.y + 20}
                            x2={targetNode.x}
                            y2={targetNode.y + 20}
                            stroke="#6B7280"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                          />
                          <text
                            x={(node.x + targetNode.x) / 2 + 30}
                            y={(node.y + targetNode.y) / 2 + 15}
                            fill="#374151"
                            fontSize="12"
                            textAnchor="middle"
                          >
                            {getConnectionIcon(connection.type)}
                          </text>
                        </g>
                      );
                    })
                  )}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#6B7280"
                      />
                    </marker>
                  </defs>
                </svg>
              )}

              {/* Render nodes */}
              {treeNodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute cursor-pointer cause-tree-node ${getNodeColor(node.type)} p-3 rounded-lg border-2 max-w-xs shadow-sm`}
                  style={{ 
                    left: node.x, 
                    top: node.y,
                    zIndex: selectedNode === node.id ? 10 : 2,
                  }}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                >
                  <div className="text-sm font-medium">{node.content}</div>
                  {selectedNode === node.id && (
                    <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-3 min-w-[200px] z-20">
                      <div className="space-y-2">
                        <Input
                          value={node.content}
                          onChange={(e) => updateNode(node.id, { content: e.target.value })}
                          placeholder="Contenu du fait"
                          className="text-sm"
                        />
                        <Select
                          value={node.type}
                          onValueChange={(value) => updateNode(node.id, { type: value as any })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="necessary">Fait nécessaire</SelectItem>
                            <SelectItem value="unusual">Fait inhabituel</SelectItem>
                            <SelectItem value="normal">Fait habituel</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteNode(node.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preventive Measures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-shield-alt text-primary-orange mr-3"></i>
              Mesures de prévention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fait nécessaire</TableHead>
                    <TableHead>Peut-on supprimer ?</TableHead>
                    <TableHead>Peut-on rendre moins dangereux ?</TableHead>
                    <TableHead>Mesure de prévention</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preventiveMeasures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <i className="fas fa-shield-alt text-4xl text-gray-300 mb-4"></i>
                        <p className="text-medium-gray">Aucune mesure de prévention définie</p>
                        <p className="text-sm text-medium-gray">
                          Générez l'arbre des causes pour obtenir des suggestions de mesures
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    preventiveMeasures.map((measure, index) => (
                      <TableRow key={index}>
                        <TableCell className="max-w-xs">
                          <p className="text-sm">{measure.factContent}</p>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={measure.canEliminate ? "yes" : "no"}
                            onValueChange={(value) => 
                              updatePreventiveMeasure(index, { canEliminate: value === "yes" })
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Oui</SelectItem>
                              <SelectItem value="no">Non</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={measure.canReduce ? "yes" : "no"}
                            onValueChange={(value) => 
                              updatePreventiveMeasure(index, { canReduce: value === "yes" })
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Oui</SelectItem>
                              <SelectItem value="no">Non</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <Input
                            value={measure.measure}
                            onChange={(e) => 
                              updatePreventiveMeasure(index, { measure: e.target.value })
                            }
                            placeholder="Décrivez la mesure de prévention..."
                            className="text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={measure.priority}
                            onValueChange={(value) => 
                              updatePreventiveMeasure(index, { priority: value as any })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">Haute</SelectItem>
                              <SelectItem value="medium">Moyenne</SelectItem>
                              <SelectItem value="low">Faible</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="bg-blue-100 text-blue-700">
                            <i className="fas fa-robot mr-1"></i>IA
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/accident/${accidentId}/summary`)}
        >
          <i className="fas fa-arrow-left mr-2"></i>Retour: Résumé de l'accident
        </Button>
        
        <div className="flex space-x-4">
          <Button 
            variant="outline"
            onClick={handleSave}
            disabled={saveCauseTreeMutation.isPending}
          >
            {saveCauseTreeMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
            <i className="fas fa-save mr-2"></i>Enregistrer
          </Button>
          <Button 
            variant="outline"
            onClick={() => exportPDFMutation.mutate()}
            disabled={exportPDFMutation.isPending}
          >
            {exportPDFMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
            <i className="fas fa-file-pdf mr-2"></i>Exporter PDF
          </Button>
          <Button 
            variant="outline"
            className="bg-green-100 text-green-700"
          >
            <i className="fas fa-image mr-2"></i>Exporter Image
          </Button>
          <Button 
            className="bg-primary-orange hover:bg-orange-600"
            onClick={() => setLocation("/dashboard")}
          >
            <i className="fas fa-check mr-2"></i>Terminer l'analyse
          </Button>
        </div>
      </div>
    </div>
  );
}
