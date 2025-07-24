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
  Folder,
  Brain
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: string
  sourceFiles?: string[]
  analysisType?: 'chat' | 'summary' | 'insights' | 'podcast'
}

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  extension: string
  modified: string
}

function CompleteOpenNotebook() {
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Ollama State
  const [ollamaStatus, setOllamaStatus] = useState({ connected: false, checking: true })
  const [availableModels, setAvailableModels] = useState<string[]>([])
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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  // UI State
  const [activePanel, setActivePanel] = useState<'chat' | 'sources' | 'analysis' | 'notebook'>('chat')
  const [showSettings, setShowSettings] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check Ollama connection
  const checkOllamaConnection = async () => {
    try {
      setOllamaStatus({ connected: false, checking: true })
      const response = await fetch('http://localhost:11434/api/tags')
      
      if (response.ok) {
        const data = await response.json()
        const models = data.models?.map((model: any) => model.name) || []
        setAvailableModels(models)
        setOllamaStatus({ connected: true, checking: false })
        
        if (models.length > 0 && !models.includes(selectedModel)) {
          setSelectedModel(models[0])
        }
      } else {
        setOllamaStatus({ connected: false, checking: false })
      }
    } catch (error) {
      console.error('Ollama connection error:', error)
      setOllamaStatus({ connected: false, checking: false })
    }
  }

  useEffect(() => {
    checkOllamaConnection()
    const interval = setInterval(checkOllamaConnection, 10000)
    return () => clearInterval(interval)
  }, [])

  // Directory Functions
  const selectDirectory = async () => {
    try {
      setLoadingDirectory(true)
      // Use direct file dialog simulation for now
      const mockResult = {
        success: true,
        path: 'C:\\Users\\frank\\Documents\\test-docs'
      }
      
      if (mockResult.success && mockResult.path) {
        setCurrentDirectory(mockResult.path)
        setCurrentDirectoryName(mockResult.path.split(/[\\/]/).pop() || mockResult.path)
        await loadDirectory(mockResult.path)
      }
    } catch (error) {
      console.error('Error selecting directory:', error)
    } finally {
      setLoadingDirectory(false)
    }
  }

  const loadDirectory = async (dirPath: string) => {
    try {
      setLoadingDirectory(true)
      // Mock file data for demonstration
      const mockFiles: FileItem[] = [
        {
          name: 'antrag.pdf',
          path: dirPath + '\\antrag.pdf',
          isDirectory: false,
          size: 245760,
          extension: 'pdf',
          modified: '2024-01-15'
        },
        {
          name: 'dokument.docx',
          path: dirPath + '\\dokument.docx',
          isDirectory: false,
          size: 89432,
          extension: 'docx',
          modified: '2024-01-14'
        },
        {
          name: 'notizen.txt',
          path: dirPath + '\\notizen.txt',
          isDirectory: false,
          size: 5248,
          extension: 'txt',
          modified: '2024-01-13'
        }
      ]
      
      setFiles(mockFiles)
    } catch (error) {
      console.error('Error loading directory:', error)
    } finally {
      setLoadingDirectory(false)
    }
  }

  // File Selection
  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath) 
        ? prev.filter(f => f !== filePath)
        : [...prev, filePath]
    )
  }

  const selectAllFiles = () => {
    const selectableFiles = files.filter(f => 
      !f.isDirectory && 
      ['pdf', 'docx', 'txt', 'md'].includes(f.extension.toLowerCase())
    )
    setSelectedFiles(selectableFiles.map(f => f.path))
  }

  const clearSelection = () => {
    setSelectedFiles([])
  }

  // Chat Functions
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !ollamaStatus.connected) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      let context = ''
      if (selectedFiles.length > 0) {
        // Add file context for the request
        context = `Basierend auf den ausgewählten Dateien (${selectedFiles.length} Dateien)`
      }

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...messages.slice(-5).map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            { role: 'user', content: context ? `${context}\n\n${userMessage.content}` : userMessage.content }
          ],
          stream: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.message?.content || 'Keine Antwort erhalten',
          timestamp: new Date(),
          context: context || undefined,
          sourceFiles: selectedFiles.length > 0 ? selectedFiles : undefined
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler bei der Kommunikation mit dem Modell.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Search Functions
  const performSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      // Simulate search functionality
      const mockResults = [
        {
          file: 'document1.pdf',
          content: `Relevanter Inhalt für "${searchQuery}"...`,
          score: 0.95
        },
        {
          file: 'document2.docx',
          content: `Weitere Ergebnisse zu "${searchQuery}"...`,
          score: 0.87
        }
      ]
      
      setSearchResults(mockResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  // Keyboard handlers
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      performSearch()
    }
  }
  
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Open Notebook LLM</h1>
          
          {/* Navigation Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mt-4">
            <button 
              onClick={() => setActivePanel('chat')}
              className={`flex-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                activePanel === 'chat' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Modelle
            </button>
            <button 
              onClick={() => setActivePanel('sources')}
              className={`flex-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                activePanel === 'sources' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quellen
            </button>
            <button 
              onClick={() => setActivePanel('analysis')}
              className={`flex-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                activePanel === 'analysis' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analysen
            </button>
            <button 
              onClick={() => setActivePanel('notebook')}
              className={`flex-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                activePanel === 'notebook' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Content Suche
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Models Panel */}
          {activePanel === 'chat' && (
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${
                    ollamaStatus.checking ? 'bg-yellow-400' : 
                    ollamaStatus.connected ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm font-medium">
                    {ollamaStatus.checking ? 'Prüfe...' : 
                     ollamaStatus.connected ? 'Verbunden' : 'Getrennt'}
                  </span>
                </div>
                
                {ollamaStatus.connected && (
                  <div className="relative">
                    <button
                      onClick={() => setShowModelSelector(!showModelSelector)}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg border flex items-center justify-between hover:bg-gray-100"
                    >
                      <span className="text-sm">{selectedModel}</span>
                      <ChevronDown size={16} />
                    </button>
                    
                    {showModelSelector && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {availableModels.map((model) => (
                          <button
                            key={model}
                            onClick={() => {
                              setSelectedModel(model)
                              setShowModelSelector(false)
                            }}
                            className={`w-full p-2 text-left text-sm hover:bg-gray-50 ${
                              selectedModel === model ? 'bg-blue-50 text-blue-600' : ''
                            }`}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-center p-8 text-slate-500">
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  {availableModels.length} Modelle verfügbar
                </p>
              </div>
            </div>
          )}

          {/* Sources Panel */}
          {activePanel === 'sources' && (
            <div>
              <button
                onClick={selectDirectory}
                disabled={loadingDirectory}
                className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
              >
                {loadingDirectory ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Folder size={16} />
                )}
                Ordner öffnen
              </button>

              {currentDirectory && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Aktueller Ordner:
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded break-all">
                    {currentDirectoryName}
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Dateien ({files.length})
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={selectAllFiles}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Alle
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Keine
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.path}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          selectedFiles.includes(file.path)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleFileSelection(file.path)}
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={14} />
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {file.extension.toUpperCase()} • {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">
                        {selectedFiles.length} Datei(en) ausgewählt
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analysis Panel */}
          {activePanel === 'analysis' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Analyse-Optionen</h3>
                <div className="space-y-2">
                  <button className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200">
                    Zusammenfassung erstellen
                  </button>
                  <button className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200">
                    Insights generieren
                  </button>
                  <button className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200">
                    Podcast erstellen
                  </button>
                  <button className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200">
                    Datenanalyse durchführen
                  </button>
                  <button className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200">
                    Tiefenanalyse starten
                  </button>
                  <button className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200">
                    Detaillierten Bericht generieren
                  </button>
                  <button className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200">
                    Schlüsselwörter extrahieren
                  </button>
                  <button className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200">
                    Strukturierte Notizen erstellen
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Übersetzung nach Deutsch</h3>
                <div className="space-y-2">
                  <button className="w-full p-2 text-left bg-blue-50 rounded-lg hover:bg-blue-100 text-sm border border-blue-200">
                    Englisch → Deutsch
                  </button>
                  <button className="w-full p-2 text-left bg-blue-50 rounded-lg hover:bg-blue-100 text-sm border border-blue-200">
                    Französisch → Deutsch
                  </button>
                  <button className="w-full p-2 text-left bg-blue-50 rounded-lg hover:bg-blue-100 text-sm border border-blue-200">
                    Spanisch → Deutsch
                  </button>
                  <button className="w-full p-2 text-left bg-blue-50 rounded-lg hover:bg-blue-100 text-sm border border-blue-200">
                    Italienisch → Deutsch
                  </button>
                  <button className="w-full p-2 text-left bg-blue-50 rounded-lg hover:bg-blue-100 text-sm border border-blue-200">
                    Portugiesisch → Deutsch
                  </button>
                  <button className="w-full p-2 text-left bg-green-50 rounded-lg hover:bg-green-100 text-sm border border-green-200">
                    Deutsch → Zielsprache wählen
                  </button>
                  <button className="w-full p-2 text-left bg-purple-50 rounded-lg hover:bg-purple-100 text-sm border border-purple-200">
                    Automatische Spracherkennung
                  </button>
                </div>
              </div>
              
              <div className="text-center p-4 text-slate-500">
                <Brain size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Erweiterte Analyse & Übersetzung</p>
                <p className="text-xs mt-1">
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} Datei(en) bereit`
                    : 'Wählen Sie Dateien aus'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Content Search Panel */}
          {activePanel === 'notebook' && (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Durchsuche Inhalte..."
                    className="w-full p-2 pr-8 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={performSearch}
                    disabled={searching}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {searching ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Search size={16} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Suchergebnisse:</h3>
                  {searchResults.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium">{result.file}</div>
                      <div className="text-xs text-gray-600 mt-1">{result.content}</div>
                      <div className="text-xs text-blue-600 mt-1">Score: {result.score}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchResults.length === 0 && !searching && (
                <div className="text-center p-8 text-slate-500">
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Suche in deinen Dokumenten</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-medium">LocalLLM Chat</h2>
            <div className="text-sm text-gray-500">
              {selectedModel} • {selectedFiles.length} Datei(en) ausgewählt
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Willkommen bei Open Notebook LLM
                </h3>
                <p className="text-gray-600 mb-4">
                  Stellen Sie Fragen zu Ihren Dokumenten oder chatten Sie mit dem KI-Modell.
                </p>
                <div className="text-sm text-gray-500">
                  {ollamaStatus.connected ? (
                    <>Bereit für Chat mit {selectedModel}</>
                  ) : (
                    <>Ollama nicht verbunden</>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.context && (
                      <div className="text-xs mt-2 opacity-75">
                        Kontext: {message.context}
                      </div>
                    )}
                    
                    {message.sourceFiles && message.sourceFiles.length > 0 && (
                      <div className="text-xs mt-2 opacity-75">
                        Quellen: {message.sourceFiles.length} Datei(en)
                      </div>
                    )}
                    
                    <div className="text-xs mt-2 opacity-60">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-blue-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader size={16} className="animate-spin" />
                      <span className="text-gray-600">Denkt nach...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  ollamaStatus.connected
                    ? "Nachricht eingeben... (Enter zum Senden, Shift+Enter für neue Zeile)"
                    : "Ollama nicht verbunden..."
                }
                disabled={!ollamaStatus.connected || isLoading}
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 bg-white"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !ollamaStatus.connected || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {selectedFiles.length} Datei(en) werden in den Kontext einbezogen
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompleteOpenNotebook
