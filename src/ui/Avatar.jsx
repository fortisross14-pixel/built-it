import React, { useState } from 'react'
import { flag } from '../game/architects.js'

// Architect portrait (plaster bust) with country flag; initials if no portrait is chosen or it fails to load.
export default function Avatar({ name = '', profile = {}, size = 64, className = '' }) {
  const [failed, setFailed] = useState(false)
  const initials = name.split(' ').map(x => x[0]).join('').slice(0, 2)
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profile.avatar && !failed
        ? <img src={`${import.meta.env.BASE_URL}art/architects/${profile.avatar}.jpg`} alt="" onError={() => setFailed(true)} />
        : initials}
      {profile.country && <span className="avatar-flag" style={{ fontSize: Math.max(16, size * 0.3) }}>{flag(profile.country)}</span>}
    </span>
  )
}
