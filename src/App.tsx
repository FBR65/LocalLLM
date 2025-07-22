// src/App.tsx - Haupt-React-Anwendung
import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
  // Initialisiere State mit localStorage-Persistenz
  const [appState, setAppState] = useState<AppState>(() => {
    const savedState = localStorage.getItem('localllm-app-state');
    if (savedState) {
      try {
        return JSON.parse(savedState);
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
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing LocalLLM Desktop...');
      
      // Versuche Backend-Initialisierung mit Timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Backend timeout')), 3000)
      );
      
      const initPromise = Promise.all([
        invoke('init_database'),
        invoke('greet', { name: 'Frank' })
      ]);
      
      await Promise.race([initPromise, timeoutPromise]);
      console.log('Backend successfully initialized');
      
      setAppState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.warn('Backend initialization failed, running in frontend-only mode:', error);
      // Fallback: App trotzdem starten, aber nur Frontend-Features verfügbar
      setAppState(prev => ({ ...prev, isInitialized: true }));
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
