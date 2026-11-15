// Review engine: scores a project on Functionality, Requirements and Aesthetics.
import { CEILINGS, DOORS, ITEMS, MATERIALS, PAINTS, ROOMS, STYLES, familyOf, q } from '../game/catalog.js'
import { BRIEFS, GRADES, TWISTS, gradeFor, reqLabel } from '../game/briefs.js'
import { cellOwners, ck, edgeCells, footprint, itemCells, projectCost, roomArea, verticalLinks, wallEdges } from './plan.js'

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const avg = (a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0

// ---------------------------------------------------------------- circulation
export function circulation(project) {
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
  for (const e of entrances) {
    if (!walkable(0, e.x, e.y)) continue
    const k = `0:${e.x}:${e.y}`
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

export function daylitRooms(project) {
  const glazed = MATERIALS[project.facade]?.glazed
  const set = new Set()
  project.levels.forEach(level => {
    const edges = wallEdges(level)
    for (const key of level.windows) { const e = edges.get(key); if (e) set.add(e.a) }
    if (glazed) for (const e of edges.values()) if (e.exterior) set.add(e.a)
    for (const it of level.items) {
      if (it.type !== 'skylight') continue
      const r = level.rooms.find(r => it.x >= r.x && it.x < r.x + r.w && it.y >= r.y && it.y < r.y + r.h)
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
  const items = allItems(project)
  const circ = circulation(project)
  const notes = []
  const checklist = []
  const note = (group, label, value, good, bad) => notes.push({ group, label, value: clamp(value), text: value >= 0.75 ? good : bad })

  // ---------------- Functionality
  const hasEntrance = circ.entrances.length > 0
  checklist.push({ label: 'Street entrance', ok: hasEntrance, detail: hasEntrance ? `${circ.entrances.length} door${circ.entrances.length > 1 ? 's' : ''}` : 'Add a door on an exterior wall' })
  const reached = rooms.filter(r => {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (circ.dist.has(`${r.li}:${x}:${y}`)) return true
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
    const occ = level.items.filter(it => !ITEMS[it.type].overlay && !ITEMS[it.type].walkable).reduce((s, it) => s + itemCells(it).filter(c => c.x >= r.x && c.x < r.x + r.w && c.y >= r.y && c.y < r.y + r.h).length, 0)
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
  const inRoom = (it, r) => it.x >= r.x && it.x < r.x + r.w && it.y >= r.y && it.y < r.y + r.h
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

  let functionality = 100 * (0.25 * reach + 0.17 * access + 0.12 * distScore + (brief.adj.length ? 0.18 : 0) * adj + 0.05 * crowd + 0.05 * wet + 0.05 * lift + 0.07 * lighting + 0.06 * equipQ)
  functionality /= (brief.adj.length ? 1 : 0.82)
  // Signature pieces: each distinct boosted item type adds once (unlocks are meant to feel good).
  const boostTypes = new Set(items.map(it => it.type).filter(t => ITEMS[t].boost))
  let boostF = [...boostTypes].reduce((s, t) => s + (ITEMS[t].boost.f || 0), 0)
  let boostA = [...boostTypes].reduce((s, t) => s + (ITEMS[t].boost.a || 0), 0)
  const door = DOORS[project.door] || DOORS.standard
  boostF += door.boost?.f || 0; boostA += door.boost?.a || 0
  boostF += Math.min(2, rooms.reduce((s, r) => s + (CEILINGS[r.ceiling]?.boost?.f || 0), 0))
  boostF = Math.min(10, boostF); boostA = Math.min(12, boostA)
  functionality += boostF
  if (boostF) notes.push({ group: 'functionality', label: 'Smart pieces', value: 1, text: `Specialist equipment makes the place work better (+${boostF}).` })
  if (!hasEntrance) functionality = Math.min(functionality, 12)
  if (kit.includes('mentor')) functionality += 5

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
    const match = (it) => req.family ? familyOf(it.type) === req.family : it.type === req.type
    const have = items.filter(it => match(it) && (!req.in || itemRoomType(project, it) === req.in)).length
    checklist.push({ label: `${reqLabel(req)}${n > 1 ? ` ×${n}` : ''}${req.in ? ` in ${ROOMS[req.in].label}` : ''}`, ok: have >= n, detail: `${Math.min(have, n)}/${n}`, kind: 'item', type: req.type, family: req.family })
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
  let requirements = 100 * (0.45 * roomScore + 0.4 * itemScore + 0.15 * levelsOk)
  if (extra.length) requirements = requirements * (1 - 0.12 * extra.length) + 100 * 0.12 * extra.reduce((s, v) => s + v, 0)

  // ---------------- Aesthetics
  const lit = daylitRooms(project)
  const hab = rooms.filter(r => ROOMS[r.type]?.habitable)
  const daylight = hab.length ? hab.filter(r => lit.has(r.id)).length / hab.length : (rooms.length ? 0.5 : 0)
  note('aesthetics', 'Daylight', daylight, 'Lived-in rooms are full of daylight.', 'Too many rooms people spend time in have no window.')

  const propRooms = rooms.filter(r => !ROOMS[r.type]?.circulation)
  const proportion = propRooms.length ? propRooms.reduce((s, r) => {
    const ar = Math.max(r.w, r.h) / Math.min(r.w, r.h)
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
  const style = rooms.length ? 0.25 * (matches(project.facade) ? 1 : 0) + 0.37 * floorMatch + 0.2 * paintMatch + 0.12 * ceilMatch + 0.06 * doorMatch : 0
  note('aesthetics', 'Style fit', style, `Materials nail the ${offer.styles.map(s => STYLES[s].toLowerCase()).join(' / ')} brief.`, `The client wanted something ${offer.styles.map(s => STYLES[s].toLowerCase()).join(' and ')}. Materials missed it.`)

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
  note('aesthetics', 'Finish quality', finishQ, 'Beautifully crafted finishes and furniture.', 'Cheap finishes show. Paint is already peeling.')
  const mood = clamp(lights.reduce((s, it) => s + ITEMS[it.type].ambience * q(it.q).score, 0) / Math.max(1, hab.length * 1.2))
  note('aesthetics', 'Lighting mood', mood, 'Warm, layered lighting gives it atmosphere at night.', 'Flat, office-style lighting kills the mood. Try pendants or a chandelier.')

  const dw = twist?.daylightWeight || 1
  const parts = [[daylight, 0.2 * dw], [proportion, 0.08], [style, 0.2], [palette, 0.08], [decor, 0.1], [facadeScore, 0.1], [compact, 0.08], [finishQ, 0.1], [mood, 0.06]]
  let aesthetics = 100 * parts.reduce((s, [v, w]) => s + v * w, 0) / parts.reduce((s, [, w]) => s + w, 0) + specialBonus
  if (kit.includes('renders')) aesthetics += 5

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
  return { head, praise, gripes }
}
