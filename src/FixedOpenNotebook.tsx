import { useState, useEffect, useRef } from 'react'
import { 
  MessageCircle, 
  Settings, 
  Send, 
  Bot, 
  User,
  CheckCircle,
  XCircle,
  Loader,
  FileText,
  Search,
  ChevronDown,
  X,
  Folder,
  BookOpen,
  Brain
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: string
}

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  extension: string
  modified: string
}

function FixedOpenNotebook() {
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Ollama State
  const [ollamaStatus, setOllamaStatus] = useState({
    connected: false,
    checking: true
  })
  const [availableModels, setAvailableModels] = useState<Array<{ name: string; size: number }>>([])
  const [selectedModel, setSelectedModel] = useState<string>('phi4-mini:latest')
  const [loadingModels, setLoadingModels] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  
  // Directory & Files State
  const [currentDirectory, setCurrentDirectory] = useState<string>('')
  const [currentDirectoryName, setCurrentDirectoryName] = useState<string>('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loadingDirectory, setLoadingDirectory] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  
  // Open Notebook Features
  const [notebookAnalysis, setNotebookAnalysis] = useState<any>(null)
  const [analyzingNotebook, setAnalyzingNotebook] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  // UI State
  const [activePanel, setActivePanel] = useState<'chat' | 'sources' | 'analysis'>('chat')
  const [showSettings, setShowSettings] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load initial data
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

  const checkOllamaStatus = async () => {
    if (!window.electronAPI) return
    
    setOllamaStatus(prev => ({ ...prev, checking: true }))
    try {
      const connected = await window.electronAPI.ollama.status()
      setOllamaStatus({ connected, checking: false })
    } catch (error) {
      console.error('Fehler beim Prüfen des Ollama Status:', error)
      setOllamaStatus({ connected: false, checking: false })
    }
  }

  const loadAvailableModels = async () => {
    if (!window.electronAPI) return
    
    setLoadingModels(true)
    try {
      const result = await window.electronAPI.ollama.models()
      console.log('Models loaded:', result)
      
      if (result.success && result.models) {
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

  const loadSettings = async () => {
    if (!window.electronAPI) return
    
    try {
      const settings = await window.electronAPI.settings.get()
      if (settings?.ollama?.model) {
        setSelectedModel(settings.ollama.model)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error)
    }
  }

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return
    
    setLoadingDirectory(true)
    try {
      const result = await window.electronAPI.dialog.openFolder()
      console.log('Folder selected:', result)
      
      if (result && result.path) {
        setCurrentDirectory(result.path)
        setCurrentDirectoryName(result.name)
        await loadDirectoryContents(result.path)
        await analyzeNotebook(result.path)
      }
    } catch (error) {
      console.error('Fehler beim Öffnen des Ordners:', error)
    } finally {
      setLoadingDirectory(false)
    }
  }

  const loadDirectoryContents = async (directory: string) => {
    if (!window.electronAPI) return
    
    try {
      const result = await window.electronAPI.fs.listDirectory(directory)
      console.log('Directory contents:', result)
      
      if (result.success && result.items) {
        setFiles(result.items)
      } else {
        console.error('Fehler beim Laden des Verzeichnisses:', result.error)
      }
    } catch (error) {
      console.error('Fehler beim Laden des Verzeichnisses:', error)
    }
  }

  const analyzeNotebook = async (directory: string) => {
    if (!window.electronAPI) return
    
    setAnalyzingNotebook(true)
    try {
      const result = await window.electronAPI.notebook.analyzeAll(directory)
      console.log('Notebook analysis:', result)
      
      if (result.success && result.analysis) {
        setNotebookAnalysis(result.analysis)
      } else {
        console.error('Fehler bei der Notebook-Analyse:', result.error)
      }
    } catch (error) {
      console.error('Fehler bei der Notebook-Analyse:', error)
    } finally {
      setAnalyzingNotebook(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading || !window.electronAPI) return

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
      // Kontext aus ausgewählten Dateien erstellen
      let context = ''
      if (selectedFiles.length > 0) {
        const contextFiles = []
        for (const filePath of selectedFiles) {
          try {
            const fileResult = await window.electronAPI.file.read(filePath)
            if (fileResult.success && fileResult.content) {
              contextFiles.push(`Datei: ${filePath}\n${fileResult.content}`)
            }
          } catch (error) {
            console.error('Fehler beim Lesen der Datei:', filePath, error)
          }
        }
        context = contextFiles.join('\n\n---\n\n')
      }

      // Modell-Einstellung speichern
      await window.electronAPI.settings.set('ollama.model', selectedModel)

      const result = await window.electronAPI.ollama.chat(userMessage.content, context)
      
      if (result.success && result.response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.response,
          timestamp: new Date(),
          context: context ? `Kontext aus ${selectedFiles.length} Datei(en)` : undefined
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(result.error || 'Unbekannter Fehler')
      }
    } catch (error) {
      console.error('Chat Fehler:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath)
        ? prev.filter(f => f !== filePath)
        : [...prev, filePath]
    )
  }

  const handleSearchContent = async () => {
    if (!searchQuery.trim() || !currentDirectory || !window.electronAPI) return
    
    setSearching(true)
    try {
      const result = await window.electronAPI.notebook.searchContent(searchQuery, currentDirectory)
      console.log('Search results:', result)
      
      if (result.success && result.results) {
        setSearchResults(result.results)
      } else {
        console.error('Fehler bei der Suche:', result.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Fehler bei der Suche:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleModelChange = async (modelName: string) => {
    setSelectedModel(modelName)
    setShowModelSelector(false)
    try {
      await window.electronAPI?.settings.set('ollama.model', modelName)
    } catch (error) {
      console.error('Fehler beim Speichern des Modells:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600">Open Notebook LLM</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Settings size={20} />
            </button>
          </div>
          
          {/* Ollama Status */}
          <div className="mt-3 flex items-center space-x-2">
            {ollamaStatus.checking ? (
              <Loader className="animate-spin" size={16} />
            ) : ollamaStatus.connected ? (
              <CheckCircle className="text-green-500" size={16} />
            ) : (
              <XCircle className="text-red-500" size={16} />
            )}
            <span className="text-sm">
              {ollamaStatus.checking ? 'Prüfe...' : 
               ollamaStatus.connected ? 'Ollama verbunden' : 'Ollama getrennt'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'chat', label: 'Chat', icon: MessageCircle },
            { key: 'sources', label: 'Quellen', icon: Folder },
            { key: 'analysis', label: 'Analyse', icon: Brain }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key as any)}
              className={`flex-1 p-3 text-sm font-medium border-b-2 ${
                activePanel === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} className="mx-auto mb-1" />
              {label}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {activePanel === 'chat' && (
            <div className="p-4">
              {/* Model Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Modell</label>
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="w-full p-2 text-left bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-between"
                    disabled={loadingModels}
                  >
                    <span className="truncate">
                      {loadingModels ? 'Lade Modelle...' : selectedModel}
                    </span>
                    <ChevronDown size={16} />
                  </button>
                  
                  {showModelSelector && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableModels.map((model) => (
                        <button
                          key={model.name}
                          onClick={() => handleModelChange(model.name)}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(model.size)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Ausgewählte Dateien ({selectedFiles.length})
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedFiles.map((filePath) => (
                      <div key={filePath} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                        <span className="truncate">{filePath.split('/').pop()}</span>
                        <button
                          onClick={() => handleFileSelect(filePath)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activePanel === 'sources' && (
            <div className="p-4">
              {/* Folder Selection */}
              <button
                onClick={handleSelectFolder}
                disabled={loadingDirectory}
                className="w-full p-3 mb-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loadingDirectory ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <Folder size={16} />
                )}
                <span>
                  {loadingDirectory ? 'Lade...' : 'Notebook öffnen'}
                </span>
              </button>

              {/* Current Directory */}
              {currentDirectoryName && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium">Aktueller Ordner:</div>
                  <div className="text-sm text-gray-600 truncate">{currentDirectoryName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {files.length} Dateien
                  </div>
                </div>
              )}

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium mb-2">Dateien</label>
                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {files.map((file) => (
                      <div
                        key={file.path}
                        className={`p-2 rounded cursor-pointer border ${
                          selectedFiles.includes(file.path)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleFileSelect(file.path)}
                      >
                        <div className="flex items-center space-x-2">
                          {file.isDirectory ? (
                            <Folder size={16} className="text-blue-500" />
                          ) : (
                            <FileText size={16} className="text-gray-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{file.name}</div>
                            {!file.isDirectory && (
                              <div className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • {file.extension}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activePanel === 'analysis' && (
            <div className="p-4">
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Content-Suche</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suche in Dokumenten..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchContent()}
                  />
                  <button
                    onClick={handleSearchContent}
                    disabled={searching || !currentDirectory}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {searching ? <Loader className="animate-spin" size={16} /> : <Search size={16} />}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Suchergebnisse ({searchResults.length})
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div key={index} className="p-3 bg-white border border-gray-200 rounded">
                        <div className="text-sm font-medium">{result.file}</div>
                        <div className="text-xs text-gray-600 mt-1">{result.snippet}</div>
                        <div className="text-xs text-blue-500 mt-1">
                          Relevanz: {(result.relevance * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notebook Analysis */}
              {notebookAnalysis && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Notebook-Analyse</label>
                  <div className="p-3 bg-white border border-gray-200 rounded">
                    <div className="text-sm">
                      <div><strong>Dokumente:</strong> {notebookAnalysis.totalDocuments}</div>
                      <div><strong>Größe:</strong> {formatFileSize(notebookAnalysis.totalSize)}</div>
                      <div><strong>Themen:</strong> {notebookAnalysis.topics.join(', ') || 'Keine erkannt'}</div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {notebookAnalysis.summary}
                    </div>
                  </div>
                </div>
              )}

              {analyzingNotebook && (
                <div className="flex items-center justify-center p-4">
                  <Loader className="animate-spin mr-2" size={16} />
                  <span className="text-sm">Analysiere Notebook...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Chat mit {selectedModel}</h2>
              <div className="text-sm text-gray-500">
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} Datei(en) als Kontext`
                  : 'Keine Dateien ausgewählt'
                }
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {ollamaStatus.connected ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <XCircle className="text-red-500" size={20} />
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">Willkommen bei Open Notebook LLM</p>
              <p>Wählen Sie Dateien aus und starten Sie ein Gespräch!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl p-4 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    {message.type === 'assistant' && (
                      <Bot size={20} className="mt-1 text-blue-500" />
                    )}
                    {message.type === 'user' && (
                      <User size={20} className="mt-1" />
                    )}
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.context && (
                        <div className="text-xs mt-2 opacity-75">
                          {message.context}
                        </div>
                      )}
                      <div className="text-xs mt-2 opacity-75">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bot size={20} className="text-blue-500" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Nachricht eingeben..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading || !ollamaStatus.connected}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
              <span>Senden</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FixedOpenNotebook
