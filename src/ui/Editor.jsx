import React, { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './icons.jsx'
import PlanView, { ItemSymbol } from './PlanView.jsx'
import View3D from './View3D.jsx'
import { ITEMS, MATERIALS, ROOMS, STYLES, materialsOfKind, itemSize } from '../game/catalog.js'
import { BRIEFS, TWISTS } from '../game/briefs.js'
import { CARDS } from '../game/cards.js'
import {
  addLevel, addRoom, canPlaceItem, canPlaceRoom, duplicateLevel, itemAt, moveItem, nearestEdge,
  placeItem, removeItem, removeRoom, removeTopLevel, roomAt, roomArea, setOpening, toggleOpening, updateRoom,
} from '../engine/plan.js'
import { evaluate } from '../engine/score.js'
import { money } from './format.js'

const TOOLS = [
  { id: 'select', label: 'Select', icon: 'select' },
  { id: 'room', label: 'Room', icon: 'room' },
  { id: 'door', label: 'Door', icon: 'door' },
  { id: 'window', label: 'Window', icon: 'window' },
  { id: 'furnish', label: 'Furnish', icon: 'sofa' },
  { id: 'finish', label: 'Finish', icon: 'brush' },
  { id: 'erase', label: 'Erase', icon: 'eraser' },
]

const HINTS = {
  select: 'Tap a room or item to edit it. Drag a selected item to move it. Two fingers pan and zoom.',
  room: 'Pick a room type, then drag across the grid to draw it.',
  door: 'Tap a wall to add or remove a door. Doors on outside walls are entrances.',
  window: 'Tap or drag along outside walls to add windows.',
  furnish: 'Pick an item, then tap or drag it into place.',
  finish: 'Pick a floor and tap rooms to apply it. Facade applies to the whole building.',
  erase: 'Tap an item, door, window or room to remove it.',
}

const unlockedMaterial = (id, kit) => MATERIALS[id].base || kit.includes(MATERIALS[id].card)
const unlockedItem = (id, kit) => !ITEMS[id].card || kit.includes(ITEMS[id].card)

export default function Editor({ offer, kit, project: initial, onChange, onSubmit, onExit }) {
  const brief = BRIEFS[offer.briefId]
  const [project, setProject] = useState(initial)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [li, setLi] = useState(0)
  const [view, setView] = useState('plan')
  const [tool, setTool] = useState('room')
  const [roomType, setRoomType] = useState(brief.rooms[0].type)
  const [itemType, setItemType] = useState(null)
  const [itemRot, setItemRot] = useState(0)
  const [floorMat, setFloorMat] = useState('vinyl')
  const [selection, setSelection] = useState(null)
  const [toast, setToast] = useState(null)
  const [briefOpen, setBriefOpen] = useState(false)
  const [levelMenu, setLevelMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [cut, setCut] = useState(true)
  const [fitSignal, setFitSignal] = useState(0)
  const [flash, setFlash] = useState(null)
  const toastTimer = useRef(null)

  const level = project.levels[Math.min(li, project.levels.length - 1)]
  const result = useMemo(() => evaluate(project, offer, kit), [project, offer, kit])

  useEffect(() => { const t = setTimeout(() => onChange(project), 400); return () => clearTimeout(t) }, [project]) // eslint-disable-line
  useEffect(() => { if (li >= project.levels.length) setLi(project.levels.length - 1) }, [project.levels.length, li])

  const say = (text, kind = 'info') => {
    clearTimeout(toastTimer.current)
    setToast({ text, kind })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }
  const commit = (res, okMsg) => {
    const next = res?.project ?? res
    if (res?.error) { say(res.error, 'error'); return false }
    if (!next || next === project) return false
    setPast(p => [...p.slice(-59), project]); setFuture([]); setProject(next)
    if (okMsg) say(okMsg)
    return true
  }
  const undo = () => { if (!past.length) return; setFuture(f => [project, ...f]); setProject(past[past.length - 1]); setPast(p => p.slice(0, -1)); setSelection(null) }
  const redo = () => { if (!future.length) return; setPast(p => [...p, project]); setProject(future[0]); setFuture(f => f.slice(1)) }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (e.key === 'r' && tool === 'furnish') setItemRot(r => (r + 1) % 2)
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selection) deleteSelection()
      else if (e.key === 'Escape') setSelection(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pickTool = (t) => { setTool(t); setSelection(null); if (t === 'furnish' && !itemType) setItemType(brief.items[0].type) }

  const deleteSelection = () => {
    if (!selection) return
    if (selection.kind === 'room') commit(removeRoom(project, li, selection.id))
    else commit(removeItem(project, li, selection.id))
    setSelection(null)
  }

  const handleTap = ({ wx, wy, x, y }) => {
    if (tool === 'select' || tool === 'room') {
      const it = tool === 'select' ? itemAt(level, x, y) : null
      if (it) return setSelection({ kind: 'item', id: it.id })
      const r = roomAt(level, x, y)
      if (r) { setSelection({ kind: 'room', id: r.id }); if (tool === 'room') setTool('select') ; return }
      return setSelection(null)
    }
    if (tool === 'door') {
      const e = nearestEdge(wx, wy)
      if (e.dist > 0.45) return say('Tap closer to a wall.')
      return commit(toggleOpening(project, li, e.key, 'door'))
    }
    if (tool === 'finish') {
      const r = roomAt(level, x, y)
      if (!r) return say('Tap inside a room to change its floor.')
      if (ROOMS[r.type].wet && !MATERIALS[floorMat].wetSafe) return say(`${MATERIALS[floorMat].label} isn't water-safe. Not for a ${ROOMS[r.type].label.toLowerCase()}.`, 'error')
      setFlash(r.id); setTimeout(() => setFlash(null), 350)
      return commit(updateRoom(project, li, r.id, { floor: floorMat }))
    }
    if (tool === 'erase') {
      const it = itemAt(level, x, y)
      if (it) return commit(removeItem(project, li, it.id))
      const e = nearestEdge(wx, wy)
      if (e.dist < 0.3) {
        if (level.doors.includes(e.key)) return commit(toggleOpening(project, li, e.key, 'door'))
        if (level.windows.includes(e.key)) return commit(toggleOpening(project, li, e.key, 'window'))
      }
      const r = roomAt(level, x, y)
      if (r) return commit(removeRoom(project, li, r.id))
    }
    if (tool === 'furnish' && itemType) handleDrop({ x: Math.round(wx - itemSize({ type: itemType, rot: itemRot }).w / 2), y: Math.round(wy - itemSize({ type: itemType, rot: itemRot }).h / 2) })
  }

  const handleRect = (rect) => {
    const res = addRoom(project, li, rect, roomType, floorMat)
    if (commit(res)) setSelection({ kind: 'room', id: res.room.id })
  }
  const handleStroke = (keys) => {
    let p = project, errors = 0, last = null
    for (const k of keys) {
      const r = keys.length === 1 ? toggleOpening(p, li, k, 'window') : setOpening(p, li, k, 'window')
      if (r.error) { errors++; last = r.error } else p = r.project
    }
    if (p === project && last) say(last, 'error')
    else commit(p)
  }
  const handleDrop = (o) => {
    if (!itemType) return
    commit(placeItem(project, li, { type: itemType, rot: itemRot, ...o }))
  }
  const handleMove = (id, o) => commit(moveItem(project, li, id, o))

  const selRoom = selection?.kind === 'room' ? level.rooms.find(r => r.id === selection.id) : null
  const selItem = selection?.kind === 'item' ? level.items.find(r => r.id === selection.id) : null
  const budgetPct = Math.round(result.cost.total / offer.budget * 100)
  const twist = offer.twist ? TWISTS[offer.twist] : null
  const done = result.checklist.filter(c => c.ok).length

  return (
    <div className={`editor ${briefOpen ? 'brief-open' : ''}`}>
      <header className="ed-top">
        <button className="icon-btn" onClick={onExit} aria-label="Back to studio"><Icon name="back" /></button>
        <div className="ed-title">
          <span className="mono dim">{offer.client}</span>
          <strong>{brief.name}</strong>
        </div>
        <div className="seg view-seg">
          <button className={view === 'plan' ? 'on' : ''} onClick={() => setView('plan')}><Icon name="plan" size={16} /><span>Plan</span></button>
          <button className={view === '3d' ? 'on' : ''} onClick={() => setView('3d')}><Icon name="cube" size={16} /><span>3D</span></button>
        </div>
        <div className="ed-actions">
          <button className="icon-btn" onClick={undo} disabled={!past.length} aria-label="Undo"><Icon name="undo" /></button>
          <button className="icon-btn hide-xs" onClick={redo} disabled={!future.length} aria-label="Redo"><Icon name="redo" /></button>
          <button className={`budget-chip ${budgetPct > 100 ? 'over' : ''}`} onClick={() => setBriefOpen(true)}>
            <span className="mono">{money(result.cost.total, true)}</span><span className="bar"><i style={{ width: `${Math.min(100, budgetPct)}%` }} /></span>
          </button>
          {kit.includes('intern') && <span className="live-score mono" title="Eager Intern estimate">≈{result.overall}</span>}
          <button className="icon-btn brief-btn" onClick={() => setBriefOpen(o => !o)} aria-label="Brief"><Icon name="brief" /><span className="badge">{done}/{result.checklist.length}</span></button>
          <button className="primary submit-btn" onClick={() => setConfirm(true)}><Icon name="stamp" size={18} /><span>Submit</span></button>
        </div>
      </header>

      <nav className="ed-tools">
        {TOOLS.map(t => (
          <button key={t.id} className={`tool ${tool === t.id && view === 'plan' ? 'on' : ''}`} onClick={() => { setView('plan'); pickTool(t.id) }}>
            <Icon name={t.icon} size={22} /><span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="ed-canvas">
        {view === 'plan' ? (
          <PlanView project={project} li={li} tool={tool} itemType={itemType} itemRot={itemRot} selection={selection} fitSignal={fitSignal} flash={flash}
            validateRect={(r) => canPlaceRoom(project, li, r)} validateItem={(it) => canPlaceItem(project, li, it)}
            onTap={handleTap} onRect={handleRect} onStroke={handleStroke} onItemDrop={handleDrop} onMoveItem={handleMove} />
        ) : (
          <View3D project={project} cutLevel={cut ? li : null} />
        )}

        <div className="levels">
          {[...project.levels.keys()].reverse().map(i => (
            <button key={i} className={`lvl ${i === li ? 'on' : ''}`} onClick={() => { setLi(i); setSelection(null) }}>L{i + 1}</button>
          ))}
          {brief.levels.max > 1 && <button className="lvl add" onClick={() => setLevelMenu(m => !m)} aria-label="Levels"><Icon name="layers" size={16} /></button>}
          {levelMenu && (
            <div className="level-menu">
              <button onClick={() => { const r = addLevel(project, brief.levels.max); if (commit(r)) setLi(project.levels.length); setLevelMenu(false) }}><Icon name="plus" size={16} />Add empty level</button>
              <button onClick={() => { const r = duplicateLevel(project, project.levels.length - 1, brief.levels.max); if (commit(r)) setLi(project.levels.length); setLevelMenu(false) }}><Icon name="copy" size={16} />Duplicate top level</button>
              <button disabled={project.levels.length <= 1} onClick={() => { commit(removeTopLevel(project)); setLevelMenu(false) }}><Icon name="trash" size={16} />Remove top level</button>
              <p className="mono dim">{brief.levels.min === brief.levels.max ? `${brief.levels.min} level` : `${brief.levels.min}–${brief.levels.max} levels`}</p>
            </div>
          )}
        </div>

        {view === '3d' && (
          <div className="view3d-hud">
            <button className={`chip ${cut ? 'on' : ''}`} onClick={() => setCut(c => !c)}><Icon name="section" size={16} />Cutaway L{li + 1}</button>
          </div>
        )}

        <div className="title-block mono">
          <div><b>{brief.name.toUpperCase()}</b></div>
          <div>CLIENT {offer.client.toUpperCase()}</div>
          <div>LEVEL {li + 1}/{project.levels.length} · SCALE 1:{Math.round(100)} · {result.stats.area} m² GFA</div>
        </div>

        {toast && <div className={`toast ${toast.kind}`}>{toast.text}</div>}
      </main>

      <section className="ed-palette">
        {view === '3d' ? <p className="hint">Drag to orbit · pinch to zoom · two fingers to pan. Switch to Plan to edit.</p>
          : selRoom ? <RoomInspector room={selRoom} kit={kit} brief={brief}
            onType={(type) => commit(updateRoom(project, li, selRoom.id, { type, floor: ROOMS[type].wet && !MATERIALS[selRoom.floor].wetSafe ? 'ceramic' : selRoom.floor }))}
            onFloor={(floor) => commit(updateRoom(project, li, selRoom.id, { floor }))}
            onDelete={deleteSelection} onClose={() => setSelection(null)} say={say} />
            : selItem ? <ItemInspector item={selItem}
              onRotate={() => commit(moveItem(project, li, selItem.id, { rot: (selItem.rot + 1) % 2 }))}
              onDelete={deleteSelection} onClose={() => setSelection(null)} />
              : <Palette styles={offer.styles} tool={tool} brief={brief} kit={kit} result={result} project={project}
                roomType={roomType} setRoomType={setRoomType} itemType={itemType} setItemType={setItemType}
                itemRot={itemRot} setItemRot={setItemRot} floorMat={floorMat} setFloorMat={setFloorMat}
                setFacade={(f) => commit({ project: { ...project, facade: f } }, `Facade: ${MATERIALS[f].label}`)} say={say} />}
      </section>

      <aside className="ed-brief">
        <BriefPanel offer={offer} brief={brief} result={result} twist={twist} kit={kit} onClose={() => setBriefOpen(false)} />
      </aside>
      {briefOpen && <div className="scrim" onClick={() => setBriefOpen(false)} />}

      {confirm && (
        <div className="modal-wrap" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Submit for review?</h3>
            <p className="dim">The client, a planner and a critic will walk through your building. You can't edit after submitting.</p>
            <ul className="mini-check">
              {result.checklist.filter(c => !c.ok).slice(0, 6).map((c, i) => <li key={i}><Icon name="x" size={14} />{c.label} <span className="mono dim">{c.detail}</span></li>)}
              {result.checklist.every(c => c.ok) && <li className="ok"><Icon name="check" size={14} />Every requirement is met.</li>}
            </ul>
            <div className="row end">
              <button className="ghost" onClick={() => setConfirm(false)}>Keep designing</button>
              <button className="primary" onClick={() => onSubmit(project)}><Icon name="stamp" size={18} />Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Palette({ styles, tool, brief, kit, result, project, roomType, setRoomType, itemType, setItemType, itemRot, setItemRot, floorMat, setFloorMat, setFacade, say }) {
  const [more, setMore] = useState(false)
  const [tab, setTab] = useState('Brief')
  if (tool === 'room') {
    const program = [...new Set(brief.rooms.map(r => r.type))]
    const extra = Object.keys(ROOMS).filter(t => !program.includes(t))
    const status = (t) => result.checklist.filter(c => c.kind === 'room' && c.type === t)
    return (
      <div className="palette">
        <p className="hint">{HINTS.room}</p>
        <div className="chips">
          {program.map(t => {
            const ok = status(t).every(c => c.ok)
            return <button key={t} className={`chip room-chip ${roomType === t ? 'on' : ''}`} onClick={() => setRoomType(t)}>
              <i className="sw" style={{ background: ROOMS[t].color }} />{ROOMS[t].label}{ok && <Icon name="check" size={14} className="ok" />}
            </button>
          })}
          <button className={`chip ${more ? 'on' : ''}`} onClick={() => setMore(m => !m)}>{more ? 'Less' : 'More rooms…'}</button>
          {more && extra.map(t => <button key={t} className={`chip room-chip ${roomType === t ? 'on' : ''}`} onClick={() => setRoomType(t)}><i className="sw" style={{ background: ROOMS[t].color }} />{ROOMS[t].label}</button>)}
        </div>
      </div>
    )
  }
  if (tool === 'furnish') {
    const groups = ['Brief', 'Furniture', 'Equipment', 'Decor', 'Site', 'Vertical', 'Special']
    const required = [...new Set(brief.items.map(i => i.type))]
    const list = tab === 'Brief' ? required : Object.keys(ITEMS).filter(id => ITEMS[id].group === tab)
    const itemStatus = (t) => result.checklist.find(c => c.kind === 'item' && c.type === t)
    return (
      <div className="palette">
        <div className="tabs">
          {groups.map(g => <button key={g} className={tab === g ? 'on' : ''} onClick={() => setTab(g)}>{g}</button>)}
          <button className="chip rot" onClick={() => setItemRot(r => (r + 1) % 2)}><Icon name="rotate" size={16} />{itemRot ? '90°' : '0°'}</button>
        </div>
        <div className="chips items">
          {list.map(id => {
            const def = ITEMS[id]
            const locked = !unlockedItem(id, kit)
            const st = itemStatus(id)
            const s = itemSize({ type: id, rot: 0 })
            return (
              <button key={id} className={`item-chip ${itemType === id ? 'on' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => locked ? say(`Unlock with the “${CARDS[def.card].name}” card.`) : setItemType(id)}>
                <svg viewBox={`-0.2 -0.2 ${s.w + 0.4} ${s.h + 0.4}`} className="item-ico"><ItemSymbol type={id} w={s.w} h={s.h} /></svg>
                <span>{def.label}</span>
                {st && <em className={st.ok ? 'ok' : ''}>{st.detail}</em>}
                {locked && <Icon name="lock" size={14} className="lock" />}
              </button>
            )
          })}
          {tab === 'Special' && list.every(id => !unlockedItem(id, kit)) && <p className="hint">Special pieces come from cards you collect.</p>}
        </div>
      </div>
    )
  }
  if (tool === 'finish') {
    const Swatch = ({ m, on, onPick }) => {
      const locked = !unlockedMaterial(m.id, kit)
      const match = m.tags.some(t => styles.includes(t))
      return (
        <button className={`swatch ${on ? 'on' : ''} ${locked ? 'locked' : ''} ${match ? 'match' : ''}`} onClick={() => locked ? say(`Unlock with the “${CARDS[m.card].name}” card.`) : onPick(m.id)}>
          <i style={{ background: m.color }} />
          <span>{m.label}</span>
          <em className="mono">{m.tags.map(t => STYLES[t]).join(' · ') || 'neutral'}{m.wetSafe && m.kind === 'floor' ? ' · wet ✓' : ''}</em>
          {locked && <Icon name="lock" size={14} className="lock" />}
          {match && <b className="match-dot" title="Matches client taste">★</b>}
        </button>
      )
    }
    return (
      <div className="palette">
        <div className="swatch-row"><span className="mono label">FACADE</span>
          <div className="chips">{materialsOfKind('facade').map(m => <Swatch key={m.id} m={m} on={project.facade === m.id} onPick={setFacade} />)}</div>
        </div>
        <div className="swatch-row"><span className="mono label">FLOOR</span>
          <div className="chips">{materialsOfKind('floor').map(m => <Swatch key={m.id} m={m} on={floorMat === m.id} onPick={setFloorMat} />)}</div>
        </div>
      </div>
    )
  }
  return <div className="palette"><p className="hint">{HINTS[tool]}</p></div>
}

function RoomInspector({ room, kit, brief, onType, onFloor, onDelete, onClose, say }) {
  const program = [...new Set(brief.rooms.map(r => r.type))]
  const types = [...program, ...Object.keys(ROOMS).filter(t => !program.includes(t))]
  return (
    <div className="palette inspector">
      <div className="insp-head">
        <i className="sw" style={{ background: ROOMS[room.type].color }} />
        <strong>{ROOMS[room.type].label}</strong>
        <span className="mono dim">{room.w} × {room.h} m · {roomArea(room)} m²</span>
        <button className="icon-btn danger" onClick={onDelete} aria-label="Delete room"><Icon name="trash" size={18} /></button>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <div className="chips">
        {types.map(t => <button key={t} className={`chip room-chip ${room.type === t ? 'on' : ''}`} onClick={() => onType(t)}><i className="sw" style={{ background: ROOMS[t].color }} />{ROOMS[t].label}</button>)}
      </div>
      <div className="chips">
        {materialsOfKind('floor').map(m => {
          const locked = !unlockedMaterial(m.id, kit)
          return <button key={m.id} className={`chip ${room.floor === m.id ? 'on' : ''} ${locked ? 'locked' : ''}`}
            onClick={() => locked ? say(`Unlock with the “${CARDS[m.card].name}” card.`) : ROOMS[room.type].wet && !m.wetSafe ? say(`${m.label} isn't water-safe.`, 'error') : onFloor(m.id)}>
            <i className="sw" style={{ background: m.color }} />{m.label}{locked && <Icon name="lock" size={12} />}
          </button>
        })}
      </div>
    </div>
  )
}

function ItemInspector({ item, onRotate, onDelete, onClose }) {
  const def = ITEMS[item.type]
  return (
    <div className="palette inspector">
      <div className="insp-head">
        <strong>{def.label}</strong>
        <span className="mono dim">{money(def.cost)} · drag it to move</span>
        <button className="chip" onClick={onRotate}><Icon name="rotate" size={16} />Rotate</button>
        <button className="icon-btn danger" onClick={onDelete} aria-label="Delete item"><Icon name="trash" size={18} /></button>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
    </div>
  )
}

function BriefPanel({ offer, brief, result, twist, kit, onClose }) {
  const groups = [
    ['Rooms', result.checklist.filter(c => c.kind === 'room')],
    ['Equipment', result.checklist.filter(c => c.kind === 'item')],
    ['Relationships', result.checklist.filter(c => c.kind === 'adj')],
    ['Building', result.checklist.filter(c => !c.kind || c.kind === 'budget')],
  ]
  return (
    <div className="brief-panel">
      <div className="bp-head">
        <div>
          <span className="mono dim">BRIEF · TIER {brief.tier}</span>
          <h3>{brief.name}</h3>
          <p className="dim small">{offer.client}</p>
        </div>
        <button className="icon-btn close-brief" onClick={onClose} aria-label="Close brief"><Icon name="x" /></button>
      </div>
      <p className="blurb">{brief.blurb}</p>
      <div className="bp-facts">
        <div><span className="mono dim">BUDGET</span><b>{money(offer.budget)}</b></div>
        <div><span className="mono dim">COST</span><b className={result.cost.total > offer.budget ? 'bad' : ''}>{money(result.cost.total)}</b></div>
        <div><span className="mono dim">LOT</span><b>{offer.lot.w} × {offer.lot.h} m</b></div>
        <div><span className="mono dim">LEVELS</span><b>{brief.levels.min === brief.levels.max ? brief.levels.min : `${brief.levels.min}–${brief.levels.max}`}</b></div>
      </div>
      <div className="bp-style">
        <span className="mono dim">CLIENT TASTE</span>
        <div className="row wrap">{offer.styles.map(s => <span key={s} className="tag-chip">{STYLES[s]}</span>)}</div>
      </div>
      {twist && <div className="twist"><b>{twist.name}</b><span>{twist.text}</span></div>}
      {kit.includes('intern') && (
        <div className="intern">
          <span className="mono dim">INTERN'S ESTIMATE</span>
          <div className="row"><span>Function <b>{result.functionality}</b></span><span>Brief <b>{result.requirements}</b></span><span>Looks <b>{result.aesthetics}</b></span></div>
        </div>
      )}
      {groups.map(([name, items]) => items.length > 0 && (
        <div key={name} className="bp-group">
          <span className="mono dim">{name.toUpperCase()}</span>
          <ul className="checklist">
            {items.map((c, i) => <li key={i} className={c.ok ? 'ok' : ''}><span className="tick">{c.ok ? <Icon name="check" size={13} stroke={2.5} /> : null}</span><span>{c.label}</span><em className="mono">{c.detail}</em></li>)}
          </ul>
        </div>
      ))}
      <p className="dim small">Scored on Functionality (circulation, access, adjacency), Requirements (program, equipment, budget) and Aesthetics (daylight, proportion, style, palette, landscape, facade, massing).</p>
    </div>
  )
}
