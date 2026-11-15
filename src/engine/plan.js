// Plan model: rooms are axis-aligned rectangles on a 1 m grid, per level.
// Walls are derived from room perimeters; doors and windows live on wall edges.
// Edge keys: "h:x:y" = top edge of cell (x,y); "v:x:y" = left edge of cell (x,y).
import { BASE_COST, CEILINGS, DOORS, ITEMS, MATERIALS, ROOFS, ROOMS, itemCost, itemSize, q } from '../game/catalog.js'

let counter = 0
export function uid(prefix = 'id') {
  counter = (counter + 1) % 1e6
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`
}

export const ck = (x, y) => `${x}:${y}`

export function emptyLevel() { return { rooms: [], doors: [], windows: [], items: [] } }

export function newProject(offer) {
  return {
    offerId: offer.id, briefId: offer.briefId,
    lot: { ...offer.lot },
    levels: [emptyLevel()],
    facade: 'stucco',
    door: 'standard',
    version: 1,
  }
}

export function clone(p) { return structuredClone(p) }

// ---------------------------------------------------------------- room shapes
// A room is any orthogonal shape: a set of 1 m cells (r.cells, keys "x:y"). x/y/w/h are kept as
// its bounding box for layout and labels. Old saves without cells fall back to the box.
const cellCache = new WeakMap()
export function rectCells(rect) {
  const out = []
  for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) out.push(ck(x, y))
  return out
}
export function roomCells(r) { return r.cells || rectCells(r) }
export function roomCellSet(r) {
  let s = cellCache.get(r)
  if (!s) { s = new Set(roomCells(r)); cellCache.set(r, s) }
  return s
}
export function inRoom(r, x, y) { return roomCellSet(r).has(ck(x, y)) }
export function roomArea(r) { return roomCells(r).length }
const parse = (k) => { const [x, y] = k.split(':'); return { x: +x, y: +y } }

export function withCells(room, cells) {
  const pts = cells.map(parse)
  const x = Math.min(...pts.map(p => p.x)), y = Math.min(...pts.map(p => p.y))
  const w = Math.max(...pts.map(p => p.x)) - x + 1, h = Math.max(...pts.map(p => p.y)) - y + 1
  return { ...room, cells: [...cells].sort(), x, y, w, h }
}

export function isConnected(cells) {
  const set = new Set(cells)
  if (!set.size) return false
  const first = cells[0] ?? [...set][0]
  const seen = new Set([first]), q = [first]
  while (q.length) {
    const { x, y } = parse(q.pop())
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = ck(x + dx, y + dy)
      if (set.has(k) && !seen.has(k)) { seen.add(k); q.push(k) }
    }
  }
  return seen.size === set.size
}

// Rectangles covering the shape (row runs, stacked when identical): for fills, slabs, highlights.
export function roomRuns(r) {
  const set = roomCellSet(r)
  const rows = new Map()
  for (const k of set) { const { x, y } = parse(k); if (!rows.has(y)) rows.set(y, []); rows.get(y).push(x) }
  const runs = []
  for (const y of [...rows.keys()].sort((a, b) => a - b)) {
    const xs = rows.get(y).sort((a, b) => a - b)
    let s0 = xs[0], prev = xs[0]
    const flush = (a, b) => {
      const up = runs.find(R => R.x === a && R.w === b - a + 1 && R.y + R.h === y)
      if (up) up.h++; else runs.push({ x: a, y, w: b - a + 1, h: 1 })
    }
    for (let i = 1; i <= xs.length; i++) {
      if (i < xs.length && xs[i] === prev + 1) { prev = xs[i]; continue }
      flush(s0, prev)
      if (i < xs.length) { s0 = prev = xs[i] }
    }
  }
  return runs
}

// SVG path of the room boundary (every cell side that doesn't face the same room).
export function roomOutline(r) {
  const set = roomCellSet(r)
  let d = ''
  for (const k of set) {
    const { x, y } = parse(k)
    if (!set.has(ck(x, y - 1))) d += `M${x} ${y}H${x + 1}`
    if (!set.has(ck(x, y + 1))) d += `M${x} ${y + 1}H${x + 1}`
    if (!set.has(ck(x - 1, y))) d += `M${x} ${y}V${y + 1}`
    if (!set.has(ck(x + 1, y))) d += `M${x + 1} ${y}V${y + 1}`
  }
  return d
}

export function roomPerimeter(r) {
  const set = roomCellSet(r)
  let n = 0
  for (const k of set) { const { x, y } = parse(k); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has(ck(x + dx, y + dy))) n++ }
  return n
}

// A good spot for the room tag: the room cell nearest the shape's centroid.
export function labelPoint(r) {
  const pts = roomCells(r).map(parse)
  const cx = pts.reduce((s, p) => s + p.x + 0.5, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y + 0.5, 0) / pts.length
  if (inRoom(r, Math.floor(cx), Math.floor(cy))) return { x: cx, y: cy }
  const best = pts.reduce((b, p) => { const d = (p.x + 0.5 - cx) ** 2 + (p.y + 0.5 - cy) ** 2; return !b || d < b.d ? { p, d } : b }, null).p
  return { x: best.x + 0.5, y: best.y + 0.5 }
}

export function cellOwners(level) {
  const map = new Map()
  for (const r of level.rooms) for (const k of roomCells(r)) map.set(k, r)
  return map
}

export function roomAt(level, x, y) {
  return level.rooms.find(r => inRoom(r, x, y)) || null
}

export function normRect(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y)
  return { x, y, w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 }
}

// shape: a rectangle {x,y,w,h} or a list of cell keys.
export function canPlaceRoom(project, li, shape, ignoreId = null) {
  const { lot } = project
  const isRect = !Array.isArray(shape)
  if (isRect && (shape.w < 2 || shape.h < 2)) return { ok: false, error: 'Rooms must be at least 2 × 2 m.' }
  const cells = isRect ? rectCells(shape) : shape
  if (cells.some(k => { const { x, y } = parse(k); return x < 0 || y < 0 || x >= lot.w || y >= lot.h })) return { ok: false, error: 'Outside the lot boundary.' }
  const owners = cellOwners(project.levels[li])
  if (cells.some(k => owners.has(k) && owners.get(k).id !== ignoreId)) return { ok: false, error: 'Overlaps another room.' }
  if (li > 0) {
    // Upper floors must sit on something: every cell needs a room below it.
    const below = cellOwners(project.levels[li - 1])
    if (cells.some(k => !below.has(k))) return { ok: false, error: 'Upper-floor rooms need structure below them.' }
  }
  return { ok: true }
}

export function addRoom(project, li, rect, type, floor = 'vinyl') {
  const check = canPlaceRoom(project, li, rect)
  if (!check.ok) return { project, error: check.error }
  const p = clone(project)
  const wet = ROOMS[type]?.wet
  const room = withCells({ id: uid('r'), type, floor: wet && !MATERIALS[floor]?.wetSafe ? 'ceramic' : floor, floorQ: 1, wall: 'chalk', wallQ: 1, ceiling: 'plain' }, rectCells(rect))
  p.levels[li].rooms.push(room)
  return { project: cleanup(p), room }
}

export function updateRoom(project, li, id, patch) {
  const p = clone(project)
  const room = p.levels[li].rooms.find(r => r.id === id)
  if (!room) return { project }
  Object.assign(room, patch)
  return { project: cleanup(p), room }
}

// Rooms above that rest on any of these cells.
function supportsAbove(project, li, cells) {
  const above = project.levels[li + 1]
  if (!above) return false
  const owners = cellOwners(above)
  return cells.some(k => owners.has(k))
}

// Add a rectangle to a room. It must touch the room and land on free, buildable cells.
export function extendRoom(project, li, id, rect) {
  const level = project.levels[li]
  const room = level.rooms.find(r => r.id === id)
  if (!room) return { project }
  const own = roomCellSet(room)
  const add = rectCells(rect).filter(k => !own.has(k))
  if (!add.length) return { project, error: 'That area is already part of the room.' }
  const check = canPlaceRoom(project, li, add, id)
  if (!check.ok) return { project, error: check.error }
  const cells = [...own, ...add]
  if (!isConnected(cells)) return { project, error: 'The extension has to touch the room.' }
  const p = clone(project)
  const i = p.levels[li].rooms.findIndex(r => r.id === id)
  p.levels[li].rooms[i] = withCells(p.levels[li].rooms[i], cells)
  return { project: cleanup(p), room: p.levels[li].rooms[i] }
}

// Carve a rectangle out of a room (notches, courtyards). The rest must stay in one piece.
export function cutRoom(project, li, id, rect) {
  const level = project.levels[li]
  const room = level.rooms.find(r => r.id === id)
  if (!room) return { project }
  const cut = new Set(rectCells(rect))
  const removed = roomCells(room).filter(k => cut.has(k))
  if (!removed.length) return { project, error: 'Drag across part of the room to cut it.' }
  const cells = roomCells(room).filter(k => !cut.has(k))
  if (cells.length < 2) return { project, error: 'That would remove the whole room. Use Erase instead.' }
  if (!isConnected(cells)) return { project, error: 'That cut would split the room in two.' }
  if (supportsAbove(project, li, removed)) return { project, error: 'Rooms on the level above stand on that part.' }
  const p = clone(project)
  const i = p.levels[li].rooms.findIndex(r => r.id === id)
  p.levels[li].rooms[i] = withCells(p.levels[li].rooms[i], cells)
  return { project: cleanup(p), room: p.levels[li].rooms[i] }
}

const shiftKey = (k, dx, dy) => { const [o, x, y] = k.split(':'); return `${o}:${+x + dx}:${+y + dy}` }

// Move a room with everything it holds: furniture, decor, lights and the doors and windows
// in its walls. Fails if rooms on the level above rest on it.
export function moveRoom(project, li, id, dx, dy) {
  const level = project.levels[li]
  const room = level.rooms.find(r => r.id === id)
  if (!room) return { project }
  if (!dx && !dy) return { project }
  const moved = roomCells(room).map(k => { const { x, y } = parse(k); return ck(x + dx, y + dy) })
  const check = canPlaceRoom(project, li, moved, id)
  if (!check.ok) return { project, error: check.error }
  if (supportsAbove(project, li, roomCells(room))) return { project, error: 'Rooms on the level above stand on this one. Move those first.' }
  const p = clone(project)
  const L = p.levels[li]
  const owns = (k) => edgeCells(k).some(c => inRoom(room, c.x, c.y))
  L.doors = L.doors.map(k => owns(k) ? shiftKey(k, dx, dy) : k)
  L.windows = L.windows.map(k => owns(k) ? shiftKey(k, dx, dy) : k)
  for (const it of L.items) if (!ITEMS[it.type].site && inRoom(room, it.x, it.y)) { it.x += dx; it.y += dy }
  const i = L.rooms.findIndex(r => r.id === id)
  L.rooms[i] = withCells(L.rooms[i], moved)
  return { project: cleanup(p) }
}

// Same-type neighbours that share at least one wall. The merged room can be any shape.
export function mergeCandidates(level, room) {
  const own = roomCellSet(room)
  return level.rooms.filter(o => o.id !== room.id && o.type === room.type && roomCells(o).some(k => {
    const { x, y } = parse(k)
    return own.has(ck(x + 1, y)) || own.has(ck(x - 1, y)) || own.has(ck(x, y + 1)) || own.has(ck(x, y - 1))
  }))
}

export function mergeRooms(project, li, aId, bId) {
  const level = project.levels[li]
  const a = level.rooms.find(r => r.id === aId), b = level.rooms.find(r => r.id === bId)
  if (!a || !b || !mergeCandidates(level, a).some(r => r.id === bId)) return { project, error: 'Only same-type rooms that share a wall can merge.' }
  const p = clone(project)
  const L = p.levels[li]
  const i = L.rooms.findIndex(r => r.id === aId)
  L.rooms[i] = withCells(L.rooms[i], [...roomCells(a), ...roomCells(b)])
  L.rooms = L.rooms.filter(r => r.id !== bId)
  return { project: cleanup(p), room: L.rooms.find(r => r.id === aId) }
}

export function removeRoom(project, li, id) {
  const p = clone(project)
  p.levels[li].rooms = p.levels[li].rooms.filter(r => r.id !== id)
  return cleanup(p)
}

// Walls: every room-cell side that does not face the same room.
export function wallEdges(level) {
  const owners = cellOwners(level)
  const edges = new Map()
  for (const r of level.rooms) {
    for (const k of roomCells(r)) {
      const [x, y] = k.split(':').map(Number)
      const sides = [
        { key: `h:${x}:${y}`, nx: x, ny: y - 1, x1: x, y1: y, x2: x + 1, y2: y, horiz: true },
        { key: `h:${x}:${y + 1}`, nx: x, ny: y + 1, x1: x, y1: y + 1, x2: x + 1, y2: y + 1, horiz: true },
        { key: `v:${x}:${y}`, nx: x - 1, ny: y, x1: x, y1: y, x2: x, y2: y + 1, horiz: false },
        { key: `v:${x + 1}:${y}`, nx: x + 1, ny: y, x1: x + 1, y1: y, x2: x + 1, y2: y + 1, horiz: false },
      ]
      for (const s of sides) {
        const other = owners.get(ck(s.nx, s.ny))
        if (other && other.id === r.id) continue
        if (edges.has(s.key)) continue
        // Outward normal points from room r towards the neighbour cell.
        edges.set(s.key, { key: s.key, x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, horiz: s.horiz, exterior: !other, a: r.id, b: other ? other.id : null, nx: s.nx - x, ny: s.ny - y })
      }
    }
  }
  return edges
}

// The two cells either side of an edge.
export function edgeCells(key) {
  const [o, xs, ys] = key.split(':'); const x = +xs, y = +ys
  return o === 'h' ? [{ x, y: y - 1 }, { x, y }] : [{ x: x - 1, y }, { x, y }]
}

export function nearestEdge(wx, wy) {
  const hx = Math.floor(wx), hy = Math.round(wy)
  const vx = Math.round(wx), vy = Math.floor(wy)
  const dh = Math.abs(wy - hy), dv = Math.abs(wx - vx)
  return dh <= dv ? { key: `h:${hx}:${hy}`, dist: dh } : { key: `v:${vx}:${vy}`, dist: dv }
}

export function toggleOpening(project, li, key, kind) {
  const level = project.levels[li]
  const edge = wallEdges(level).get(key)
  if (!edge) return { project, error: 'Openings go on walls.' }
  if (kind === 'window' && !edge.exterior) return { project, error: 'Windows go on exterior walls.' }
  if (kind === 'door' && edge.exterior && li > 0) return { project, error: 'Upper floors cannot have street doors.' }
  const p = clone(project)
  const L = p.levels[li]
  const list = kind === 'door' ? L.doors : L.windows
  const other = kind === 'door' ? L.windows : L.doors
  const i = list.indexOf(key)
  if (i >= 0) { list.splice(i, 1); return { project: p, removed: true } }
  const j = other.indexOf(key)
  if (j >= 0) other.splice(j, 1)
  list.push(key)
  return { project: p }
}

export function setOpening(project, li, key, kind) {
  const level = project.levels[li]
  if ((kind === 'door' ? level.doors : level.windows).includes(key)) return { project }
  return toggleOpening(project, li, key, kind)
}

export function itemCells(item) {
  const { w, h } = itemSize(item)
  const out = []
  for (let y = item.y; y < item.y + h; y++) for (let x = item.x; x < item.x + w; x++) out.push({ x, y })
  return out
}

// Structural rules: inside the lot, inside one room (any room: the wrong room only costs
// Functionality), or outdoors on the ground floor when the item can live outside.
export function placeBasics(project, li, item) {
  const def = ITEMS[item.type]
  if (!def) return { ok: false, error: 'Unknown item.' }
  const level = project.levels[li]
  const { lot } = project
  const cells = itemCells(item)
  if (cells.some(c => c.x < 0 || c.y < 0 || c.x >= lot.w || c.y >= lot.h)) return { ok: false, error: 'Outside the lot.' }
  const owners = cellOwners(level)
  const rooms = new Set(cells.map(c => owners.get(ck(c.x, c.y))?.id || null))
  const room = rooms.size === 1 && !rooms.has(null) ? owners.get(ck(cells[0].x, cells[0].y)) : null
  const outdoors = rooms.size === 1 && rooms.has(null)
  if (rooms.size > 1) return { ok: false, error: `${def.label} can't straddle a wall.` }
  if (def.site === true) {
    if (li !== 0) return { ok: false, error: `${def.label} goes on the ground-floor site.` }
    if (!outdoors) return { ok: false, error: `${def.label} goes outside, on the site.` }
    return { ok: true, room: null, outdoors: true }
  }
  if (outdoors) {
    if (def.ceiling) return { ok: false, error: 'Ceiling lights need a ceiling: place them inside a room.' }
    if (!(def.outdoor || def.site === 'both')) return { ok: false, error: `${def.label} can't go outside.` }
    if (li !== 0) return { ok: false, error: 'Outdoor pieces go on the ground floor.' }
    return { ok: true, room: null, outdoors: true }
  }
  const misfit = !!(def.rooms && !def.rooms.includes(room.type))
  return { ok: true, room, misfit }
}

