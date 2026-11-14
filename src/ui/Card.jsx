import React from 'react'
import Icon from './icons.jsx'
import { CARDS } from '../game/cards.js'
import { ITEMS, MATERIALS, STYLES } from '../game/catalog.js'
import { ItemSymbol } from './PlanView.jsx'

const PERK_ICON = { contractor: 'coin', silver: 'hat', press: 'star', network: 'map', intern: 'info', mentor: 'trophy', renders: 'cube', longCareer: 'flag' }

export default function Card({ id, owned = true, selected = false, onClick, small = false, fresh = false }) {
  const c = CARDS[id]
  if (!c) return null
  const mat = c.kind === 'material' ? MATERIALS[c.ref] : null
  const item = c.kind === 'item' ? ITEMS[c.ref] : null
  return (
    <button type="button" className={`card r-${c.rarity} k-${c.kind} ${owned ? '' : 'unowned'} ${selected ? 'selected' : ''} ${small ? 'small' : ''} ${fresh ? 'fresh' : ''}`} onClick={onClick} disabled={!onClick}>
      <div className="card-art" style={mat ? { background: mat.color } : undefined}>
        {mat && <div className={`texture t-${mat.kind}`} />}
        {item && <svg viewBox={`-0.4 -0.4 ${item.w + 0.8} ${item.h + 0.8}`} className="card-sym"><ItemSymbol type={c.ref} w={item.w} h={item.h} /></svg>}
        {c.kind === 'perk' && <Icon name={PERK_ICON[id] || 'star'} size={small ? 30 : 42} stroke={1.4} />}
        {!owned && <div className="card-lock"><Icon name="lock" size={22} /></div>}
      </div>
      <div className="card-body">
        <span className="card-kind mono">{c.kind === 'material' ? (mat.kind === 'facade' ? 'FACADE' : 'FLOOR') : c.kind === 'item' ? 'SPECIAL ITEM' : 'STUDIO PERK'} · {c.rarity.toUpperCase()}</span>
        <strong>{owned ? c.name : '???'}</strong>
        {!small && <p>{owned ? c.text : 'Earn this card with a 3★+ project.'}</p>}
        {!small && mat && owned && <span className="card-tags mono">{mat.tags.map(t => STYLES[t]).join(' · ')}</span>}
      </div>
    </button>
  )
}
