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
  ChevronDown,
  X,
  Folder,
  BookOpen,
  Brain,
  Lightbulb,
  Download,
  Eye,
  Filter
} from 'lucide-react'

// TypeScript definitions für Electron API
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
          models?: Array<{ name: string; size: number }>
          error?: string
        }>
        summarize: (content: string, type: string) => Promise<{
          success: boolean
          summary?: string
          error?: string
        }>
        analyze: (content: string, analysisType: string) => Promise<{
          success: boolean
          analysis?: string
          error?: string
        }>
        generatePodcast: (content: string, style: string) => Promise<{
          success: boolean
          script?: string
          error?: string
        }>
      }
      dialog: {
        openFile: (filters?: any) => Promise<any>
        openFolder: () => Promise<{ path: string; name: string } | null>
      }
      fs: {
        listDirectory: (path: string) => Promise<{
          success: boolean
          items?: Array<{
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
      file: {
        read: (path: string) => Promise<{
          success: boolean
          content?: string
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
        searchContent: (query: string, directory: string) => Promise<{
          success: boolean
          results?: Array<{
            file: string
            relevance: number
            snippet: string
            path: string
          }>
          error?: string
        }>
      }
      settings: {
        get: (key?: string) => Promise<any>
        set: (key: string, value: any) => Promise<boolean>
      }
    }
  }
}
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

function SimpleOpenNotebook() {
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
  
  // Documents
  const [currentDirectory, setCurrentDirectory] = useState<string>('')
  const [documentSources, setDocumentSources] = useState<DocumentSource[]>([])
  const [loadingDirectory, setLoadingDirectory] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    checkOllamaStatus()
    loadAvailableModels()
    const interval = setInterval(checkOllamaStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkOllamaStatus = async () => {
    if (!window.electronAPI) {
      console.error('electronAPI nicht verfügbar!')
      return
    }
    
    setOllamaStatus(prev => ({ ...prev, checking: true }))
    try {
      const connected = await window.electronAPI.ollama.status()
      console.log('Ollama Status:', connected)
      setOllamaStatus({ connected, checking: false })
    } catch (error) {
      console.error('Ollama Status Error:', error)
      setOllamaStatus({ connected: false, checking: false })
    }
  }

  const loadAvailableModels = async () => {
    if (!window.electronAPI) return
    
    setLoadingModels(true)
    try {
      console.log('Lade Modelle...')
      const result = await window.electronAPI.ollama.models()
      console.log('Modelle Result:', result)
      
      if (result.success && result.models) {
        console.log('Gefundene Modelle:', result.models.length)
        setAvailableModels(result.models)
      } else {
        console.error('Fehler beim Laden der Modelle:', result.error)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Modelle:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return
    
    try {
      console.log('Öffne Ordner-Dialog...')
      const result = await window.electronAPI.dialog.openFolder()
      console.log('Ordner-Dialog Result:', result)
      
      if (result && result.path) {
        setCurrentDirectory(result.path)
        await loadDirectoryContents(result.path)
      }
    } catch (error) {
      console.error('Fehler beim Öffnen des Ordners:', error)
    }
  }

  const loadDirectoryContents = async (directory: string) => {
    setLoadingDirectory(true)
    try {
      console.log('Lade Verzeichnis-Inhalt:', directory)
      const result = await window.electronAPI.fs.listDirectory(directory)
      console.log('Verzeichnis Result:', result)
      
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
        
        console.log('Gefundene Dokumente:', documents.length)
        setDocumentSources(documents)
      }
    } catch (error) {
      console.error('Fehler beim Laden des Verzeichnisses:', error)
    } finally {
      setLoadingDirectory(false)
    }
  }

  const handleDocumentSummary = async (document: DocumentSource, type: 'brief' | 'detailed' | 'key-points') => {
    console.log('Erstelle Zusammenfassung für:', document.name, 'Typ:', type)
    
    if (!document.content) {
      // Lade Dokumentinhalt
      try {
        const result = await window.electronAPI.file.read(document.path)
        if (result.success && result.content) {
          document.content = result.content
        } else {
          console.error('Fehler beim Laden des Dokuments:', result.error)
          return
        }
      } catch (error) {
        console.error('Fehler beim Laden des Dokuments:', error)
        return
      }
    }

    setIsLoading(true)
    try {
      const result = await window.electronAPI.ollama.summarize(document.content, type)
      console.log('Zusammenfassung Result:', result)
      
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
      } else {
        console.error('Fehler bei der Zusammenfassung:', result.error)
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
    
    console.log('Generiere Insights für', selectedDocs.length, 'Dokumente')
    setIsLoading(true)
    
    try {
      // Lade Content für alle ausgewählten Dokumente
      for (const doc of selectedDocs) {
        if (!doc.content) {
          const result = await window.electronAPI.file.read(doc.path)
          if (result.success && result.content) {
            doc.content = result.content
          }
        }
      }
      
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
      {/* SOURCES PANEL */}
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
        </div>

        {/* Directory Info */}
        {currentDirectory && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Aktueller Ordner:</div>
            <div className="text-sm font-medium truncate" title={currentDirectory}>
              {currentDirectory}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {documentSources.length} Dokumente gefunden
            </div>
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
                      <div className="font-medium text-sm truncate" title={doc.name}>
                        {doc.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(doc.size)} • {new Date(doc.modified).toLocaleDateString('de-DE')}
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
                      disabled={isLoading}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      Zusammenfassung
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDocumentSummary(doc, 'key-points')
                      }}
                      disabled={isLoading}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
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
                    <div className="text-sm font-medium text-gray-700">Verfügbare Modelle ({availableModels.length})</div>
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
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {message.analysisType === 'summary' && <FileText className="w-3 h-3" />}
                        {message.analysisType === 'insights' && <Brain className="w-3 h-3" />}
                        {message.analysisType.charAt(0).toUpperCase() + message.analysisType.slice(1)}
                      </span>
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
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
                    {message.timestamp.toLocaleTimeString('de-DE')}
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
    </div>
  )
}

export default SimpleOpenNotebook
