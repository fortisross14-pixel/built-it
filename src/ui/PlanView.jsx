import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ITEMS, MATERIALS, PRODUCTS, ROOMS, itemSize } from '../game/catalog.js'
import { merchandise } from '../engine/score.js'
import { settings } from './fx.js'
import { inRoom, labelPoint, nearestEdge, normRect, roomArea, roomOutline, roomRuns, wallEdges } from '../engine/plan.js'

// CAD-style plan editor. One finger = current tool, two fingers = pan/zoom.
// Mouse: wheel zooms, right/middle drag pans.
export default function PlanView({
  project, li, tool, itemType, itemRot = 0, selection, fitSignal = 0,
  validateRect, validateItem, onTap, onRect, onStroke, onItemDrop, onMoveItem, flash,
  moving = null, onMoveDrag, mergeIds = null, bubble = null, shaping = null,
}) {
  const wrap = useRef(null)
  const svg = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const touched = useRef(false)
  const [view, setView] = useState(null)
  const [gesture, setGesture] = useState(null)
  const [hover, setHover] = useState(null)
  const pointers = useRef(new Map())
  const g = useRef(null)
  const { lot } = project
  const level = project.levels[li]

  useLayoutEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 1, h: el.clientHeight || 1 }))
    ro.observe(el)
    setSize({ w: el.clientWidth || 1, h: el.clientHeight || 1 })
    return () => ro.disconnect()
  }, [])

  // --- view motion: clamped, eased (frame-rate independent), with pan inertia (camera-systems skill)
  const anim = useRef(0)
  const viewRef = useRef(null)
  viewRef.current = view
  const fitZ = () => Math.min(size.w / (lot.w + 4), size.h / (lot.h + 8))
  const clampView = (nv) => {
    const z = Math.max(fitZ() * 0.45, Math.min(140, nv.z))
    return { z, cx: Math.max(-4, Math.min(lot.w + 4, nv.cx)), cy: Math.max(-4, Math.min(lot.h + 10, nv.cy)) }
  }
  const stopAnim = () => { cancelAnimationFrame(anim.current); anim.current = 0 }
  const setV = (nv) => { stopAnim(); setView(clampView(nv)) }
  const animateTo = (target) => {
    stopAnim()
    const to = clampView(target)
    if (!viewRef.current || settings.reduceMotion) return setView(to)
    let last = performance.now()
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const k = 1 - Math.exp(-14 * dt)
      const cur = viewRef.current
      const next = { cx: cur.cx + (to.cx - cur.cx) * k, cy: cur.cy + (to.cy - cur.cy) * k, z: cur.z + (to.z - cur.z) * k }
      const done = Math.abs(next.z - to.z) < 0.01 * to.z && Math.hypot(next.cx - to.cx, next.cy - to.cy) < 0.02
      viewRef.current = done ? to : next
      setView(viewRef.current)
      anim.current = done ? 0 : requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }
  const fling = (vx, vy) => { // vx, vy in world units per second
    stopAnim()
    if (settings.reduceMotion) return
    let last = performance.now()
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const decay = Math.exp(-5 * dt)
      vx *= decay; vy *= decay
      const cur = viewRef.current
      viewRef.current = clampView({ ...cur, cx: cur.cx - vx * dt, cy: cur.cy - vy * dt })
      setView(viewRef.current)
      anim.current = Math.hypot(vx, vy) > 0.3 ? requestAnimationFrame(step) : 0
    }
    anim.current = requestAnimationFrame(step)
  }
  useEffect(() => stopAnim, [])
  const fit = () => {
    touched.current = false
    const target = { cx: lot.w / 2, cy: lot.h / 2 + 1.8, z: fitZ() }
    if (viewRef.current) animateTo(target); else setView(target)
  }
  const zoomBy = (f) => { const r = svg.current.getBoundingClientRect(); touched.current = true; animateTo(zoomAt(f, r.left + size.w / 2, r.top + size.h / 2)) }
  // Refit when the canvas is measured or resized, unless the player has panned/zoomed.
  useEffect(() => { if (size.w > 1 && (!touched.current || !view)) fit() }, [size.w, size.h, fitSignal, lot.w, lot.h]) // eslint-disable-line

  const v = view || { cx: lot.w / 2, cy: lot.h / 2, z: 20 }
  const vb = [v.cx - size.w / 2 / v.z, v.cy - size.h / 2 / v.z, size.w / v.z, size.h / v.z]

  const toWorld = (cx, cy) => {
    const r = svg.current.getBoundingClientRect()
    return { wx: v.cx + (cx - r.left - size.w / 2) / v.z, wy: v.cy + (cy - r.top - size.h / 2) / v.z }
  }
  const cellOf = (p) => ({ x: Math.floor(p.wx), y: Math.floor(p.wy) })
  const itemOrigin = (p) => {
    const s = itemSize({ type: itemType, rot: itemRot })
    return { x: Math.round(p.wx - s.w / 2), y: Math.round(p.wy - s.h / 2) }
  }
  const zoomAt = (factor, clientX, clientY, base = v) => {
    const r = svg.current.getBoundingClientRect()
    const z = Math.max(4, Math.min(140, base.z * factor))
    const px = clientX - r.left - size.w / 2, py = clientY - r.top - size.h / 2
    const wx = base.cx + px / base.z, wy = base.cy + py / base.z
    return { cx: wx - px / z, cy: wy - py / z, z }
  }

  const begin = (next) => { if (next) stopAnim(); g.current = next; setGesture(next); if (next && (next.kind === 'pan' || next.kind === 'pinch')) touched.current = true }

  const onDown = (e) => {
    svg.current.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      begin({ kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, view: v })
      return
    }
    if (pointers.current.size > 2) return
    const p = toWorld(e.clientX, e.clientY)
    const start = { x: e.clientX, y: e.clientY, t: performance.now(), view: v, p }
    if (e.pointerType === 'mouse' && e.button !== 0) return begin({ kind: 'pan', ...start, noTap: true })
    if (moving) return begin({ kind: 'roomMove', ...start, base: { dx: moving.dx, dy: moving.dy } })
    if (tool === 'room') return begin({ kind: 'rect', ...start, a: cellOf(p), b: cellOf(p) })
    if (tool === 'window') {
      const ne = nearestEdge(p.wx, p.wy)
      return begin({ kind: 'stroke', ...start, keys: ne.dist < 0.4 ? [ne.key] : [] })
    }
    if (tool === 'furnish' && itemType) return begin({ kind: 'ghost', ...start, o: itemOrigin(p) })
    if (tool === 'select' && selection?.kind === 'item') {
      const it = level.items.find(i => i.id === selection.id)
      if (it) {
        const s = itemSize(it)
        if (p.wx >= it.x && p.wx < it.x + s.w && p.wy >= it.y && p.wy < it.y + s.h) {
          return begin({ kind: 'move', ...start, id: it.id, dx: p.wx - it.x, dy: p.wy - it.y, o: { x: it.x, y: it.y }, type: it.type, rot: it.rot })
        }
      }
    }
    begin({ kind: 'pan', ...start })
  }

  const onMove = (e) => {
    if (!pointers.current.has(e.pointerId)) {
      if (e.pointerType === 'mouse') setHover(toWorld(e.clientX, e.clientY))
      return
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const cur = g.current
    if (!cur) return
    if (cur.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const zoomed = zoomAt(d / cur.d, cur.mid.x, cur.mid.y, cur.view)
      setV({ ...zoomed, cx: zoomed.cx - (mid.x - cur.mid.x) / zoomed.z, cy: zoomed.cy - (mid.y - cur.mid.y) / zoomed.z })
      return
    }
    const p = toWorld(e.clientX, e.clientY)
    const moved = Math.hypot(e.clientX - cur.x, e.clientY - cur.y)
    if (cur.kind === 'pan') {
      if (moved > 4) setV({ ...cur.view, cx: cur.view.cx - (e.clientX - cur.x) / cur.view.z, cy: cur.view.cy - (e.clientY - cur.y) / cur.view.z })
      const now = performance.now()
      cur.samples = [...(cur.samples || []).filter(p => now - p.t < 90), { t: now, x: e.clientX, y: e.clientY }]
      return
    }
    let next = cur
    if (cur.kind === 'rect') next = { ...cur, b: cellOf(p) }
    if (cur.kind === 'stroke') {
      const ne = nearestEdge(p.wx, p.wy)
      if (ne.dist < 0.4 && !cur.keys.includes(ne.key)) next = { ...cur, keys: [...cur.keys, ne.key] }
    }
    if (cur.kind === 'ghost') next = { ...cur, o: itemOrigin(p) }
    if (cur.kind === 'roomMove') { onMoveDrag?.(cur.base.dx + Math.round(p.wx - cur.p.wx), cur.base.dy + Math.round(p.wy - cur.p.wy)); return }
    if (cur.kind === 'move') next = { ...cur, o: { x: Math.round(p.wx - cur.dx), y: Math.round(p.wy - cur.dy) }, moved: cur.moved || moved > 6 }
    if (next !== cur) { g.current = next; setGesture(next) }
  }

  const onUp = (e) => {
    pointers.current.delete(e.pointerId)
    const cur = g.current
    if (!cur) return
    if (cur.kind === 'pinch') {
      if (pointers.current.size === 0) begin(null)
      else begin({ kind: 'pan', noTap: true, x: [...pointers.current.values()][0].x, y: [...pointers.current.values()][0].y, view: v, t: 0 })
      return
    }
    if (e.type === 'pointercancel') return begin(null)
    const moved = Math.hypot(e.clientX - cur.x, e.clientY - cur.y)
    const p = cur.p
    if (cur.kind === 'pan' && moved >= 7 && cur.samples?.length > 1) {
      const a0 = cur.samples[0], a1 = cur.samples[cur.samples.length - 1]
      const dt = (a1.t - a0.t) / 1000
      if (dt > 0.01 && performance.now() - a1.t < 60) fling((a1.x - a0.x) / dt / v.z, (a1.y - a0.y) / dt / v.z)
    }
    if (cur.kind === 'pan') {
      if (!cur.noTap && moved < 7 && performance.now() - cur.t < 600) onTap?.({ ...p, ...cellOf(p) })
    } else if (cur.kind === 'rect') {
      if (cur.a.x === cur.b.x && cur.a.y === cur.b.y) onTap?.({ ...p, ...cellOf(p) })
      else onRect?.(normRect(cur.a, cur.b))
    } else if (cur.kind === 'stroke') {
      if (cur.keys.length) onStroke?.(cur.keys)
    } else if (cur.kind === 'ghost') {
      onItemDrop?.(cur.o)
    } else if (cur.kind === 'move') {
      if (cur.moved) onMoveItem?.(cur.id, cur.o)
      else onTap?.({ ...p, ...cellOf(p) })
    }
    begin(null)
  }

  const onWheel = (e) => {
    e.preventDefault()
    touched.current = true
    setV(zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY))
  }
  useEffect(() => {
    const el = svg.current
    const h = (e) => onWheel(e)
    el.addEventListener('wheel', h, { passive: false })
    return () => el.removeEventListener('wheel', h)
  })

  const edges = useMemo(() => [...wallEdges(level).values()], [level])
  // Merchandising links: fixtures that work together (same department, or a display by its racks).
  const merchLinks = useMemo(() => merchandise(level).links, [level])
  const doors = useMemo(() => new Set(level.doors), [level])
  const windows = useMemo(() => new Set(level.windows), [level])
  const below = li > 0 ? project.levels[li - 1] : null

  // previews
  let preview = null
  if (gesture?.kind === 'rect') {
    const r = normRect(gesture.a, gesture.b)
    const ok = validateRect ? validateRect(r) : { ok: true }
    preview = (
      <g className="pv-rect">
        <rect x={r.x} y={r.y} width={r.w} height={r.h} className={`${ok.ok ? 'ok' : 'bad'} ${shaping === 'cut' ? 'cut' : ''}`} />
        <text x={r.x + r.w / 2} y={r.y - 0.45} className="pv-label">{shaping === 'cut' ? 'Cut ' : shaping === 'extend' ? 'Add ' : ''}{r.w} × {r.h} m · {r.w * r.h} m²</text>
        {!ok.ok && <text x={r.x + r.w / 2} y={r.y + r.h + 0.9} className="pv-label bad">{ok.error}</text>}
      </g>
    )
  }
  let ghost = null
  const ghostAt = gesture?.kind === 'ghost' ? { type: itemType, rot: itemRot, ...gesture.o }
    : gesture?.kind === 'move' && gesture.moved ? { type: gesture.type, rot: gesture.rot, ...gesture.o }
      : tool === 'furnish' && itemType && hover && !gesture ? { type: itemType, rot: itemRot, ...itemOrigin(hover) } : null
  if (ghostAt) {
    const s = itemSize(ghostAt)
    const ok = gesture?.kind === 'move' ? true : validateItem ? validateItem(ghostAt).ok : true
    ghost = (
      <g className={`pghost ${ok ? 'ok' : 'bad'}`} transform={`translate(${ghostAt.x} ${ghostAt.y})`}>
        <rect width={s.w} height={s.h} />
        <ItemSymbol type={ghostAt.type} w={s.w} h={s.h} />
      </g>
    )
  }
  const hoverEdge = (tool === 'door' || tool === 'window') && hover && !gesture ? nearestEdge(hover.wx, hover.wy) : null

  // overall dimensions
  const dims = useMemo(() => {
    if (!level.rooms.length) return null
    const minX = Math.min(...level.rooms.map(r => r.x)), minY = Math.min(...level.rooms.map(r => r.y))
    const maxX = Math.max(...level.rooms.map(r => r.x + r.w)), maxY = Math.max(...level.rooms.map(r => r.y + r.h))
    return { minX, minY, maxX, maxY }
  }, [level])
  const selRoom = selection?.kind === 'room' ? level.rooms.find(r => r.id === selection.id) : null
  const movingRoom = moving ? level.rooms.find(r => r.id === moving.id) : null
  // Screen position for the room bubble: above the room (or its moving ghost), clamped on screen.
  let bubblePos = null
  const anchor = movingRoom ? { ...movingRoom, x: movingRoom.x + moving.dx, y: movingRoom.y + moving.dy } : selRoom
  if (bubble && anchor && size.w > 1) {
    const sx = (anchor.x + anchor.w / 2 - vb[0]) * v.z
    const top = (anchor.y - vb[1]) * v.z, bottom = (anchor.y + anchor.h - vb[1]) * v.z
    const below = top < 150
    const bw = Math.min(340, size.w - 16)
    const left = Math.max(bw / 2 + 8, Math.min(size.w - bw / 2 - 8, sx))
    bubblePos = { left, top: below ? Math.min(size.h - 12, bottom + 10) : top - 10, below, bw, ax: Math.max(-bw / 2 + 20, Math.min(bw / 2 - 20, sx - left)) }
  }
  const selItem = selection?.kind === 'item' ? level.items.find(r => r.id === selection.id) : null

  return (
    <div ref={wrap} className={`plan-wrap tool-${tool}`}>
      <svg ref={svg} className="plan-svg" viewBox={vb.join(' ')} width={size.w || 1} height={size.h || 1}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onPointerLeave={() => setHover(null)} onContextMenu={e => e.preventDefault()}>
        <defs>
          <pattern id="g1" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" className="grid-minor" /></pattern>
          <pattern id="g5" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#g1)" /><path d="M5 0H0V5" className="grid-major" /></pattern>
          <pattern id="hatch" width="0.5" height="0.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V0.5" className="hatch" /></pattern>
        </defs>
        <rect x={-60} y={-60} width={lot.w + 120} height={lot.h + 120} className="paper" />
        <rect x={-60} y={lot.h + 0.6} width={lot.w + 120} height={2.4} className="sidewalk" />
        <rect x={-60} y={lot.h + 3} width={lot.w + 120} height={7} className="street" />
        <line x1={-60} x2={lot.w + 60} y1={lot.h + 6.5} y2={lot.h + 6.5} className="street-line" />
        <text x={lot.w / 2} y={lot.h + 7.6} className="street-label">STREET</text>
        <rect x={0} y={0} width={lot.w} height={lot.h} fill="url(#g5)" className="lot" />
        <rect x={0} y={0} width={lot.w} height={lot.h} className="lot-line" />
        <text x={0} y={-0.5} className="lot-label">LOT {lot.w} × {lot.h} m</text>

        {below && below.rooms.map(r => <path key={r.id} d={roomOutline(r)} className="below" />)}

        {level.rooms.map(r => (
          <g key={r.id} className={`room ${selRoom?.id === r.id ? 'sel' : ''} ${flash === r.id ? 'flash' : ''}`}>
            <g className="room-fill">{roomRuns(r).map((q, i) => <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} style={{ fill: ROOMS[r.type]?.color }} />)}</g>
            {ROOMS[r.type]?.wet && roomRuns(r).map((q, i) => <rect key={`w${i}`} x={q.x} y={q.y} width={q.w} height={q.h} fill="url(#hatch)" className="wet" />)}
            {selRoom?.id === r.id && <path d={roomOutline(r)} className="sel-outline" />}
          </g>
        ))}

        {level.items.filter(it => ITEMS[it.type].overlay).map(it => <Item key={it.id} it={it} sel={selItem?.id === it.id} />)}
        {level.items.filter(it => !ITEMS[it.type].overlay).map(it => <Item key={it.id} it={it} sel={selItem?.id === it.id} />)}

        {merchLinks.map((l, i) => <line key={`ml${i}`} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} className={`merch-link ${l.kind}`} style={{ stroke: l.color }} />)}
        {edges.map(e => {
          if (doors.has(e.key)) return <Door key={e.key} e={e} />
          if (windows.has(e.key)) return <Window key={e.key} e={e} />
          return <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className={e.exterior ? 'wall ext' : 'wall int'} />
        })}

        {level.rooms.map(r => { const lp = labelPoint(r); return roomArea(r) >= 4 && (
          <g key={`t${r.id}`} className="tag" transform={`translate(${lp.x} ${lp.y})`}>
            <text y={-0.05} className="tag-name" style={r.w < 5 ? { fontSize: 0.36 } : undefined}>{ROOMS[r.type]?.label.toUpperCase()}</text>
            <text y={0.55} className="tag-area">{roomArea(r)} m²{r.w >= 7 ? ` · ${MATERIALS[r.floor]?.label}` : ''}</text>
          </g>
        ) })}

        {dims && <Dim x1={dims.minX} y1={dims.minY - 1.3} x2={dims.maxX} y2={dims.minY - 1.3} />}
        {dims && <Dim x1={dims.minX - 1.3} y1={dims.minY} x2={dims.minX - 1.3} y2={dims.maxY} vertical />}
        {selRoom && <Dim x1={selRoom.x} y1={selRoom.y + selRoom.h + 0.8} x2={selRoom.x + selRoom.w} y2={selRoom.y + selRoom.h + 0.8} accent />}
        {selRoom && <Dim x1={selRoom.x + selRoom.w + 0.8} y1={selRoom.y} x2={selRoom.x + selRoom.w + 0.8} y2={selRoom.y + selRoom.h} vertical accent />}

        {hoverEdge && hoverEdge.dist < 0.4 && <HoverEdge k={hoverEdge.key} />}
        {gesture?.kind === 'stroke' && gesture.keys.map(k => <HoverEdge key={k} k={k} />)}
        {mergeIds && level.rooms.filter(r => mergeIds.has(r.id)).map(r => <g key={`m${r.id}`}>{roomRuns(r).map((q, i) => <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} className="merge-fill" />)}<path d={roomOutline(r)} className="merge-cand" /></g>)}
        {movingRoom && (
          <g className={`move-ghost ${moving.ok ? 'ok' : 'bad'}`} transform={`translate(${moving.dx} ${moving.dy})`}>
            {roomRuns(movingRoom).map((q, i) => <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} className="ghost-fill" style={{ fill: ROOMS[movingRoom.type]?.color }} />)}
            {level.items.filter(it => !ITEMS[it.type].site && inRoom(movingRoom, it.x, it.y)).map(it => {
              const sz = itemSize(it)
              return <g key={it.id} transform={`translate(${it.x} ${it.y})`}><ItemSymbol type={it.type} w={sz.w} h={sz.h} /></g>
            })}
            <path d={roomOutline(movingRoom)} className="move-outline" />
          </g>
        )}
        {preview}
        {ghost}
        {tool === 'room' && hover && !gesture && <rect x={Math.floor(hover.wx)} y={Math.floor(hover.wy)} width={1} height={1} className="cursor-cell" />}
      </svg>
      {bubblePos && <div className={`room-bubble ${bubblePos.below ? 'below' : ''}`} style={{ left: bubblePos.left, top: bubblePos.top, '--bw': `${bubblePos.bw}px`, '--ax': `${bubblePos.ax}px` }} onPointerDown={e => e.stopPropagation()}>{bubble}</div>}
      <div className="plan-hud">
        <button className="hud-btn" onClick={fit} aria-label="Fit to lot">⤢</button>
        <button className="hud-btn" onClick={() => zoomBy(1.4)} aria-label="Zoom in">+</button>
        <button className="hud-btn" onClick={() => zoomBy(1 / 1.4)} aria-label="Zoom out">−</button>
      </div>
      <div className="scale-bar"><div className="sb" style={{ width: v.z * 5 }} /><span>5 m</span></div>
      <svg className="north" viewBox="-12 -12 24 24" width="34" height="34"><circle r="11" /><path d="M0 -9 L4 5 L0 2 L-4 5Z" /><text y="-12.5">N</text></svg>
    </div>
  )
}

