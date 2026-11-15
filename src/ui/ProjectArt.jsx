import React, { useState } from 'react'
import Icon from './icons.jsx'
import { BRIEFS } from '../game/briefs.js'
import { INDUSTRIES } from '../game/catalog.js'

// Project artwork: public/art/projects/<briefId>.png (96×96 or larger, square).
// Until an image exists, a styled tile with the industry icon stands in.
const TINT = {
  fashion: ['#e8a3b5', '#9b4d68'], food: ['#f0b36a', '#a4542a'], grocery: ['#a9d38c', '#4b7a35'],
  health: ['#9fd0e6', '#2f6f8f'], civic: ['#d8c3a0', '#7a5c33'], housing: ['#d9a48a', '#8a4b33'],
  office: ['#a9b8cc', '#3d4f68'], retail: ['#e5b97a', '#8f5b1f'], sports: ['#9fd6b8', '#2f7a57'], transport: ['#a8c2ea', '#34508f'],
}
const missing = new Set()

export default function ProjectArt({ briefId, size = 96, className = '' }) {
  const b = BRIEFS[briefId]
  const [failed, setFailed] = useState(missing.has(briefId))
    const src = `${import.meta.env.BASE_URL}art/projects/${briefId}.png`
  return (
    <span className={`project-art ${className}`} style={className.includes('fill') ? undefined : { width: size, height: size }}>
      {!failed && <img src={src} alt="" width={size} height={size} loading="lazy" onError={() => { missing.add(briefId); setFailed(true) }} />}
      {failed && (
        <span className="art-fallback" aria-hidden="true">
          <Icon name={INDUSTRIES[b.industry].icon} size={Math.round(size * (className.includes('fill') ? 0.26 : 0.42))} stroke={1.3} />
          <em className="mono">L{b.level}</em>
        </span>
      )}
    </span>
  )
}
