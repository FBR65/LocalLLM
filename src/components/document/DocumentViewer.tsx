// src/components/document/DocumentViewer.tsx - Dokumenten-Viewer mit Analyse-Panel
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { 
  FolderOpen, 
  FileText, 
  Search, 
  Eye, 
  Brain, 
  RefreshCw,
  AlertCircle,
  File,
  ChevronRight
} from 'lucide-react';

interface DocumentItem {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  lastModified: string;
  content?: string;
}

interface DocumentAnalysis {
  summary: string;
  keywords: string[];
  sentiment: string;
  language: string;
  wordCount: number;
  topics: string[];
}

interface DocumentViewerProps {
  documentsFolder: string | null;
  onDocumentsFolderChange: (folder: string) => void;
  currentModel: string | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentsFolder,
  onDocumentsFolderChange,
  currentModel
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualPath, setManualPath] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dokumenten-Ordner auswählen
  const selectDocumentsFolder = async () => {
    try {
      setError(null);
      
      // Verwende Tauri Dialog API
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Dokumenten-Ordner auswählen'
      });

      if (selected && typeof selected === 'string') {
        onDocumentsFolderChange(selected);
        loadDocuments(selected);
      }
    } catch (error) {
      console.error('Fehler beim Ordner auswählen:', error);
      setError('Fehler beim Öffnen des Dateidialogs. Verwenden Sie die manuelle Eingabe.');
      setShowManualInput(true);
    }
  };

  // Manuellen Pfad anwenden
  const applyManualPath = () => {
    if (manualPath.trim()) {
      onDocumentsFolderChange(manualPath.trim());
      loadDocuments(manualPath.trim());
      setShowManualInput(false);
      setError(null);
    }
  };

  // Dokumente laden
  const loadDocuments = async (folderPath: string) => {
    setIsLoading(true);
    try {
      console.log('📁 Loading documents from:', folderPath);
      const result = await invoke<DocumentItem[]>('scan_documents_folder', {
        folder_path: folderPath
      });
      
      console.log('✅ Loaded documents:', result);
      setDocuments(result || []);
      setError(null);
    } catch (error) {
      console.error('Fehler beim Laden der Dokumente:', error);
      setError('Fehler beim Laden der Dokumente. Überprüfen Sie den Pfad.');
      
      // Fallback zu Demo-Daten bei Entwicklungsfehlern
      setDocuments([
        {
          id: 'doc_1',
          name: 'Projektbericht_2024.pdf',
          path: `${folderPath}/Projektbericht_2024.pdf`,
          type: 'PDF',
          size: 2547392,
          lastModified: '2024-12-15T10:30:00Z',
          content: 'Dies ist ein Beispiel-Projektbericht für das Jahr 2024. Der Bericht enthält detaillierte Analysen...'
        },
        {
          id: 'doc_2',
          name: 'Meeting_Notes.txt',
          path: `${folderPath}/Meeting_Notes.txt`,
          type: 'TXT',
          size: 15476,
          lastModified: '2024-12-20T14:45:00Z',
          content: 'Meeting-Notizen vom 20.12.2024\n\nTeilnehmer: Max Mustermann, Anna Schmidt, Peter Weber...'
        },
        {
          id: 'doc_3',
          name: 'Technische_Dokumentation.md',
          path: '/documents/Technische_Dokumentation.md',
          type: 'MD',
          size: 87432,
          lastModified: '2024-12-18T09:15:00Z',
          content: '# Technische Dokumentation\n\n## Übersicht\n\nDiese Dokumentation beschreibt die technische Architektur...'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Dokument analysieren
  const analyzeDocument = async (document: DocumentItem) => {
    if (!currentModel) {
      setError('Bitte wählen Sie zuerst ein Modell aus.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await invoke<DocumentAnalysis>('analyze_document', {
        documentPath: document.path,
        modelName: currentModel
      });
      
      setAnalysis(result);
    } catch (error) {
      console.error('Fehler bei der Dokumentenanalyse:', error);
      setError('Fehler bei der Dokumentenanalyse.');
      // Demo-Analyse
      setAnalysis({
        summary: 'Dies ist eine automatisch generierte Zusammenfassung des Dokuments. Das Dokument behandelt wichtige Themen im Bereich der Dokumentenverarbeitung und KI-Analyse.',
        keywords: ['Projekt', 'Analyse', 'Bericht', 'Technologie', 'Dokumentation'],
        sentiment: 'Neutral',
        language: 'Deutsch',
        wordCount: 1247,
        topics: ['Projektmanagement', 'Technische Dokumentation', 'Datenanalyse']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dokumente laden wenn Ordner gesetzt wird
  useEffect(() => {
    if (documentsFolder) {
      loadDocuments(documentsFolder);
    }
  }, [documentsFolder]);

  // Gefilterte Dokumente
  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <File className="w-4 h-4 text-red-600" />;
      case 'txt': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'md': return <FileText className="w-4 h-4 text-green-600" />;
      default: return <File className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
          <FileText className="w-6 h-6 mr-3 text-blue-600" />
          Dokumenten-Viewer
        </h2>
        
        {/* Ordnerauswahl */}
        <div className="kern-content-section">
          <div className="kern-button-group">
            <button
              onClick={selectDocumentsFolder}
              className="kern-button-primary flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Ordner auswählen</span>
            </button>
            
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="kern-button-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Manuell eingeben</span>
            </button>
            
            {documentsFolder && (
              <button
                onClick={() => loadDocuments(documentsFolder)}
                className="kern-button-secondary flex items-center gap-2"
                disabled={isLoading}
                style={{ 
                  backgroundColor: isLoading ? 'var(--kern-neutral-200)' : undefined,
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Neu laden</span>
              </button>
            )}
          </div>

          {/* Manuelle Pfadeingabe */}
          {showManualInput && (
            <div className="kern-button-group" style={{ marginTop: 'var(--kern-space-4)' }}>
              <input
                type="text"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                placeholder="z.B. C:\Users\frank\Documents\Dokumente"
                className="kern-input"
                style={{ 
                  flex: '1 1 300px',
                  minWidth: '250px'
                }}
              />
              <button
                onClick={applyManualPath}
                className="kern-button-primary"
                style={{ 
                  minWidth: '120px',
                  flexShrink: 0
                }}
              >
                Übernehmen
              </button>
            </div>
          )}

          {/* Aktueller Pfad */}
          {documentsFolder && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <span className="font-medium">Ausgewählter Ordner:</span> {documentsFolder}
              </p>
            </div>
          )}

          {/* Fehlermeldung */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {documentsFolder ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Dokumente-Liste - scrollbar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Suchbereich */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Dokumente durchsuchen..."
                  className="kern-input w-full pl-10"
                />
              </div>
              
              <div className="mt-3 text-sm" 
                   style={{ 
                     color: 'var(--kern-neutral-600)',
                     fontSize: 'var(--kern-font-size-sm)'
                   }}>
                {filteredDocuments.length} von {documents.length} Dokumenten
              </div>
            </div>

            {/* Dokumente-Liste - scrollbar */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--kern-primary)' }} />
                  <span className="ml-3" style={{ color: 'var(--kern-neutral-600)' }}>Lade Dokumente...</span>
                </div>
              ) : filteredDocuments.length > 0 ? (
                <div className="space-y-2 p-4">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocument(doc)}
                      className={`p-4 rounded-lg cursor-pointer transition-all kern-fade-in ${
                        selectedDocument?.id === doc.id
                          ? 'border-2'
                          : 'border hover:shadow-md'
                      }`}
                      style={{
                        borderColor: selectedDocument?.id === doc.id ? 'var(--kern-primary)' : 'var(--kern-border-color)',
                        backgroundColor: selectedDocument?.id === doc.id ? 'var(--kern-neutral-50)' : 'white',
                        marginBottom: 'var(--kern-space-3)'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {getFileIcon(doc.type)}
                        <div className="font-medium text-sm truncate flex-1"
                             style={{ 
                               color: 'var(--kern-neutral-900)',
                               fontSize: 'var(--kern-font-size-sm)',
                               fontWeight: '600'
                             }}>
                          {doc.name}
                        </div>
                      </div>
                      <div className="text-xs space-y-2"
                           style={{ 
                             color: 'var(--kern-neutral-500)',
                             fontSize: 'var(--kern-font-size-xs)'
                           }}>
                        <div>{doc.type} • {formatFileSize(doc.size)}</div>
                        <div>{new Date(doc.lastModified).toLocaleDateString('de-DE')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <FileText className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Keine Dokumente gefunden' : 'Keine Dokumente im Ordner'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dokument-Inhalt - scrollbar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {selectedDocument ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    {getFileIcon(selectedDocument.type)}
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {selectedDocument.name}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{selectedDocument.type} • {formatFileSize(selectedDocument.size)}</div>
                    <div>{new Date(selectedDocument.lastModified).toLocaleString('de-DE')}</div>
                  </div>
                  <button
                    onClick={() => analyzeDocument(selectedDocument)}
                    disabled={!currentModel || isAnalyzing}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    <Brain className="w-4 h-4" />
                    {isAnalyzing ? 'Analysiere...' : 'KI-Analyse'}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="prose prose-sm max-w-none">
                    <pre className="text-gray-700 leading-relaxed whitespace-pre-wrap font-sans text-sm">
                      {selectedDocument.content || 'Inhalt wird geladen...'}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Wählen Sie ein Dokument aus der Liste aus</p>
                </div>
              </div>
            )}
          </div>

          {/* Analyse-Panel - scrollbar */}
          <div className="w-1/3 flex flex-col">
            {analysis ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    KI-Analyse
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Modell: {currentModel || 'Unbekannt'}
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Zusammenfassung */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Zusammenfassung</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Metadaten */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Sprache:</span>
                      <p className="text-gray-700">{analysis.language}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Wörter:</span>
                      <p className="text-gray-700">{analysis.wordCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Sentiment:</span>
                      <p className="text-gray-700">{analysis.sentiment}</p>
                    </div>
                  </div>

                  {/* Schlüsselwörter */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Schlüsselwörter</h4>
                    <div className="flex flex-wrap gap-1">
                      {analysis.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded border"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Themen */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Erkannte Themen</h4>
                    <div className="space-y-1">
                      {analysis.topics.map((topic, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded border text-sm"
                        >
                          <ChevronRight className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    KI-Analyse
                  </h3>
                  <p className="text-gray-500 mb-4 max-w-sm">
                    Wählen Sie ein Dokument aus und klicken Sie auf "KI-Analyse", um eine detaillierte Analyse zu erhalten.
                  </p>
                  {!currentModel && (
                    <p className="text-orange-600 text-sm">
                      Bitte wählen Sie zuerst ein Modell aus.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Dokumenten-Ordner auswählen
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              Wählen Sie einen Ordner mit Dokumenten aus, um diese zu durchsuchen und mit KI zu analysieren.
            </p>
            <button
              onClick={selectDocumentsFolder}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ordner auswählen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
