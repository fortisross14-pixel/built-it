// Review engine: scores a project on Functionality, Requirements and Aesthetics.
import { CEILINGS, COMPLEMENTS, DOORS, ITEMS, MATERIALS, PAINTS, ROOFS, ROOMS, STYLES, defaultProduct, familyOf, itemSize, productDef, q } from '../game/catalog.js'
import { BRIEFS, GRADES, TWISTS, checksFor, featuresFor, gradeFor, reqLabel } from '../game/briefs.js'
import { bgOf } from '../game/architects.js'
import { cellOwners, ck, edgeCells, footprint, inRoom as inRoomCell, itemCells, itemConflict, placeBasics, projectCost, roomArea, roomAt, roomCells, verticalLinks, wallEdges } from './plan.js'

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const avg = (a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0

// ---------------------------------------------------------------- circulation
export function circulation(project, seeds = null) {
  const levels = project.levels
  const blocked = levels.map(level => {
    const s = new Set()
    for (const it of level.items) {
      const d = ITEMS[it.type]
      if (d.walkable || d.overlay) continue
      for (const c of itemCells(it)) s.add(ck(c.x, c.y))
    }
    return s
  })
  const owners = levels.map(cellOwners)
  const doorSets = levels.map(l => new Set(l.doors))
  const edgeKeyBetween = (a, b) => {
    if (a.x === b.x) return `h:${a.x}:${Math.max(a.y, b.y)}`
    return `v:${Math.max(a.x, b.x)}:${a.y}`
  }
  const walkable = (li, x, y) => owners[li].has(ck(x, y)) && !blocked[li].has(ck(x, y))

  // Vertical connections
  const vert = new Map()
  for (let li = 0; li < levels.length - 1; li++) {
    for (const { a, b } of verticalLinks(project, li)) {
      const ac = itemCells(a), bc = itemCells(b)
      const up = `${li + 1}:${bc[0].x}:${bc[0].y}`
      const down = `${li}:${ac[0].x}:${ac[0].y}`
      for (const c of ac) { const k = `${li}:${c.x}:${c.y}`; vert.set(k, [...(vert.get(k) || []), up]) }
      for (const c of bc) { const k = `${li + 1}:${c.x}:${c.y}`; vert.set(k, [...(vert.get(k) || []), down]) }
    }
  }

  const entrances = []
  const edges0 = levels[0] ? wallEdges(levels[0]) : new Map()
  for (const key of levels[0]?.doors || []) {
    const e = edges0.get(key)
    if (!e || !e.exterior) continue
    const [c1, c2] = edgeCells(key)
    const inside = owners[0].has(ck(c1.x, c1.y)) ? c1 : c2
    entrances.push({ key, ...inside })
  }

  const dist = new Map()
  const q = []
  const starts = seeds || entrances.map(e => `0:${e.x}:${e.y}`)
  for (const k of starts) {
    const [li, x, y] = k.split(':').map(Number)
    if (!walkable(li, x, y)) continue
    if (!dist.has(k)) { dist.set(k, 0); q.push(k) }
  }
  for (let i = 0; i < q.length; i++) {
    const k = q[i]
    const [li, x, y] = k.split(':').map(Number)
    const d = dist.get(k)
    const here = owners[li].get(ck(x, y))
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (!walkable(li, nx, ny)) continue
      const there = owners[li].get(ck(nx, ny))
      if (there.id !== here.id && !doorSets[li].has(edgeKeyBetween({ x, y }, { x: nx, y: ny }))) continue
      const nk = `${li}:${nx}:${ny}`
      if (!dist.has(nk)) { dist.set(nk, d + 1); q.push(nk) }
    }
    for (const nk of vert.get(k) || []) {
      const [nl, nx, ny] = nk.split(':').map(Number)
      if (!walkable(nl, nx, ny)) continue
      if (!dist.has(nk)) { dist.set(nk, d + 4); q.push(nk) }
    }
  }
  return { dist, entrances, owners, blocked, walkable }
}

function itemReach(circ, li, it) {
  const cells = itemCells(it)
  const room = circ.owners[li].get(ck(cells[0].x, cells[0].y))
  let best = Infinity
  const own = new Set(cells.map(c => ck(c.x, c.y)))
  for (const c of cells) {
    const k = `${li}:${c.x}:${c.y}`
    if (ITEMS[it.type].walkable && circ.dist.has(k)) best = Math.min(best, circ.dist.get(k))
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx, ny = c.y + dy
      if (own.has(ck(nx, ny))) continue
      if (room && circ.owners[li].get(ck(nx, ny))?.id !== room.id) continue
      const d = circ.dist.get(`${li}:${nx}:${ny}`)
      if (d !== undefined) best = Math.min(best, d)
    }
  }
  return best
}

// ---------------------------------------------------------------- helpers
function allRooms(project) {
  return project.levels.flatMap((l, li) => l.rooms.map(r => ({ ...r, li })))
}
function allItems(project) {
  return project.levels.flatMap((l, li) => l.items.map(it => ({ ...it, li })))
}

function itemRoomType(project, it) {
  const owners = cellOwners(project.levels[it.li])
  return owners.get(ck(it.x, it.y))?.type || null
}

function adjacencyState(project, a, b) {
  let best = 0
  project.levels.forEach(level => {
    const edges = wallEdges(level)
    const byId = new Map(level.rooms.map(r => [r.id, r]))
    const doors = new Set(level.doors)
    for (const e of edges.values()) {
      if (!e.b) continue
      const ta = byId.get(e.a).type, tb = byId.get(e.b).type
      if (!((ta === a && tb === b) || (ta === b && tb === a))) continue
      best = Math.max(best, doors.has(e.key) ? 1 : 0.4)
      if (best === 1) return
    }
  })
  return best
}

// Tall furniture (shelving, chillers, lockers…) pushed against a window blocks its daylight.
function tallCells(level) {
  const s = new Set()
  for (const it of level.items) if (ITEMS[it.type].tall) for (const c of itemCells(it)) s.add(ck(c.x, c.y))
  return s
}
function windowBlocked(e, tall) {
  const inside = { x: e.x1 - (e.nx > 0 ? 1 : 0), y: e.y1 - (e.ny > 0 ? 1 : 0) }
  return tall.has(ck(inside.x, inside.y))
}
export function blockedWindows(project) {
  let n = 0
  project.levels.forEach(level => { const edges = wallEdges(level), tall = tallCells(level); for (const k of level.windows) { const e = edges.get(k); if (e && windowBlocked(e, tall)) n++ } })
  return n
}

export function daylitRooms(project) {
  const glazed = MATERIALS[project.facade]?.glazed
  const set = new Set()
  project.levels.forEach(level => {
    const edges = wallEdges(level)
    const blocked = tallCells(level)
    for (const key of level.windows) { const e = edges.get(key); if (e && !windowBlocked(e, blocked)) set.add(e.a) }
    if (glazed) for (const e of edges.values()) if (e.exterior) set.add(e.a)
    for (const it of level.items) {
      if (it.type !== 'skylight') continue
      const r = roomAt(level, it.x, it.y)
      if (r) set.add(r.id)
    }
  })
  return set
}

export function offerBrief(offer) { return BRIEFS[offer.briefId] }

