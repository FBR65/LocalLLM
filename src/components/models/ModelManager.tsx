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

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {availableModels.map((model) => (
            <div
              key={model.id}
              className={`kern-card transition-all ${
                currentModel === model.id
                  ? "border-2"
                  : "border hover:shadow-lg"
              }`}
              style={{
                borderColor: currentModel === model.id ? 'var(--kern-success)' : 'var(--kern-border-color)',
                minHeight: '320px'
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-3" 
                          style={{ 
                            color: 'var(--kern-neutral-900)', 
                            fontSize: 'var(--kern-font-size-xl)',
                            lineHeight: '1.4',
                            marginBottom: 'var(--kern-space-4)'
                          }}>
                        {model.name}
                      </h3>
                      
                      <div className="flex items-center gap-4 mb-4">
                        {currentModel === model.id && (
                          <span className="px-3 py-2 rounded-full text-sm font-medium"
                                style={{ 
                                  backgroundColor: 'var(--kern-success)',
                                  color: 'white',
                                  display: 'inline-block'
                                }}>
                            Aktiv
                          </span>
                        )}
                        {model.isDownloaded && (
                          <div className="flex items-center gap-2" 
                               style={{ 
                                 color: 'var(--kern-success)',
                                 fontSize: 'var(--kern-font-size-sm)',
                                 fontWeight: '500'
                               }}>
                            <CheckCircle className="w-5 h-5" />
                            <span>Heruntergeladen</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-6" 
                         style={{ 
                           padding: 'var(--kern-space-4)',
                           backgroundColor: 'var(--kern-neutral-50)',
                           borderRadius: 'var(--kern-border-radius)',
                           border: '1px solid var(--kern-neutral-200)'
                         }}>
                      <h4 className="font-medium mb-2" 
                          style={{ 
                            color: 'var(--kern-neutral-800)',
                            fontSize: 'var(--kern-font-size-base)',
                            marginBottom: 'var(--kern-space-2)'
                          }}>
                        Beschreibung:
                      </h4>
                      <p style={{ 
                         color: 'var(--kern-neutral-700)',
                         lineHeight: '1.6',
                         fontSize: 'var(--kern-font-size-base)'
                       }}>
                        {model.description}
                      </p>
                    </div>
                    
                    <div className="space-y-4 text-sm" role="list" aria-label="Modell-Informationen">
                      <div className="flex justify-between items-center p-3 rounded-lg" 
                           role="listitem"
                           style={{ 
                             backgroundColor: 'var(--kern-neutral-50)',
                             border: '1px solid var(--kern-neutral-200)',
                             marginBottom: 'var(--kern-space-4)'
                           }}>
                        <span className="font-medium" 
                              style={{ color: 'var(--kern-neutral-700)' }}
                              aria-label="Dateigröße">
                          Größe:
                        </span>
                        <span className="font-semibold" 
                              style={{ color: 'var(--kern-neutral-900)' }}
                              aria-describedby="size-{model.id}">
                          {model.size}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-lg" 
                           role="listitem"
                           style={{ 
                             backgroundColor: 'var(--kern-neutral-50)',
                             border: '1px solid var(--kern-neutral-200)',
                             marginBottom: 'var(--kern-space-4)'
                           }}>
                        <span className="font-medium" 
                              style={{ color: 'var(--kern-neutral-700)' }}
                              aria-label="Modell-Performance">
                          Performance:
                        </span>
                        <span className="font-semibold" 
                              style={{ color: 'var(--kern-neutral-900)' }}
                              aria-describedby="performance-{model.id}">
                          {model.performance}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg" 
                           role="listitem"
                           style={{ 
                             backgroundColor: 'var(--kern-neutral-50)',
                             border: '1px solid var(--kern-neutral-200)',
                             marginBottom: 'var(--kern-space-4)'
                           }}>
                        <div className="mb-3">
                          <span className="font-medium block" 
                                style={{ 
                                  color: 'var(--kern-neutral-700)',
                                  marginBottom: 'var(--kern-space-2)'
                                }}
                                aria-label="HuggingFace Repository">
                            HuggingFace Repository:
                          </span>
                        </div>
                        <code className="text-xs font-mono block p-2 rounded" 
                              style={{ 
                                color: 'var(--kern-neutral-600)',
                                backgroundColor: 'white',
                                border: '1px solid var(--kern-neutral-300)',
                                wordBreak: 'break-all',
                                lineHeight: '1.4'
                              }}
                              aria-label="Repository-URL"
                              tabIndex={0}>
                          {model.huggingFaceId}
                        </code>
                      </div>

                      <div className="p-4 rounded-lg" 
                           role="listitem"
                           style={{ 
                             backgroundColor: 'rgba(14, 165, 233, 0.1)',
                             border: '1px solid rgba(14, 165, 233, 0.3)',
                             marginTop: 'var(--kern-space-6)'
                           }}>
                        <h5 className="font-medium block mb-3" 
                            style={{ 
                              color: 'var(--kern-neutral-800)',
                              fontSize: 'var(--kern-font-size-base)',
                              marginBottom: 'var(--kern-space-3)'
                            }}
                            aria-label="Einsatzbereich des Modells">
                          Einsatzbereich:
                        </h5>
                        <p style={{ 
                          color: 'var(--kern-neutral-700)',
                          lineHeight: '1.6',
                          fontSize: 'var(--kern-font-size-base)'
                        }}
                        aria-describedby="usecase-{model.id}">
                          {model.useCase}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4" 
                     style={{ 
                       borderTop: `1px solid var(--kern-border-color)`,
                       paddingTop: 'var(--kern-space-4)',
                       gap: 'var(--kern-space-4)'
                     }}>
                  {model.isDownloaded ? (
                    <div className="flex" style={{ gap: 'var(--kern-space-4)' }}>
                      <button
                        onClick={() => handleModelSelect(model.id)}
                        className={currentModel === model.id ? "kern-button-primary" : "kern-button-primary"}
                        style={{ 
                          minWidth: '120px',
                          backgroundColor: currentModel === model.id ? 'var(--kern-success)' : undefined
                        }}
                      >
                        {currentModel === model.id ? "Aktiv" : "Auswählen"}
                      </button>
                      <button className="kern-button-secondary flex items-center" 
                              style={{ minWidth: '140px', gap: 'var(--kern-space-2)' }}>
                        <Settings className="w-4 h-4" />
                        Konfigurieren
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDownload(model.id)}
                      disabled={downloadingModel === model.id}
                      className="kern-button-primary flex items-center"
                      style={{ 
                        minWidth: '160px',
                        gap: 'var(--kern-space-2)',
                        opacity: downloadingModel === model.id ? 0.7 : 1
                      }}
                    >
                      {downloadingModel === model.id ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Lade herunter...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Herunterladen
                        </>
                      )}
                    </button>
                  )}
                  <div className="text-sm" 
                       style={{ 
                         color: 'var(--kern-neutral-500)',
                         fontSize: 'var(--kern-font-size-sm)',
                         marginLeft: 'var(--kern-space-4)'
                       }}>
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