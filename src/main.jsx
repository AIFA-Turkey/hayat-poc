import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import { I18nProvider } from './contexts/I18nContext'
import './index.css'
import App from './App.jsx'
import { Buffer } from 'buffer'

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </I18nProvider>
  </StrictMode>,
)
