import React, { useState, useEffect } from "react";
import { Brain, Download, Settings, CheckCircle, X, Save } from "lucide-react";

interface ModelManagerProps {
  currentModel: string | null;
  onModelChange: (modelName: string | null) => void;
}

export const ModelManager: React.FC<ModelManagerProps> = ({
  currentModel,
  onModelChange
}) => {
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [configuringModel, setConfiguringModel] = useState<string | null>(null);
  const [downloadedModels, setDownloadedModels] = useState<Set<string>>(new Set());
  const [systemPrompts, setSystemPrompts] = useState<Record<string, string>>({
    'llama-3.2-3b-instruct': 'Du bist ein hilfreicher deutscher KI-Assistent. Antworte höflich, präzise und auf Deutsch.',
    'phi-4-mini-instruct': 'Du bist ein leistungsstarker KI-Assistent mit Fokus auf Code und Reasoning. Antworte auf Deutsch.',
    'gemma-3-1b-it': 'Du bist ein effizienter KI-Assistent für schnelle Antworten. Antworte kurz und präzise auf Deutsch.',
    'bge-m3-embedder': 'System für Vektorisierung und semantische Suche. Keine Chat-Funktion.'
  });

  // Lade gespeicherte Systemprompts beim Component-Mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem('systemPrompts');
    if (savedPrompts) {
      try {
        const parsedPrompts = JSON.parse(savedPrompts);
        setSystemPrompts(prev => ({
          ...prev,
          ...parsedPrompts
        }));
        console.log('Gespeicherte Systemprompts geladen:', parsedPrompts);
      } catch (e) {
        console.warn('Fehler beim Laden der Systemprompts:', e);
      }
    }
  }, []);
  const [tempPrompt, setTempPrompt] = useState<string>('');

  // Prüfe beim Component-Mount welche Modelle wirklich verfügbar sind
  useEffect(() => {
    const checkAvailableModels = async () => {
      try {
        console.log('Prüfe verfügbare Modelle beim App-Start...');
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Frage Backend nach verfügbaren Modellen
        const availableModelIds = await invoke<string[]>('get_downloaded_model_list');
        
        console.log('Verfügbare Modelle vom Backend:', availableModelIds);
        
        // Synchronisiere mit localStorage
        const savedDownloads = localStorage.getItem('downloadedModels');
        let savedSet = new Set<string>();
        
        if (savedDownloads) {
          try {
            savedSet = new Set(JSON.parse(savedDownloads));
          } catch (e) {
            console.warn('Fehler beim Parsen der gespeicherten Downloads:', e);
          }
        }
        
        // Erstelle vereinigte Liste: Backend + localStorage
        const combinedSet = new Set([...availableModelIds, ...savedSet]);
        
        // Prüfe jedes Modell einzeln
        const verifiedModels = new Set<string>();
        for (const modelId of combinedSet) {
          try {
            const isAvailable = await invoke<boolean>('check_model_availability', { modelId });
            if (isAvailable) {
              verifiedModels.add(modelId);
            }
          } catch (e) {
            console.warn(`Modell ${modelId} konnte nicht verifiziert werden:`, e);
          }
        }
        
        console.log('Verifizierte verfügbare Modelle:', Array.from(verifiedModels));
        
        // Aktualisiere State und localStorage
        setDownloadedModels(verifiedModels);
        localStorage.setItem('downloadedModels', JSON.stringify(Array.from(verifiedModels)));
        
        // Wiederherstellen des zuletzt ausgewählten Modells
        const savedCurrentModel = localStorage.getItem('currentModel');
        if (savedCurrentModel && verifiedModels.has(savedCurrentModel)) {
          console.log('Wiederherstelle zuletzt ausgewähltes Modell:', savedCurrentModel);
          
          // Informiere Backend über das geladene Modell
          try {
            await invoke('load_german_model', {
              modelName: savedCurrentModel
            });
            onModelChange(savedCurrentModel);
            console.log('Backend über gespeichertes Modell informiert:', savedCurrentModel);
          } catch (loadError) {
            console.warn('Fehler beim Laden des gespeicherten Modells:', loadError);
            onModelChange(savedCurrentModel); // Frontend-State trotzdem setzen
          }
        }
        
      } catch (error) {
        console.warn('Fehler beim Prüfen verfügbarer Modelle:', error);
        
        // Fallback: Verwende localStorage
        try {
          const saved = localStorage.getItem('downloadedModels');
          if (saved) {
            const savedArray = JSON.parse(saved) as string[];
            const savedSet = new Set(savedArray);
            setDownloadedModels(savedSet);
            console.log('Fallback: Verwende gespeicherte Downloads:', Array.from(savedSet));
            
            // Wiederherstellen des zuletzt ausgewählten Modells (Fallback)
            const savedCurrentModel = localStorage.getItem('currentModel');
            if (savedCurrentModel && savedSet.has(savedCurrentModel)) {
              console.log('Fallback: Wiederherstelle zuletzt ausgewähltes Modell:', savedCurrentModel);
              
              // Versuche Backend zu informieren, auch im Fallback-Modus
              try {
                const { invoke: fallbackInvoke } = await import('@tauri-apps/api/core');
                await fallbackInvoke('load_german_model', {
                  modelName: savedCurrentModel
                });
                onModelChange(savedCurrentModel);
                console.log('Fallback: Backend über gespeichertes Modell informiert:', savedCurrentModel);
              } catch (loadError) {
                console.warn('Fallback: Fehler beim Laden des gespeicherten Modells:', loadError);
                onModelChange(savedCurrentModel); // Frontend-State trotzdem setzen
              }
            }
          }
        } catch (e) {
          console.warn('Fehler beim Laden der gespeicherten Downloads:', e);
          setDownloadedModels(new Set());
        }
      }
    };
    
    checkAvailableModels();
  }, [onModelChange]);

  // Funktion zum Speichern des Download-Status
  const markModelAsDownloaded = (modelId: string) => {
    setDownloadedModels(prev => {
      const newSet = new Set(prev);
      newSet.add(modelId);
      // Speichere in localStorage
      localStorage.setItem('downloadedModels', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const availableModels = [
    {
      id: "llama-3.2-3b-instruct",
      name: "Llama 3.2 3B Instruct",
      description: "Meta's Llama 3.2 3B Instruct - Leistungsstarkes Sprachmodell für deutsche und internationale Texte",
      size: "6.2 GB",
      isDownloaded: downloadedModels.has("llama-3.2-3b-instruct"),
      performance: "Sehr Hoch",
      useCase: "Chat, Textgenerierung, Instruction Following",
      huggingFaceId: "onnx-community/Llama-3.2-3B-Instruct"
    },
    {
      id: "phi-4-mini-instruct",
      name: "Phi-4 Mini Instruct",
      description: "Microsoft's Phi-4 Mini - Kompaktes aber sehr leistungsfähiges Instruction-Modell",
      size: "2.8 GB",
      isDownloaded: downloadedModels.has("phi-4-mini-instruct"),
      performance: "Hoch",
      useCase: "Chat, Code-Generierung, Reasoning",
      huggingFaceId: "onnx-community/Phi-4-mini-instruct-ONNX-GQA"
    },
    {
      id: "gemma-3-1b-it",
      name: "Gemma 3 1B Instruct",
      description: "Google's Gemma 3 1B - Effizienter Instruction-Tuned Modell für schnelle Inferenz",
      size: "2.1 GB",
      isDownloaded: downloadedModels.has("gemma-3-1b-it"),
      performance: "Mittel-Hoch",
      useCase: "Chat, Textverarbeitung, Schnelle Antworten",
      huggingFaceId: "onnx-community/gemma-3-1b-it-ONNX-GQA"
    },
    {
      id: "bge-m3-embedder",
      name: "BGE-M3 Embedder & Reranker",
      description: "Multilingualer Embedder für Vektorisierung und Semantic Search - unterstützt 100+ Sprachen",
      size: "1.1 GB",
      isDownloaded: downloadedModels.has("bge-m3-embedder"),
      performance: "Spezialisiert",
      useCase: "Embeddings, Vektorsuche, Semantic Reranking",
      huggingFaceId: "philipp-zettl/BAAI-bge-m3-ONNX"
    }
  ];

  const handleModelSelect = async (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (model && model.isDownloaded) {
      try {
        // Informiere das Backend über die Modellauswahl
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('load_german_model', {
          modelName: modelId
        });
        
        onModelChange(modelId);
        // Speichere die Modellauswahl für Neustart-Persistierung
        localStorage.setItem('currentModel', modelId);
        console.log('Modell ausgewählt, Backend informiert und gespeichert:', modelId);
      } catch (error) {
        console.error('Fehler beim Laden des Modells:', error);
        alert(`Fehler beim Laden des Modells: ${error}`);
      }
    } else {
      alert('Dieses Modell muss erst heruntergeladen werden, bevor es ausgewählt werden kann.');
    }
  };

  const handleDownload = async (modelId: string) => {
    setDownloadingModel(modelId);
    
    try {
      const model = availableModels.find(m => m.id === modelId);
      if (!model) return;
      
      console.log(`Starting download for: ${model.huggingFaceId}`);
      
      // AUSSCHLIESSLICH Desktop-App: Tauri Backend-Integration
      const { invoke } = await import('@tauri-apps/api/core');
      
      const downloadResult = await invoke('download_model_from_huggingface', {
        modelId: model.id,
        huggingfaceId: model.huggingFaceId
      });
      
      if (downloadResult) {
        markModelAsDownloaded(model.id);
        
        // Automatisch das Modell laden nach erfolgreichem Download
        try {
          await invoke('load_german_model', {
            modelName: model.id
          });
          onModelChange(model.id);
          localStorage.setItem('currentModel', model.id);
          console.log('Modell nach Download automatisch geladen:', model.id);
          
          alert(`Modell ${model.name} erfolgreich heruntergeladen und geladen!\n${downloadResult}`);
        } catch (loadError) {
          console.error('Fehler beim automatischen Laden nach Download:', loadError);
          alert(`Modell ${model.name} heruntergeladen, aber Fehler beim Laden: ${loadError}`);
        }
      } else {
        throw new Error('Download fehlgeschlagen - kein Ergebnis vom Backend');
      }
      
    } catch (error) {
      console.error('Download-Fehler:', error);
      alert(`Fehler beim Download: ${String(error)}\n\nStellen Sie sicher, dass die Desktop-App läuft und das Backend verfügbar ist.`);
    } finally {
      setDownloadingModel(null);
    }
  };

  const handleConfigure = (modelId: string) => {
    setConfiguringModel(modelId);
    setTempPrompt(systemPrompts[modelId] || '');
  };

  const handleSaveConfiguration = () => {
    if (configuringModel) {
      const updatedPrompts = {
        ...systemPrompts,
        [configuringModel]: tempPrompt
      };
      
      setSystemPrompts(updatedPrompts);
      
      // Speichere alle Systemprompts in localStorage
      localStorage.setItem('systemPrompts', JSON.stringify(updatedPrompts));
      
      setConfiguringModel(null);
      setTempPrompt('');
      
      console.log('Systemprompt gespeichert für', configuringModel, ':', tempPrompt);
      alert(`Systemprompt für ${availableModels.find(m => m.id === configuringModel)?.name} gespeichert!`);
    }
  };

  const handleCancelConfiguration = () => {
    setConfiguringModel(null);
    setTempPrompt('');
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
                      <button 
                              onClick={() => handleConfigure(model.id)}
                              className="kern-button-secondary flex items-center" 
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

        {/* Konfigurationsdialog für Systemprompts */}
        {configuringModel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Modell konfigurieren: {availableModels.find(m => m.id === configuringModel)?.name}
                </h3>
                <button 
                  onClick={handleCancelConfiguration}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Systemprompt
                </label>
                <textarea
                  value={tempPrompt}
                  onChange={(e) => setTempPrompt(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Geben Sie hier den Systemprompt für das Modell ein..."
                />
                <p className="text-sm text-gray-600 mt-2">
                  Der Systemprompt definiert das Verhalten und die Persönlichkeit des KI-Modells.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelConfiguration}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveConfiguration}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};