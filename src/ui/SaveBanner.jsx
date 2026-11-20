import React, { useEffect } from 'react'
import Icon from './icons.jsx'

// Save status, shown on every screen. Errors stay until dismissed (with Retry and a backup
// download); warnings and notices fade after a few seconds.
export default function SaveBanner({ status, onClose, onRetry, onBackup }) {
  useEffect(() => {
    if (!status || status.kind === 'error') return
    const t = setTimeout(onClose, status.kind === 'warn' ? 9000 : 5000)
    return () => clearTimeout(t)
  }, [status]) // eslint-disable-line
  if (!status) return null
  return (
    <div className={`save-banner ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
      <Icon name={status.kind === 'error' ? 'x' : status.kind === 'ok' ? 'check' : 'brief'} size={16} />
      <span><b>{status.kind === 'error' ? 'Saving failed. ' : status.kind === 'ok' ? 'Saved. ' : ''}</b>{status.text}</span>
      {status.kind === 'error' && <button className="bb" onClick={onRetry}>Retry</button>}
      {(status.kind === 'error' || status.kind === 'warn') && <button className="bb" onClick={onBackup}>Download backup</button>}
      <button className="bb icon" onClick={onClose} aria-label="Dismiss"><Icon name="x" size={14} /></button>
    </div>
  )
}
