import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { registerServiceWorker } from './ui/install.js'

registerServiceWorker()

createRoot(document.getElementById('root')).render(<App />)