// ---------------------------------------------------------------- evaluate
export function evaluate(project, offer, kit = []) {
  const brief = offerBrief(offer)
  const twist = offer.twist ? TWISTS[offer.twist] : null
  const rooms = allRooms(project)
  // Overlapping items (e.g. rotated into something) are drawn red in the editor and don't count.
  const conflicts = allItems(project).filter(it => itemConflict(project, it.li, it))
  const conflictIds = new Set(conflicts.map(it => it.id))
  const items = allItems(project).filter(it => !conflictIds.has(it.id))
  const circ = circulation(project)
  const notes = []
  const checklist = []
  const note = (group, label, value, good, bad, detail = []) => notes.push({ group, label, value: clamp(value), text: value >= 0.75 ? good : bad, detail: value >= 0.99 ? [] : detail })

  // ---------------- Functionality
  const hasEntrance = circ.entrances.length > 0
  checklist.push({ label: 'Street entrance', ok: hasEntrance, detail: hasEntrance ? `${circ.entrances.length} door${circ.entrances.length > 1 ? 's' : ''}` : 'Add a door on an exterior wall' })
  const reached = rooms.filter(r => {
    for (const k of roomCells(r)) if (circ.dist.has(`${r.li}:${k}`)) return true
    return false
  })
  const reach = rooms.length ? reached.length / rooms.length : 0
  checklist.push({ label: 'Every room reachable', ok: rooms.length > 0 && reach === 1, detail: `${reached.length}/${rooms.length} rooms` })
  note('functionality', 'Circulation', reach, 'Every room can be reached from the street.', `${rooms.length - reached.length} room(s) can't be reached: add doors${project.levels.length > 1 ? ' or stairs' : ''}.`)

  const useful = items.filter(it => !ITEMS[it.type].site && !ITEMS[it.type].overlay && ITEMS[it.type].group !== 'Decor' && !ITEMS[it.type].vertical)
  const reachD = useful.map(it => itemReach(circ, it.li, it))
  const access = useful.length ? reachD.filter(d => d < Infinity).length / useful.length : 0
  note('functionality', 'Access to equipment', access, 'Staff and visitors can get to every piece of furniture.', 'Some furniture is boxed in or behind closed walls.')

  const totalArea = rooms.reduce((s, r) => s + roomArea(r), 0)
  const ref = Math.sqrt(Math.max(1, totalArea / Math.max(1, project.levels.length))) + (project.levels.length - 1) * 5
  const finite = reachD.filter(d => d < Infinity)
  const walk = finite.length ? avg(finite) : ref * 3
  const distScore = clamp(1.4 - walk / (ref * 1.5))
  note('functionality', 'Walking distances', distScore, `Short, direct routes (avg ${walk.toFixed(1)} m from the door).`, `Routes are long and winding (avg ${walk.toFixed(1)} m from the door).`)

  const adjScores = brief.adj.map(([a, b]) => {
    const s = adjacencyState(project, a, b)
    checklist.push({ label: `${ROOMS[a].label} ↔ ${ROOMS[b].label}`, ok: s === 1, detail: s === 1 ? 'connected' : s > 0 ? 'share a wall, no door' : 'not adjacent', kind: 'adj' })
    return s
  })
  const adj = adjScores.length ? avg(adjScores) : 1
  if (brief.adj.length) note('functionality', 'Adjacencies', adj, 'The rooms that work together sit together.', 'Key rooms that work together are not connected by a door.')

  const crowd = avg(project.levels.flatMap(level => level.rooms.map(r => {
    const occ = level.items.filter(it => !ITEMS[it.type].overlay && !ITEMS[it.type].walkable).reduce((s, it) => s + itemCells(it).filter(c => inRoomCell(r, c.x, c.y)).length, 0)
    return clamp(1 - Math.max(0, occ / roomArea(r) - 0.5) * 3)
  }))) || 1
  note('functionality', 'Breathing room', crowd, 'Rooms are furnished without feeling cramped.', 'Some rooms are crammed with furniture.')

  const wetRooms = rooms.filter(r => ROOMS[r.type]?.wet)
  const wet = wetRooms.length ? wetRooms.filter(r => MATERIALS[r.floor]?.wetSafe).length / wetRooms.length : 1
  if (wetRooms.length) note('functionality', 'Wet-room floors', wet, 'Kitchens and bathrooms have water-safe floors.', 'Timber or carpet in a wet room? The client winced.')

  let lift = 1
  if (project.levels.length > 1) {
    let linksOk = 0, liftOk = 0
    for (let li = 0; li < project.levels.length - 1; li++) {
      const links = verticalLinks(project, li)
      if (links.length) linksOk++
      if (links.some(l => ITEMS[l.a.type].lift)) liftOk++
    }
    const n = project.levels.length - 1
    lift = brief.needsLift ? (linksOk / n) * 0.5 + (liftOk / n) * 0.5 : linksOk / n
    checklist.push({ label: brief.needsLift ? 'Stairs + lift on every level' : 'Stairs between levels', ok: lift === 1, detail: `${linksOk}/${n} stair links, ${liftOk}/${n} lift` })
    note('functionality', 'Vertical circulation', lift, 'Levels are properly linked by stairs and lifts.', 'Levels are not all linked: stack stairs and lifts directly above each other.')
  }

  // Ceiling lighting: each room needs enough light output for its floor area.
  const inRoom = (it, r) => inRoomCell(r, it.x, it.y)
  const lights = items.filter(it => ITEMS[it.type].ceiling)
  let litArea = 0
  project.levels.forEach((level, li) => level.rooms.forEach(r => {
    const out = lights.filter(it => it.li === li && inRoom(it, r)).reduce((s, it) => s + ITEMS[it.type].light * (0.8 + 0.2 * (it.q ?? 1)), 0)
    litArea += clamp(out / roomArea(r)) * roomArea(r)
  }))
  const lighting = totalArea ? litArea / totalArea : 0
  checklist.push({ label: 'Ceiling lighting', ok: lighting >= 0.9, detail: `${Math.round(lighting * 100)}% lit`, kind: 'light' })
  note('functionality', 'Lighting', lighting, 'Every room is properly lit after dark.', 'Rooms are dark after sunset: add ceiling lights in Decorate 3D.')

  const equipQ = useful.length ? avg(useful.map(it => q(it.q).score)) : 0
  note('functionality', 'Equipment quality', equipQ, 'Quality furniture and equipment that will last.', 'Cheap equipment: staff are already complaining.')

  // Misplaced items: allowed anywhere, but a drinks station in the WC works badly.
  const misfits = useful.filter(it => placeBasics(project, it.li, it).misfit)
  const placement = useful.length ? 1 - misfits.length / useful.length : 1
  note('functionality', 'Item placement', placement, 'Every piece is in the room it belongs in.', `${misfits.length} item(s) sit in the wrong kind of room.`,
    misfits.slice(0, 6).map(it => `${ITEMS[it.type].label} in the ${(roomAt(project.levels[it.li], it.x, it.y) ? ROOMS[roomAt(project.levels[it.li], it.x, it.y).type].label : 'room').toLowerCase()}`))
  if (conflicts.length) {
    note('functionality', 'Overlapping items', 0, '', `${conflicts.length} item(s) overlap something and don't count until you move them.`, conflicts.slice(0, 6).map(it => ITEMS[it.type].label))
    checklist.push({ label: 'No overlapping items', ok: false, detail: `${conflicts.length} in red`, kind: 'conflict' })
  }

  // Key layout checks for this building type: walking distance, graded Close / Mid / Far.
  const keyChecks = checksFor(offer.briefId).map(c => measureCheck(project, circ, c))
  for (const k of keyChecks) checklist.push({ label: k.label, ok: k.value >= 0.9, value: k.value, detail: k.tier + (Number.isFinite(k.dist) ? ` · ${k.dist.toFixed(0)} m` : ''), kind: 'check' })
  const checkW = keyChecks.reduce((s, k) => s + k.w, 0)
  const checkScore = checkW ? keyChecks.reduce((s, k) => s + k.value * k.w, 0) / checkW : 1
  if (keyChecks.length) note('functionality', 'Key layout checks', checkScore, 'The routes that matter for this building are short.',
    'Key routes for this building are too long or disconnected.', keyChecks.filter(k => k.value < 0.9).map(k => `${k.label}: ${k.tier.toLowerCase()}${Number.isFinite(k.dist) ? ` (${k.dist.toFixed(0)} m)` : ''}. ${k.why}`))

  // Merchandising: departments grouped together, complements side by side, tills by the door.
  const merch = project.levels.map(level => merchandise(level, project.levels.indexOf(level) === 0 ? circ.entrances : []))
  const merchItems = merch.reduce((s, m) => s + m.count, 0)
  const merchW = merchItems >= 3 ? 0.1 : 0
  const merchScore = merchW ? merch.filter(m => m.count).reduce((s, m) => s + m.score * m.count, 0) / merchItems : 0
  if (merchW) {
    const parts = merch.flatMap(m => m.parts)
    const worst = parts.sort((a, b) => a.v - b.v)[0]
    note('functionality', 'Merchandising', merchScore,
      'Departments are grouped, complements sit side by side and the tills are by the door.',
      worst?.why || 'Products are scattered: group departments and put complements together.')
    checklist.push({ label: 'Merchandising', ok: merchScore >= 0.75, detail: `${Math.round(merchScore * 100)}%`, kind: 'merch' })
  }
  const checksW = keyChecks.length ? 0.2 : 0
  let functionality = 100 * (0.25 * reach + 0.17 * access + 0.12 * distScore + (brief.adj.length ? 0.18 : 0) * adj + 0.05 * crowd + 0.05 * wet + 0.05 * lift + 0.07 * lighting + 0.06 * equipQ + merchW * merchScore + checksW * checkScore + 0.06 * placement)
  functionality /= (brief.adj.length ? 1 : 0.82) + merchW + checksW + 0.06
  functionality -= Math.min(25, conflicts.length * 5)
  // Signature pieces: each distinct boosted item type adds once (unlocks are meant to feel good).
  const boostTypes = new Set(items.map(it => it.type).filter(t => ITEMS[t].boost))
  let boostF = [...boostTypes].reduce((s, t) => s + (ITEMS[t].boost.f || 0), 0)
  let boostA = [...boostTypes].reduce((s, t) => s + (ITEMS[t].boost.a || 0), 0)
  const door = DOORS[project.door] || DOORS.standard
  boostF += door.boost?.f || 0; boostA += door.boost?.a || 0
  const roof = ROOFS[project.roof] || ROOFS.gravel
  boostF += roof.boost?.f || 0; boostA += roof.boost?.a || 0
  boostF += Math.min(2, rooms.reduce((s, r) => s + (CEILINGS[r.ceiling]?.boost?.f || 0), 0))
  boostF = Math.min(10, boostF); boostA = Math.min(12, boostA)
  functionality += boostF
  if (boostF) notes.push({ group: 'functionality', label: 'Smart pieces', value: 1, text: `Specialist equipment makes the place work better (+${boostF}).` })
  if (!hasEntrance) functionality = Math.min(functionality, 12)
  if (kit.includes('mentor')) functionality += 5
  const bg = bgOf(kit)
  if (bg?.func) functionality += bg.func
  if (kit.includes(`exp:${brief.industry}`)) {
    functionality += 5
    notes.push({ group: 'functionality', label: 'Expertise', value: 1, text: 'Your specialist knows this building type inside out (+5).' })
  }

  // ---------------- Requirements
  const slots = []
  for (const req of brief.rooms) {
    const n = req.count || 1
    const cands = rooms.filter(r => r.type === req.type).map(roomArea).sort((a, b) => b - a)
    let ok = 0
    for (let i = 0; i < n; i++) {
      const a = cands[i] || 0
      const s = a >= req.min ? 1 : a ? clamp(a / req.min) * 0.8 : 0
      if (s === 1) ok++
      slots.push(s)
    }
    checklist.push({ label: `${ROOMS[req.type].label}${n > 1 ? ` ×${n}` : ''} ≥ ${req.min} m²`, ok: ok === n, detail: n > 1 ? `${ok}/${n}` : cands[0] ? `${cands[0]} m²` : 'missing', kind: 'room', type: req.type })
  }
  const roomScore = avg(slots)
  note('requirements', 'Room program', roomScore, 'Every room in the brief is there, at the right size.', 'The room program is incomplete or undersized.')

  const itemScores = brief.items.map(req => {
    const n = req.count || 1
    const match = (it) => (req.family ? familyOf(it.type) === req.family : it.type === req.type) && (!req.product || (it.product || defaultProduct(it.type)) === req.product)
    const have = items.filter(it => match(it) && (!req.in || itemRoomType(project, it) === req.in)).length
    checklist.push({ label: `${reqLabel(req)}${n > 1 ? ` ×${n}` : ''}${req.in ? ` in ${ROOMS[req.in].label}` : ''}`, ok: have >= n, detail: `${Math.min(have, n)}/${n}`, kind: 'item', type: req.type, family: req.family, product: req.product })
    return clamp(have / n)
  })
  const itemScore = avg(itemScores)
  note('requirements', 'Furniture & equipment', itemScore, 'All the equipment the client listed is in place.', 'Required furniture or equipment is missing.')

  const cost = projectCost(project, kit)
  const costRatio = cost.total / offer.budget
  const over = costRatio - 1
  const budgetScore = !rooms.length ? 0 : costRatio <= 0.8 ? 1 : costRatio <= 1 ? 1 - (costRatio - 0.8) / 0.2 * 0.25 : clamp(0.75 - over * 2.5)
  checklist.push({ label: 'Within budget', ok: over <= 0, detail: `${Math.round(cost.total / 1000)}k / ${Math.round(offer.budget / 1000)}k`, kind: 'budget' })
  note('budget', 'Budget', budgetScore, costRatio <= 0.85 ? 'Came in well under budget. The client is delighted.' : over <= 0 ? 'Delivered on budget.' : 'Slightly over budget, but worth it.', `${Math.round(over * 100)}% over budget. The client's accountant is furious.`)

  const L = project.levels.filter(l => l.rooms.length).length
  const levelsOk = L >= brief.levels.min && L <= brief.levels.max ? 1 : clamp(L / brief.levels.min)
  if (brief.levels.min > 1) checklist.push({ label: `At least ${brief.levels.min} levels`, ok: levelsOk === 1, detail: `${L} built` })

  const extra = []
  if (twist?.facades) {
    const ok = twist.facades.includes(project.facade)
    extra.push(ok ? 1 : 0)
    checklist.push({ label: 'Heritage facade', ok, detail: twist.facades.map(f => MATERIALS[f].label).join(' / ') })
    note('requirements', 'Heritage rules', ok ? 1 : 0, 'The facade respects the district.', 'The planning board rejected the facade material.')
  }
  const greenery = items.filter(it => ['plant', 'tree', 'oakTree', 'greenWall', 'planter'].includes(it.type)).length
  if (twist?.greenery) {
    const s = clamp(greenery / twist.greenery)
    extra.push(s)
    checklist.push({ label: `Greenery ×${twist.greenery}`, ok: s === 1, detail: `${Math.min(greenery, twist.greenery)}/${twist.greenery}` })
  }
  if (twist?.daylightWeight) {
    const hab = rooms.filter(r => ROOMS[r.type]?.habitable)
    const lit = daylitRooms(project)
    const s = hab.length ? hab.filter(r => lit.has(r.id)).length / hab.length : 0
    extra.push(s)
    checklist.push({ label: 'Daylight in every lived-in room', ok: s === 1, detail: `${hab.filter(r => lit.has(r.id)).length}/${hab.length}` })
  }
  // Signature features for this building type (booths, gendered restrooms, premium seating, finishes…).
  const feats = featuresFor(offer.briefId).map(f => measureFeature(project, f))
  for (const f of feats) checklist.push({ label: f.label + (f.bonus ? ' (bonus)' : ''), ok: f.value >= 0.99, value: f.value, detail: f.detail, kind: 'feature' })
  const reqFeats = feats.filter(f => !f.bonus)
  const featW = reqFeats.reduce((s, f) => s + f.w, 0)
  const featScore = featW ? reqFeats.reduce((s, f) => s + f.value * f.w, 0) / featW : 1
  const featBonus = Math.min(6, feats.filter(f => f.bonus && f.value >= 0.99).length * 3)
  if (reqFeats.length) note('requirements', 'Signature features', featScore, 'Everything this kind of client expects is here.', 'Missing what this kind of client expects.',
    reqFeats.filter(f => f.value < 0.99).map(f => `${f.label}: ${f.detail}. ${f.why}`))
  const roomMissing = checklist.filter(c => c.kind === 'room' && !c.ok).map(c => `${c.label} (${c.detail})`)
  const itemMissing = checklist.filter(c => c.kind === 'item' && !c.ok).map(c => `${c.label} (${c.detail})`)
  const rn = notes.find(n => n.label === 'Room program'); if (rn && rn.value < 0.75) rn.detail = roomMissing
  const iN = notes.find(n => n.label === 'Furniture & equipment'); if (iN && iN.value < 0.75) iN.detail = itemMissing
  let requirements = 100 * (0.45 * roomScore + 0.4 * itemScore + 0.15 * levelsOk)
  if (featW) requirements = requirements * 0.8 + 20 * featScore
  requirements += featBonus
  if (extra.length) requirements = requirements * (1 - 0.12 * extra.length) + 100 * 0.12 * extra.reduce((s, v) => s + v, 0)

  // ---------------- Aesthetics
  const lit = daylitRooms(project)
  const hab = rooms.filter(r => ROOMS[r.type]?.habitable)
  const daylight = hab.length ? hab.filter(r => lit.has(r.id)).length / hab.length : (rooms.length ? 0.5 : 0)
  const blockedN = blockedWindows(project)
  note('aesthetics', 'Daylight', daylight, 'Lived-in rooms are full of daylight.', 'Too many rooms people spend time in have no natural light.',
    [...hab.filter(r => !lit.has(r.id)).slice(0, 6).map(r => `${ROOMS[r.type].label} has no window or skylight`), ...(blockedN ? [`${blockedN} window(s) blocked by tall furniture`] : [])])

  const propRooms = rooms.filter(r => !ROOMS[r.type]?.circulation)
  const proportion = propRooms.length ? propRooms.reduce((s, r) => {
    const ar = Math.max(r.w, r.h) / Math.min(r.w, r.h)
    // Irregular shapes are fine (L, T, U); only very jagged, mostly-empty outlines lose points.
    const fill = roomArea(r) / (r.w * r.h)
    if (fill < 0.999) return s + clamp(1 - (ar - 2.6) / 3) * clamp((fill - 0.3) / 0.3) * roomArea(r)
    return s + clamp(1 - (ar - 2.2) / 3) * roomArea(r)
  }, 0) / propRooms.reduce((s, r) => s + roomArea(r), 0) : 0
  note('aesthetics', 'Proportions', proportion, 'Rooms have handsome, usable proportions.', 'Some rooms are awkward slivers.')

  const floorArea = new Map()
  rooms.forEach(r => floorArea.set(r.floor, (floorArea.get(r.floor) || 0) + roomArea(r)))
  const matches = (id) => (MATERIALS[id]?.tags || []).some(t => offer.styles.includes(t))
  const floorMatch = totalArea ? [...floorArea].reduce((s, [id, a]) => s + (matches(id) ? a : 0), 0) / totalArea : 0
  const paintMatch = totalArea ? rooms.reduce((s, r) => s + ((PAINTS[r.wall]?.tags || []).some(t => offer.styles.includes(t)) ? roomArea(r) : 0), 0) / totalArea : 0
  const ceilMatch = totalArea ? rooms.reduce((s, r) => s + ((CEILINGS[r.ceiling || 'plain']?.tags || []).some(t => offer.styles.includes(t)) ? roomArea(r) : 0), 0) / totalArea : 0
  const doorMatch = door.tags.some(t => offer.styles.includes(t)) ? 1 : 0
  const roofMatch = roof.tags.some(t => offer.styles.includes(t)) ? 1 : 0
  const style = rooms.length ? 0.24 * (matches(project.facade) ? 1 : 0) + 0.35 * floorMatch + 0.2 * paintMatch + 0.12 * ceilMatch + 0.05 * doorMatch + 0.04 * roofMatch : 0
  note('aesthetics', 'Style fit', style, `Materials nail the ${offer.styles.map(s => STYLES[s].toLowerCase()).join(' / ')} brief.`, `The client wanted something ${offer.styles.map(s => STYLES[s].toLowerCase()).join(' and ')}. Materials missed it.`,
    [...(!matches(project.facade) ? [`Facade (${MATERIALS[project.facade]?.label}) isn't ${offer.styles.map(x => STYLES[x].toLowerCase()).join(' or ')}`] : []),
     ...rooms.filter(r => !(MATERIALS[r.floor]?.tags || []).some(t => offer.styles.includes(t))).slice(0, 3).map(r => `${ROOMS[r.type].label} floor (${MATERIALS[r.floor]?.label}) doesn't match the taste`),
     ...rooms.filter(r => !(PAINTS[r.wall]?.tags || []).some(t => offer.styles.includes(t))).slice(0, 3).map(r => `${ROOMS[r.type].label} walls (${PAINTS[r.wall]?.label || 'paint'}) don't match the taste`)])

  const distinct = new Set([project.facade, ...floorArea.keys()]).size
  const palette = !rooms.length ? 0 : distinct <= 1 ? 0.5 : distinct <= 4 ? 1 : distinct === 5 ? 0.75 : 0.45
  note('aesthetics', 'Material palette', palette, 'A disciplined, coherent palette.', distinct <= 1 ? 'One material everywhere feels flat.' : 'Too many materials fighting each other.')

  const decorPts = items.reduce((s, it) => s + (ITEMS[it.type].decor || 0), 0)
  const fp = footprint(project, 0)
  const decor = rooms.length ? clamp(decorPts / (fp / 45 + 2)) : 0
  note('aesthetics', 'Planting & landscape', decor, 'Planting and landscape soften the building.', 'The building feels bare: add plants, trees and landscape.')

  const exterior = project.levels.reduce((s, l) => s + [...wallEdges(l).values()].filter(e => e.exterior).length, 0)
  const winCount = project.levels.reduce((s, l) => s + l.windows.length, 0)
  const ratio = exterior ? winCount / exterior : 0
  const facadeScore = MATERIALS[project.facade]?.glazed ? 1 : clamp(ratio < 0.15 ? ratio / 0.15 : ratio <= 0.55 ? 1 : 1 - (ratio - 0.55) * 2)
  note('aesthetics', 'Facade rhythm', facadeScore, 'The facade has a confident rhythm of openings.', ratio < 0.15 ? 'Blank, windowless facades.' : 'So much glass it reads as a greenhouse.')

  let compact = 0
  const g = project.levels[0]?.rooms || []
  if (g.length) {
    const minX = Math.min(...g.map(r => r.x)), minY = Math.min(...g.map(r => r.y))
    const maxX = Math.max(...g.map(r => r.x + r.w)), maxY = Math.max(...g.map(r => r.y + r.h))
    compact = clamp((fp / ((maxX - minX) * (maxY - minY)) - 0.45) / 0.45)
  }
  note('aesthetics', 'Massing', compact, 'A clear, legible building form.', 'The footprint is fragmented and hard to read.')

  const specialBonus = boostA
  if (specialBonus) notes.push({ group: 'aesthetics', label: 'Signature pieces', value: 1, text: `Signature pieces add flair (+${Math.round(specialBonus)}).` })

  const roomQ = totalArea ? rooms.reduce((s, r) => s + (q(r.floorQ).score + q(r.wallQ).score) / 2 * roomArea(r), 0) / totalArea : 0
  const decoItems = items.filter(it => ITEMS[it.type].layer === 'decor' || ITEMS[it.type].group === 'Furniture')
  const finishQ = decoItems.length ? 0.65 * roomQ + 0.35 * avg(decoItems.map(it => q(it.q).score)) : roomQ
  const premiumDeco = decoItems.filter(it => (it.q ?? 1) >= 2).length
  note('aesthetics', 'Finish quality', finishQ, 'Beautifully crafted finishes and furniture.', 'Cheap finishes show. Paint is already peeling.',
    [...rooms.filter(r => (r.floorQ ?? 1) === 0 || (r.wallQ ?? 1) === 0).slice(0, 3).map(r => `${ROOMS[r.type].label}: basic-grade ${(r.floorQ ?? 1) === 0 ? 'floor' : 'paint'}`),
     ...(decoItems.length && premiumDeco === 0 ? ['No premium furniture or decoration anywhere'] : []),
     ...(decoItems.filter(it => (it.q ?? 1) === 0).length ? [`${decoItems.filter(it => (it.q ?? 1) === 0).length} pieces are the cheapest grade`] : []),
     ...(!decoItems.length ? ['No furniture or decoration to show off'] : [])])
  const mood = clamp(lights.reduce((s, it) => s + ITEMS[it.type].ambience * q(it.q).score, 0) / Math.max(1, hab.length * 1.2))
  note('aesthetics', 'Lighting mood', mood, 'Warm, layered lighting gives it atmosphere at night.', 'Flat, office-style lighting kills the mood. Try pendants or a chandelier.')

  const dw = twist?.daylightWeight || 1
  const parts = [[daylight, 0.2 * dw], [proportion, 0.08], [style, 0.2], [palette, 0.08], [decor, 0.1], [facadeScore, 0.1], [compact, 0.08], [finishQ, 0.1], [mood, 0.06]]
  let aesthetics = 100 * parts.reduce((s, [v, w]) => s + v * w, 0) / parts.reduce((s, [, w]) => s + w, 0) + specialBonus
  if (kit.includes('renders')) aesthetics += 5
  if (bg?.aes) aesthetics += bg.aes
  if (bg?.reqForgive) requirements = 100 - (100 - requirements) * (1 - bg.reqForgive)

  functionality = Math.round(clamp(functionality, 0, 100))
  requirements = Math.round(clamp(requirements, 0, 100))
  aesthetics = Math.round(clamp(aesthetics, 0, 100))
  const budget = Math.round(100 * budgetScore)
  const w = { functionality: 1, requirements: 1, aesthetics: 1, budget: 1, ...(twist?.weights || {}) }
  const overall = Math.round((functionality * w.functionality + requirements * w.requirements + aesthetics * w.aesthetics + budget * w.budget) / (w.functionality + w.requirements + w.aesthetics + w.budget))

  return {
    functionality, requirements, aesthetics, budget, overall,
    grade: gradeFor(overall).id, stars: starsFor(overall), cost, notes, checklist,
    stats: { area: totalArea, levels: L, walk: Number(walk.toFixed(1)), daylit: hab.filter(r => lit.has(r.id)).length, habitable: hab.length },
  }
}