function HoverEdge({ k }) {
  const [o, xs, ys] = k.split(':'); const x = +xs, y = +ys
  return o === 'h' ? <line x1={x} y1={y} x2={x + 1} y2={y} className="edge-hover" /> : <line x1={x} y1={y} x2={x} y2={y + 1} className="edge-hover" />
}

function Door({ e }) {
  let d
  if (e.horiz) {
    const hx = e.x1 + 0.08, y = e.y1, s = -e.ny * 0.84
    d = `M${hx} ${y} L${hx} ${y + s} A0.84 0.84 0 0 ${e.ny > 0 ? 1 : 0} ${hx + 0.84} ${y}`
  } else {
    const x = e.x1, hy = e.y1 + 0.08, s = -e.nx * 0.84
    d = `M${x} ${hy} L${x + s} ${hy} A0.84 0.84 0 0 ${e.nx > 0 ? 0 : 1} ${x} ${hy + 0.84}`
  }
  const jamb = e.exterior ? 'jamb ext' : 'jamb'
  return (
    <g className="door">
      {e.horiz
        ? <><line x1={e.x1} y1={e.y1} x2={e.x1 + 0.08} y2={e.y1} className={jamb} /><line x1={e.x2 - 0.08} y1={e.y1} x2={e.x2} y2={e.y1} className={jamb} /></>
        : <><line x1={e.x1} y1={e.y1} x2={e.x1} y2={e.y1 + 0.08} className={jamb} /><line x1={e.x1} y1={e.y2 - 0.08} x2={e.x1} y2={e.y2} className={jamb} /></>}
      <path d={d} className="swing" />
      {e.exterior && <path d={e.horiz ? `M${e.x1 + 0.5} ${e.y1 + e.ny * 0.55} l-0.18 ${-e.ny * 0.25} h0.36z` : `M${e.x1 + e.nx * 0.55} ${e.y1 + 0.5} l${-e.nx * 0.25} -0.18 v0.36z`} className="entry-arrow" />}
    </g>
  )
}

