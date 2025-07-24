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

// Declare global electronAPI interface
declare global {
  interface Window {
    electronAPI?: {
      ollama: {
        status: () => Promise<boolean>
        chat: (message: string, context?: string) => Promise<{
          success: boolean
          response?: string
          error?: string
        }>
        models: () => Promise<string[]>
      }
      files: {
        selectDirectory: () => Promise<{ success: boolean; path?: string }>
        readDirectory: (path: string) => Promise<FileItem[]>
        readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>
      }
      pst: {
        open: (path: string) => Promise<{ success: boolean; error?: string }>
        search: (query: string) => Promise<{ success: boolean; results?: any[]; error?: string }>
        analyze: (path: string) => Promise<{ success: boolean; analysis?: any; error?: string }>
      }
    }
  }
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
  
  // LocalLLM Features
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  // UI State
  const [activePanel, setActivePanel] = useState<'chat' | 'sources' | 'analysis' | 'pst' | 'notebook'>('chat')
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
      
      // Use Electron's dialog API
      if (window.electronAPI && window.electronAPI.files.selectDirectory) {
        const result = await window.electronAPI.files.selectDirectory()
        
        if (result.success && result.path) {
          setCurrentDirectory(result.path)
          setCurrentDirectoryName(result.path.split(/[\\/]/).pop() || result.path)
          await loadDirectory(result.path)
        }
      } else {
        // Fallback for browser mode - create input element
        const input = document.createElement('input')
        input.type = 'file'
        input.webkitdirectory = true
        input.multiple = true
        
        input.onchange = async (e: any) => {
          const files = Array.from(e.target.files || []) as File[]
          if (files.length > 0) {
            const firstFile = files[0] as any
            const directoryPath = firstFile.webkitRelativePath.split('/')[0]
            setCurrentDirectory(directoryPath)
            setCurrentDirectoryName(directoryPath)
            await loadDirectoryFromFileList(files)
          }
        }
        
        input.click()
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
      
      // Use Electron API for real file system access
      if (window.electronAPI && window.electronAPI.files.readDirectory) {
        const filesList = await window.electronAPI.files.readDirectory(dirPath)
        setFiles(filesList)
      } else {
        // Use backend API for file system access
        const response = await fetch('/api/files/directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: dirPath })
        })
        
        if (response.ok) {
          const data = await response.json()
          setFiles(data.files || [])
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Error loading directory:', error)
      alert(`Fehler beim Laden des Verzeichnisses: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
      setFiles([])
    } finally {
      setLoadingDirectory(false)
    }
  }

  const loadDirectoryFromFileList = async (fileList: File[]) => {
    try {
      const fileItems: FileItem[] = fileList.map(file => ({
        name: file.name,
        path: file.webkitRelativePath || file.name,
        isDirectory: false,
        size: file.size,
        extension: file.name.split('.').pop()?.toLowerCase() || '',
        modified: new Date(file.lastModified).toLocaleDateString()
      }))
      
      setFiles(fileItems)
    } catch (error) {
      console.error('Error processing file list:', error)
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
      ['pdf', 'docx', 'txt', 'md', 'pst'].includes(f.extension.toLowerCase())
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
      // Check if PST files are selected for special email search
      const hasPstFiles = selectedFiles.some(file => file.endsWith('.pst'))
      
      if (hasPstFiles) {
        // Real PST search using Electron API
        if (window.electronAPI && window.electronAPI.pst.search) {
          const result = await window.electronAPI.pst.search(searchQuery)
          
          if (result.success && result.results) {
            setSearchResults(result.results)
          } else {
            throw new Error(result.error || 'PST search failed')
          }
        } else {
          // Fallback: Use backend API for PST search
          const response = await fetch('/api/pst/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: searchQuery,
              files: selectedFiles.filter(f => f.endsWith('.pst'))
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            setSearchResults(data.results || [])
          } else {
            throw new Error(`HTTP ${response.status}`)
          }
        }
      } else {
        // Standard document search using backend
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            files: selectedFiles
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.results || [])
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Suchfehler'
      alert(`Fehler bei der Suche: ${errorMessage}`)
    } finally {
      setSearching(false)
    }
  }

  // PST Analysis Functions
  const performPstAnalysis = async (analysisType: string) => {
    const pstFiles = selectedFiles.filter(file => file.endsWith('.pst'))
    if (pstFiles.length === 0) return

    try {
      setIsLoading(true)
      
      if (window.electronAPI && window.electronAPI.pst.analyze) {
        // Use Electron API for PST analysis
        for (const pstFile of pstFiles) {
          const result = await window.electronAPI.pst.analyze(pstFile)
          if (result.success) {
            // Add analysis results to chat
            const analysisMessage: ChatMessage = {
              id: Date.now().toString(),
              type: 'assistant',
              content: `PST-Analyse "${analysisType}" für ${pstFile.split('\\').pop()}:\n\n${JSON.stringify(result.analysis, null, 2)}`,
              timestamp: new Date(),
              analysisType: 'summary'
            }
            setMessages(prev => [...prev, analysisMessage])
          }
        }
      } else {
        // Use backend API for PST analysis
        const response = await fetch('/api/pst/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: pstFiles,
            analysisType: analysisType
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          const analysisMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `PST-Analyse "${analysisType}" abgeschlossen:\n\n${data.summary || 'Analyse erfolgreich durchgeführt'}`,
            timestamp: new Date(),
            analysisType: 'summary'
          }
          setMessages(prev => [...prev, analysisMessage])
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      }
    } catch (error) {
      console.error('PST analysis error:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Fehler bei der PST-Analyse: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
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
          <h1 className="text-xl font-bold text-gray-900">LocalLLM Desktop</h1>
          
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
              onClick={() => setActivePanel('pst')}
              className={`flex-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                activePanel === 'pst' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              PST
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
                          {file.extension.toLowerCase() === 'pst' ? (
                            <div className="text-orange-500">
                              <FileText size={14} />
                            </div>
                          ) : (
                            <FileText size={14} />
                          )}
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
                          {file.extension.toLowerCase() === 'pst' && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">
                              Outlook
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {file.extension.toUpperCase()} • 
                          {file.size > 1024 * 1024 
                            ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                            : `${(file.size / 1024).toFixed(1)} KB`
                          }
                          {file.extension.toLowerCase() === 'pst' && (
                            <span className="text-orange-600 font-medium"> • Email Archive</span>
                          )}
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

              {/* PST-spezifische Analyse */}
              {selectedFiles.some(file => file.endsWith('.pst')) && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 text-slate-600">PST Email-Analyse</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => performPstAnalysis('email-categories')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200"
                    >
                      Email-Kategorien analysieren
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('frequent-contacts')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200"
                    >
                      Häufigste Kontakte identifizieren
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('email-volume')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200"
                    >
                      Email-Volumen nach Zeitraum
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('auto-tagging')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200"
                    >
                      Automatische Tag-Erstellung
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('extract-attachments')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200"
                    >
                      Anhänge extrahieren & analysieren
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('sentiment-analysis')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200"
                    >
                      Email-Sentiment-Analyse
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('extract-appointments')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200"
                    >
                      Terminextraktion aus Emails
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('important-threads')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200"
                    >
                      Wichtige Email-Threads identifizieren
                    </button>
                  </div>
                </div>
              )}
              
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

          {/* PST Panel */}
          {activePanel === 'pst' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 text-slate-600">PST Email-Archive</h3>
                
                {/* PST-Datei öffnen */}
                <div className="mb-4">
                  <button
                    onClick={selectDirectory}
                    disabled={loadingDirectory}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingDirectory ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Folder size={16} />
                    )}
                    PST-Dateien suchen
                  </button>
                </div>

                {/* PST-Informationen */}
                {selectedFiles.filter(f => f.endsWith('.pst')).length > 0 ? (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      PST-Dateien ({selectedFiles.filter(f => f.endsWith('.pst')).length}):
                    </div>
                    <div className="space-y-1">
                      {selectedFiles.filter(f => f.endsWith('.pst')).map(pstFile => (
                        <div key={pstFile} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                          {pstFile.split(/[\\/]/).pop()}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-2">Keine PST-Dateien ausgewählt</p>
                    <p className="text-xs text-gray-500">Öffnen Sie einen Ordner mit .pst-Dateien</p>
                  </div>
                )}

                {/* PST-Suche */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Email-Suche</h4>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      placeholder="von:sender@domain.com betreff:Meeting datum:2024-01-15"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={performSearch}
                      disabled={searching || !searchQuery.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700 disabled:opacity-50"
                    >
                      {searching ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Search size={16} />
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Erweiterte Suche: von:, an:, betreff:, datum:, anhang:ja, wichtig:ja
                  </div>
                </div>

                {/* PST-Analysen */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Schnell-Analysen</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => performPstAnalysis('email-categories')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200 disabled:opacity-50"
                      disabled={selectedFiles.filter(f => f.endsWith('.pst')).length === 0}
                    >
                      Email-Statistiken erstellen
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('frequent-contacts')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200 disabled:opacity-50"
                      disabled={selectedFiles.filter(f => f.endsWith('.pst')).length === 0}
                    >
                      Top-Kontakte analysieren
                    </button>
                    <button 
                      onClick={() => performPstAnalysis('email-volume')}
                      className="w-full p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 text-sm border border-gray-200 disabled:opacity-50"
                      disabled={selectedFiles.filter(f => f.endsWith('.pst')).length === 0}
                    >
                      Zeittrend-Analyse
                    </button>
                  </div>
                </div>

                {/* PST-Status */}
                <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium">PST-Funktionalität aktiv</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Outlook Email-Archive werden unterstützt
                  </p>
                </div>
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
                    placeholder={
                      selectedFiles.some(f => f.endsWith('.pst'))
                        ? "Suche in Emails, Betreff, Absender..."
                        : "Durchsuche Inhalte..."
                    }
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

              {/* PST-spezifische Suchfilter */}
              {selectedFiles.some(file => file.endsWith('.pst')) && (
                <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="text-sm font-medium text-orange-800 mb-2">📧 Email-Suchfilter</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button 
                      onClick={() => setSearchQuery('von:')}
                      className="p-2 bg-white rounded border hover:bg-orange-50"
                    >
                      Nach Absender
                    </button>
                    <button 
                      onClick={() => setSearchQuery('an:')}
                      className="p-2 bg-white rounded border hover:bg-orange-50"
                    >
                      Nach Empfänger
                    </button>
                    <button 
                      onClick={() => setSearchQuery('betreff:')}
                      className="p-2 bg-white rounded border hover:bg-orange-50"
                    >
                      Nach Betreff
                    </button>
                    <button 
                      onClick={() => setSearchQuery('datum:')}
                      className="p-2 bg-white rounded border hover:bg-orange-50"
                    >
                      Nach Datum
                    </button>
                    <button 
                      onClick={() => setSearchQuery('anhang:ja')}
                      className="p-2 bg-white rounded border hover:bg-orange-50"
                    >
                      Mit Anhängen
                    </button>
                    <button 
                      onClick={() => setSearchQuery('wichtig:ja')}
                      className="p-2 bg-white rounded border hover:bg-orange-50"
                    >
                      Wichtige Emails
                    </button>
                  </div>
                  
                  <div className="mt-2 text-xs text-orange-700">
                    💡 Beispielsuchen: "von:mueller@firma.de", "betreff:rechnung", "datum:2024-01"
                  </div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Suchergebnisse:</h3>
                  {searchResults.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {result.file.endsWith('.pst') && <span className="text-orange-500">📧</span>}
                        {result.file}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{result.content}</div>
                      <div className="text-xs text-blue-600 mt-1">Score: {result.score}</div>
                      {result.emailMeta && (
                        <div className="text-xs text-gray-500 mt-1 bg-white p-1 rounded">
                          Von: {result.emailMeta.from} • Datum: {result.emailMeta.date}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {searchResults.length === 0 && !searching && (
                <div className="text-center p-8 text-slate-500">
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    {selectedFiles.some(f => f.endsWith('.pst'))
                      ? "Durchsuche deine Email-Archive"
                      : "Suche in deinen Dokumenten"
                    }
                  </p>
                  {selectedFiles.some(f => f.endsWith('.pst')) && (
                    <div className="text-xs text-blue-600 mt-2">
                      PST-Archive erkannt - Erweiterte Email-Suche verfügbar
                    </div>
                  )}
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
                  Willkommen bei LocalLLM Desktop
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