export function starsFor(score) {
  return { S: 5, A: 4, B: 3, C: 2, F: 1 }[gradeFor(score).id]
}

export const STAR_LABEL = ['', 'Disaster', 'Disappointing', 'Solid work', 'Excellent', 'Masterpiece']

export function critique(result, offer) {
  const brief = offerBrief(offer)
  const sorted = [...result.notes].sort((a, b) => b.value - a.value)
  const good = sorted.filter(n => n.value >= 0.75)
  const praise = ['aesthetics', 'functionality', 'requirements'].map(g => good.find(n => n.group === g)).filter(Boolean).slice(0, 3)
  const gripes = sorted.filter(n => n.value < 0.6).reverse().slice(0, 3)
  const head = {
    5: [`“A landmark ${brief.name.toLowerCase()}. We'll be telling people we hired you first.”`],
    4: ['“Honestly better than we imagined. Our customers noticed on day one.”'],
    3: ['“It works, and there are moments we really love.”'],
    2: ['“We can live with it, but it is not what we asked for.”'],
    1: ['“We are going to need to talk to our lawyers.”'],
  }[result.stars][0]
  return { head, praise, gripes, breakdown: breakdown(result, offer) }
}

// Per-rating detail for the review screen: what earned or cost points, worst first.
export function breakdown(result, offer) {
  const fromNotes = (g) => result.notes.filter(n => n.group === g).map(n => ({ label: n.label, value: Math.round(n.value * 100) / 100, text: n.text, detail: n.detail || [] }))
  const fromList = (kinds) => result.checklist.filter(c => kinds.includes(c.kind || 'building')).map(c => ({ label: c.label, value: c.value ?? (c.ok ? 1 : 0), text: c.detail || '', detail: [], check: true }))
  const sort = (a) => a.sort((x, y) => x.value - y.value)
  const c = result.cost
  const over = c.total - offer.budget
  return {
    functionality: sort([...fromList(['check', 'conflict', 'adj', 'merch', 'light', 'building']), ...fromNotes('functionality')]),
    requirements: sort([...fromList(['room', 'item', 'feature']), ...fromNotes('requirements')]),
    aesthetics: sort(fromNotes('aesthetics')),
    budget: [
      { label: over > 0 ? 'Over budget' : 'Within budget', value: over > 0 ? Math.max(0, 1 - over / offer.budget * 3) : 1, text: `${Math.round(c.total / 1000)}k spent of ${Math.round(offer.budget / 1000)}k`, detail: [] },
      { label: 'Where the money went', value: 1, text: '', detail: [['Structure', c.shell], ['Finishes & roof', c.finishes], ['Furniture & equipment', c.items], ['Doors & windows', c.openings], ['Facade', c.facade]].filter(([, v]) => v).map(([k, v]) => `${k}: ${Math.round(v / 1000)}k`) },
    ],
  }
}

