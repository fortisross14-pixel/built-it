import React, { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './icons.jsx'
import PlanView, { ItemSymbol } from './PlanView.jsx'
import View3D from './View3D.jsx'
import { CEILINGS, DOORS, FAMILIES, INDUSTRIES, ITEMS, itemLabel, productsFor, MATERIALS, PAINTS, QUALITY, ROOMS, STYLES, familyOf, isDecorLayer, itemCost, itemSize, materialsOfKind } from '../game/catalog.js'
import { BRIEFS, TWISTS } from '../game/briefs.js'
import { available, lockReason } from '../game/packs.js'
import {
  addLevel, addRoom, canPlaceItem, canPlaceRoom, cutRoom, duplicateLevel, extendRoom, itemAt, roomRuns, itemCells, mergeCandidates, mergeRooms, moveItem, moveRoom,
  nearestEdge, placeItem, removeItem, removeRoom, removeTopLevel, roomAt, roomArea, setOpening, toggleOpening, updateRoom,
} from '../engine/plan.js'
import { evaluate } from '../engine/score.js'
import { money } from './format.js'
import { feedback } from './fx.js'

// Two layers: Design (2D plan: rooms, openings, furniture) and Decorate (3D: finishes, decor, lighting).
// Catalog tools (Room, Furnish, Decor, Lights) open a catalog; you pick one thing, place as many as
// you like, and the red ✕ ends placing.
const LAYERS = {
  design: [
    { id: 'select', label: 'Select', icon: 'select' },
    { id: 'room', label: 'Room', icon: 'room', catalog: true },
    { id: 'furnish', label: 'Furnish', icon: 'sofa', catalog: true },
    { id: 'door', label: 'Door', icon: 'door' },
    { id: 'window', label: 'Window', icon: 'window' },
    { id: 'erase', label: 'Erase', icon: 'eraser' },
  ],
  decorate: [
    { id: 'look', label: 'Select', icon: 'select' },
    { id: 'floor', label: 'Floor', icon: 'grid' },
    { id: 'paint', label: 'Paint', icon: 'brush' },
    { id: 'ceiling', label: 'Ceiling', icon: 'layers' },
    { id: 'facade', label: 'Facade', icon: 'building' },
    { id: 'decor', label: 'Decor', icon: 'leaf', catalog: true },
    { id: 'light', label: 'Lights', icon: 'bulb', catalog: true },
    { id: 'remove', label: 'Remove', icon: 'eraser' },
  ],
}

const HINTS = {
  select: 'Tap a room for Move / Merge / Erase, or an item to edit it. Two fingers pan and zoom.',
  door: 'Tap a wall to add or remove a door. Doors on outside walls are entrances.',
  window: 'Tap or drag along outside walls to add windows.',
  erase: 'Tap furniture, a door or a window to remove it. Rooms are removed from their Select bubble.',
  look: 'Drag to orbit, pinch to zoom. Tap a room or a decoration to edit it.',
  remove: 'Tap a decoration or a light to remove it.',
  placing: 'Tap or drag to place as many as you like. Press ✕ when you are done.',
  placingRoom: 'Drag across the grid to draw rooms. Press ✕ when you are done.',
}

function decorAt(level, x, y, preferCeiling) {
  const hits = level.items.filter(it => isDecorLayer(it.type) && itemCells(it).some(c => c.x === x && c.y === y))
  const ceil = hits.find(h => ITEMS[h.type].ceiling), floor = hits.find(h => !ITEMS[h.type].ceiling)
  return preferCeiling ? ceil || floor : floor || ceil
}

// "This project" filter: only what belongs to this brief's industry and rooms.
function relevantItem(id, brief) {
  const def = ITEMS[id]
  const program = new Set(brief.rooms.map(r => r.type))
  if (brief.items.some(r => r.type === id || (r.family && familyOf(id) === r.family))) return true
  if (def.ind) return def.ind.includes(brief.industry)
  if (def.vertical) return brief.levels.max > 1
  if (!def.rooms) return true
  return def.rooms.some(r => program.has(r) && !ROOMS[r].basic)
}

export default function Editor({ offer, kit, ctx, project: initial, onChange, onSubmit, onExit }) {
  const brief = BRIEFS[offer.briefId]
  const [project, setProject] = useState(initial)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [li, setLi] = useState(0)
  const [layer, setLayer] = useState('design')
  const [tool, setTool] = useState('select')
  const [catalog, setCatalog] = useState(project.levels[0].rooms.length ? null : 'room')
  const [placing, setPlacing] = useState(null) // { kind: 'room' | 'item', type }
  const [showAll, setShowAll] = useState(false)
  const [itemRot, setItemRot] = useState(0)
  const [quality, setQuality] = useState(1)
  const [floorMat, setFloorMat] = useState('vinyl')
  const [paint, setPaint] = useState('chalk')
  const [ceil, setCeil] = useState('plain')
  const [selection, setSelection] = useState(null)
  const [moving, setMoving] = useState(null)
  const [merging, setMerging] = useState(null)
  const [shaping, setShaping] = useState(null) // { id, mode: 'extend' | 'cut' }
  const [confirmErase, setConfirmErase] = useState(null)
  const [toast, setToast] = useState(null)
  const [briefOpen, setBriefOpen] = useState(false)
  const [levelMenu, setLevelMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [wholeBuilding, setWholeBuilding] = useState(false)
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
    toastTimer.current = setTimeout(() => setToast(null), 2800)
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
  const undo = () => { if (!past.length) return; feedback('undo'); setFuture(f => [project, ...f]); setProject(past[past.length - 1]); setPast(p => p.slice(0, -1)); setSelection(null); setMoving(null); setMerging(null) }
  const redo = () => { if (!future.length) return; feedback('undo'); setPast(p => [...p, project]); setProject(future[0]); setFuture(f => f.slice(1)) }

  const clearModes = () => { setSelection(null); setMoving(null); setMerging(null); setShaping(null) }
  const stopPlacing = () => { setPlacing(null); setTool(layer === 'design' ? 'select' : 'look'); feedback('tool') }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      else if (e.key === 'r') setItemRot(r => (r + 1) % 2)
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selection?.kind === 'item') { commit(removeItem(project, li, selection.id), null, 'remove'); setSelection(null) }
      else if (e.key === 'Escape') { if (catalog) setCatalog(null); else if (placing) stopPlacing(); else clearModes() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const switchLayer = (l) => {
    if (l === layer) return
    feedback('tool')
    setLayer(l); clearModes(); setHover(null); setPlacing(null); setCatalog(null)
    setTool(l === 'design' ? 'select' : 'look')
  }
  const pickTool = (t) => {
    if (t.id !== tool) feedback('tool')
    clearModes(); setPlacing(null)
    setTool(t.id)
    if (t.catalog) setCatalog(t.id)
  }
  // First product line this architect may use (drinks chillers etc. can be locked).
  const productOk = (type, pid) => { const pd = productsFor(type)?.[pid]; return !!pd && available(pd, `${type}:${pid}`, ctx) }
  const firstProduct = (type) => { const ps = productsFor(type); return ps ? Object.keys(ps).find(pid => productOk(type, pid)) : undefined }
  const pickFromCatalog = (kind, type) => {
    feedback('select')
    setPlacing({ kind, type, product: kind === 'item' ? firstProduct(type) : undefined })
    setCatalog(null)
    if (kind === 'room') setTool('room')
  }

  // ---------------------------------------------------------------- Design (2D)
  const planTool = shaping ? 'room' : placing?.kind === 'room' ? 'room' : placing && layer === 'design' ? 'furnish' : tool === 'room' || tool === 'furnish' ? 'select' : tool
  const itemType = placing?.kind === 'item' ? placing.type : null

  const handleTap = ({ wx, wy, x, y }) => {
    if (moving || shaping) return
    if (merging) {
      const r = roomAt(level, x, y)
      if (r && merging.ids.has(r.id)) {
        const res = mergeRooms(project, li, merging.id, r.id)
        if (commit(res, `Merged into one ${ROOMS[res.room.type].label.toLowerCase()} · ${roomArea(res.room)} m²`, 'room')) setSelection({ kind: 'room', id: res.room.id })
      } else say('Tap one of the highlighted rooms, or Cancel.')
      setMerging(null)
      return
    }
    if (planTool === 'select') {
      const it = itemAt(level, x, y)
      if (it) { feedback('select'); return setSelection({ kind: 'item', id: it.id }) }
      const r = roomAt(level, x, y)
      if (r) { feedback('select'); return setSelection({ kind: 'room', id: r.id }) }
      return setSelection(null)
    }
    if (planTool === 'door') {
      const e = nearestEdge(wx, wy)
      if (e.dist > 0.45) return say('Tap closer to a wall.')
      return commit(toggleOpening(project, li, e.key, 'door'), null, 'opening')
    }
    if (planTool === 'erase') {
      const it = itemAt(level, x, y)
      if (it) return commit(removeItem(project, li, it.id), null, 'remove')
      const e = nearestEdge(wx, wy)
      if (e.dist < 0.35) {
        if (level.doors.includes(e.key)) return commit(toggleOpening(project, li, e.key, 'door'), null, 'remove')
        if (level.windows.includes(e.key)) return commit(toggleOpening(project, li, e.key, 'window'), null, 'remove')
      }
      if (roomAt(level, x, y)) say('Erase only removes objects. To remove a room, Select it and use Erase in its bubble.')
      return
    }
    if (planTool === 'furnish' && itemType) {
      const s = itemSize({ type: itemType, rot: itemRot })
      handleDrop({ x: Math.round(wx - s.w / 2), y: Math.round(wy - s.h / 2) })
    }
  }
  const handleRect = (rect) => {
    if (shaping) {
      const res = (shaping.mode === 'extend' ? extendRoom : cutRoom)(project, li, shaping.id, rect)
      commit(res, res.room ? `${ROOMS[res.room.type].label} · ${roomArea(res.room)} m²` : null, shaping.mode === 'extend' ? 'room' : 'remove')
      return
    }
    if (placing?.kind !== 'room') return
    commit(addRoom(project, li, rect, placing.type, floorMat), null, 'room')
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
  const handleDrop = (o) => { if (itemType) commit(placeItem(project, li, { type: itemType, rot: itemRot, q: quality, ...(placing?.product ? { product: placing.product } : {}), ...o })) }
  const handleMove = (id, o) => commit(moveItem(project, li, id, o))

  const selRoom = selection?.kind === 'room' ? level.rooms.find(r => r.id === selection.id) : null
  const selItem = selection?.kind === 'item' ? level.items.find(r => r.id === selection.id) : null
  // While shaping, taps on the plan do nothing (drags draw the rectangle).
  const moveCheck = useMemo(() => moving ? moveRoom(project, li, moving.id, moving.dx, moving.dy) : null, [moving, project, li])

  const startMove = () => { feedback('tool'); setMoving({ id: selRoom.id, dx: 0, dy: 0 }) }
  const confirmMove = () => {
    if (!moving.dx && !moving.dy) { setMoving(null); return }
    if (commit(moveCheck, null, 'room')) setMoving(null)
  }
  const startMerge = () => {
    const cands = mergeCandidates(level, selRoom)
    if (!cands.length) return say(`No neighbouring ${ROOMS[selRoom.type].label.toLowerCase()} shares a whole wall with this one.`)
    if (cands.length === 1) {
      const res = mergeRooms(project, li, selRoom.id, cands[0].id)
      if (commit(res, `Merged · ${roomArea(res.room)} m²`, 'room')) setSelection({ kind: 'room', id: res.room.id })
      return
    }
    feedback('tool')
    setMerging({ id: selRoom.id, ids: new Set(cands.map(r => r.id)) })
    say('Tap the room to merge with.')
  }

  let bubble = null
  if (layer === 'design' && moving) {
    bubble = (
      <div className="bubble-row">
        <span className="mono">{moving.dx || moving.dy ? `${moving.dx >= 0 ? '+' : ''}${moving.dx}, ${moving.dy >= 0 ? '+' : ''}${moving.dy} m` : 'Drag to move'}</span>
        <button className="bb ok" disabled={!!moveCheck?.error} onClick={confirmMove}><Icon name="check" size={16} />Place</button>
        <button className="bb" onClick={() => setMoving(null)}><Icon name="x" size={16} />Cancel</button>
        {moveCheck?.error && (moving.dx || moving.dy) ? <em className="bb-err">{moveCheck.error}</em> : null}
      </div>
    )
  } else if (layer === 'design' && shaping) {
    const r = level.rooms.find(x => x.id === shaping.id)
    bubble = (
      <div className="bubble-row">
        <span>{shaping.mode === 'extend' ? 'Drag a rectangle touching the room to add it' : 'Drag across the room to carve it out'}</span>
        <span className="mono dim">{r ? `${roomArea(r)} m²` : ''}</span>
        <button className="bb ok" onClick={() => { feedback('tool'); setShaping(null) }}><Icon name="check" size={16} />Done</button>
      </div>
    )
  } else if (layer === 'design' && merging) {
    bubble = <div className="bubble-row"><span>Tap a highlighted room</span><button className="bb" onClick={() => setMerging(null)}><Icon name="x" size={16} />Cancel</button></div>
  } else if (layer === 'design' && selRoom) {
    const program = [...new Set(brief.rooms.map(r => r.type))]
    const types = [...program, ...Object.keys(ROOMS).filter(t => !program.includes(t) && (showAll || ROOMS[t].basic))]
    const canMerge = mergeCandidates(level, selRoom).length > 0
    bubble = (
      <div className="bubble-col">
        <div className="bubble-head">
          <i className="sw" style={{ background: ROOMS[selRoom.type].color }} />
          <select value={selRoom.type} aria-label="Room type" onChange={(e) => commit(updateRoom(project, li, selRoom.id, { type: e.target.value, floor: ROOMS[e.target.value].wet && !MATERIALS[selRoom.floor].wetSafe ? 'ceramic' : selRoom.floor }), null, 'select')}>
            {types.map(t => <option key={t} value={t}>{ROOMS[t].label}</option>)}
          </select>
          <span className="mono dim">{roomArea(selRoom)} m²{roomArea(selRoom) !== selRoom.w * selRoom.h ? ' · custom shape' : ` · ${selRoom.w}×${selRoom.h}`}</span>
          <button className="bb icon" onClick={() => setSelection(null)} aria-label="Close"><Icon name="x" size={16} /></button>
        </div>
        <div className="bubble-row">
          <button className="bb" onClick={() => { feedback('tool'); setShaping({ id: selRoom.id, mode: 'extend' }) }}><Icon name="plus" size={16} />Extend</button>
          <button className="bb" onClick={() => { feedback('tool'); setShaping({ id: selRoom.id, mode: 'cut' }) }}><Icon name="cut" size={16} />Cut</button>
        </div>
        <div className="bubble-row">
          <button className="bb" onClick={startMove}><Icon name="move" size={16} />Move</button>
          <button className="bb" onClick={startMerge} disabled={!canMerge} title={canMerge ? '' : 'Needs a same-type neighbour sharing a whole wall'}><Icon name="merge" size={16} />Merge</button>
          <button className="bb danger" onClick={() => { feedback('tap'); setConfirmErase(selRoom.id) }}><Icon name="trash" size={16} />Erase</button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------- Decorate (3D)
  const placing3D = layer === 'decorate' && placing?.kind === 'item' ? placing.type : null
  const originAt = (p, type) => { const s = itemSize({ type, rot: itemRot }); return { x: Math.round(p.wx - s.w / 2), y: Math.round(p.wy - s.h / 2) } }
  const tap3D = (p) => {
    const room = roomAt(level, p.x, p.y)
    if (placing3D) {
      if (ITEMS[placing3D].site && li !== 0) return say('Landscaping goes on the ground level.')
      const o = originAt(p, placing3D), sz = itemSize({ type: placing3D, rot: itemRot })
      if (commit(placeItem(project, li, { type: placing3D, rot: itemRot, q: quality, ...(placing?.product ? { product: placing.product } : {}), ...o }))) setPulse({ x: o.x + sz.w / 2, y: o.y + sz.h / 2, w: sz.w, h: sz.h, li, ceiling: ITEMS[placing3D].ceiling, id: Date.now() })
      return
    }
    if (tool === 'look') {
      const it = decorAt(level, p.x, p.y, false) || itemAt(level, p.x, p.y)
      if (it) { feedback('select'); return setSelection({ kind: 'item', id: it.id }) }
      if (room) feedback('select')
      return setSelection(room ? { kind: 'room', id: room.id } : null)
    }
    if (['floor', 'paint', 'ceiling'].includes(tool)) {
      if (!room) return say('Tap inside a room.')
      if (tool === 'floor') {
        if (ROOMS[room.type].wet && !MATERIALS[floorMat].wetSafe) return say(`${MATERIALS[floorMat].label} isn't water-safe. Not for a ${ROOMS[room.type].label.toLowerCase()}.`, 'error')
        commit(updateRoom(project, li, room.id, { floor: floorMat, floorQ: quality }), null, 'paint')
      } else if (tool === 'paint') commit(updateRoom(project, li, room.id, { wall: paint, wallQ: quality }), null, 'paint')
      else commit(updateRoom(project, li, room.id, { ceiling: ceil }), null, 'paint')
      setPulse({ x: p.wx, y: p.wy, w: 2, h: 2, li, ceiling: tool === 'ceiling', id: Date.now() })
      setFlash(room.id); setTimeout(() => setFlash(null), 300)
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
    if (selRoom) roomRuns(selRoom).forEach(q => out.push({ ...q, li }))
    if (selItem) { const s = itemSize(selItem); out.push({ x: selItem.x, y: selItem.y, w: s.w, h: s.h, li, ceiling: ITEMS[selItem.type].ceiling }) }
    if (hover) {
      if (placing3D) {
        const o = originAt(hover, placing3D); const s = itemSize({ type: placing3D, rot: itemRot })
        out.push({ ...o, w: s.w, h: s.h, li, ceiling: ITEMS[placing3D].ceiling, bad: !canPlaceItem(project, li, { type: placing3D, rot: itemRot, ...o }).ok })
      } else if (['floor', 'paint', 'ceiling', 'look'].includes(tool)) {
        const r = roomAt(level, hover.x, hover.y)
        if (r && r.id !== selRoom?.id) roomRuns(r).forEach(q => out.push({ ...q, li, soft: true, ceiling: tool === 'ceiling' }))
      }
    }
    if (flash) { const r = level.rooms.find(r => r.id === flash); if (r) roomRuns(r).forEach(q => out.push({ ...q, li, ceiling: tool === 'ceiling' })) }
    return out
  }, [layer, selection, hover, placing3D, itemRot, project, li, tool, flash]) // eslint-disable-line

  // ---------------------------------------------------------------- palette (bottom tray)
  const budgetPct = Math.round(result.cost.total / offer.budget * 100)
  const twist = offer.twist ? TWISTS[offer.twist] : null
  const done = result.checklist.filter(c => c.ok).length
  const qualityBar = <QualityPicker value={quality} onChange={setQuality} />
  const swatchItems = (src, kind) => Object.entries(src).map(([id, m]) => ({ id, kind, ...m }))

  let palette
  if (selItem) {
    palette = <ItemInspector item={selItem}
      onQuality={(v) => commit(moveItem(project, li, selItem.id, { q: v }), null, 'select')}
      onProduct={(pid) => productOk(selItem.type, pid) ? commit(moveItem(project, li, selItem.id, { product: pid }), null, 'select') : say(lockReason(productsFor(selItem.type)[pid]))}
      productOk={(pid) => productOk(selItem.type, pid)}
      onRotate={() => commit(moveItem(project, li, selItem.id, { rot: (selItem.rot + 1) % 2 }), null, 'select')}
      onDelete={() => { commit(removeItem(project, li, selItem.id), null, 'remove'); setSelection(null) }} onClose={() => setSelection(null)} />
  } else if (layer === 'decorate' && selRoom) {
    palette = <RoomFinishInspector room={selRoom} ctx={ctx} styles={offer.styles} say={say} onClose={() => setSelection(null)}
      onPatch={(patch) => commit(updateRoom(project, li, selRoom.id, patch), null, 'paint')} />
  } else if (placing) {
    palette = <div className="palette"><div className="tabs"><span className="hint grow">{placing.kind === 'room' ? HINTS.placingRoom : productsFor(placing.type) ? 'Pick the product in the bar above. Group a department together and put displays next to their racks.' : HINTS.placing}</span><div className="tabs-extra">{placing.kind === 'item' && qualityBar}</div></div></div>
  } else if (tool === 'floor') {
    palette = <SwatchPalette label="FLOOR" items={materialsOfKind('floor')} value={floorMat} ctx={ctx} styles={offer.styles} say={say} onPick={setFloorMat} extra={qualityBar} hint="Pick a floor and quality, then tap rooms." />
  } else if (tool === 'paint') {
    palette = <SwatchPalette label="WALLS" items={swatchItems(PAINTS, 'paint')} value={paint} ctx={ctx} styles={offer.styles} say={say} onPick={setPaint} extra={qualityBar} hint="Pick a paint and quality, then tap rooms." />
  } else if (tool === 'ceiling') {
    palette = <SwatchPalette label="CEILING" items={swatchItems(CEILINGS, 'ceiling')} value={ceil} ctx={ctx} styles={offer.styles} say={say} onPick={setCeil} hint="Pick a ceiling finish, then tap rooms. Ceilings are shown while this tool is on." />
  } else if (tool === 'facade') {
    palette = (
      <div className="palette">
        <SwatchRow label="FACADE" items={materialsOfKind('facade')} value={project.facade} ctx={ctx} styles={offer.styles} say={say}
          onPick={(f) => commit({ project: { ...project, facade: f } }, `Facade: ${MATERIALS[f].label}`, 'paint')} />
        <SwatchRow label="ENTRANCE" items={swatchItems(DOORS, 'door')} value={project.door || 'standard'} ctx={ctx} styles={offer.styles} say={say}
          onPick={(d) => commit({ project: { ...project, door: d } }, `Entrances: ${DOORS[d].label}`, 'paint')} />
      </div>
    )
  } else {
    palette = <div className="palette"><p className="hint">{HINTS[tool] || ''}</p></div>
  }

  const placingDef = placing?.kind === 'item' ? ITEMS[placing.type] : null

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
          {kit.includes('intern') && <span className="live-score mono" title="Eager intern estimate">≈{result.overall}</span>}
          <button className="icon-btn brief-btn" onClick={() => setBriefOpen(o => !o)} aria-label="Brief"><Icon name="brief" /><span className="badge">{done}/{result.checklist.length}</span></button>
          <button className="primary submit-btn" onClick={() => setConfirm(true)}><Icon name="stamp" size={18} /><span>Submit</span></button>
        </div>
      </header>

      <nav className="ed-tools">
        {LAYERS[layer].map(t => (
          <button key={t.id} className={`tool ${tool === t.id ? 'on' : ''}`} onClick={() => pickTool(t)}>
            <Icon name={t.icon} size={22} /><span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="ed-canvas">
        {layer === 'design' ? (
          <PlanView project={project} li={li} tool={moving || merging ? 'select' : planTool} itemType={itemType} itemRot={itemRot} selection={selection} flash={flash}
            validateRect={(r) => shaping ? (() => { const e = (shaping.mode === 'extend' ? extendRoom : cutRoom)(project, li, shaping.id, r).error; return { ok: !e, error: e } })() : canPlaceRoom(project, li, r)}
            validateItem={(it) => canPlaceItem(project, li, it)} shaping={shaping?.mode}
            onTap={handleTap} onRect={handleRect} onStroke={handleStroke} onItemDrop={handleDrop} onMoveItem={handleMove}
            moving={moving ? { ...moving, ok: !moveCheck?.error || (!moving.dx && !moving.dy) } : null} onMoveDrag={(dx, dy) => setMoving(m => m && (m.dx !== dx || m.dy !== dy) ? { ...m, dx, dy } : m)}
            mergeIds={merging?.ids} bubble={bubble} />
        ) : (
          <View3D project={project} cutLevel={wholeBuilding ? null : li} night={night} pickLevel={li}
            onTap={tap3D} onHover={setHover} highlights={highlights} pulse={pulse} focusLevel={li} showCeilings={tool === 'ceiling'} />
        )}

        <div className="levels">
          {[...project.levels.keys()].reverse().map(i => (
            <button key={i} className={`lvl ${i === li ? 'on' : ''}`} onClick={() => { setLi(i); clearModes() }}>L{i + 1}</button>
          ))}
          {brief.levels.max > 1 && layer === 'design' && <button className="lvl add" onClick={() => setLevelMenu(m => !m)} aria-label="Levels"><Icon name="layers" size={16} /></button>}
          {levelMenu && layer === 'design' && (
            <div className="level-menu">
              <button onClick={() => { const r = addLevel(project, brief.levels.max); if (commit(r, null, 'room')) setLi(project.levels.length); setLevelMenu(false) }}><Icon name="plus" size={16} />Add empty level</button>
              <button onClick={() => { const r = duplicateLevel(project, project.levels.length - 1, brief.levels.max); if (commit(r, null, 'room')) setLi(project.levels.length); setLevelMenu(false) }}><Icon name="copy" size={16} />Duplicate top level</button>
              <button disabled={project.levels.length <= 1} onClick={() => { commit(removeTopLevel(project), null, 'remove'); setLevelMenu(false) }}><Icon name="trash" size={16} />Remove top level</button>
              <p className="mono dim">{brief.levels.min === brief.levels.max ? `${brief.levels.min} level${brief.levels.min > 1 ? 's' : ''}` : `${brief.levels.min}–${brief.levels.max} levels`}</p>
            </div>
          )}
        </div>

        {placing && (
          <div className="placing-bar" role="status">
            <button className="placing-what" onClick={() => setCatalog(placing.kind === 'room' ? 'room' : tool)} aria-label="Change item">
              {placing.kind === 'room'
                ? <i className="sw lg" style={{ background: ROOMS[placing.type].color }} />
                : <svg viewBox={`-0.2 -0.2 ${placingDef.w + 0.4} ${placingDef.h + 0.4}`} className="item-ico"><ItemSymbol type={placing.type} w={placingDef.w} h={placingDef.h} product={placing.product} /></svg>}
              <span><em className="mono">PLACING</em><b>{placing.kind === 'room' ? ROOMS[placing.type].label : placingDef.label}</b></span>
              <Icon name="chevron" size={14} />
            </button>
            {placing.kind === 'item' && productsFor(placing.type) && (
              <ProductPicker type={placing.type} value={placing.product} ok={(pid) => productOk(placing.type, pid)}
                onPick={(pid) => productOk(placing.type, pid) ? (feedback('tap'), setPlacing(pl => ({ ...pl, product: pid }))) : say(lockReason(productsFor(placing.type)[pid]))} />
            )}
            {placing.kind === 'item' && !productsFor(placing.type) && <QualityPicker value={quality} onChange={setQuality} compact />}
            {placing.kind === 'item' && placingDef.w !== placingDef.h && <button className="chip rot" onClick={() => setItemRot(r => (r + 1) % 2)} aria-label="Rotate"><Icon name="rotate" size={16} /></button>}
            <button className="stop-x" onClick={stopPlacing} aria-label="Stop placing"><Icon name="x" size={20} stroke={2.6} /></button>
          </div>
        )}

        {layer === 'decorate' && !placing && (
          <div className="view3d-hud">
            <button className={`chip ${wholeBuilding ? '' : 'on'}`} onClick={() => setWholeBuilding(v => !v)}><Icon name="section" size={16} />{wholeBuilding ? 'Whole building' : `Cut at L${li + 1}`}</button>
            <button className={`chip ${night ? 'on' : ''}`} onClick={() => setNight(n => !n)}><Icon name={night ? 'moon' : 'sun'} size={16} />{night ? 'Night' : 'Day'}</button>
          </div>
        )}

        {layer === 'design' && (
          <div className="title-block mono">
            <div><b>{brief.name.toUpperCase()}</b></div>
            <div>CLIENT {offer.client.toUpperCase()} · LEVEL {brief.level}/10</div>
            <div>FLOOR {li + 1}/{project.levels.length} · SCALE 1:100 · {result.stats.area} m² GFA</div>
          </div>
        )}

        {toast && <div key={toast.id} className={`toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div>}
      </main>

      <section className="ed-palette">{palette}</section>

      <aside className="ed-brief">
        <BriefPanel offer={offer} brief={brief} result={result} twist={twist} kit={kit} onClose={() => setBriefOpen(false)} />
      </aside>
      {briefOpen && <div className="scrim" onClick={() => setBriefOpen(false)} />}

      {catalog && (
        <CatalogSheet kind={catalog} brief={brief} ctx={ctx} result={result} showAll={showAll} setShowAll={setShowAll}
          onPick={pickFromCatalog} onClose={() => { setCatalog(null); if (!placing) setTool(layer === 'design' ? 'select' : 'look') }} say={say} />
      )}

      {confirmErase && (
        <div className="modal-wrap" onClick={() => setConfirmErase(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="alertdialog" aria-label="Remove room">
            <h3>Are you sure you want to remove the room?</h3>
            <p className="dim">The {ROOMS[level.rooms.find(r => r.id === confirmErase)?.type]?.label.toLowerCase() || 'room'} and everything inside it (furniture, decor, lights, doors and windows in its walls) will be removed. You can undo this.</p>
            <div className="row end">
              <button className="ghost" onClick={() => setConfirmErase(null)} autoFocus>Keep it</button>
              <button className="primary danger" onClick={() => { commit(removeRoom(project, li, confirmErase), null, 'remove'); setConfirmErase(null); setSelection(null) }}><Icon name="trash" size={18} />Remove room</button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="modal-wrap" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Submit for review?</h3>
            <p className="dim">The client, a planner, a critic and an accountant will walk through your building. F fails the project: you can retry, at the cost of a strike.</p>
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

// ---------------------------------------------------------------- catalog
const UNLOCK_LABEL = { B: 'B unlock', A: 'A unlock', S: 'S unlock' }

function CatalogSheet({ kind, brief, ctx, result, showAll, setShowAll, onPick, onClose, say }) {
  const title = { room: 'Rooms', furnish: 'Furniture & equipment', decor: 'Decor & landscape', light: 'Ceiling lighting' }[kind]
  const program = [...new Set(brief.rooms.map(r => r.type))]
  let sections
  if (kind === 'room') {
    const basics = Object.keys(ROOMS).filter(t => !program.includes(t) && ROOMS[t].basic)
    const others = Object.keys(ROOMS).filter(t => !program.includes(t) && !ROOMS[t].basic)
    sections = [['In the brief', program], ['Support spaces', basics], ...(showAll ? [['Other room types', others]] : [])]
      .map(([name, ids]) => [name, ids.map(id => ({ id, room: true }))])
  } else {
    const pool = Object.keys(ITEMS).filter(id => kind === 'furnish' ? !isDecorLayer(id) : kind === 'light' ? ITEMS[id].ceiling : isDecorLayer(id) && !ITEMS[id].ceiling)
    const shown = pool.filter(id => showAll || relevantItem(id, brief))
    const required = shown.filter(id => brief.items.some(r => r.type === id || (r.family && familyOf(id) === r.family)))
    const rest = shown.filter(id => !required.includes(id))
    const groups = {}
    for (const id of rest) (groups[ITEMS[id].group] ||= []).push(id)
    sections = [['Required by the brief', required], ...Object.entries(groups)].filter(([, ids]) => ids.length).map(([name, ids]) => [name, ids.map(id => ({ id }))])
  }
  const roomStatus = (t) => result.checklist.filter(c => c.kind === 'room' && c.type === t)
  const itemStatus = (id) => result.checklist.find(c => c.kind === 'item' && c.type === id && !c.product) || result.checklist.find(c => c.kind === 'item' && c.type === id) || result.checklist.find(c => c.kind === 'item' && c.family && c.family === familyOf(id))
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <div className="seg filter-seg">
            <button className={!showAll ? 'on' : ''} onClick={() => setShowAll(false)}>This project</button>
            <button className={showAll ? 'on' : ''} onClick={() => setShowAll(true)}>All</button>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close catalog"><Icon name="x" /></button>
        </div>
        <div className="sheet-body">
          {sections.map(([name, list]) => (
            <section key={name}>
              <span className="mono dim">{name.toUpperCase()}</span>
              <div className="cat-grid">
                {list.map(({ id, room }) => {
                  if (room) {
                    const st = roomStatus(id)
                    const ok = st.length && st.every(c => c.ok)
                    return (
                      <button key={id} className="cat-card" onClick={() => onPick('room', id)}>
                        <span className="cat-art"><i className="room-swatch" style={{ background: ROOMS[id].color }} /></span>
                        <b>{ROOMS[id].label}</b>
                        <em className="mono">{st.length ? st.map(c => c.detail).join(' · ') : ROOMS[id].wet ? 'wet room' : ' '}</em>
                        {ok ? <span className="cat-ok"><Icon name="check" size={12} stroke={3} /></span> : null}
                      </button>
                    )
                  }
                  const def = ITEMS[id]
                  const open = available(def, id, ctx)
                  const st = itemStatus(id)
                  return (
                    <button key={id} className={`cat-card ${open ? '' : 'locked'}`} onClick={() => open ? onPick('item', id) : say(lockReason(def))}>
                      <span className="cat-art"><svg viewBox={`-0.3 -0.3 ${def.w + 0.6} ${def.h + 0.6}`} className="item-ico"><ItemSymbol type={id} w={def.w} h={def.h} /></svg></span>
                      <b>{def.label}</b>
                      <em className="mono">{money(def.cost, true)} · {def.w}×{def.h} m{def.boost ? ` · +${(def.boost.f || 0) + (def.boost.a || 0)}` : ''}{def.products ? ` · ${Object.keys(productsFor(id)).length} products` : ''}</em>
                      {st && open && <span className={`cat-req ${st.ok ? 'ok' : ''}`}>{st.detail}</span>}
                      {!open && <span className={`cat-lock ${def.pack ? 'pack' : `g-${def.unlock}`}`}><Icon name="lock" size={11} />{def.pack ? 'Pack' : UNLOCK_LABEL[def.unlock]}</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
          {!showAll && <button className="ghost show-all" onClick={() => setShowAll(true)}>Show everything, including other industries</button>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- palette pieces
export function QualityPicker({ value, onChange, compact }) {
  return (
    <div className={`quality ${compact ? 'compact' : ''}`} role="radiogroup" aria-label="Quality">
      {QUALITY.map(qq => (
        <button key={qq.id} className={`q-${qq.id} ${value === qq.id ? 'on' : ''}`} onClick={() => { feedback('tap'); onChange(qq.id) }} role="radio" aria-checked={value === qq.id}>
          <span>{compact ? qq.label[0] : qq.label}</span>{!compact && <em className="mono">×{qq.cost}</em>}
        </button>
      ))}
    </div>
  )
}

function SwatchRow({ label, items, value, ctx, styles, say, onPick }) {
  return (
    <div className="swatch-row"><span className="mono label">{label}</span>
      <div className="chips">
        {items.map(m => {
          const open = available(m, m.id, ctx)
          const match = m.tags.some(t => styles.includes(t))
          return (
            <button key={m.id} className={`swatch ${value === m.id ? 'on' : ''} ${open ? '' : 'locked'} ${match ? 'match' : ''}`}
              onClick={() => open ? onPick(m.id) : say(lockReason(m))}>
              <i style={{ background: m.color }} />
              <span>{m.label}</span>
              <em className="mono">{m.tags.map(t => STYLES[t]).join(' · ') || 'neutral'}{m.wetSafe && m.kind === 'floor' ? ' · wet ✓' : ''}</em>
              {!open && <Icon name="lock" size={14} className="lock" />}
              {match && <b className="match-dot" title="Matches client taste">★</b>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SwatchPalette({ label, items, value, ctx, styles, say, onPick, extra, hint }) {
  return (
    <div className="palette">
      <div className="tabs"><span className="hint grow">{hint}</span><div className="tabs-extra">{extra}</div></div>
      <SwatchRow label={label} items={items} value={value} ctx={ctx} styles={styles} say={say} onPick={onPick} />
    </div>
  )
}

function RoomFinishInspector({ room, ctx, styles, say, onPatch, onClose }) {
  const chips = (src, field, extra) => Object.entries(src).map(([id, m]) => {
    const open = available(m, id, ctx)
    return <button key={id} className={`chip ${room[field] === id ? 'on' : ''} ${open ? '' : 'locked'}`}
      onClick={() => { if (!open) say(lockReason(m)); else if (extra) extra(id, m); else onPatch({ [field]: id }) }}>
      <i className="sw" style={{ background: m.color }} />{m.label}{m.tags.some(t => styles.includes(t)) && <b className="star">★</b>}{!open && <Icon name="lock" size={12} />}
    </button>
  })
  const floors = Object.fromEntries(materialsOfKind('floor').map(m => [m.id, m]))
  return (
    <div className="palette inspector">
      <div className="insp-head">
        <i className="sw" style={{ background: ROOMS[room.type].color }} />
        <strong>{ROOMS[room.type].label}</strong>
        <span className="mono dim">{roomArea(room)} m²</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      <div className="swatch-row"><span className="mono label">FLOOR</span>
        <div className="chips"><QualityPicker value={room.floorQ ?? 1} onChange={(v) => onPatch({ floorQ: v })} compact />
          {chips(floors, 'floor', (id, m) => ROOMS[room.type].wet && !m.wetSafe ? say(`${m.label} isn't water-safe.`, 'error') : onPatch({ floor: id }))}</div>
      </div>
      <div className="swatch-row"><span className="mono label">WALLS</span>
        <div className="chips"><QualityPicker value={room.wallQ ?? 1} onChange={(v) => onPatch({ wallQ: v })} compact />{chips(PAINTS, 'wall')}</div>
      </div>
      <div className="swatch-row"><span className="mono label">CEILING</span>
        <div className="chips">{chips(CEILINGS, 'ceiling')}</div>
      </div>
    </div>
  )
}

export function ProductPicker({ type, value, ok, onPick }) {
  const ps = productsFor(type)
  return (
    <div className="products" role="radiogroup" aria-label="Product">
      {Object.entries(ps).map(([pid, pd]) => (
        <button key={pid} className={`prod ${value === pid ? 'on' : ''} ${ok(pid) ? '' : 'locked'}`} role="radio" aria-checked={value === pid} onClick={() => onPick(pid)}>
          <i style={{ background: pd.color }} />{pd.label}{!ok(pid) && <Icon name="lock" size={11} />}
        </button>
      ))}
    </div>
  )
}

function ItemInspector({ item, onQuality, onRotate, onDelete, onClose, onProduct, productOk }) {
  const def = ITEMS[item.type]
  return (
    <div className="palette inspector">
      <div className="insp-head">
        <strong>{itemLabel(item)}</strong>
        <span className="mono dim">{money(itemCost(item))}{isDecorLayer(item.type) ? '' : ' · drag to move'}</span>
        <button className="chip" onClick={onRotate}><Icon name="rotate" size={16} /><span className="hide-xs">Rotate</span></button>
        <button className="icon-btn danger" onClick={onDelete} aria-label="Delete item"><Icon name="trash" size={18} /></button>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
      </div>
      {productsFor(item.type) && <div className="row"><span className="mono dim">PRODUCT</span><ProductPicker type={item.type} value={item.product || Object.keys(productsFor(item.type))[0]} ok={productOk} onPick={onProduct} /></div>}
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
          <span className="mono dim">BRIEF · LEVEL {brief.level}/10</span>
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
          <div className="row wrap"><span>Function <b>{result.functionality}</b></span><span>Brief <b>{result.requirements}</b></span><span>Looks <b>{result.aesthetics}</b></span><span>Budget <b>{result.budget}</b></span><span>Grade <b>{result.grade}</b></span></div>
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
      <p className="dim small">Graded <b>F · C · B · A · S</b> on the average of Functionality, Requirements, Aesthetics and Budget. F fails. B, A and S unlock better {INDUSTRIES[brief.industry].label.toLowerCase()} pieces for every future architect.</p>
    </div>
  )
}

export { FAMILIES }
