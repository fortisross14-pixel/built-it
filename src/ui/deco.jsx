import React, { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './icons.jsx'
import { feedback } from './fx.js'

// Monograph design language: linework, numbered markers, diamonds and windows that open and close.

// Flowing mesh of thin lines (top corners of decks). Pure SVG, drifts slowly.
export function WaveMesh({ className = '', lines = 34, width = 900, height = 260 }) {
  const paths = useMemo(() => Array.from({ length: lines }, (_, i) => {
    const t = i / (lines - 1)
    const y0 = 20 + t * 120, y1 = 160 - t * 90 + Math.sin(t * 3) * 30, y2 = 40 + t * 150, y3 = 10 + t * 60
    return `M0 ${y0.toFixed(1)} C ${width * 0.3} ${y1.toFixed(1)}, ${width * 0.6} ${y2.toFixed(1)}, ${width} ${y3.toFixed(1)}`
  }), [lines, width])
  return (
    <svg className={`wave-mesh ${className}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {paths.map((d, i) => <path key={i} d={d} style={{ animationDelay: `${i * 18}ms` }} />)}
    </svg>
  )
}

// One-point perspective wireframe of an interior (corridor of frames, doors and a window).
export function PerspectiveLines({ className = '' }) {
  const W = 600, H = 360, vx = 230, vy = 170
  const lines = []
  const corners = [[0, 0], [W, 0], [W, H], [0, H]]
  corners.forEach(([x, y]) => lines.push([x, y, vx, vy]))
  // receding frames
  for (let k = 1; k <= 7; k++) {
    const s = 1 - k / 8.5
    const x0 = vx + (0 - vx) * s, x1 = vx + (W - vx) * s, y0 = vy + (0 - vy) * s, y1 = vy + (H - vy) * s
    lines.push([x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0])
  }
  // floor and ceiling grid
  for (let i = 1; i < 8; i++) { const x = (W / 8) * i; lines.push([x, H, vx, vy], [x, 0, vx, vy]) }
  // a door on the right wall and a window on the left
  const p = (x, y, s) => [vx + (x - vx) * s, vy + (y - vy) * s]
  const rect = (pts) => pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; lines.push([...a, ...b]) })
  rect([p(W, 140, 0.92), p(W, H, 0.92), p(W, H, 0.72), p(W, 140, 0.72)])
  rect([p(0, 70, 0.9), p(0, 230, 0.9), p(0, 230, 0.62), p(0, 70, 0.62)])
  return (
    <svg className={`perspective ${className}`} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {lines.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} style={{ animationDelay: `${(i % 24) * 35}ms` }} />)}
    </svg>
  )
}

export function Num({ n, className = '' }) {
  return <span className={`num-dot ${className}`}>{n}</span>
}

// "Architectural Design Office": a light word, then a bold one.
export function Title({ light, bold, after, as: Tag = 'h1', className = '' }) {
  return <Tag className={`title-pair ${className}`}>{light && <span className="t-light">{light} </span>}<span className="t-bold">{bold}</span>{after && <span className="t-light"> {after}</span>}</Tag>
}

// Diamond crop with a numbered marker.
export function Diamond({ n, children, onClick, locked, className = '', style }) {
  return (
    <button className={`diamond ${locked ? 'locked' : ''} ${className}`} onClick={onClick} style={style}>
      <span className="diamond-crop"><span className="diamond-in">{children}</span></span>
      {n != null && <Num n={n} />}
    </button>
  )
}

// A window that animates in and folds away before unmounting.
// Render it while open; call the close() it passes to children (or press Esc / backdrop).
export function Window({ onClose, children, variant = 'panel', label, className = '' }) {
  const [closing, setClosing] = useState(false)
  const timer = useRef(null)
  const close = () => {
    if (closing) return
    feedback('tap')
    setClosing(true)
    timer.current = setTimeout(onClose, 260)
  }
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), []) // only on unmount
  return (
    <div className={`win-wrap ${variant} ${closing ? 'closing' : ''}`} onClick={close}>
      <div className={`win ${className}`} role="dialog" aria-label={label} onClick={e => e.stopPropagation()}>
        <button className="win-close" onClick={close} aria-label="Close"><Icon name="x" size={18} /></button>
        {typeof children === 'function' ? children(close) : children}
      </div>
    </div>
  )
}