function Window({ e }) {
  const t = 0.11
  return e.horiz ? (
    <g className="window"><rect x={e.x1} y={e.y1 - t} width={1} height={t * 2} /><line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y1} /></g>
  ) : (
    <g className="window"><rect x={e.x1 - t} y={e.y1} width={t * 2} height={1} /><line x1={e.x1} y1={e.y1} x2={e.x1} y2={e.y2} /></g>
  )
}

function Dim({ x1, y1, x2, y2, vertical, accent }) {
  const len = vertical ? y2 - y1 : x2 - x1
  const tick = 0.25
  return (
    <g className={`dim ${accent ? 'accent' : ''}`}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? <>
        <line x1={x1 - tick} y1={y1 + tick} x2={x1 + tick} y2={y1 - tick} /><line x1={x2 - tick} y1={y2 + tick} x2={x2 + tick} y2={y2 - tick} />
        <text transform={`translate(${x1 - 0.3} ${(y1 + y2) / 2}) rotate(-90)`}>{len.toFixed(2)}</text>
      </> : <>
        <line x1={x1 - tick} y1={y1 + tick} x2={x1 + tick} y2={y1 - tick} /><line x1={x2 - tick} y1={y2 + tick} x2={x2 + tick} y2={y2 - tick} />
        <text x={(x1 + x2) / 2} y={y1 - 0.3}>{len.toFixed(2)}</text>
      </>}
    </g>
  )
}

