// Plan model: rooms are axis-aligned rectangles on a 1 m grid, per level.
// Walls are derived from room perimeters; doors and windows live on wall edges.
// Edge keys: "h:x:y" = top edge of cell (x,y); "v:x:y" = left edge of cell (x,y).
import { BASE_COST, CEILINGS, DOORS, ITEMS, MATERIALS, ROOMS, itemCost, itemSize, q } from '../game/catalog.js'

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

export function roomArea(r) { return r.w * r.h }

export function cellOwners(level) {
  const map = new Map()
  for (const r of level.rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) map.set(ck(x, y), r)
  return map
}

export function roomAt(level, x, y) {
  return level.rooms.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) || null
}

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

export function normRect(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y)
  return { x, y, w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 }
}

export function canPlaceRoom(project, li, rect, ignoreId = null) {
  const { lot } = project
  if (rect.w < 2 || rect.h < 2) return { ok: false, error: 'Rooms must be at least 2 × 2 m.' }
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > lot.w || rect.y + rect.h > lot.h) return { ok: false, error: 'Outside the lot boundary.' }
  const level = project.levels[li]
  if (level.rooms.some(r => r.id !== ignoreId && overlaps(r, rect))) return { ok: false, error: 'Overlaps another room.' }
  if (li > 0) {
    // Upper floors must sit on something: every cell needs a room below it.
    const below = cellOwners(project.levels[li - 1])
    for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (!below.has(ck(x, y))) return { ok: false, error: 'Upper-floor rooms need structure below them.' }
    }
  }
  return { ok: true }
}

export function addRoom(project, li, rect, type, floor = 'vinyl') {
  const check = canPlaceRoom(project, li, rect)
  if (!check.ok) return { project, error: check.error }
  const p = clone(project)
  const wet = ROOMS[type]?.wet
  const room = { id: uid('r'), type, floor: wet && !MATERIALS[floor]?.wetSafe ? 'ceramic' : floor, floorQ: 1, wall: 'chalk', wallQ: 1, ceiling: 'plain', ...rect }
  p.levels[li].rooms.push(room)
  return { project: cleanup(p), room }
}

export function updateRoom(project, li, id, patch) {
  const p = clone(project)
  const room = p.levels[li].rooms.find(r => r.id === id)
  if (!room) return { project }
  const next = { ...room, ...patch }
  if (['x', 'y', 'w', 'h'].some(k => k in patch)) {
    const check = canPlaceRoom(p, li, next, id)
    if (!check.ok) return { project, error: check.error }
  }
  Object.assign(room, next)
  return { project: cleanup(p), room }
}

const shiftKey = (k, dx, dy) => { const [o, x, y] = k.split(':'); return `${o}:${+x + dx}:${+y + dy}` }
const inRect = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h

// Move a room with everything it holds: furniture, decor, lights and the doors and windows
// in its walls. Fails if rooms on the level above rest on it.
export function moveRoom(project, li, id, dx, dy) {
  const level = project.levels[li]
  const room = level.rooms.find(r => r.id === id)
  if (!room) return { project }
  if (!dx && !dy) return { project }
  const next = { ...room, x: room.x + dx, y: room.y + dy }
  const check = canPlaceRoom(project, li, next, id)
  if (!check.ok) return { project, error: check.error }
  const above = project.levels[li + 1]
  if (above && above.rooms.some(r => overlaps(r, room))) return { project, error: 'Rooms on the level above stand on this one. Move those first.' }
  const p = clone(project)
  const L = p.levels[li]
  const owns = (k) => edgeCells(k).some(c => inRect(room, c.x, c.y))
  L.doors = L.doors.map(k => owns(k) ? shiftKey(k, dx, dy) : k)
  L.windows = L.windows.map(k => owns(k) ? shiftKey(k, dx, dy) : k)
  for (const it of L.items) if (!ITEMS[it.type].site && inRect(room, it.x, it.y)) { it.x += dx; it.y += dy }
  Object.assign(L.rooms.find(r => r.id === id), { x: next.x, y: next.y })
  return { project: cleanup(p) }
}

