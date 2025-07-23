import { useState } from 'react'

function SimpleApp() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{ color: '#333' }}>LocalLLM Desktop</h1>
      <p>Test App läuft erfolgreich!</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Klicks: {count}
      </button>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h3>Electron API Test:</h3>
        <p>
          {typeof window !== 'undefined' && (window as any).electronAPI 
            ? '✅ Electron API verfügbar' 
            : '❌ Electron API nicht verfügbar'}
        </p>
      </div>
    </div>
  )
}

export default SimpleApp