export function canPlaceItem(project, li, item, ignoreId = null) {
  const base = placeBasics(project, li, item)
  if (!base.ok) return base
  const def = ITEMS[item.type]
  const level = project.levels[li]
  const cells = itemCells(item)
  if (!def.overlay || def.ceiling) {
    const taken = new Set()
    for (const it of level.items) {
      if (it.id === ignoreId) continue
      if (def.ceiling ? !ITEMS[it.type].ceiling : ITEMS[it.type].overlay) continue
      for (const c of itemCells(it)) taken.add(ck(c.x, c.y))
    }
    if (cells.some(c => taken.has(ck(c.x, c.y)))) return { ok: false, error: 'Something is already there.', overlap: true }
  }
  return base
}

// An item that overlaps another (e.g. after rotating) stays where it is, drawn red, until moved.
export function itemConflict(project, li, it) { return !canPlaceItem(project, li, it, it.id).ok }

export function rotateItem(project, li, id) {
  const p = clone(project)
  const it = p.levels[li].items.find(i => i.id === id)
  if (!it) return { project }
  it.rot = ((it.rot || 0) + 1) % 2
  const bad = !placeBasics(p, li, it).ok
  if (bad) return { project, error: 'No room to rotate there: it would leave the room.' }
  return { project: p, conflict: itemConflict(p, li, it) }
}