// Same-type neighbours that share a full side, so the union stays a rectangle.
export function mergeCandidates(level, room) {
  return level.rooms.filter(o => o.id !== room.id && o.type === room.type && (
    (o.y === room.y && o.h === room.h && (o.x === room.x + room.w || o.x + o.w === room.x)) ||
    (o.x === room.x && o.w === room.w && (o.y === room.y + room.h || o.y + o.h === room.y))))
}

export function mergeRooms(project, li, aId, bId) {
  const level = project.levels[li]
  const a = level.rooms.find(r => r.id === aId), b = level.rooms.find(r => r.id === bId)
  if (!a || !b || !mergeCandidates(level, a).some(r => r.id === bId)) return { project, error: 'Only same-type rooms that share a whole wall can merge.' }
  const p = clone(project)
  const L = p.levels[li]
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y)
  const w = Math.max(a.x + a.w, b.x + b.w) - x, h = Math.max(a.y + a.h, b.y + b.h) - y
  Object.assign(L.rooms.find(r => r.id === aId), { x, y, w, h })
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
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
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

export function canPlaceItem(project, li, item, ignoreId = null) {
  const def = ITEMS[item.type]
  if (!def) return { ok: false, error: 'Unknown item.' }
  const level = project.levels[li]
  const { lot } = project
  const cells = itemCells(item)
  if (cells.some(c => c.x < 0 || c.y < 0 || c.x >= lot.w || c.y >= lot.h)) return { ok: false, error: 'Outside the lot.' }
  const owners = cellOwners(level)
  const rooms = new Set(cells.map(c => owners.get(ck(c.x, c.y))?.id || null))
  let room = null
  if (rooms.size === 1 && !rooms.has(null)) room = owners.get(ck(cells[0].x, cells[0].y))
  const outdoors = rooms.size === 1 && rooms.has(null)
  if (def.site === true) {
    if (li !== 0) return { ok: false, error: `${def.label} goes on the ground-floor site.` }
    if (!outdoors) return { ok: false, error: `${def.label} goes outside, on the site.` }
  } else if (def.site === 'both' && outdoors) {
    if (li !== 0) return { ok: false, error: 'Outdoor pieces go on the ground floor.' }
  } else {
    if (!room) return { ok: false, error: `${def.label} must sit fully inside one room.` }
    if (def.rooms && !def.rooms.includes(room.type)) {
      return { ok: false, error: `${def.label} belongs in: ${def.rooms.map(t => ROOMS[t].label).join(', ')}.` }
    }
  }
  if (!def.overlay || def.ceiling) {
    const taken = new Set()
    for (const it of level.items) {
      if (it.id === ignoreId) continue
      if (def.ceiling ? !ITEMS[it.type].ceiling : ITEMS[it.type].overlay) continue
      for (const c of itemCells(it)) taken.add(ck(c.x, c.y))
    }
    if (cells.some(c => taken.has(ck(c.x, c.y)))) return { ok: false, error: 'Something is already there.' }
  }
  return { ok: true, room }
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
    const keep = []
    for (const it of level.items) {
      const tmp = { ...p, levels: p.levels.map((l, i) => i === li ? { ...l, items: keep } : l) }
      if (canPlaceItem(tmp, li, it).ok) keep.push(it)
    }
    level.items = keep
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
      paint += 2 * (r.w + r.h) * 3 * BASE_COST.paint * q(r.wallQ).cost
      paint += roomArea(r) * (CEILINGS[r.ceiling]?.cost || 25)
    }
    if (li === 0) { const edges = wallEdges(level); for (const k of level.doors) if (edges.get(k)?.exterior) openings += DOORS[project.door]?.cost || 0 }
    for (const it of level.items) items += itemCost(it)
    openings += level.doors.length * BASE_COST.door + level.windows.length * BASE_COST.window
    for (const e of wallEdges(level).values()) if (e.exterior) facade += facadeRate
  })
  finishes += paint
  let total = shell + finishes + items + openings + facade
  if (kit.includes('contractor')) total *= 0.88
  return { total: Math.round(total), shell: Math.round(shell), finishes: Math.round(finishes), items, openings, facade: Math.round(facade) }
}

export function footprint(project, li = 0) {
  return project.levels[li].rooms.reduce((s, r) => s + roomArea(r), 0)
}
