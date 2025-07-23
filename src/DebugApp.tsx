import { useState, useEffect } from 'react'

function DebugApp() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [models, setModels] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [currentDirectory, setCurrentDirectory] = useState<string>('')

  useEffect(() => {
    // Debug electronAPI Verfügbarkeit
    console.log('DEBUG: window.electronAPI:', !!window.electronAPI)
    console.log('DEBUG: electronAPI keys:', window.electronAPI ? Object.keys(window.electronAPI) : 'N/A')
    
    setDebugInfo({
      electronAPIAvailable: !!window.electronAPI,
      electronAPIKeys: window.electronAPI ? Object.keys(window.electronAPI) : [],
      ollamaAPIs: window.electronAPI?.ollama ? Object.keys(window.electronAPI.ollama) : []
    })

    if (window.electronAPI) {
      loadModels()
    }
  }, [])

  const loadModels = async () => {
    try {
      console.log('DEBUG: Lade Modelle...')
      const result = await window.electronAPI.ollama.models()
      console.log('DEBUG: Modelle Result:', result)
      setModels(result.models || [])
    } catch (error) {
      console.error('DEBUG: Fehler beim Laden der Modelle:', error)
    }
  }

  const selectFolder = async () => {
    try {
      console.log('DEBUG: Öffne Ordner Dialog...')
      const result = await window.electronAPI.dialog.openFolder()
      console.log('DEBUG: Ordner Result:', result)
      
      if (result?.path) {
        setCurrentDirectory(result.path)
        
        const dirResult = await window.electronAPI.fs.listDirectory(result.path)
        console.log('DEBUG: Directory Result:', dirResult)
        setDocuments(dirResult.items || [])
      }
    } catch (error) {
      console.error('DEBUG: Fehler beim Ordner öffnen:', error)
    }
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">LocalLLM Debug App</h1>
      
      {/* Debug Info */}
      <div className="bg-white p-4 rounded-lg mb-6 border">
        <h2 className="text-lg font-semibold mb-4">🔍 Debug Information</h2>
        <div className="space-y-2 text-sm">
          <div><strong>ElectronAPI verfügbar:</strong> {debugInfo.electronAPIAvailable ? '✅ Ja' : '❌ Nein'}</div>
          <div><strong>ElectronAPI Keys:</strong> {debugInfo.electronAPIKeys?.join(', ') || 'Keine'}</div>
          <div><strong>Ollama APIs:</strong> {debugInfo.ollamaAPIs?.join(', ') || 'Keine'}</div>
        </div>
      </div>

      {/* Models Section */}
      <div className="bg-white p-4 rounded-lg mb-6 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">🤖 Verfügbare Modelle ({models.length})</h2>
          <button 
            onClick={loadModels}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Modelle neu laden
          </button>
        </div>
        
        <div className="space-y-2">
          {models.length === 0 ? (
            <div className="text-gray-500 p-4 text-center border-2 border-dashed border-gray-300 rounded">
              Keine Modelle geladen
            </div>
          ) : (
            models.map((model, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50">
                <div className="font-medium text-blue-700">{model.name}</div>
                <div className="text-sm text-gray-600">
                  Größe: {(model.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">📁 Dokumente ({documents.length})</h2>
          <button 
            onClick={selectFolder}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Ordner wählen
          </button>
        </div>
        
        {currentDirectory && (
          <div className="mb-4 p-3 bg-blue-50 rounded border">
            <div className="text-sm text-gray-600">Aktueller Ordner:</div>
            <div className="font-medium text-blue-700 break-all">{currentDirectory}</div>
          </div>
        )}
        
        <div className="space-y-2">
          {documents.length === 0 ? (
            <div className="text-gray-500 p-4 text-center border-2 border-dashed border-gray-300 rounded">
              {currentDirectory ? 'Keine Dokumente gefunden' : 'Wähle einen Ordner aus'}
            </div>
          ) : (
            documents
              .filter(doc => !doc.isDirectory && ['.txt', '.md', '.pdf', '.docx', '.json'].includes(doc.extension))
              .map((doc, index) => (
                <div key={index} className="p-3 border rounded-lg bg-gray-50">
                  <div className="font-medium text-green-700">{doc.name}</div>
                  <div className="text-sm text-gray-600">
                    Typ: {doc.extension} • Größe: {(doc.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Raw Data Debug */}
      <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg">
        <h3 className="text-white mb-2">🔧 Raw Debug Data:</h3>
        <pre className="text-xs overflow-auto max-h-40">
          {JSON.stringify({ debugInfo, models, documents, currentDirectory }, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default DebugApp
