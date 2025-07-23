// src/App.tsx - Haupt-React-Anwendung
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { DocumentViewer } from './components/document/DocumentViewer';
import { ChatInterface } from './components/chat/ChatInterface';
import { PSTExplorer } from './components/pst/PSTExplorer';
import { ModelManager } from './components/models/ModelManager';
import './App.css';

interface AppState {
  currentModel: string | null;
  documentsFolder: string | null;
  pstFolder: string | null;
  isInitialized: boolean;
}

function App() {
  // Initialisiere State mit localStorage-Persistenz und Validierung
  const [appState, setAppState] = useState<AppState>(() => {
    const savedState = localStorage.getItem('localllm-app-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Validiere gespeicherte Daten - setze ungültige Modelle zurück
        return {
          ...parsed,
          currentModel: null, // Reset bis Modell wirklich heruntergeladen wird
        };
      } catch (e) {
        console.warn('Failed to parse saved state:', e);
      }
    }
    return {
      currentModel: null,
      documentsFolder: null,
      pstFolder: null,
      isInitialized: false,
    };
  });

  const [currentView, setCurrentView] = useState<'chat' | 'documents' | 'pst' | 'models'>('chat');

  // Persistiere State in localStorage bei Änderungen
  useEffect(() => {
    localStorage.setItem('localllm-app-state', JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    // Initialisiere Desktop-App
    console.log('Initialisiere LocalLLM Desktop-App...');
    
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing LocalLLM Desktop...');
      
      // Desktop-App: Tauri Backend-Integration erforderlich
      const { invoke } = await import('@tauri-apps/api/core');
      
      await Promise.all([
        invoke('init_database'),
        invoke('greet', { name: 'Frank' })
      ]);
      
      console.log('Desktop-App erfolgreich initialisiert');
      setAppState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error('Desktop-App Initialisierung fehlgeschlagen:', error);
      alert('Fehler beim Starten der Desktop-App!\n\nStellen Sie sicher, dass:\n• Die Tauri Desktop-App läuft\n• Das Backend verfügbar ist\n\nBrowser-Modus wird nicht mehr unterstützt.');
      setAppState(prev => ({ ...prev, isInitialized: false }));
    }
  };

  const handleModelChange = useCallback((modelName: string | null) => {
    setAppState(prev => {
      const newState = { ...prev, currentModel: modelName };
      localStorage.setItem('localllm-app-state', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleDocumentsFolderChange = useCallback((folder: string) => {
    setAppState(prev => {
      const newState = { ...prev, documentsFolder: folder };
      localStorage.setItem('localllm-app-state', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handlePstFolderChange = useCallback((folder: string) => {
    setAppState(prev => {
      const newState = { ...prev, pstFolder: folder };
      localStorage.setItem('localllm-app-state', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const renderMainContent = () => {
    switch (currentView) {
      case 'chat':
        return (
          <ChatInterface
            currentModel={appState.currentModel}
            documentsFolder={appState.documentsFolder}
            pstFolder={appState.pstFolder}
          />
        );
      case 'documents':
        return (
          <DocumentViewer
            documentsFolder={appState.documentsFolder}
            onDocumentsFolderChange={handleDocumentsFolderChange}
            currentModel={appState.currentModel}
          />
        );
      case 'pst':
        return (
          <PSTExplorer
            pstFolder={appState.pstFolder}
            onPstFolderChange={handlePstFolderChange}
          />
        );
      case 'models':
        return (
          <ModelManager
            currentModel={appState.currentModel}
            onModelChange={handleModelChange}
          />
        );
      default:
        return <div className="p-6 text-gray-500">Unbekannte Ansicht</div>;
    }
  };

  if (!appState.isInitialized) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">LocalLLM wird initialisiert...</h1>
          <p className="text-gray-600">Lade Desktop-Anwendung und Backend-Services...</p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Fixed */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentModel={appState.currentModel}
        documentsFolder={appState.documentsFolder}
        pstFolder={appState.pstFolder}
      />

      {/* Hauptinhalt - Scrollable */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="flex-1 overflow-y-auto">
          {renderMainContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