export function placeItem(project, li, item) {
  const check = canPlaceItem(project, li, item)
  if (!check.ok) return { project, error: check.error }
  const p = clone(project)
  const placed = { id: uid('i'), rot: 0, q: 1, ...item }
  p.levels[li].items.push(placed)
  return { project: p, item: placed }
}

export function moveItem(project, li, id, patch) {
  const level = project.levels[li]
  const it = level.items.find(i => i.id === id)
  if (!it) return { project }
  const next = { ...it, ...patch }
  const check = canPlaceItem(project, li, next, id)
  if (!check.ok) return { project, error: check.error }
  const p = clone(project)
  Object.assign(p.levels[li].items.find(i => i.id === id), patch)
  return { project: p }
}

export function removeItem(project, li, id) {
  const p = clone(project)
  p.levels[li].items = p.levels[li].items.filter(i => i.id !== id)
  return p
}

export function itemAt(level, x, y) {
  // Prefer non-overlay items (furniture) over overlays like skylights.
  const hits = level.items.filter(it => itemCells(it).some(c => c.x === x && c.y === y))
  return hits.find(h => !ITEMS[h.type].overlay) || hits[0] || null
}

// Drop openings no longer on valid walls and items no longer inside valid rooms.
export function cleanup(p) {
  p.levels.forEach((level, li) => {
    const edges = wallEdges(level)
    level.doors = level.doors.filter(k => edges.has(k) && !(li > 0 && edges.get(k).exterior))
    level.windows = level.windows.filter(k => edges.has(k) && edges.get(k).exterior)
    level.items = level.items.filter(it => placeBasics(p, li, it).ok)
  })
  return p
}

