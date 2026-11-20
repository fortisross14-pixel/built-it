import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { registerServiceWorker } from './ui/install.js'

registerServiceWorker()

// A crash shows a recovery screen instead of a blank page. Progress is saved as you go,
// so reloading puts you back where you were.
class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error(error, info?.componentStack) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="crash">
        <h2>Something broke.</h2>
        <p>Your progress is saved. Reload to pick up where you left off.</p>
        <button className="primary big" onClick={() => location.reload()}>Reload</button>
        <pre>{String(this.state.error?.message || this.state.error)}</pre>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>)