function Item({ it, sel }) {
  const s = itemSize(it)
  const def = ITEMS[it.type]
  return (
    <g className={`item g-${def.group.toLowerCase()} ${def.overlay ? 'overlay' : ''} ${sel ? 'sel' : ''}`} transform={`translate(${it.x} ${it.y})`}>
      <g className="item-pop"><ItemSymbol type={it.type} w={s.w} h={s.h} product={it.product} /></g>
      {sel && <rect width={s.w} height={s.h} className="sel-box" />}
    </g>
  )
}

// Plan symbols drawn in footprint space (w × h metres).
export function ItemSymbol({ type, w, h, product }) {
  const pd = ITEMS[type]?.products ? (PRODUCTS[ITEMS[type].products][product] || Object.values(PRODUCTS[ITEMS[type].products])[0]) : null
  const i = 0.08
  const box = <rect x={i} y={i} width={w - i * 2} height={h - i * 2} className="sym" />
  switch (type) {
    case 'table': case 'bigTable': {
      const n = Math.max(2, Math.round(Math.max(w, h)))
      const along = w >= h
      const chairs = []
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n
        if (along) { chairs.push(<rect key={`a${k}`} x={t * w - 0.2} y={0.05} width={0.4} height={0.32} className="sym" />, <rect key={`b${k}`} x={t * w - 0.2} y={h - 0.37} width={0.4} height={0.32} className="sym" />) }
        else { chairs.push(<rect key={`a${k}`} x={0.05} y={t * h - 0.2} width={0.32} height={0.4} className="sym" />, <rect key={`b${k}`} x={w - 0.37} y={t * h - 0.2} width={0.32} height={0.4} className="sym" />) }
      }
      return <g>{chairs}<rect x={along ? 0.25 : 0.45} y={along ? 0.45 : 0.25} width={along ? w - 0.5 : w - 0.9} height={along ? h - 0.9 : h - 0.5} className="sym fill-wood" /></g>
    }
    case 'stairs': case 'featureStair': {
      const along = w > h, n = 10, L = Math.max(w, h)
      const treads = Array.from({ length: n }, (_, k) => along
        ? <line key={k} x1={(k + 1) * L / (n + 1)} y1={0.1} x2={(k + 1) * L / (n + 1)} y2={h - 0.1} className="sym-line" />
        : <line key={k} x1={0.1} y1={(k + 1) * L / (n + 1)} x2={w - 0.1} y2={(k + 1) * L / (n + 1)} className="sym-line" />)
      return <g>{box}{treads}<path d={along ? `M0.3 ${h / 2} H${w - 0.4} m-0.3 -0.25 l0.3 0.25 l-0.3 0.25` : `M${w / 2} ${h - 0.3} V0.4 m-0.25 0.3 l0.25 -0.3 l0.25 0.3`} className="sym-arrow" /></g>
    }
    case 'elevator': return <g>{box}<path d={`M${i} ${i} L${w - i} ${h - i} M${w - i} ${i} L${i} ${h - i}`} className="sym-line" /></g>
    case 'toilet': return <g><rect x={w / 2 - 0.25} y={0.1} width={0.5} height={0.22} className="sym" /><ellipse cx={w / 2} cy={0.62} rx={0.22} ry={0.3} className="sym" /></g>
    case 'sink': return <g>{box}<circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.25} className="sym" /></g>
    case 'shower': return <g>{box}<path d={`M${i} ${i} L${w - i} ${h - i}`} className="sym-line" /><circle cx={w / 2} cy={h / 2} r={0.06} className="sym" /></g>
    case 'stove': case 'oven': return <g>{box}{[0.25, 0.75].map(u => <circle key={u} cx={u * w} cy={h / 2} r={0.17} className="sym" />)}</g>
    case 'bed': return <g>{box}<rect x={0.25} y={0.18} width={w - 0.5} height={0.4} className="sym" /></g>
    case 'sofa': return <g>{box}<line x1={i} y1={0.3} x2={w - i} y2={0.3} className="sym-line" /></g>
    case 'tree': case 'oakTree': {
      const r = Math.min(w, h) / 2
      return <g className="tree"><circle cx={w / 2} cy={h / 2} r={r * 1.15} className="sym-tree" />{[0, 60, 120].map(a => <line key={a} x1={w / 2 - Math.cos(a * Math.PI / 180) * r} y1={h / 2 - Math.sin(a * Math.PI / 180) * r} x2={w / 2 + Math.cos(a * Math.PI / 180) * r} y2={h / 2 + Math.sin(a * Math.PI / 180) * r} className="sym-line" />)}</g>
    }
    case 'plant': return <g><circle cx={w / 2} cy={h / 2} r={0.36} className="sym-tree" /><circle cx={w / 2} cy={h / 2} r={0.12} className="sym" /></g>
    case 'shelving': case 'lockers': return <g>{box}{Array.from({ length: Math.round(Math.max(w, h)) * 2 - 1 }, (_, k) => w >= h ? <line key={k} x1={(k + 1) * 0.5} y1={i} x2={(k + 1) * 0.5} y2={h - i} className="sym-line" /> : <line key={k} y1={(k + 1) * 0.5} x1={i} y2={(k + 1) * 0.5} x2={w - i} className="sym-line" />)}</g>
    case 'downlight': case 'pendant': return <g><circle cx={w / 2} cy={h / 2} r={0.22} className="sym-light" /><path d={`M${w / 2 - 0.3} ${h / 2} h0.6 M${w / 2} ${h / 2 - 0.3} v0.6`} className="sym-light" /></g>
    case 'chandelier': return <g><circle cx={w / 2} cy={h / 2} r={0.7} className="sym-light" /><circle cx={w / 2} cy={h / 2} r={0.25} className="sym-light" /></g>
    case 'track': case 'panel': return <g><rect x={0.15} y={0.15} width={w - 0.3} height={h - 0.3} className="sym-light" />{[0.25, 0.5, 0.75].map(u => <circle key={u} cx={w >= h ? u * w : w / 2} cy={w >= h ? h / 2 : u * h} r={0.1} className="sym-light" />)}</g>
    case 'skylight': return <g><rect x={0.1} y={0.1} width={w - 0.2} height={h - 0.2} className="sym-dash" /><path d={`M0.1 0.1 L${w - 0.1} ${h - 0.1} M${w - 0.1} 0.1 L0.1 ${h - 0.1}`} className="sym-dash" /></g>
    case 'pool': return <g>{box}<rect x={0.3} y={0.3} width={w - 0.6} height={h - 0.6} className="sym water" /></g>
    case 'artwork': case 'sculpture': return <g>{box}<circle cx={w / 2} cy={h / 2} r={0.22} className="sym fill-accent" /></g>
    case 'counter': case 'reception': return <g>{box}<line x1={0.2} y1={h * 0.35} x2={w - 0.2} y2={h * 0.35} className="sym-line" /></g>
    case 'stage': return <g><rect x={i} y={i} width={w - i * 2} height={h - i * 2} className="sym" fill="url(#hatch)" /></g>
    case 'greenWall': return <g><rect x={i} y={i} width={w - i * 2} height={h - i * 2} className="sym-tree" /></g>
    case 'neonSign': return <g><rect x={0.15} y={h / 2 - 0.12} width={w - 0.3} height={0.24} className="sym fill-neon" /></g>
    case 'rack': {
      const along = w >= h
      return <g>{box}<rect x={along ? 0.15 : w / 2 - 0.2} y={along ? h / 2 - 0.2 : 0.15} width={along ? w - 0.3 : 0.4} height={along ? 0.4 : h - 0.3} style={{ fill: pd.color }} className="sym" />{along ? <line x1={0.1} y1={h / 2} x2={w - 0.1} y2={h / 2} className="sym-line" /> : <line x1={w / 2} y1={0.1} x2={w / 2} y2={h - 0.1} className="sym-line" />}</g>
    }
    case 'chiller':
      return <g>{box}<rect x={0.2} y={0.2} width={w - 0.4} height={h - 0.4} style={{ fill: pd.color }} className="sym" /><path d={`M0.2 0.2 L${w - 0.2} ${h - 0.2}`} className="sym-dash" /></g>
    case 'aisle':
      return <g>{box}<rect x={0.12} y={0.12} width={w - 0.24} height={h - 0.24} style={{ fill: pd.color, opacity: 0.6 }} />{Array.from({ length: Math.round(Math.max(w, h)) * 2 - 1 }, (_, k) => w >= h ? <line key={k} x1={(k + 1) * 0.5} y1={i} x2={(k + 1) * 0.5} y2={h - i} className="sym-line" /> : <line key={k} y1={(k + 1) * 0.5} x1={i} y2={(k + 1) * 0.5} x2={w - i} className="sym-line" />)}</g>
    case 'display': case 'miniDisplay':
      return <g>{box}<rect x={0.25} y={0.25} width={Math.max(0.2, w - 0.5)} height={Math.max(0.2, h - 0.5)} style={{ fill: pd?.color || '#eee' }} className="sym" /></g>
    case 'mannequin':
      return <g><circle cx={w / 2} cy={h / 2} r={0.36} style={{ fill: pd?.color || '#eee' }} className="sym" /><circle cx={w / 2} cy={h / 2} r={0.12} className="sym" /></g>
    case 'courtLines': return <g><rect x={0.05} y={0.05} width={w - 0.1} height={h - 0.1} className="sym-dash" /><line x1={w / 2} y1={0.05} x2={w / 2} y2={h - 0.05} className="sym-dash" /><circle cx={w / 2} cy={h / 2} r={0.7} className="sym-dash" /></g>
    case 'rug': return <g><rect x={0.15} y={0.15} width={w - 0.3} height={h - 0.3} className="sym-dash" /></g>
    case 'spotTrack': case 'linear': case 'scoreboard': case 'departures': return <g><rect x={0.15} y={h / 2 - 0.15} width={w - 0.3} height={0.3} className="sym-light" /></g>
    case 'palm': return <g><circle cx={w / 2} cy={h / 2} r={0.42} className="sym-tree" /><path d={`M${w / 2 - 0.4} ${h / 2} h0.8 M${w / 2} ${h / 2 - 0.4} v0.8`} className="sym-line" /></g>
    default: {
      const label = (ITEMS[type]?.label || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
      return <g>{box}<text x={w / 2} y={h / 2 + 0.16} className="sym-text">{label}</text></g>
    }
  }
}