export function addLevel(project, max) {
  if (project.levels.length >= max) return { project, error: `This brief allows ${max} level${max > 1 ? 's' : ''}.` }
  const p = clone(project)
  p.levels.push(emptyLevel())
  return { project: p }
}

// Copy a level to a new level on top (handy for towers and housing).
export function duplicateLevel(project, li, max) {
  if (project.levels.length >= max) return { project, error: `This brief allows ${max} levels.` }
  if (li !== project.levels.length - 1) return { project, error: 'Duplicate the top level.' }
  const p = clone(project)
  const src = p.levels[li]
  const copy = {
    rooms: src.rooms.map(r => ({ ...r, id: uid('r') })),
    doors: [...src.doors], windows: [...src.windows],
    items: src.items.filter(it => !ITEMS[it.type].site && !(ITEMS[it.type].site === 'both' && !roomAt(src, it.x, it.y))).map(it => ({ ...it, id: uid('i') })),
  }
  p.levels.push(copy)
  return { project: cleanup(p) }
}

export function removeTopLevel(project) {
  if (project.levels.length <= 1) return project
  const p = clone(project)
  p.levels.pop()
  return p
}

// Vertical items on level li that overlap a vertical item on level li+1.
export function verticalLinks(project, li) {
  const up = project.levels[li + 1]
  if (!up) return []
  const links = []
  for (const a of project.levels[li].items) {
    if (!ITEMS[a.type].vertical) continue
    const ac = new Set(itemCells(a).map(c => ck(c.x, c.y)))
    for (const b of up.items) {
      if (!ITEMS[b.type].vertical) continue
      if (!!ITEMS[a.type].lift !== !!ITEMS[b.type].lift) continue
      if (itemCells(b).some(c => ac.has(ck(c.x, c.y)))) links.push({ a, b })
    }
  }
  return links
}

