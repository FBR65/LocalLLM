import React, { useState } from "react";
import { Brain, Download, Settings, CheckCircle } from "lucide-react";

interface ModelManagerProps {
  currentModel: string | null;
  onModelChange: (modelName: string | null) => void;
}

export const ModelManager: React.FC<ModelManagerProps> = ({
  currentModel,
  onModelChange
}) => {
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);

  const availableModels = [
    {
      id: "llama-3.2-3b-instruct",
      name: "Llama 3.2 3B Instruct",
      description: "Meta's Llama 3.2 3B Instruct - Leistungsstarkes Sprachmodell für deutsche und internationale Texte",
      size: "6.2 GB",
      isDownloaded: true,
      performance: "Sehr Hoch",
      useCase: "Chat, Textgenerierung, Instruction Following",
      huggingFaceId: "onnx-community/Llama-3.2-3B-Instruct"
    },
    {
      id: "phi-4-mini-instruct",
      name: "Phi-4 Mini Instruct",
      description: "Microsoft's Phi-4 Mini - Kompaktes aber sehr leistungsfähiges Instruction-Modell",
      size: "2.8 GB",
      isDownloaded: false,
      performance: "Hoch",
      useCase: "Chat, Code-Generierung, Reasoning",
      huggingFaceId: "onnx-community/Phi-4-mini-instruct-ONNX-GQA"
    },
    {
      id: "gemma-3-1b-it",
      name: "Gemma 3 1B Instruct",
      description: "Google's Gemma 3 1B - Effizienter Instruction-Tuned Modell für schnelle Inferenz",
      size: "2.1 GB",
      isDownloaded: true,
      performance: "Mittel-Hoch",
      useCase: "Chat, Textverarbeitung, Schnelle Antworten",
      huggingFaceId: "onnx-community/gemma-3-1b-it-ONNX-GQA"
    },
    {
      id: "bge-m3-embedder",
      name: "BGE-M3 Embedder & Reranker",
      description: "Multilingualer Embedder für Vektorisierung und Semantic Search - unterstützt 100+ Sprachen",
      size: "1.1 GB",
      isDownloaded: false,
      performance: "Spezialisiert",
      useCase: "Embeddings, Vektorsuche, Semantic Reranking",
      huggingFaceId: "philipp-zettl/BAAI-bge-m3-ONNX"
    }
  ];

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
  };

  const handleDownload = async (modelId: string) => {
    setDownloadingModel(modelId);
    
    try {
      const model = availableModels.find(m => m.id === modelId);
      if (!model) return;
      
      // Hier würde der echte Download von HuggingFace implementiert
      console.log(`Downloading model from: ${model.huggingFaceId}`);
      
      // Simuliere Download-Prozess mit realistischer Zeit basierend auf Modellgröße
      const sizeInGB = parseFloat(model.size.replace(' GB', ''));
      const downloadTimeMs = sizeInGB * 2000; // 2 Sekunden pro GB (für Demo)
      
      await new Promise(resolve => setTimeout(resolve, downloadTimeMs));
      
      // Model als heruntergeladen markieren (würde in echter App persistiert)
      model.isDownloaded = true;
      
      alert(`Modell ${model.name} erfolgreich heruntergeladen!`);
      
    } catch (error) {
      console.error('Download-Fehler:', error);
      alert(`Fehler beim Download: ${error}`);
    } finally {
      setDownloadingModel(null);
    }
  };

  return (
    <div className="h-full p-8 bg-white text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="border-b border-gray-200 pb-6 mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-green-600" />
            KI-Modellverwaltung
          </h1>
          <p className="text-gray-600 mt-2">Verwalten Sie deutsche ONNX-Modelle für Textanalyse und KI-Funktionen</p>
        </div>

        {currentModel && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">
                Aktives Modell: {availableModels.find(m => m.id === currentModel)?.name || currentModel}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {availableModels.map((model) => (
            <div
              key={model.id}
              className={`bg-white rounded-lg border-2 transition-all shadow-sm ${
                currentModel === model.id
                  ? "border-green-500 shadow-green-100"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{model.name}</h3>
                      {currentModel === model.id && (
                        <span className="ml-3 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Aktiv
                        </span>
                      )}
                      {model.isDownloaded && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{model.description}</p>
                    
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Größe:</span>
                        <span className="text-gray-600">{model.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Performance:</span>
                        <span className="text-gray-600">{model.performance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">HuggingFace:</span>
                        <span className="text-gray-600 text-xs font-mono">{model.huggingFaceId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Einsatzbereich:</span>
                        <div className="text-gray-600 mt-1">{model.useCase}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {model.isDownloaded ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleModelSelect(model.id)}
                        className={`px-6 py-2 rounded-md font-medium transition-colors ${
                          currentModel === model.id
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {currentModel === model.id ? "Aktiv" : "Auswählen"}
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Konfigurieren
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDownload(model.id)}
                      disabled={downloadingModel === model.id}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
                    >
                      {downloadingModel === model.id ? (
                        <>
                          <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Lade herunter...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Herunterladen
                        </>
                      )}
                    </button>
                  )}
                  <div className="text-sm text-gray-500">
                    {model.isDownloaded ? "Verfügbar" : "Nicht heruntergeladen"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Modell-Status</h3>
          {currentModel ? (
            <div className="text-gray-700">
              <p>Aktuelles Modell: <span className="text-green-700 font-semibold">{currentModel}</span></p>
              <p className="text-sm text-gray-600 mt-2">
                Das Modell ist bereit für deutsche Textverarbeitung und Chat-Anfragen.
              </p>
            </div>
          ) : (
            <div className="text-gray-600">
              <p>Kein Modell aktiviert. Wählen Sie ein Modell aus der Liste oben aus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};