// ---------------------------------------------------------------- merchandising
const gap = (a, b) => {
  const sa = itemSize(a), sb = itemSize(b)
  const dx = Math.max(0, b.x - (a.x + sa.w), a.x - (b.x + sb.w))
  const dy = Math.max(0, b.y - (a.y + sa.h), a.y - (b.y + sb.h))
  return Math.max(dx, dy)
}
const centre = (it) => { const s = itemSize(it); return { x: it.x + s.w / 2, y: it.y + s.h / 2 } }

// Scores one level and returns the links the plan draws between fixtures that work together.
export function merchandise(level, entrances = []) {
  const roomOf = (it) => roomAt(level, it.x, it.y)?.id
  const goods = level.items.filter(it => productDef(it)?.dept).map(it => ({ it, dept: productDef(it).dept, room: roomOf(it) }))
  const links = [], parts = []
  if (!goods.length) return { score: 0, count: 0, links, parts }
  // 1. Grouping: each fixture wants a same-department neighbour (touching or one aisle apart).
  const multi = goods.filter(g => goods.some(o => o !== g && o.dept === g.dept && o.room === g.room))
  let grouped = 0
  for (const g of multi) {
    const near = goods.filter(o => o !== g && o.dept === g.dept && o.room === g.room && gap(g.it, o.it) <= 1)
    if (near.length) grouped++
    for (const o of near) if (g.it.id < o.it.id) links.push({ a: centre(g.it), b: centre(o.it), kind: 'group', color: productDef(g.it).color })
  }
  if (multi.length) parts.push({ v: grouped / multi.length, w: 0.5, why: `${multi.length - grouped} fixture(s) sit apart from the rest of their department. Group them.` })
  // 2. Complements: displays and mannequins next to their racks, produce crates by the chillers.
  let compN = 0, compOk = 0
  for (const [a, b] of COMPLEMENTS) {
    for (const g of goods.filter(x => x.it.type === a)) {
      const partners = goods.filter(o => o.it.type === b && o.dept === g.dept && o.room === g.room)
      if (!level.items.some(o => o.type === b)) continue
      compN++
      const near = partners.filter(o => gap(g.it, o.it) <= 2)
      if (near.length) { compOk++; links.push({ a: centre(g.it), b: centre(near[0].it), kind: 'complement', color: productDef(g.it).color }) }
    }
  }
  if (compN) parts.push({ v: compOk / compN, w: 0.3, why: `${compN - compOk} display(s) aren't next to the matching department. Put women's accessories by women's racks.` })
  // 3. Tills near the door.
  const tills = level.items.filter(it => it.type === 'checkout' || it.type === 'counter')
  if (tills.length && entrances.length) {
    const ok = tills.filter(t => entrances.some(e => Math.abs(centre(t).x - e.x - 0.5) + Math.abs(centre(t).y - e.y - 0.5) <= 6)).length
    parts.push({ v: ok / tills.length, w: 0.2, why: 'The tills are far from the door. Customers should pass them on the way out.' })
  }
  const W = parts.reduce((s, p) => s + p.w, 0)
  return { score: W ? parts.reduce((s, p) => s + p.v * p.w, 0) / W : 1, count: goods.length, links, parts }
}