export function projectCost(project, kit = []) {
  let shell = 0, finishes = 0, items = 0, openings = 0, facade = 0, paint = 0
  const facadeRate = MATERIALS[project.facade]?.cost || 260
  project.levels.forEach((level, li) => {
    const premium = 1 + li * BASE_COST.levelPremium
    for (const r of level.rooms) {
      shell += roomArea(r) * BASE_COST.perM2 * premium
      finishes += roomArea(r) * (MATERIALS[r.floor]?.cost || 40) * q(r.floorQ).cost
      paint += roomPerimeter(r) * 3 * BASE_COST.paint * q(r.wallQ).cost
      paint += roomArea(r) * (CEILINGS[r.ceiling]?.cost || 25)
    }
    if (li === 0) { const edges = wallEdges(level); for (const k of level.doors) if (edges.get(k)?.exterior) openings += DOORS[project.door]?.cost || 0 }
    for (const it of level.items) items += itemCost(it)
    openings += level.doors.length * BASE_COST.door + level.windows.length * BASE_COST.window
    for (const e of wallEdges(level).values()) if (e.exterior) facade += facadeRate
  })
  finishes += paint
  const roof = roofArea(project) * (ROOFS[project.roof]?.cost || ROOFS.gravel.cost)
  finishes += roof
  let total = shell + finishes + items + openings + facade
  if (kit.includes('contractor')) total *= 0.88
  const bgId = kit.find(k => k.startsWith('bg:'))
  if (bgId === 'bg:business') total *= 0.9
  if (bgId === 'bg:architect') total *= 0.975
  return { total: Math.round(total), shell: Math.round(shell), finishes: Math.round(finishes), items, openings, facade: Math.round(facade) }
}

// Exposed roof: every room cell with no room cell on the level above.
export function roofArea(project) {
  let n = 0
  project.levels.forEach((level, li) => {
    const above = project.levels[li + 1] ? cellOwners(project.levels[li + 1]) : null
    for (const r of level.rooms) for (const c of roomCells(r)) if (!above?.has(c)) n++
  })
  return n
}

export function footprint(project, li = 0) {
  return project.levels[li].rooms.reduce((s, r) => s + roomArea(r), 0)
}
