const { contextBridge, ipcRenderer } = require('electron');

// Sichere API für das Frontend
const electronAPI = {
  // Ollama Operations
  ollama: {
    status: () => {
      console.log('Frontend: Rufe ollama:status auf');
      return ipcRenderer.invoke('ollama:status');
    },
    chat: (message, context) => {
      console.log('Frontend: Rufe ollama:chat auf mit:', message);
      return ipcRenderer.invoke('ollama:chat', message, context);
    },
    models: () => {
      console.log('Frontend: Rufe ollama:models auf');
      return ipcRenderer.invoke('ollama:models');
    },
    // Open Notebook Features
    summarize: (content, type) => {
      console.log('Frontend: Rufe ollama:summarize auf, Typ:', type);
      return ipcRenderer.invoke('ollama:summarize', content, type);
    },
    analyze: (content, analysisType) => {
      console.log('Frontend: Rufe ollama:analyze auf, Typ:', analysisType);
      return ipcRenderer.invoke('ollama:analyze', content, analysisType);
    },
    generatePodcast: (content, style) => {
      console.log('Frontend: Rufe ollama:generatePodcast auf, Stil:', style);
      return ipcRenderer.invoke('ollama:generatePodcast', content, style);
    }
  },
  
  // Settings Operations
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value)
  },
  
  // File Operations
  dialog: {
    openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
    openFolder: () => ipcRenderer.invoke('dialog:openFolder')
  },
  
  file: {
    read: (filePath) => ipcRenderer.invoke('file:read', filePath),
    search: (searchTerm, directory) => ipcRenderer.invoke('file:search', searchTerm, directory)
  },
  
  // File System Operations
  files: {
    selectDirectory: () => ipcRenderer.invoke('dialog:openFolder'),
    readDirectory: (dirPath) => ipcRenderer.invoke('fs:listDirectory', dirPath)
  },
  
  // File System Operations
  fs: {
    listDirectory: (dirPath) => ipcRenderer.invoke('fs:listDirectory', dirPath)
  },
  
  // Open Notebook Operations
  notebook: {
    analyzeAll: (directory) => {
      console.log('Frontend: Rufe notebook:analyzeAll auf für:', directory);
      return ipcRenderer.invoke('notebook:analyzeAll', directory);
    },
    searchContent: (query, directory) => {
      console.log('Frontend: Rufe notebook:searchContent auf:', query, directory);
      return ipcRenderer.invoke('notebook:searchContent', query, directory);
    },
    createNotes: (content, title) => {
      console.log('Frontend: Rufe notebook:createNotes auf:', title);
      return ipcRenderer.invoke('notebook:createNotes', content, title);
    }
  },
  
  // PST Operations (erweitert)
  pst: {
    analyze: (filePath) => ipcRenderer.invoke('pst:analyze', filePath),
    search: (filePath, query, options) => ipcRenderer.invoke('pst:search', filePath, query, options),
    openFolder: (filePath) => ipcRenderer.invoke('pst:openFolder', filePath),
    loadEmails: (filePath, folderPath, limit, offset) => ipcRenderer.invoke('pst:loadEmails', filePath, folderPath, limit, offset),
    loadEmailDetails: (filePath, emailId) => ipcRenderer.invoke('pst:loadEmailDetails', filePath, emailId),
    generateStats: (filePath, analysisType) => ipcRenderer.invoke('pst:generateStats', filePath, analysisType)
  },
  
  // Platform Info
  platform: process.platform,
  
  // Version Info
  version: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome
  }
};

// API im Main World verfügbar machen
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('LocalLLM Preload Script mit Open Notebook Features geladen');
console.log('electronAPI Keys:', Object.keys(electronAPI));
console.log('ollama Keys:', Object.keys(electronAPI.ollama));
console.log('notebook Keys:', Object.keys(electronAPI.notebook));
