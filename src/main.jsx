// v2.1
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Eliminar service workers viejos del PWA que causan pantalla blanca
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((sw) => sw.unregister())
  })
  window.caches?.keys().then((keys) => {
    keys.forEach((key) => window.caches.delete(key))
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
