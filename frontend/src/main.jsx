import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/animations.css'
import './styles/enhanced-animations.css'
import { trackDashboardOpened } from './services/firebase'

// Track app open in Firebase Analytics
trackDashboardOpened()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)