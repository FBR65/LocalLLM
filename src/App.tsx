// src/App.tsx - Haupt-React-Anwendung
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Sidebar } from './components/Sidebar';
import { DocumentViewer } from './components/document/DocumentViewer';
import { ChatInterface } from './components/chat/ChatInterface';
import { PSTExplorer } from './components/pst/PSTExplorer';
import { ModelManager } from './components/ModelManager';
import './App.css';

interface AppState {
  currentModel: string | null;
  documentsFolder: string | null;
  pstFolder: string | null;
  isInitialized: boolean;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentModel: null,
    documentsFolder: null,
    pstFolder: null,
    isInitialized: false,
  });

  const [currentView, setCurrentView] = useState<'chat' | 'documents' | 'pst' | 'models'>('chat');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing LocalLLM Desktop...');
      
      // Datenbank initialisieren
      await invoke('init_database');
      console.log('Database initialized');

      // Grüßung vom Backend
      const greeting = await invoke('greet', { name: 'Frank' });
      console.log(greeting);

      setAppState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  };

  const handleModelChange = (modelName: string | null) => {
    setAppState(prev => ({ ...prev, currentModel: modelName }));
  };

  const handleDocumentsFolderChange = (folder: string) => {
    setAppState(prev => ({ ...prev, documentsFolder: folder }));
  };

  const handlePstFolderChange = (folder: string) => {
    setAppState(prev => ({ ...prev, pstFolder: folder }));
  };

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">LocalLLM wird geladen...</h1>
          <p className="text-gray-600">Initialisierung der Anwendung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentModel={appState.currentModel}
        documentsFolder={appState.documentsFolder}
        pstFolder={appState.pstFolder}
      />

      {/* Hauptinhalt */}
      <main className="flex-1 flex flex-col min-h-screen">
        {renderMainContent()}
      </main>
    </div>
  );
}

export default App;
