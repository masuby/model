import React from 'react'
import ReactDOM from 'react-dom/client'
import WarningModule from './pages/WarningModule'
import './index.css'

/**
 * STANDALONE WARNING MODULE APPLICATION
 * Runs as independent application without auth, database, or language providers
 */

function StandaloneWarningApp() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <WarningModule onNavigate={() => {}} />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StandaloneWarningApp />
  </React.StrictMode>,
)
