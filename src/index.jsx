import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './utils/registerSW'
import { initPerformanceMonitoring } from './utils/performanceMonitor'

// Initialize performance monitoring (only in development)
initPerformanceMonitoring()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register service worker for PWA
registerServiceWorker()

