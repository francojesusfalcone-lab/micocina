// v2.3 — auto-cleanup SW cache en cada deploy
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Forzar que el SW nuevo tome control inmediatamente
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.update())
  })
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
