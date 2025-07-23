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
  Folder,
  BookOpen,
  Mic,
  FileSearch,
  Brain,
  Lightbulb,
  Download,
  Eye,
  Filter,
  Star,
  Clock,
  Archive,
  PlusCircle,
  MinusCircle,
  RotateCcw,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react'

// Electron API Types (erweitert für Open Notebook Features)
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
        summarize: (content: string, type: 'brief' | 'detailed' | 'key-points') => Promise<{
          success: boolean
          summary?: string
          error?: string
        }>
        analyze: (content: string, analysisType: 'insights' | 'themes' | 'questions' | 'action-items') => Promise<{
          success: boolean
          analysis?: string
          error?: string
        }>
        generatePodcast: (content: string, style: 'informative' | 'conversational' | 'interview') => Promise<{
          success: boolean
          script?: string
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
        search: (searchTerm: string, directory: string) => Promise<{
          success: boolean
          results: Array<{
            path: string
            name: string
            matches: Array<{ line: number; text: string }>
          }>
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
      notebook: {
        analyzeAll: (directory: string) => Promise<{
          success: boolean
          analysis?: {
            totalDocuments: number
            totalSize: number
            fileTypes: Record<string, number>
            topics: string[]
            summary: string
          }
          error?: string
        }>
        createNotes: (content: string, title: string) => Promise<{
          success: boolean
          noteId?: string
          error?: string
        }>
        searchContent: (query: string, directory: string) => Promise<{
          success: boolean
          results: Array<{
            file: string
            relevance: number
            snippet: string
            path: string
          }>
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
  sourceFiles?: string[]
  analysisType?: 'chat' | 'summary' | 'insights' | 'notes' | 'podcast'
}

interface DocumentSource {
  id: string
  name: string
  path: string
  type: string
  size: number
  modified: string
  summary?: string
  analyzed: boolean
  content?: string
}

interface NotebookAnalysis {
  totalDocuments: number
  totalSize: number
  fileTypes: Record<string, number>
  topics: string[]
  summary: string
}

interface SearchResult {
  file: string
  relevance: number
  snippet: string
  path: string
}

interface Note {
  id: string
  title: string
  content: string
  sourceFiles: string[]
  created: Date
  tags: string[]
}

function OpenNotebookApp() {
  // Chat & Messages
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Ollama & Models
  const [ollamaStatus, setOllamaStatus] = useState({
    connected: false,
    checking: true
  })
  const [availableModels, setAvailableModels] = useState<Array<{ name: string; size: number }>>([])
  const [selectedModel, setSelectedModel] = useState<string>('phi4-mini:latest')
  const [loadingModels, setLoadingModels] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  
  // Document Sources (Open Notebook Core)
  const [currentDirectory, setCurrentDirectory] = useState<string>('')
  const [documentSources, setDocumentSources] = useState<DocumentSource[]>([])
  const [loadingDirectory, setLoadingDirectory] = useState(false)
  const [notebookAnalysis, setNotebookAnalysis] = useState<NotebookAnalysis | null>(null)
  const [analyzingNotebook, setAnalyzingNotebook] = useState(false)
  
  // Search & Notes
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  
  // UI State
  const [activePanel, setActivePanel] = useState<'sources' | 'notes' | 'chat'>('sources')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<'brief' | 'detailed' | 'key-points'>('brief')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    checkOllamaStatus()
    loadAvailableModels()
    loadSettings()
    const interval = setInterval(checkOllamaStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSettings = async () => {
    try {
      const settings = await window.electronAPI?.settings.get()
      if (settings?.ollama?.model) {
        setSelectedModel(settings.ollama.model)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error)
    }
  }

  const loadAvailableModels = async () => {
    if (!window.electronAPI) return
    
    setLoadingModels(true)
    try {
      const result = await window.electronAPI.ollama.models()
      if (result.success && result.models) {
        setAvailableModels(result.models)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Modelle:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  const checkOllamaStatus = async () => {
    if (!window.electronAPI) return
    
    setOllamaStatus(prev => ({ ...prev, checking: true }))
    try {
      const connected = await window.electronAPI.ollama.status()
      setOllamaStatus({ connected, checking: false })
    } catch (error) {
      setOllamaStatus({ 
        connected: false, 
        checking: false
      })
    }
  }

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return
    
    try {
      const result = await window.electronAPI.dialog.openFolder()
      if (result && result.path) {
        setCurrentDirectory(result.path)
        await loadDirectoryContents(result.path)
        await analyzeNotebook(result.path)
      }
    } catch (error) {
      console.error('Fehler beim Öffnen des Ordners:', error)
    }
  }

  const loadDirectoryContents = async (directory: string) => {
    setLoadingDirectory(true)
    try {
      const result = await window.electronAPI.fs.listDirectory(directory)
      if (result.success && result.items) {
        const documents: DocumentSource[] = result.items
          .filter(item => !item.isDirectory && ['.txt', '.md', '.pdf', '.docx', '.json'].includes(item.extension))
          .map(item => ({
            id: item.path,
            name: item.name,
            path: item.path,
            type: item.extension,
            size: item.size,
            modified: item.modified,
            analyzed: false
          }))
        setDocumentSources(documents)
      }
    } catch (error) {
      console.error('Fehler beim Laden des Verzeichnisses:', error)
    } finally {
      setLoadingDirectory(false)
    }
  }

  const analyzeNotebook = async (directory: string) => {
    if (!window.electronAPI.notebook) return
    
    setAnalyzingNotebook(true)
    try {
      const result = await window.electronAPI.notebook.analyzeAll(directory)
      if (result.success && result.analysis) {
        setNotebookAnalysis(result.analysis)
      }
    } catch (error) {
      console.error('Fehler bei der Notebook-Analyse:', error)
    } finally {
      setAnalyzingNotebook(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentDirectory) return
    
    setSearching(true)
    try {
      const result = await window.electronAPI.notebook.searchContent(searchQuery, currentDirectory)
      if (result.success && result.results) {
        setSearchResults(result.results)
      }
    } catch (error) {
      console.error('Fehler bei der Suche:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleDocumentSummary = async (document: DocumentSource, type: 'brief' | 'detailed' | 'key-points') => {
    if (!document.content) {
      // Lade Dokumentinhalt falls noch nicht geladen
      try {
        const result = await window.electronAPI.file.read(document.path)
        if (result.success && result.content) {
          document.content = result.content
        }
      } catch (error) {
        console.error('Fehler beim Laden des Dokuments:', error)
        return
      }
    }

    setIsLoading(true)
    try {
      const result = await window.electronAPI.ollama.summarize(document.content, type)
      if (result.success && result.summary) {
        const summaryMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: result.summary,
          timestamp: new Date(),
          sourceFiles: [document.name],
          analysisType: 'summary'
        }
        setMessages(prev => [...prev, summaryMessage])
        document.summary = result.summary
        document.analyzed = true
        setDocumentSources(prev => prev.map(d => d.id === document.id ? document : d))
      }
    } catch (error) {
      console.error('Fehler bei der Zusammenfassung:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateInsights = async () => {
    const selectedDocs = documentSources.filter(doc => selectedSources.includes(doc.id))
    if (selectedDocs.length === 0) return
    
    setIsLoading(true)
    try {
      const combinedContent = selectedDocs
        .map(doc => `--- ${doc.name} ---\n${doc.content || doc.summary || ''}`)
        .join('\n\n')
      
      const result = await window.electronAPI.ollama.analyze(combinedContent, 'insights')
      if (result.success && result.analysis) {
        const insightMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: result.analysis,
          timestamp: new Date(),
          sourceFiles: selectedDocs.map(d => d.name),
          analysisType: 'insights'
        }
        setMessages(prev => [...prev, insightMessage])
      }
    } catch (error) {
      console.error('Fehler bei der Insight-Generierung:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePodcast = async () => {
    const selectedDocs = documentSources.filter(doc => selectedSources.includes(doc.id))
    if (selectedDocs.length === 0) return
    
    setIsLoading(true)
    try {
      const combinedContent = selectedDocs
        .map(doc => `--- ${doc.name} ---\n${doc.content || doc.summary || ''}`)
        .join('\n\n')
      
      const result = await window.electronAPI.ollama.generatePodcast(combinedContent, 'conversational')
      if (result.success && result.script) {
        const podcastMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: result.script,
          timestamp: new Date(),
          sourceFiles: selectedDocs.map(d => d.name),
          analysisType: 'podcast'
        }
        setMessages(prev => [...prev, podcastMessage])
      }
    } catch (error) {
      console.error('Fehler bei der Podcast-Generierung:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading || !ollamaStatus.connected) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    try {
      // Kontext aus ausgewählten Dokumenten
      const selectedDocs = documentSources.filter(doc => selectedSources.includes(doc.id))
      const context = selectedDocs.length > 0 
        ? selectedDocs.map(doc => `${doc.name}: ${doc.summary || doc.content || ''}`).join('\n\n')
        : ''

      const result = await window.electronAPI.ollama.chat(currentMessage, context)
      
      if (result.success && result.response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.response,
          timestamp: new Date(),
          context: context || undefined,
          sourceFiles: selectedDocs.map(d => d.name),
          analysisType: 'chat'
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatModelSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case '.pdf': return <FileText className="w-4 h-4 text-red-500" />
      case '.docx': return <FileText className="w-4 h-4 text-blue-500" />
      case '.txt': case '.md': return <FileText className="w-4 h-4 text-gray-500" />
      case '.json': return <FileText className="w-4 h-4 text-green-500" />
      default: return <File className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SOURCES PANEL - Open Notebook Style */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Dokumente
            </h2>
            <button
              onClick={handleSelectFolder}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Ordner wählen
            </button>
          </div>
          
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Durchsuche alle Dokumente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {searching ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Directory Info */}
        {currentDirectory && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Aktueller Ordner:</div>
            <div className="text-sm font-medium truncate">{currentDirectory}</div>
            
            {notebookAnalysis && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded">
                  <div className="font-medium">{notebookAnalysis.totalDocuments}</div>
                  <div className="text-gray-500">Dokumente</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="font-medium">{formatFileSize(notebookAnalysis.totalSize)}</div>
                  <div className="text-gray-500">Größe</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto">
          {loadingDirectory ? (
            <div className="p-4 text-center">
              <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
              <div className="text-sm text-gray-500">Lade Dokumente...</div>
            </div>
          ) : documentSources.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <div className="text-sm">Wähle einen Ordner mit Dokumenten</div>
            </div>
          ) : (
            <div className="p-2">
              {documentSources.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 mb-2 border rounded-lg cursor-pointer transition-all ${
                    selectedSources.includes(doc.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedSources(prev => 
                      prev.includes(doc.id)
                        ? prev.filter(id => id !== doc.id)
                        : [...prev, doc.id]
                    )
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-1">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{doc.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(doc.size)} • {new Date(doc.modified).toLocaleDateString()}
                      </div>
                      {doc.analyzed && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Analysiert</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDocumentSummary(doc, 'brief')
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Zusammenfassung
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDocumentSummary(doc, 'key-points')
                      }}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Key Points
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Actions */}
        {selectedSources.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm font-medium mb-2">
              {selectedSources.length} Dokument(e) ausgewählt
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateInsights}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-1"
              >
                <Brain className="w-4 h-4" />
                Insights
              </button>
              <button
                onClick={handleGeneratePodcast}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-1"
              >
                <Volume2 className="w-4 h-4" />
                Podcast
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CHAT PANEL */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Open Notebook LLM</h1>
            
            {/* Ollama Status */}
            <div className="flex items-center gap-2">
              {ollamaStatus.checking ? (
                <Loader className="w-4 h-4 animate-spin text-gray-400" />
              ) : ollamaStatus.connected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${
                ollamaStatus.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {ollamaStatus.connected ? 'Ollama verbunden' : 'Ollama getrennt'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                disabled={loadingModels || !ollamaStatus.connected}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {selectedModel.split(':')[0]}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showModelSelector && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-700">Verfügbare Modelle</div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {loadingModels ? (
                      <div className="p-4 text-center">
                        <Loader className="w-4 h-4 animate-spin mx-auto mb-2" />
                        <div className="text-sm text-gray-500">Lade Modelle...</div>
                      </div>
                    ) : availableModels.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Keine Modelle verfügbar
                      </div>
                    ) : (
                      availableModels.map((model) => (
                        <button
                          key={model.name}
                          onClick={() => {
                            setSelectedModel(model.name)
                            setShowModelSelector(false)
                          }}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                            selectedModel === model.name ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <div className="font-medium text-sm">{model.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatModelSize(model.size)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Willkommen bei Open Notebook LLM!</h3>
              <p className="text-sm max-w-md mx-auto">
                Wähle Dokumente aus der Seitenleiste und starte ein intelligentes Gespräch über deren Inhalte.
                Oder nutze die Analyse-Tools für Zusammenfassungen und Insights.
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
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-3xl ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md' 
                    : 'bg-white border border-gray-200 rounded-2xl rounded-tl-md'
                } p-4 shadow-sm`}>
                  
                  {/* Analysis Type Badge */}
                  {message.analysisType && message.analysisType !== 'chat' && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        message.analysisType === 'summary' ? 'bg-blue-100 text-blue-700' :
                        message.analysisType === 'insights' ? 'bg-purple-100 text-purple-700' :
                        message.analysisType === 'podcast' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {message.analysisType === 'summary' && <FileText className="w-3 h-3" />}
                        {message.analysisType === 'insights' && <Brain className="w-3 h-3" />}
                        {message.analysisType === 'podcast' && <Volume2 className="w-3 h-3" />}
                        {message.analysisType === 'notes' && <Lightbulb className="w-3 h-3" />}
                        {message.analysisType.charAt(0).toUpperCase() + message.analysisType.slice(1)}
                      </span>
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className={`prose max-w-none ${
                    message.type === 'user' ? 'prose-invert' : ''
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                  
                  {/* Source Files */}
                  {message.sourceFiles && message.sourceFiles.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Quellen:</div>
                      <div className="flex flex-wrap gap-1">
                        {message.sourceFiles.map((file, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            <File className="w-3 h-3" />
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div className="mt-2 text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-gray-600">Denke nach...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-6">
          {selectedSources.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700 mb-1">
                Kontext: {selectedSources.length} Dokument(e) ausgewählt
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedSources.slice(0, 3).map((sourceId) => {
                  const doc = documentSources.find(d => d.id === sourceId)
                  return doc ? (
                    <span key={sourceId} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {doc.name}
                    </span>
                  ) : null
                })}
                {selectedSources.length > 3 && (
                  <span className="text-xs text-blue-600">
                    +{selectedSources.length - 3} weitere
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={
                  selectedSources.length > 0 
                    ? `Frage etwas über die ausgewählten Dokumente...`
                    : `Schreibe eine Nachricht...`
                }
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={!ollamaStatus.connected}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading || !ollamaStatus.connected}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results Overlay */}
      {searchResults.length > 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Suchergebnisse</h3>
              <button
                onClick={() => setSearchResults([])}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="font-medium text-sm mb-1">{result.file}</div>
                    <div className="text-sm text-gray-600 mb-2">{result.snippet}</div>
                    <div className="text-xs text-gray-500">
                      Relevanz: {Math.round(result.relevance * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OpenNotebookApp