// ---------------------------------------------------------------- key checks & features
function accessCells(project, circ, li, it) {
  const cells = itemCells(it), own = new Set(cells.map(c => ck(c.x, c.y)))
  const room = circ.owners[li].get(ck(cells[0].x, cells[0].y))
  const out = []
  for (const c of cells) {
    if (ITEMS[it.type].walkable && circ.walkable(li, c.x, c.y)) out.push(`${li}:${c.x}:${c.y}`)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx, ny = c.y + dy
      if (own.has(ck(nx, ny)) || !circ.walkable(li, nx, ny)) continue
      if (room && circ.owners[li].get(ck(nx, ny))?.id !== room.id) continue
      out.push(`${li}:${nx}:${ny}`)
    }
  }
  return out
}
function specCells(project, circ, spec) {
  if (spec === 'entrance') return circ.entrances.map(e => `0:${e.x}:${e.y}`)
  const [k, v] = spec.split(':')
  if (k === 'room' || k === 'rooms') {
    const out = []
    project.levels.forEach((l, li) => l.rooms.filter(r => r.type === v).forEach(r => roomCells(r).forEach(c => out.push(`${li}:${c}`))))
    return out
  }
  const types = v.split(',')
  return project.levels.flatMap((l, li) => l.items.filter(it => types.includes(it.type)).flatMap(it => accessCells(project, circ, li, it)))
}
function specTargets(project, circ, spec) {
  const [k, v] = spec.split(':')
  if (k === 'room') { const cells = specCells(project, circ, spec); return cells.length ? [{ cells }] : [] }
  if (k === 'rooms') return project.levels.flatMap((l, li) => l.rooms.filter(r => r.type === v).map(r => ({ cells: roomCells(r).map(c => `${li}:${c}`) })))
  const types = v.split(',')
  return project.levels.flatMap((l, li) => l.items.filter(it => types.includes(it.type)).map(it => {
    const outdoors = li === 0 && !roomAt(l, it.x, it.y)
    return { cells: accessCells(project, circ, li, it), outdoors: outdoors ? it : null }
  }))
}
const tierOf = (d, c) => !Number.isFinite(d) ? 0 : d <= c.close ? 1 : d <= c.mid ? 0.6 : 0.25

