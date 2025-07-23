import { useState, useEffect, useRef } from 'react'
import { 
  MessageCircle, 
  Settings, 
  Upload, 
  File, 
  Send, 
  Bot, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  FileText,
  Search,
  Mail,
  ChevronDown,
  X,
  Folder
} from 'lucide-react'

// Electron API Types
declare global {
  interface Window {
    electronAPI: {
      ollama: {
        status: () => Promise<boolean>
        chat: (message: string, context?: string) => Promise<{
          success: boolean
          response?: string
          error?: string
        }>
        models: () => Promise<{
          success: boolean
          models: Array<{ name: string; size: number }>
          error?: string
        }>
      }
      settings: {
        get: (key?: string) => Promise<any>
        set: (key: string, value: any) => Promise<boolean>
      }
      dialog: {
        openFile: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<{
          path: string
          name: string
          size: number
          extension: string
        } | null>
        openFolder: () => Promise<{
          path: string
          name: string
        } | null>
      }
      file: {
        read: (filePath: string) => Promise<{
          success: boolean
          content?: string
          error?: string
        }>
      }
      fs: {
        listDirectory: (dirPath: string) => Promise<{
          success: boolean
          items: Array<{
            name: string
            path: string
            isDirectory: boolean
            size: number
            extension: string
            modified: string
          }>
          error?: string
        }>
      }
      pst: {
        analyze: (filePath: string) => Promise<{
          success: boolean
          info?: {
            totalEmails: number
            totalSize: number
            dateRange: { start: string; end: string }
            folders: string[]
          }
          error?: string
        }>
        search: (filePath: string, searchTerm: string) => Promise<{
          success: boolean
          results: Array<{
            id: string
            subject: string
            sender: string
            recipient: string
            date: string
            body: string
            attachments: string[]
            folder: string
          }>
          totalFound: number
          error?: string
        }>
      }
    }
  }
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: string
  fileInfo?: {
    name: string
    type: 'document' | 'pst'
    size: number
  }
}

interface OllamaStatus {
  connected: boolean
  checking: boolean
  error?: string
}

interface AvailableModel {
  name: string
  size: number
  modified_at?: string
}

interface UploadedFile {
  name: string
  content: string
  path: string
  type: 'document' | 'pst'
  size: number
}

function LocalLLMApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    connected: false,
    checking: true
  })
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('phi4-mini:latest')
  const [loadingModels, setLoadingModels] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [pstSearchTerm, setPstSearchTerm] = useState('')
  const [pstSearchResults, setPstSearchResults] = useState<any[]>([])
  const [searchingPst, setSearchingPst] = useState(false)
  const [currentDirectory, setCurrentDirectory] = useState<string>('')
  const [directoryItems, setDirectoryItems] = useState<any[]>([])
  const [loadingDirectory, setLoadingDirectory] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ollama Status beim Start prüfen
  useEffect(() => {
    checkOllamaStatus()
    loadAvailableModels()
    loadSettings()
    const interval = setInterval(checkOllamaStatus, 10000) // Alle 10 Sekunden prüfen
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll zu neuen Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSettings = async () => {
    try {
      const settings = await window.electronAPI.settings.get()
      if (settings?.ollama?.model) {
        setSelectedModel(settings.ollama.model)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error)
    }
  }

  const loadAvailableModels = async () => {
    if (!window.electronAPI) return
    
    console.log('Frontend: Lade verfügbare Modelle...')
    setLoadingModels(true)
    try {
      const result = await window.electronAPI.ollama.models()
      console.log('Frontend: Modelle-Response:', result)
      if (result.success && result.models) {
        console.log('Frontend: Gefundene Modelle:', result.models)
        setAvailableModels(result.models)
      } else {
        console.error('Frontend: Fehler beim Laden der Modelle:', result.error)
      }
    } catch (error) {
      console.error('Frontend: Fehler beim Laden der Modelle:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  const handleModelChange = async (modelName: string) => {
    setSelectedModel(modelName)
    setShowModelSelector(false)
    
    try {
      await window.electronAPI.settings.set('ollama.model', modelName)
    } catch (error) {
      console.error('Fehler beim Speichern des Modells:', error)
    }
  }

  const checkOllamaStatus = async () => {
    console.log('Frontend: checkOllamaStatus gestartet');
    console.log('Frontend: window.electronAPI verfügbar:', !!window.electronAPI);
    
    if (!window.electronAPI) {
      console.error('Frontend: electronAPI nicht verfügbar!');
      setOllamaStatus({ 
        connected: false, 
        checking: false, 
        error: 'Electron API nicht verfügbar' 
      });
      return;
    }
    
    setOllamaStatus(prev => ({ ...prev, checking: true }))
    try {
      console.log('Frontend: Rufe electronAPI.ollama.status() auf');
      const connected = await window.electronAPI.ollama.status()
      console.log('Frontend: Ollama Status Response:', connected);
      setOllamaStatus({ connected, checking: false })
    } catch (error) {
      console.error('Frontend: Ollama Status Error:', error);
      setOllamaStatus({ 
        connected: false, 
        checking: false, 
        error: 'Fehler beim Prüfen der Ollama-Verbindung: ' + (error instanceof Error ? error.message : String(error))
      })
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading || !ollamaStatus.connected) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
      context: uploadedFile?.name
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      console.log('Frontend: Sende Chat-Nachricht:', currentMessage);
      const response = await window.electronAPI.ollama.chat(
        currentMessage,
        uploadedFile?.content
      )
      
      console.log('Frontend: Chat Response erhalten:', response);

      if (response.success && response.response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(response.error || 'Unbekannter Fehler bei der Chat-Antwort')
      }
    } catch (error) {
      console.error('Frontend: Chat Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nBitte prüfen Sie:\n- Ist Ollama gestartet?\n- Ist das Modell verfügbar?\n- Läuft der Ollama-Service auf Port 11434?`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleFileUpload = async () => {
    if (!window.electronAPI) return

    try {
      const file = await window.electronAPI.dialog.openFile([
        { name: 'Dokumente', extensions: ['txt', 'md', 'json', 'pdf'] },
        { name: 'PST-Dateien', extensions: ['pst'] },
        { name: 'Alle Dateien', extensions: ['*'] }
      ])

      if (file) {
        const content = await window.electronAPI.file.read(file.path)
        if (content.success && content.content) {
          const fileType = file.extension === '.pst' ? 'pst' : 'document'
          setUploadedFile({
            name: file.name,
            content: content.content,
            path: file.path,
            type: fileType,
            size: file.size
          })
          
          // Für PST-Dateien initialisiere die Suchfunktion
          if (fileType === 'pst') {
            setPstSearchResults([])
            setPstSearchTerm('')
          }
        } else {
          throw new Error(content.error || 'Fehler beim Lesen der Datei')
        }
      }
    } catch (error) {
      console.error('Fehler beim Datei-Upload:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ Fehler beim Laden der Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handlePstUpload = async () => {
    if (!window.electronAPI) return

    try {
      const file = await window.electronAPI.dialog.openFile([
        { name: 'PST-Dateien', extensions: ['pst'] },
        { name: 'Alle Dateien', extensions: ['*'] }
      ])

      if (file) {
        // PST-Datei analysieren
        const analysisResult = await window.electronAPI.pst.analyze(file.path)
        
        if (analysisResult.success && analysisResult.info) {
          const info = analysisResult.info
          
          setUploadedFile({
            name: file.name,
            content: `PST-Datei analysiert: ${info.totalEmails} E-Mails, ${info.folders.length} Ordner`,
            path: file.path,
            type: 'pst',
            size: file.size
          })
          
          setPstSearchResults([])
          setPstSearchTerm('')
          
          const infoMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `📧 PST-Datei "${file.name}" erfolgreich analysiert!\n\n📊 **Übersicht:**\n• E-Mails gesamt: ${info.totalEmails.toLocaleString('de-DE')}\n• Dateigröße: ${(file.size / 1024 / 1024).toFixed(1)} MB\n• Zeitraum: ${info.dateRange.start} bis ${info.dateRange.end}\n• Ordner: ${info.folders.join(', ')}\n\n🔍 **Verfügbare Aktionen:**\n• Verwenden Sie die Suchfunktion links\n• Stellen Sie Fragen zu E-Mail-Inhalten\n• Lassen Sie Analysen durchführen\n\nBeispiel-Fragen:\n"Suche nach E-Mails über Projekte"\n"Zeige mir wichtige E-Mails vom letzten Monat"\n"Analysiere die Kommunikation mit Kunden"`,
            timestamp: new Date(),
            fileInfo: {
              name: file.name,
              type: 'pst',
              size: file.size
            }
          }
          setMessages(prev => [...prev, infoMessage])
        } else {
          throw new Error(analysisResult.error || 'PST-Analyse fehlgeschlagen')
        }
      }
    } catch (error) {
      console.error('Fehler beim PST-Upload:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ Fehler beim Laden der PST-Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handlePstSearch = async () => {
    if (!pstSearchTerm.trim() || !uploadedFile || uploadedFile.type !== 'pst') return

    setSearchingPst(true)
    try {
      const searchResult = await window.electronAPI.pst.search(uploadedFile.path, pstSearchTerm)
      
      if (searchResult.success && searchResult.results) {
        setPstSearchResults(searchResult.results)
        
        const searchMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `🔍 PST-Suche für "${pstSearchTerm}" abgeschlossen.\n\nGefunden: ${searchResult.totalFound} E-Mails\n\nErgebnisse:\n${searchResult.results.map(email => 
            `📧 ${email.subject}\n   Von: ${email.sender}\n   Datum: ${new Date(email.date).toLocaleDateString('de-DE')}\n   Ordner: ${email.folder}`
          ).join('\n\n')}\n\nSie können nun Fragen zu diesen E-Mails stellen oder weitere Analysen durchführen.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, searchMessage])
      } else {
        throw new Error(searchResult.error || 'PST-Suche fehlgeschlagen')
      }
      
    } catch (error) {
      console.error('PST-Suchfehler:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ Fehler bei der PST-Suche: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSearchingPst(false)
    }
  }

  const handleFolderSelect = async () => {
    if (!window.electronAPI) {
      console.error('Frontend: electronAPI nicht verfügbar für Ordner-Auswahl')
      return
    }

    console.log('Frontend: Starte Ordner-Auswahl...')
    try {
      const folder = await window.electronAPI.dialog.openFolder()
      console.log('Frontend: Ordner-Response:', folder)
      if (folder) {
        console.log('Frontend: Setze aktuelles Verzeichnis:', folder.path)
        setCurrentDirectory(folder.path)
        await loadDirectoryContents(folder.path)
      } else {
        console.log('Frontend: Kein Ordner ausgewählt')
      }
    } catch (error) {
      console.error('Frontend: Fehler beim Ordner-Auswahl:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ Fehler beim Öffnen des Ordner-Dialogs: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const loadDirectoryContents = async (dirPath: string) => {
    console.log('Frontend: Lade Verzeichnis-Inhalt für:', dirPath)
    setLoadingDirectory(true)
    try {
      const result = await window.electronAPI.fs.listDirectory(dirPath)
      console.log('Frontend: Verzeichnis-Response:', result)
      if (result.success) {
        console.log('Frontend: Gefundene Items:', result.items.length)
        setDirectoryItems(result.items)
      } else {
        console.error('Frontend: Fehler beim Laden des Verzeichnisses:', result.error)
        setDirectoryItems([])
      }
    } catch (error) {
      console.error('Frontend: Fehler beim Laden des Verzeichnisses:', error)
      setDirectoryItems([])
    } finally {
      setLoadingDirectory(false)
    }
  }

  const handleDirectoryItemClick = async (item: any) => {
    if (item.isDirectory) {
      setCurrentDirectory(item.path)
      await loadDirectoryContents(item.path)
    } else {
      // Datei auswählen
      try {
        const content = await window.electronAPI.file.read(item.path)
        if (content.success && content.content) {
          const fileType = item.extension === '.pst' ? 'pst' : 'document'
          setUploadedFile({
            name: item.name,
            content: content.content,
            path: item.path,
            type: fileType,
            size: item.size
          })
          
          const infoMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `📄 Datei "${item.name}" aus dem Dateisystem geladen.\n\nSie können jetzt Fragen zu dieser Datei stellen oder weitere Analysen durchführen.`,
            timestamp: new Date(),
            fileInfo: {
              name: item.name,
              type: fileType,
              size: item.size
            }
          }
          setMessages(prev => [...prev, infoMessage])
        }
      } catch (error) {
        console.error('Fehler beim Laden der Datei:', error)
      }
    }
  }

  const navigateUp = () => {
    if (currentDirectory) {
      const parentPath = currentDirectory.split('\\').slice(0, -1).join('\\')
      if (parentPath) {
        setCurrentDirectory(parentPath)
        loadDirectoryContents(parentPath)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">LocalLLM Desktop</h1>
              <p className="text-sm text-gray-500">Deutsche KI für Dokumente & Analyse</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Modell-Auswahl */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                disabled={!ollamaStatus.connected || loadingModels}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bot className="w-4 h-4" />
                <span className="font-medium">
                  {loadingModels ? 'Lädt...' : selectedModel}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showModelSelector && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Verfügbare Modelle</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {availableModels.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">
                        Keine Modelle verfügbar
                      </div>
                    ) : (
                      availableModels.map((model) => (
                        <button
                          key={model.name}
                          onClick={() => handleModelChange(model.name)}
                          className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            selectedModel === model.name ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <div className="font-medium text-sm">{model.name}</div>
                          <div className="text-xs text-gray-500">
                            {(model.size / 1024 / 1024 / 1024).toFixed(1)} GB
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Ollama Status */}
            <div className="flex items-center gap-2">
              {ollamaStatus.checking ? (
                <Loader className="w-4 h-4 text-gray-400 animate-spin" />
              ) : ollamaStatus.connected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {ollamaStatus.checking 
                  ? 'Prüfe...' 
                  : ollamaStatus.connected 
                    ? 'Verbunden' 
                    : 'Getrennt'
                }
              </span>
            </div>
            
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* File Operations */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Datei-Operationen</h3>
            
            <div className="space-y-2">
              {/* Document Upload */}
              <button
                onClick={handleFileUpload}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Dokument hochladen
              </button>
              
              {/* PST Upload */}
              <button
                onClick={handlePstUpload}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                PST-Datei laden
              </button>
            </div>
          </div>
          
          {/* Current File Info */}
          {uploadedFile && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Aktuelle Datei</h3>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {uploadedFile.type === 'pst' ? (
                    <Mail className="w-4 h-4 text-green-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.name}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {uploadedFile.type === 'pst' ? 'PST-Datei' : 'Dokument'} • {(uploadedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          )}
          
          {/* PST Search */}
          {uploadedFile && uploadedFile.type === 'pst' && (
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 mb-3">PST-Suche</h3>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pstSearchTerm}
                    onChange={(e) => setPstSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePstSearch()}
                    placeholder="Nach E-Mails suchen..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handlePstSearch}
                    disabled={searchingPst || !pstSearchTerm.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {searchingPst ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {/* Search Results */}
                {pstSearchResults.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Suchergebnisse ({pstSearchResults.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {pstSearchResults.map((result, index) => (
                        <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                          <div className="font-medium text-gray-900 truncate">
                            {result.subject}
                          </div>
                          <div className="text-gray-600 truncate">
                            {result.sender}
                          </div>
                          <div className="text-gray-500">
                            {result.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* File Browser placeholder */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Datei-Browser</h3>
              <button
                onClick={handleFolderSelect}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                title="Ordner auswählen"
              >
                <Folder className="w-3 h-3" />
              </button>
            </div>
            
            {currentDirectory && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                  <span className="truncate" title={currentDirectory}>
                    {currentDirectory.length > 30 
                      ? '...' + currentDirectory.slice(-27)
                      : currentDirectory
                    }
                  </span>
                </div>
                {currentDirectory.split('\\').length > 1 && (
                  <button
                    onClick={navigateUp}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mb-2"
                  >
                    <span>↑</span> Übergeordneter Ordner
                  </button>
                )}
              </div>
            )}
            
            <div className="space-y-1 max-h-64 overflow-y-auto text-xs">
              {loadingDirectory ? (
                <div className="flex items-center gap-2 py-2 text-gray-500">
                  <Loader className="w-3 h-3 animate-spin" />
                  <span>Lädt Verzeichnis...</span>
                </div>
              ) : directoryItems.length === 0 ? (
                <div className="text-gray-500 italic py-2">
                  {currentDirectory 
                    ? 'Verzeichnis ist leer' 
                    : 'Wählen Sie einen Ordner aus'
                  }
                </div>
              ) : (
                directoryItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleDirectoryItemClick(item)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 group"
                  >
                    <div className="flex items-center gap-2">
                      {item.isDirectory ? (
                        <Folder className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate group-hover:text-blue-700">
                          {item.name}
                        </div>
                        {!item.isDirectory && (
                          <div className="text-gray-500">
                            {(item.size / 1024).toFixed(1)} KB
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-6 px-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Willkommen bei LocalLLM Desktop
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Stellen Sie Fragen oder laden Sie Dokumente für die Analyse hoch. 
                  Ihre Daten bleiben lokal auf diesem Computer.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-3xl ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className={`flex-1 px-4 py-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                      {message.context && (
                        <div className="mt-2 pt-2 border-t border-blue-500/20">
                          <div className="text-xs opacity-75 flex items-center gap-1">
                            <File className="w-3 h-3" />
                            Kontext aus: {message.context}
                          </div>
                        </div>
                      )}
                      {message.fileInfo && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            {message.fileInfo.type === 'pst' ? (
                              <Mail className="w-3 h-3" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            {message.fileInfo.name} ({(message.fileInfo.size / 1024).toFixed(1)} KB)
                          </div>
                        </div>
                      )}
                      <div className="text-xs mt-1 opacity-50">
                        {message.timestamp.toLocaleTimeString('de-DE')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-3xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader className="w-4 h-4 animate-spin" />
                      KI denkt nach...
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-200">
            {/* File status */}
            {uploadedFile && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {uploadedFile.type === 'pst' ? (
                      <Mail className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-sm font-medium text-blue-900">
                      {uploadedFile.name}
                    </span>
                    <span className="text-xs text-blue-700">
                      ({uploadedFile.type === 'pst' ? 'PST-Datei' : 'Dokument'})
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={ollamaStatus.connected ? "Nachricht eingeben..." : "Warten auf Ollama-Verbindung..."}
                  disabled={!ollamaStatus.connected || isLoading}
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading || !ollamaStatus.connected}
                className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocalLLMApp
