import React, { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './icons.jsx'
import PlanView, { ItemSymbol } from './PlanView.jsx'
import View3D from './View3D.jsx'
import { ITEMS, MATERIALS, PAINTS, QUALITY, ROOMS, STYLES, isDecorLayer, itemCost, itemSize, materialsOfKind, q } from '../game/catalog.js'
import { BRIEFS, TWISTS } from '../game/briefs.js'
import { CARDS } from '../game/cards.js'
import {
  addLevel, addRoom, canPlaceItem, canPlaceRoom, duplicateLevel, itemAt, itemCells, moveItem, nearestEdge,
  placeItem, removeItem, removeRoom, removeTopLevel, roomAt, roomArea, setOpening, toggleOpening, updateRoom,
} from '../engine/plan.js'
import { evaluate } from '../engine/score.js'
import { money } from './format.js'
import { feedback } from './fx.js'

// Two layers: Design (2D plan: the building and its furniture) and Decorate (3D: finishes, decor, lighting).
const LAYERS = {
  design: [
    { id: 'select', label: 'Select', icon: 'select' },
    { id: 'room', label: 'Room', icon: 'room' },
    { id: 'door', label: 'Door', icon: 'door' },
    { id: 'window', label: 'Window', icon: 'window' },
    { id: 'furnish', label: 'Furnish', icon: 'sofa' },
    { id: 'erase', label: 'Erase', icon: 'eraser' },
  ],
  decorate: [
    { id: 'look', label: 'Select', icon: 'select' },
    { id: 'floor', label: 'Floor', icon: 'grid' },
    { id: 'paint', label: 'Paint', icon: 'brush' },
    { id: 'facade', label: 'Facade', icon: 'building' },
    { id: 'decor', label: 'Decor', icon: 'leaf' },
    { id: 'light', label: 'Lights', icon: 'bulb' },
    { id: 'remove', label: 'Remove', icon: 'eraser' },
  ],
}

const HINTS = {
  select: 'Tap a room or item to edit it. Drag a selected item to move it. Two fingers pan and zoom.',
  room: 'Pick a room type, then drag across the grid to draw it.',
  door: 'Tap a wall to add or remove a door. Doors on outside walls are entrances.',
  window: 'Tap or drag along outside walls to add windows.',
  furnish: 'Pick an item and a quality, then tap or drag it into place.',
  erase: 'Tap an item, door, window or room to remove it.',
  look: 'Drag to orbit, pinch to zoom. Tap a room or a decoration to edit it.',
  facade: 'The facade material wraps the whole building.',
  remove: 'Tap a decoration or a light to remove it.',
}

const unlockedMaterial = (id, kit) => MATERIALS[id].base || kit.includes(MATERIALS[id].card)
const unlockedItem = (id, kit) => !ITEMS[id].card || kit.includes(ITEMS[id].card)
const DESIGN_GROUPS = ['Brief', 'Furniture', 'Equipment', 'Vertical', 'Special']
const DECOR_GROUPS = ['Decor', 'Site', 'Special']

function decorAt(level, x, y, preferCeiling) {
  const hits = level.items.filter(it => isDecorLayer(it.type) && itemCells(it).some(c => c.x === x && c.y === y))
  const ceil = hits.find(h => ITEMS[h.type].ceiling), floor = hits.find(h => !ITEMS[h.type].ceiling)
  return preferCeiling ? ceil || floor : floor || ceil
}

export default function Editor({ offer, kit, project: initial, onChange, onSubmit, onExit }) {
  const brief = BRIEFS[offer.briefId]
  const [project, setProject] = useState(initial)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [li, setLi] = useState(0)
  const [layer, setLayer] = useState('design')
  const [tool, setTool] = useState('room')
  const [roomType, setRoomType] = useState(brief.rooms[0].type)
  const [itemType, setItemType] = useState(null)
  const [decoType, setDecoType] = useState('plant')
  const [lightType, setLightType] = useState('downlight')
  const [itemRot, setItemRot] = useState(0)
  const [quality, setQuality] = useState(1)
  const [floorMat, setFloorMat] = useState('vinyl')
  const [paint, setPaint] = useState('chalk')
  const [selection, setSelection] = useState(null)
  const [toast, setToast] = useState(null)
  const [briefOpen, setBriefOpen] = useState(false)
  const [levelMenu, setLevelMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [night, setNight] = useState(false)
  const [hover, setHover] = useState(null)
  const [flash, setFlash] = useState(null)
  const [pulse, setPulse] = useState(null)
  const toastTimer = useRef(null)

  const level = project.levels[Math.min(li, project.levels.length - 1)]
  const result = useMemo(() => evaluate(project, offer, kit), [project, offer, kit])

  useEffect(() => { const t = setTimeout(() => onChange(project), 400); return () => clearTimeout(t) }, [project]) // eslint-disable-line
  useEffect(() => { if (li >= project.levels.length) setLi(project.levels.length - 1) }, [project.levels.length, li])

  const say = (text, kind = 'info') => {
    clearTimeout(toastTimer.current)
    if (kind === 'error') feedback('error')
    setToast({ text, kind, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }
  const commit = (res, okMsg, ev = 'place') => {
    const next = res?.project ?? res
    if (res?.error) { say(res.error, 'error'); return false }
    if (!next || next === project) return false
    setPast(p => [...p.slice(-59), project]); setFuture([]); setProject(next)
    feedback(res?.removed ? 'remove' : ev)
    if (okMsg) say(okMsg)
    return true
  }
  const undo = () => { if (!past.length) return; feedback('undo'); setFuture(f => [project, ...f]); setProject(past[past.length - 1]); setPast(p => p.slice(0, -1)); setSelection(null) }
  const redo = () => { if (!future.length) return; feedback('undo'); setPast(p => [...p, project]); setProject(future[0]); setFuture(f => f.slice(1)) }

  const deleteSelection = () => {
    if (!selection) return
    if (selection.kind === 'room') commit(removeRoom(project, li, selection.id), null, 'remove')
    else commit(removeItem(project, li, selection.id), null, 'remove')
    setSelection(null)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (e.key === 'r') setItemRot(r => (r + 1) % 2)
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selection) deleteSelection()
      else if (e.key === 'Escape') setSelection(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const switchLayer = (l) => {
    if (l !== layer) feedback('tool')
    setLayer(l); setSelection(null); setHover(null)
    setTool(l === 'design' ? 'select' : 'look')
  }
  const pickTool = (t) => { if (t !== tool) feedback('tool'); setTool(t); setSelection(null); if (t === 'furnish' && !itemType) setItemType(brief.items[0].type) }

  // ---------------------------------------------------------------- Design (2D) handlers
  const handleTap = ({ wx, wy, x, y }) => {
    if (tool === 'select' || tool === 'room') {
      const it = tool === 'select' ? itemAt(level, x, y) : null
      if (it) { feedback('select'); return setSelection({ kind: 'item', id: it.id }) }
      const r = roomAt(level, x, y)
      if (r) { feedback('select'); setSelection({ kind: 'room', id: r.id }); if (tool === 'room') setTool('select'); return }
      return setSelection(null)
    }
    if (tool === 'door') {
      const e = nearestEdge(wx, wy)
      if (e.dist > 0.45) return say('Tap closer to a wall.')
      return commit(toggleOpening(project, li, e.key, 'door'), null, 'opening')
    }
    if (tool === 'erase') {
      const it = itemAt(level, x, y)
      if (it) return commit(removeItem(project, li, it.id), null, 'remove')
      const e = nearestEdge(wx, wy)
      if (e.dist < 0.3) {
        if (level.doors.includes(e.key)) return commit(toggleOpening(project, li, e.key, 'door'), null, 'remove')
        if (level.windows.includes(e.key)) return commit(toggleOpening(project, li, e.key, 'window'), null, 'remove')
      }
      const r = roomAt(level, x, y)
      if (r) return commit(removeRoom(project, li, r.id), null, 'remove')
    }
    if (tool === 'furnish' && itemType) {
      const s = itemSize({ type: itemType, rot: itemRot })
      handleDrop({ x: Math.round(wx - s.w / 2), y: Math.round(wy - s.h / 2) })
    }
  }
  const handleRect = (rect) => {
    const res = addRoom(project, li, rect, roomType, floorMat)
    if (commit(res, null, 'room')) setSelection({ kind: 'room', id: res.room.id })
  }
  const handleStroke = (keys) => {
    let p = project, last = null
    for (const k of keys) {
      const r = keys.length === 1 ? toggleOpening(p, li, k, 'window') : setOpening(p, li, k, 'window')
      if (r.error) last = r.error; else p = r.project
    }
    if (p === project && last) say(last, 'error')
    else commit(p, null, 'opening')
  }
  const handleDrop = (o) => { if (itemType) commit(placeItem(project, li, { type: itemType, rot: itemRot, q: quality, ...o })) }
  const handleMove = (id, o) => commit(moveItem(project, li, id, o))

  // ---------------------------------------------------------------- Decorate (3D) handlers
  const placing = tool === 'decor' ? decoType : tool === 'light' ? lightType : null
  const originAt = (p, type) => { const s = itemSize({ type, rot: itemRot }); return { x: Math.round(p.wx - s.w / 2), y: Math.round(p.wy - s.h / 2) } }
  const tap3D = (p) => {
    const room = roomAt(level, p.x, p.y)
    if (tool === 'look') {
      const it = decorAt(level, p.x, p.y, false) || (itemAt(level, p.x, p.y))
      if (it) { feedback('select'); return setSelection({ kind: 'item', id: it.id }) }
      if (room) feedback('select')
      return setSelection(room ? { kind: 'room', id: room.id } : null)
    }
    if (tool === 'floor' || tool === 'paint') {
      if (!room) return say('Tap inside a room.')
      if (tool === 'floor') {
        if (ROOMS[room.type].wet && !MATERIALS[floorMat].wetSafe) return say(`${MATERIALS[floorMat].label} isn't water-safe. Not for a ${ROOMS[room.type].label.toLowerCase()}.`, 'error')
        commit(updateRoom(project, li, room.id, { floor: floorMat, floorQ: quality }), null, 'paint')
      } else commit(updateRoom(project, li, room.id, { wall: paint, wallQ: quality }), null, 'paint')
      setPulse({ x: p.wx, y: p.wy, w: 2, h: 2, li, id: Date.now() })
      setFlash(room.id); setTimeout(() => setFlash(null), 300)
      return
    }
    if (placing) {
      if (ITEMS[placing].site && li !== 0) return say('Landscaping goes on the ground level.')
      const o = originAt(p, placing), sz = itemSize({ type: placing, rot: itemRot })
      if (commit(placeItem(project, li, { type: placing, rot: itemRot, q: quality, ...o }))) setPulse({ x: o.x + sz.w / 2, y: o.y + sz.h / 2, w: sz.w, h: sz.h, li, ceiling: ITEMS[placing].ceiling, id: Date.now() })
      return
    }
    if (tool === 'remove') {
      const it = decorAt(level, p.x, p.y, true)
      if (it) return commit(removeItem(project, li, it.id), null, 'remove')
      say('Nothing to remove there. Furniture is removed in Design 2D.')
    }
  }

  const highlights = useMemo(() => {
    if (layer !== 'decorate') return []
    const out = []
    const selRoom3 = selection?.kind === 'room' ? level.rooms.find(r => r.id === selection.id) : null
    if (selRoom3) out.push({ ...selRoom3, li })
    const selIt = selection?.kind === 'item' ? level.items.find(r => r.id === selection.id) : null
    if (selIt) { const s = itemSize(selIt); out.push({ x: selIt.x, y: selIt.y, w: s.w, h: s.h, li, ceiling: ITEMS[selIt.type].ceiling }) }
    if (hover) {
      if (placing) {
        const o = originAt(hover, placing); const s = itemSize({ type: placing, rot: itemRot })
        out.push({ ...o, w: s.w, h: s.h, li, ceiling: ITEMS[placing].ceiling, bad: !canPlaceItem(project, li, { type: placing, rot: itemRot, ...o }).ok })
      } else if (tool === 'floor' || tool === 'paint' || tool === 'look') {
        const r = roomAt(level, hover.x, hover.y)
        if (r && r.id !== selRoom3?.id) out.push({ ...r, li, soft: true })
      }
    }
    if (flash) { const r = level.rooms.find(r => r.id === flash); if (r) out.push({ ...r, li }) }
    return out
  }, [layer, selection, hover, placing, itemRot, project, li, tool, flash]) // eslint-disable-line

  const selRoom = selection?.kind === 'room' ? level.rooms.find(r => r.id === selection.id) : null
  const selItem = selection?.kind === 'item' ? level.items.find(r => r.id === selection.id) : null
  const budgetPct = Math.round(result.cost.total / offer.budget * 100)
  const twist = offer.twist ? TWISTS[offer.twist] : null
  const done = result.checklist.filter(c => c.ok).length
  const tools = LAYERS[layer]
  const qualityBar = <QualityPicker value={quality} onChange={setQuality} />

  let palette
  if (selRoom && layer === 'design') {
    palette = <RoomTypeInspector room={selRoom} brief={brief}
      onType={(type) => commit(updateRoom(project, li, selRoom.id, { type, floor: ROOMS[type].wet && !MATERIALS[selRoom.floor].wetSafe ? 'ceramic' : selRoom.floor }))}
      onDelete={deleteSelection} onClose={() => setSelection(null)} />
  } else if (selRoom) {
    palette = <RoomFinishInspector room={selRoom} kit={kit} styles={offer.styles} say={say} onClose={() => setSelection(null)}
      onPatch={(patch) => commit(updateRoom(project, li, selRoom.id, patch))} />
  } else if (selItem) {
    palette = <ItemInspector item={selItem}
      onQuality={(v) => commit(moveItem(project, li, selItem.id, { q: v }))}
      onRotate={() => commit(moveItem(project, li, selItem.id, { rot: (selItem.rot + 1) % 2 }))}
      onDelete={deleteSelection} onClose={() => setSelection(null)} />
  } else if (tool === 'room') {
    palette = <RoomPalette brief={brief} result={result} roomType={roomType} setRoomType={setRoomType} />
  } else if (tool === 'furnish') {
    palette = <ItemPalette groups={DESIGN_GROUPS} brief={brief} kit={kit} result={result} value={itemType} onPick={setItemType} say={say}
      filter={(id) => !isDecorLayer(id)} extra={<>{qualityBar}<RotateBtn rot={itemRot} setRot={setItemRot} /></>} />
  } else if (tool === 'decor') {
    palette = <ItemPalette groups={DECOR_GROUPS} brief={brief} kit={kit} result={result} value={decoType} onPick={setDecoType} say={say}
      filter={(id) => isDecorLayer(id) && !ITEMS[id].ceiling} extra={<>{qualityBar}<RotateBtn rot={itemRot} setRot={setItemRot} /></>} />
  } else if (tool === 'light') {
    palette = <ItemPalette groups={['Lighting']} brief={brief} kit={kit} result={result} value={lightType} onPick={setLightType} say={say}
      filter={(id) => ITEMS[id].ceiling} extra={<>{qualityBar}<RotateBtn rot={itemRot} setRot={setItemRot} /></>}
      note={<LightingMeter result={result} />} />
  } else if (tool === 'floor') {
    palette = <SwatchPalette label="FLOOR" items={materialsOfKind('floor')} value={floorMat} kit={kit} styles={offer.styles} say={say} onPick={setFloorMat} extra={qualityBar} hint="Pick a floor and quality, then tap rooms." />
  } else if (tool === 'paint') {
    palette = <SwatchPalette label="WALLS" items={Object.entries(PAINTS).map(([id, p]) => ({ id, base: true, kind: 'paint', ...p }))} value={paint} kit={kit} styles={offer.styles} say={say} onPick={setPaint} extra={qualityBar} hint="Pick a paint and quality, then tap rooms." />
  } else if (tool === 'facade') {
    palette = <SwatchPalette label="FACADE" items={materialsOfKind('facade')} value={project.facade} kit={kit} styles={offer.styles} say={say} hint={HINTS.facade}
      onPick={(f) => commit({ project: { ...project, facade: f } }, `Facade: ${MATERIALS[f].label}`)} />
  } else {
    palette = <div className="palette"><p className="hint">{HINTS[tool]}</p></div>
  }

  return (
    <div className={`editor layer-${layer} ${briefOpen ? 'brief-open' : ''}`}>
      <header className="ed-top">
        <button className="icon-btn" onClick={onExit} aria-label="Back to studio"><Icon name="back" /></button>
        <div className="ed-title">
          <span className="mono dim">{offer.client}</span>
          <strong>{brief.name}</strong>
        </div>
        <div className="seg view-seg layer-seg">
          <button className={layer === 'design' ? 'on' : ''} onClick={() => switchLayer('design')}><Icon name="plan" size={16} /><span>Design <em>2D</em></span></button>
          <button className={layer === 'decorate' ? 'on' : ''} onClick={() => switchLayer('decorate')}><Icon name="cube" size={16} /><span>Decorate <em>3D</em></span></button>
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
        {tools.map(t => (
          <button key={t.id} className={`tool ${tool === t.id ? 'on' : ''}`} onClick={() => pickTool(t.id)}>
            <Icon name={t.icon} size={22} /><span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="ed-canvas">
        {layer === 'design' ? (
          <PlanView project={project} li={li} tool={tool} itemType={itemType} itemRot={itemRot} selection={selection} flash={flash}
            validateRect={(r) => canPlaceRoom(project, li, r)} validateItem={(it) => canPlaceItem(project, li, it)}
            onTap={handleTap} onRect={handleRect} onStroke={handleStroke} onItemDrop={handleDrop} onMoveItem={handleMove} />
        ) : (
          <View3D project={project} cutLevel={showAll ? null : li} night={night} pickLevel={li}
            onTap={tap3D} onHover={setHover} highlights={highlights} pulse={pulse} focusLevel={li} />
        )}

        <div className="levels">
          {[...project.levels.keys()].reverse().map(i => (
            <button key={i} className={`lvl ${i === li ? 'on' : ''}`} onClick={() => { setLi(i); setSelection(null) }}>L{i + 1}</button>
          ))}
          {brief.levels.max > 1 && layer === 'design' && <button className="lvl add" onClick={() => setLevelMenu(m => !m)} aria-label="Levels"><Icon name="layers" size={16} /></button>}
          {levelMenu && layer === 'design' && (
            <div className="level-menu">
              <button onClick={() => { const r = addLevel(project, brief.levels.max); if (commit(r)) setLi(project.levels.length); setLevelMenu(false) }}><Icon name="plus" size={16} />Add empty level</button>
              <button onClick={() => { const r = duplicateLevel(project, project.levels.length - 1, brief.levels.max); if (commit(r)) setLi(project.levels.length); setLevelMenu(false) }}><Icon name="copy" size={16} />Duplicate top level</button>
              <button disabled={project.levels.length <= 1} onClick={() => { commit(removeTopLevel(project)); setLevelMenu(false) }}><Icon name="trash" size={16} />Remove top level</button>
              <p className="mono dim">{brief.levels.min === brief.levels.max ? `${brief.levels.min} level` : `${brief.levels.min}–${brief.levels.max} levels`}</p>
            </div>
          )}
        </div>

        {layer === 'decorate' && (
          <div className="view3d-hud">
            <button className={`chip ${showAll ? '' : 'on'}`} onClick={() => setShowAll(v => !v)}><Icon name="section" size={16} />{showAll ? 'Whole building' : `Cut at L${li + 1}`}</button>
            <button className={`chip ${night ? 'on' : ''}`} onClick={() => setNight(n => !n)}><Icon name={night ? 'moon' : 'sun'} size={16} />{night ? 'Night' : 'Day'}</button>
          </div>
        )}

        {layer === 'design' && (
          <div className="title-block mono">
            <div><b>{brief.name.toUpperCase()}</b></div>
            <div>CLIENT {offer.client.toUpperCase()}</div>
            <div>LEVEL {li + 1}/{project.levels.length} · SCALE 1:100 · {result.stats.area} m² GFA</div>
          </div>
        )}

        {toast && <div key={toast.id} className={`toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div>}
      </main>

      <section className="ed-palette">{palette}</section>

      <aside className="ed-brief">
        <BriefPanel offer={offer} brief={brief} result={result} twist={twist} kit={kit} onClose={() => setBriefOpen(false)} />
      </aside>
      {briefOpen && <div className="scrim" onClick={() => setBriefOpen(false)} />}

      {confirm && (
        <div className="modal-wrap" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Submit for review?</h3>
            <p className="dim">The client, a planner, a critic and an accountant will walk through your building. You can't edit after submitting.</p>
            <ul className="mini-check">
              {result.checklist.filter(c => !c.ok).slice(0, 6).map((c, i) => <li key={i}><Icon name="x" size={14} />{c.label} <span className="mono dim">{c.detail}</span></li>)}
              {result.checklist.every(c => c.ok) && <li className="ok"><Icon name="check" size={14} />Every requirement is met.</li>}
            </ul>
            <div className="row end">
              <button className="ghost" onClick={() => setConfirm(false)}>Keep designing</button>
              <button className="primary" onClick={() => { feedback('stamp'); onSubmit(project) }}><Icon name="stamp" size={18} />Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- palette pieces
export function QualityPicker({ value, onChange }) {
  return (
    <div className="quality" role="radiogroup" aria-label="Quality">
      {QUALITY.map(qq => (
        <button key={qq.id} className={`q-${qq.id} ${value === qq.id ? 'on' : ''}`} onClick={() => onChange(qq.id)} role="radio" aria-checked={value === qq.id}>
          <span>{qq.label}</span><em className="mono">×{qq.cost}</em>
        </button>
      ))}
    </div>
  )
}

function RotateBtn({ rot, setRot }) {
  return <button className="chip rot" onClick={() => setRot(r => (r + 1) % 2)}><Icon name="rotate" size={16} />{rot ? '90°' : '0°'}</button>
}

function RoomPalette({ brief, result, roomType, setRoomType }) {
  const [more, setMore] = useState(false)
  const program = [...new Set(brief.rooms.map(r => r.type))]
  const extra = Object.keys(ROOMS).filter(t => !program.includes(t))
  const ok = (t) => result.checklist.filter(c => c.kind === 'room' && c.type === t).every(c => c.ok)
  return (
    <div className="palette">
      <p className="hint">{HINTS.room}</p>
      <div className="chips">
        {program.map(t => (
          <button key={t} className={`chip room-chip ${roomType === t ? 'on' : ''}`} onClick={() => setRoomType(t)}>
            <i className="sw" style={{ background: ROOMS[t].color }} />{ROOMS[t].label}{ok(t) && <Icon name="check" size={14} className="ok" />}
          </button>
        ))}
        <button className={`chip ${more ? 'on' : ''}`} onClick={() => setMore(m => !m)}>{more ? 'Less' : 'More rooms…'}</button>
        {more && extra.map(t => <button key={t} className={`chip room-chip ${roomType === t ? 'on' : ''}`} onClick={() => setRoomType(t)}><i className="sw" style={{ background: ROOMS[t].color }} />{ROOMS[t].label}</button>)}
      </div>
    </div>
  )
}

function ItemPalette({ groups, brief, kit, result, value, onPick, say, filter, extra, note }) {
  const [tab, setTab] = useState(groups[0])
  const required = [...new Set(brief.items.map(i => i.type))]
  const list = (tab === 'Brief' ? required : Object.keys(ITEMS).filter(id => ITEMS[id].group === tab)).filter(filter)
  const itemStatus = (t) => result.checklist.find(c => c.kind === 'item' && c.type === t)
  return (
    <div className="palette">
      <div className="tabs">
        {groups.length > 1 && groups.map(g => <button key={g} className={tab === g ? 'on' : ''} onClick={() => setTab(g)}>{g}</button>)}
        <div className="tabs-extra">{extra}</div>
      </div>
      {note}
      <div className="chips items">
        {list.map(id => {
          const def = ITEMS[id]
          const locked = !unlockedItem(id, kit)
          const st = itemStatus(id)
          const s = itemSize({ type: id, rot: 0 })
          return (
            <button key={id} className={`item-chip ${value === id ? 'on' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => locked ? say(`Unlock with the “${CARDS[def.card].name}” card.`) : onPick(id)}>
              <svg viewBox={`-0.2 -0.2 ${s.w + 0.4} ${s.h + 0.4}`} className="item-ico"><ItemSymbol type={id} w={s.w} h={s.h} /></svg>
              <span>{def.label}</span>
              {st ? <em className={st.ok ? 'ok' : ''}>{st.detail}</em> : <em className="price">{money(def.cost, true)}</em>}
              {locked && <Icon name="lock" size={14} className="lock" />}
            </button>
          )
        })}
        {!list.length && <p className="hint">Nothing here yet. Special pieces come from cards you collect.</p>}
      </div>
    </div>
  )
}

function SwatchPalette({ label, items, value, kit, styles, say, onPick, extra, hint }) {
  return (
    <div className="palette">
      <div className="tabs"><span className="hint grow">{hint}</span><div className="tabs-extra">{extra}</div></div>
      <div className="swatch-row"><span className="mono label">{label}</span>
        <div className="chips">
          {items.map(m => {
            const locked = m.kind !== 'paint' && !unlockedMaterial(m.id, kit)
            const match = m.tags.some(t => styles.includes(t))
            return (
              <button key={m.id} className={`swatch ${value === m.id ? 'on' : ''} ${locked ? 'locked' : ''} ${match ? 'match' : ''}`}
                onClick={() => locked ? say(`Unlock with the “${CARDS[m.card].name}” card.`) : onPick(m.id)}>
                <i style={{ background: m.color }} />
                <span>{m.label}</span>
                <em className="mono">{m.tags.map(t => STYLES[t]).join(' · ') || 'neutral'}{m.wetSafe && m.kind === 'floor' ? ' · wet ✓' : ''}</em>
                {locked && <Icon name="lock" size={14} className="lock" />}
                {match && <b className="match-dot" title="Matches client taste">★</b>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LightingMeter({ result }) {
  const c = result.checklist.find(c => c.kind === 'light')
  const v = parseInt(c?.detail) || 0
  return <div className="light-meter"><span className="mono dim">LIGHT LEVEL</span><div className="bar"><i style={{ width: `${v}%` }} className={v < 60 ? 'bad' : v < 90 ? 'mid' : ''} /></div><b className="mono">{v}%</b></div>
}

function RoomTypeInspector({ room, brief, onType, onDelete, onClose }) {
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
      <p className="hint">Floors, paint and lights are chosen in Decorate 3D.</p>
    </div>
  )
}

function RoomFinishInspector({ room, kit, styles, say, onPatch, onClose }) {
  return (
    <div className="palette inspector">
      <div className="insp-head">
        <i className="sw" style={{ background: ROOMS[room.type].color }} />
        <strong>{ROOMS[room.type].label}</strong>
        <span className="mono dim">{roomArea(room)} m²</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <div className="swatch-row"><span className="mono label">FLOOR</span>
        <div className="chips">
          <QualityPicker value={room.floorQ ?? 1} onChange={(v) => onPatch({ floorQ: v })} />
          {materialsOfKind('floor').map(m => {
            const locked = !unlockedMaterial(m.id, kit)
            return <button key={m.id} className={`chip ${room.floor === m.id ? 'on' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => locked ? say(`Unlock with the “${CARDS[m.card].name}” card.`) : ROOMS[room.type].wet && !m.wetSafe ? say(`${m.label} isn't water-safe.`, 'error') : onPatch({ floor: m.id })}>
              <i className="sw" style={{ background: m.color }} />{m.label}{m.tags.some(t => styles.includes(t)) && <b className="star">★</b>}{locked && <Icon name="lock" size={12} />}
            </button>
          })}
        </div>
      </div>
      <div className="swatch-row"><span className="mono label">WALLS</span>
        <div className="chips">
          <QualityPicker value={room.wallQ ?? 1} onChange={(v) => onPatch({ wallQ: v })} />
          {Object.entries(PAINTS).map(([id, p]) => (
            <button key={id} className={`chip ${room.wall === id ? 'on' : ''}`} onClick={() => onPatch({ wall: id })}>
              <i className="sw" style={{ background: p.color }} />{p.label}{p.tags.some(t => styles.includes(t)) && <b className="star">★</b>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemInspector({ item, onQuality, onRotate, onDelete, onClose }) {
  const def = ITEMS[item.type]
  return (
    <div className="palette inspector">
      <div className="insp-head">
        <strong>{def.label}</strong>
        <span className="mono dim">{money(itemCost(item))}{isDecorLayer(item.type) ? '' : ' · drag to move'}</span>
        <button className="chip" onClick={onRotate}><Icon name="rotate" size={16} /><span className="hide-xs">Rotate</span></button>
        <button className="icon-btn danger" onClick={onDelete} aria-label="Delete item"><Icon name="trash" size={18} /></button>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <div className="row"><span className="mono dim">QUALITY</span><QualityPicker value={item.q ?? 1} onChange={onQuality} /></div>
      <p className="hint">{['Basic: cheap, but staff and critics notice.', 'Standard: solid and sensible.', 'Premium: lifts Functionality and Aesthetics, at twice the price.'][item.q ?? 1]}</p>
    </div>
  )
}

function BriefPanel({ offer, brief, result, twist, kit, onClose }) {
  const groups = [
    ['Rooms', result.checklist.filter(c => c.kind === 'room')],
    ['Equipment', result.checklist.filter(c => c.kind === 'item')],
    ['Relationships', result.checklist.filter(c => c.kind === 'adj')],
    ['Building', result.checklist.filter(c => !c.kind || c.kind === 'budget' || c.kind === 'light')],
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
          <div className="row wrap"><span>Function <b>{result.functionality}</b></span><span>Brief <b>{result.requirements}</b></span><span>Looks <b>{result.aesthetics}</b></span><span>Budget <b>{result.budget}</b></span></div>
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
      <p className="dim small">Four ratings, averaged: <b>Functionality</b> (circulation, access, adjacency, lighting, equipment quality), <b>Requirements</b> (program, equipment, levels), <b>Aesthetics</b> (daylight, style, palette, finish quality, lighting mood, landscape, facade, massing) and <b>Budget</b>. Premium pieces lift the first and third and cost you the fourth.</p>
    </div>
  )
}