export function measureCheck(project, circ, c) {
  const seeds = specCells(project, circ, c.from)
  const targets = specTargets(project, circ, c.to)
  const base = { id: c.id, label: c.label, why: c.why, w: c.w }
  if (!seeds.length || !targets.length) return { ...base, value: 0, dist: NaN, tier: 'Missing' }
  const field = circulation(project, seeds).dist
  const dists = targets.map(t => {
    let d = Math.min(Infinity, ...t.cells.map(k => field.get(k) ?? Infinity))
    // Outdoor pieces (terrace tables): walk to the nearest street door, then across the terrace.
    if (t.outdoors) for (const e of circ.entrances) { const fd = field.get(`0:${e.x}:${e.y}`); if (fd !== undefined) d = Math.min(d, fd + Math.abs(e.x - t.outdoors.x) + Math.abs(e.y - t.outdoors.y)) }
    return d
  })
  const value = c.mode === 'min' ? tierOf(Math.min(...dists), c) : dists.reduce((s, d) => s + tierOf(d, c), 0) / dists.length
  const finite = dists.filter(Number.isFinite)
  const dist = !finite.length ? NaN : c.mode === 'min' ? Math.min(...finite) : finite.reduce((s, d) => s + d, 0) / finite.length
  const tier = !finite.length ? 'Not connected' : value >= 0.9 ? 'Close' : value >= 0.5 ? 'Mid' : 'Far'
  return { ...base, value, dist, tier }
}

export function measureFeature(project, f) {
  const items = project.levels.flatMap(l => l.items)
  const rooms = project.levels.flatMap(l => l.rooms)
  const base = { id: f.id, label: f.label, why: f.why, w: f.w, bonus: !!f.bonus }
  if (f.kind === 'has') { const n = items.filter(it => f.types.includes(it.type)).length; return { ...base, value: n ? 1 : 0, detail: n ? `${n} placed` : 'none' } }
  if (f.kind === 'gender') {
    const rs = rooms.filter(r => r.type === f.room)
    const w = rs.some(r => r.gender === 'women'), m = rs.some(r => r.gender === 'men')
    return { ...base, value: (w ? 0.5 : 0) + (m ? 0.5 : 0), detail: w && m ? 'women + men' : w ? "no men's room" : m ? "no women's room" : 'not assigned (set it in the room bubble)' }
  }
  if (f.kind === 'premium') {
    const list = items.filter(it => f.types.includes(it.type))
    if (!list.length) return { ...base, value: 0, detail: 'none placed' }
    const share = list.filter(it => (it.q ?? 1) === 2).length / list.length
    return { ...base, value: clamp(share / f.share), detail: `${Math.round(share * 100)}% premium` }
  }
  if (f.kind === 'finish') {
    const area = rooms.reduce((s, r) => s + roomArea(r), 0)
    if (!area) return { ...base, value: 0, detail: 'no rooms' }
    const qv = rooms.reduce((s, r) => s + (q(r.floorQ).score + q(r.wallQ).score) / 2 * roomArea(r), 0) / area
    return { ...base, value: clamp((qv - 0.45) / (f.min - 0.45)), detail: qv >= f.min ? 'premium' : qv >= 0.75 ? 'standard' : 'basic' }
  }
  return { ...base, value: 1, detail: '' }
}
