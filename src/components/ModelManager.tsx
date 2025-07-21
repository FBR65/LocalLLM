import React from "react";
import { Brain, Download, Settings, HardDrive, Cpu } from "lucide-react";

interface ModelManagerProps {
  currentModel: string | null;
  onModelChange: (modelName: string) => void;
}

export const ModelManager: React.FC<ModelManagerProps> = ({
  currentModel,
  onModelChange
}) => {
  const availableModels = [
    {
      id: "llama-3.2-3b-instruct",
      name: "Llama 3.2 3B Instruct",
      description: "Meta's Llama 3.2 3B Instruct - Leistungsstarkes Sprachmodell für deutsche und internationale Texte",
      size: "6.2 GB",
      huggingface_id: "onnx-community/Llama-3.2-3B-Instruct",
      model_type: "instruction",
      recommended_ram_gb: 8,
      performance_tier: "Sehr Hoch",
      use_cases: ["Chat", "Textgenerierung", "Instruction Following"],
      isDownloaded: false
    },
    {
      id: "phi-4-mini-instruct",
      name: "Phi-4 Mini Instruct",
      description: "Microsoft's Phi-4 Mini - Kompaktes aber sehr leistungsfähiges Instruction-Modell",
      size: "2.8 GB",
      huggingface_id: "onnx-community/Phi-4-mini-instruct-ONNX-GQA",
      model_type: "instruction",
      recommended_ram_gb: 4,
      performance_tier: "Hoch",
      use_cases: ["Chat", "Code-Generierung", "Reasoning"],
      isDownloaded: false
    },
    {
      id: "gemma-3-1b-it",
      name: "Gemma 3 1B Instruct",
      description: "Google's Gemma 3 1B - Effizienter Instruction-Tuned Modell für schnelle Inferenz",
      size: "2.1 GB",
      huggingface_id: "onnx-community/gemma-3-1b-it-ONNX-GQA",
      model_type: "instruction",
      recommended_ram_gb: 3,
      performance_tier: "Mittel-Hoch",
      use_cases: ["Chat", "Textverarbeitung", "Schnelle Antworten"],
      isDownloaded: false
    },
    {
      id: "bge-m3-embedder",
      name: "BGE-M3 Embedder & Reranker",
      description: "Multilingualer Embedder für Vektorisierung und Semantic Search - unterstützt 100+ Sprachen",
      size: "1.1 GB",
      huggingface_id: "philipp-zettl/BAAI-bge-m3-ONNX",
      model_type: "embedder",
      recommended_ram_gb: 2,
      performance_tier: "Spezialisiert",
      use_cases: ["Embeddings", "Vektorsuche", "Semantic Reranking"],
      isDownloaded: false
    }
  ];

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
  };

  const getPerformanceBadgeColor = (tier: string) => {
    switch (tier) {
      case "Sehr Hoch": return "bg-red-100 text-red-800 border border-red-200";
      case "Hoch": return "bg-orange-100 text-orange-800 border border-orange-200";
      case "Mittel-Hoch": return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Spezialisiert": return "bg-blue-100 text-blue-800 border border-blue-200";
      default: return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <div className="h-full bg-white">
      <div className="h-full flex flex-col">
        {/* Header - fixed */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-3 text-blue-600" />
            ONNX-Modelle verwalten
          </h2>
          <p className="text-gray-600 mt-1">Verwalten Sie Ihre lokalen Sprachmodelle</p>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4 max-w-4xl">
            {availableModels.map((model) => (
              <div
                key={model.id}
                className={`bg-white border-2 rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  currentModel === model.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleModelSelect(model.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceBadgeColor(model.performance_tier)}`}>
                        {model.performance_tier}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {model.model_type}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 leading-relaxed">{model.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        <span>{model.size}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Cpu className="w-4 h-4" />
                        <span>{model.recommended_ram_gb} GB RAM empfohlen</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {model.use_cases.map((useCase, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-gray-500 font-mono">{model.huggingface_id}</p>
                  </div>

                  <div className="ml-6 flex flex-col items-end gap-3">
                    {model.isDownloaded ? (
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-200">
                          Installiert
                        </span>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelSelect(model.id);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                          Laden
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full border border-gray-200">
                          Nicht installiert
                        </span>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Download implementieren
                            console.log('Download model:', model.id);
                          }}
                        >
                          <Download className="w-4 h-4" />
                          Herunterladen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
