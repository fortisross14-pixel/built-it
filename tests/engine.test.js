import test from 'node:test'
import assert from 'node:assert/strict'
import { addRoom, canPlaceItem, cutRoom, duplicateLevel, extendRoom, mergeCandidates, mergeRooms, moveRoom, roomArea, roomPerimeter, newProject, placeItem, removeRoom, toggleOpening, wallEdges, verticalLinks, addLevel } from '../src/engine/plan.js'
import { evaluate, merchandise } from '../src/engine/score.js'
import { START_CASH, abandonCareer, acceptOffer, acknowledge, archiveCareer, buyPack, completeCommission, makeOffer, newCareer, newMeta, retryCommission, rng, unlocksFor } from '../src/engine/career.js'
import { PACKS, available, makeCtx } from '../src/game/packs.js'
import { ITEMS, PRODUCTS } from '../src/game/catalog.js'
import { BRIEFS, estimateBudget } from '../src/game/briefs.js'
import { cafeOffer, referenceCafe } from './fixtures.js'

test('rooms cannot overlap or leave the lot', () => {
  const p = newProject(cafeOffer())
  const a = addRoom(p, 0, { x: 0, y: 0, w: 4, h: 4 }, 'seating')
  assert.ok(!a.error)
  assert.match(addRoom(a.project, 0, { x: 3, y: 3, w: 3, h: 3 }, 'wc').error, /Overlaps/)
  assert.match(addRoom(a.project, 0, { x: 16, y: 0, w: 4, h: 3 }, 'wc').error, /lot/)
})

test('walls derive from rooms; shared walls are interior', () => {
  let p = newProject(cafeOffer())
  p = addRoom(p, 0, { x: 0, y: 0, w: 3, h: 2 }, 'seating').project
  p = addRoom(p, 0, { x: 3, y: 0, w: 2, h: 2 }, 'kitchen').project
  const edges = wallEdges(p.levels[0])
  assert.equal(edges.get('v:3:0').exterior, false)
  assert.equal(edges.get('h:0:0').exterior, true)
  assert.equal([...edges.values()].filter(e => e.exterior).length, 14)
})

test('windows only on exterior walls, doors anywhere on walls', () => {
  let p = newProject(cafeOffer())
  p = addRoom(p, 0, { x: 0, y: 0, w: 3, h: 2 }, 'seating').project
  p = addRoom(p, 0, { x: 3, y: 0, w: 2, h: 2 }, 'kitchen').project
  assert.match(toggleOpening(p, 0, 'v:3:0', 'window').error, /exterior/)
  assert.ok(!toggleOpening(p, 0, 'v:3:0', 'door').error)
  assert.match(toggleOpening(p, 0, 'v:1:0', 'door').error, /walls/)
})

test('kitchen wet rooms default to a water-safe floor', () => {
  const p = addRoom(newProject(cafeOffer()), 0, { x: 0, y: 0, w: 3, h: 3 }, 'kitchen', 'oak')
  assert.equal(p.room.floor, 'ceramic')
})

test('items must sit in allowed rooms; site items outside', () => {
  let p = addRoom(newProject(cafeOffer()), 0, { x: 0, y: 0, w: 4, h: 4 }, 'seating').project
  assert.ok(canPlaceItem(p, 0, { type: 'table', x: 0, y: 0, rot: 0 }).ok)
  assert.ok(!canPlaceItem(p, 0, { type: 'oven', x: 0, y: 0, rot: 0 }).ok)
  assert.ok(!canPlaceItem(p, 0, { type: 'tree', x: 1, y: 1, rot: 0 }).ok)
  assert.ok(canPlaceItem(p, 0, { type: 'tree', x: 6, y: 6, rot: 0 }).ok)
  p = placeItem(p, 0, { type: 'table', x: 0, y: 0 }).project
  assert.ok(!canPlaceItem(p, 0, { type: 'table', x: 1, y: 1, rot: 0 }).ok)
})

test('removing a room removes its items and openings', () => {
  let p = referenceCafe()
  const kitchen = p.levels[0].rooms.find(r => r.type === 'kitchen')
  p = removeRoom(p, 0, kitchen.id)
  assert.ok(!p.levels[0].items.some(i => i.type === 'oven'))
  assert.equal(p.levels[0].rooms.length, 3)
})

test('reference café scores well; empty project scores badly', () => {
  const offer = cafeOffer()
  const good = evaluate(referenceCafe(offer), offer)
  assert.ok(good.overall >= 80, `reference overall ${good.overall}`)
  assert.ok(good.functionality >= 80)
  const empty = evaluate(newProject(offer), offer)
  assert.ok(empty.overall < 25, `empty overall ${empty.overall}`)
  assert.equal(empty.stars, 1)
})

test('no street door caps functionality', () => {
  const offer = cafeOffer()
  let p = referenceCafe(offer)
  p = toggleOpening(p, 0, 'h:5:8', 'door').project
  const r = evaluate(p, offer)
  assert.ok(r.functionality <= 12)
})

test('wrong style lowers aesthetics; over budget lowers requirements', () => {
  const offer = cafeOffer()
  const base = evaluate(referenceCafe(offer), offer)
  const offStyle = evaluate(referenceCafe(offer), { ...offer, styles: ['corporate', 'luxe'] })
  assert.ok(offStyle.aesthetics < base.aesthetics - 15)
  const poor = evaluate(referenceCafe(offer), { ...offer, budget: 100000 })
  assert.ok(poor.budget < base.budget - 40)
})

test('stairs link levels only when stacked', () => {
  let p = newProject({ ...cafeOffer(), lot: { w: 20, h: 20 } })
  p = addRoom(p, 0, { x: 0, y: 0, w: 6, h: 6 }, 'lobby').project
  p = addLevel(p, 3).project
  assert.match(addRoom(p, 1, { x: 4, y: 4, w: 4, h: 4 }, 'office').error, /structure/)
  p = addRoom(p, 1, { x: 0, y: 0, w: 6, h: 6 }, 'office').project
  p = placeItem(p, 0, { type: 'stairs', x: 0, y: 0 }).project
  p = placeItem(p, 1, { type: 'stairs', x: 3, y: 3 }).project
  assert.equal(verticalLinks(p, 0).length, 0)
  p = placeItem(p, 1, { type: 'stairs', x: 0, y: 1 }).project
  assert.equal(verticalLinks(p, 0).length, 1)
  const d = duplicateLevel(p, 1, 3)
  assert.equal(d.project.levels.length, 3)
  assert.ok(verticalLinks(d.project, 1).length >= 1)
})

test('every brief has a sane budget and a lot big enough for its program', () => {
  for (const [id, b] of Object.entries(BRIEFS)) {
    const area = b.rooms.reduce((s, r) => s + r.min * (r.count || 1), 0)
    assert.ok(b.lot.w * b.lot.h * b.levels.max >= area * 1.3, `${id} lot too small`)
    assert.ok(estimateBudget(b) > 50000, id)
  }
})

const res = (overall) => ({ overall, functionality: overall, requirements: overall, aesthetics: overall, budget: overall, stars: 3, cost: { total: 1 } })

test('career: first offers are the three basics, then the ladder adapts to grades', () => {
  let meta = newMeta()
  let c = newCareer(meta, { name: 'Test', seed: 5 })
  assert.deepEqual(c.offers.map(o => o.level), [1, 1, 1])
  assert.deepEqual(new Set(c.offers.map(o => o.industry)), new Set(['fashion', 'food', 'grocery']))
  // S jumps two levels
  c = acceptOffer(c, c.offers[0].id, {})
  let r = completeCommission(meta, c, res(95), null); meta = r.meta; c = acknowledge(r.career)
  assert.equal(c.level, 3)
  assert.ok(c.cash > START_CASH)
  assert.ok(c.offers.filter(o => !o.locked).some(o => o.level === 4), 'A/S grade offers a stretch')
  // C drops a level
  c = acceptOffer(c, c.offers.find(o => !o.locked && o.level === 3).id, {})
  r = completeCommission(meta, c, res(60), null); meta = r.meta; c = acknowledge(r.career)
  assert.equal(c.level, 2)
  assert.equal(r.unlocks.length, 0, 'C unlocks nothing')
})

test('career: grades unlock industry items permanently (B < A < S)', () => {
  assert.ok(unlocksFor('fashion', 'B').includes('miniDisplay'))
  assert.ok(!unlocksFor('fashion', 'B').includes('shoeWall'))
  assert.ok(unlocksFor('fashion', 'A').includes('shoeWall'))
  assert.ok(unlocksFor('fashion', 'S').includes('vipSalon'))
  assert.ok(!unlocksFor('fashion', 'C').length)
  assert.ok(unlocksFor('grocery', 'B').includes('chiller:drinks'))
  assert.ok(!unlocksFor('grocery', 'B').includes('aisle:bakery') && unlocksFor('grocery', 'A').includes('aisle:bakery'))
  let meta = newMeta()
  let c = newCareer(meta, { name: 'Test', seed: 2 })
  c = acceptOffer(c, c.offers.find(o => o.industry === 'fashion').id, {})
  const r = completeCommission(meta, c, res(84), null)
  assert.ok(r.meta.unlocked.includes('shoeWall') && r.meta.unlocked.includes('miniDisplay'))
  const ctxNew = makeCtx(r.meta, newCareer(r.meta, { name: 'Next', seed: 3 }))
  assert.ok(available(ITEMS.shoeWall, 'shoeWall', ctxNew), 'unlocks carry to the next architect')
  assert.ok(!available(ITEMS.pendant, 'pendant', ctxNew), 'packs do not')
})

test('career: F fails, costs a strike, keeps the commission for a retry; 3 strikes ends it', () => {
  const meta = newMeta()
  let c = newCareer(meta, { name: 'Test', seed: 9 })
  c = acceptOffer(c, c.offers[0].id, { draft: 1 })
  for (let i = 1; i <= 3; i++) {
    const r = completeCommission(meta, c, res(30), null)
    assert.equal(r.entry.grade, 'F')
    assert.ok(r.career.current, 'commission stays open for retry')
    assert.equal(r.career.portfolio.length, 0)
    c = retryCommission(r.career)
    assert.equal(c.strikes, i)
  }
  assert.equal(c.status, 'fired')
  const m = archiveCareer(meta, c)
  assert.equal(m.legacy.length, 1)
  assert.equal(abandonCareer(newCareer(meta, { name: 'X', seed: 1 })).status, 'abandoned')
})

test('shop: packs cost cash and unlock for this architect', () => {
  const meta = newMeta()
  let c = newCareer(meta, { name: 'Test', seed: 4 })
  assert.ok(buyPack(c, 'stone').error, 'too expensive at start')
  const r = buyPack(c, 'ambient')
  assert.ok(!r.error)
  assert.equal(r.career.cash, START_CASH - PACKS.ambient.price)
  assert.ok(available(ITEMS.pendant, 'pendant', makeCtx(meta, r.career)))
})

test('every brief requirement is placeable with base items', () => {
  for (const [id, b] of Object.entries(BRIEFS)) {
    for (const req of b.items) {
      if (req.type) assert.ok(!ITEMS[req.type].unlock && !ITEMS[req.type].pack, `${id} requires locked ${req.type}`)
      if (req.product) assert.ok(!PRODUCTS[ITEMS[req.type].products][req.product].unlock, `${id} requires locked product ${req.product}`)
      if (req.family) assert.ok(Object.values(ITEMS).some(i => (i.family === req.family || (req.family === 'tableFam')) && !i.unlock && !i.pack), `${id} family ${req.family}`)
    }
  }
  const levels = new Set(Object.values(BRIEFS).map(b => b.level))
  for (let l = 1; l <= 10; l++) assert.ok(levels.has(l), `no brief at level ${l}`)
})

test('rooms: move carries contents; merge joins same-type neighbours', () => {
  let p = referenceCafe()
  const dining = p.levels[0].rooms.find(r => r.type === 'seating')
  assert.match(moveRoom(p, 0, dining.id, 1, 0).error, /Overlaps/)
  const service = p.levels[0].rooms.find(r => r.type === 'service')
  // move the WC (2x3 at 14,2) down by 6 cells: free space
  const wc = p.levels[0].rooms.find(r => r.type === 'wc')
  const moved = moveRoom(p, 0, wc.id, 0, 6)
  assert.ok(!moved.error, moved.error)
  const toilet = moved.project.levels[0].items.find(i => i.type === 'toilet')
  assert.equal(toilet.y, 4 + 6)
  let q = newProject(cafeOffer())
  q = addRoom(q, 0, { x: 0, y: 0, w: 4, h: 4 }, 'seating').project
  q = addRoom(q, 0, { x: 4, y: 0, w: 3, h: 4 }, 'seating').project
  q = addRoom(q, 0, { x: 0, y: 4, w: 3, h: 3 }, 'seating').project
  const [a, b, c] = q.levels[0].rooms
  assert.deepEqual(new Set(mergeCandidates(q.levels[0], a).map(r => r.id)), new Set([b.id, c.id]))
  const m = mergeRooms(q, 0, a.id, c.id)
  assert.equal(m.project.levels[0].rooms.length, 2)
  assert.equal(roomArea(m.room), 16 + 9, 'L-shaped merge keeps every cell')
  assert.equal(m.room.w, 4); assert.equal(m.room.h, 7)
  assert.ok(service)
})

test('rooms: any orthogonal shape via extend and cut; walls follow the outline', () => {
  let p = newProject(cafeOffer())
  p = addRoom(p, 0, { x: 0, y: 0, w: 6, h: 4 }, 'seating').project
  const id = p.levels[0].rooms[0].id
  let r = extendRoom(p, 0, id, { x: 0, y: 4, w: 2, h: 3 })
  assert.ok(!r.error, r.error)
  p = r.project
  assert.equal(roomArea(p.levels[0].rooms[0]), 24 + 6)
  // L shape: 6+... outline: walls count equals perimeter
  const ext = [...wallEdges(p.levels[0]).values()].filter(e => e.exterior).length
  assert.equal(ext, roomPerimeter(p.levels[0].rooms[0]))
  assert.match(extendRoom(p, 0, id, { x: 10, y: 10, w: 2, h: 2 }).error, /touch/)
  r = cutRoom(p, 0, id, { x: 2, y: 1, w: 2, h: 2 })
  assert.ok(!r.error, 'courtyard-style notch inside is fine')
  assert.equal(roomArea(r.project.levels[0].rooms[0]), 30 - 4)
  assert.match(cutRoom(p, 0, id, { x: 0, y: 2, w: 6, h: 1 }).error, /split/)
  // furniture outside the new outline is dropped by cleanup
  let q = placeItem(p, 0, { type: 'table', x: 0, y: 5 }).project
  q = cutRoom(q, 0, id, { x: 0, y: 4, w: 2, h: 3 }).project
  assert.ok(!q.levels[0].items.some(i => i.type === 'table'))
  // scoring still runs on irregular rooms
  assert.ok(evaluate(p, cafeOffer()).overall >= 0)
})

test('family requirements accept any variant', () => {
  const offer = { ...makeOffer('boutique', rng(1), 0), twist: null }
  let p = newProject(offer)
  p = addRoom(p, 0, { x: 1, y: 1, w: 8, h: 6 }, 'sales').project
  for (const [prod, x, y] of [['women', 1, 2], ['men', 3, 2], ['kids', 5, 2], ['kids', 1, 4]]) p = placeItem(p, 0, { type: 'rack', product: prod, x, y }).project
  const r = evaluate(p, offer)
  assert.ok(r.checklist.find(c => c.type === 'rack' && !c.product).ok, 'any 4 racks')
  assert.ok(r.checklist.find(c => c.product === 'women').ok)
  assert.ok(r.checklist.find(c => c.product === 'men').ok)
})

test('merchandising: grouped departments and complements score higher than scattered ones', () => {
  const room = { id: 'r', type: 'sales', x: 0, y: 0, w: 14, h: 10, cells: null }
  const mk = (items) => ({ rooms: [room], doors: [], windows: [], items: items.map((it, i) => ({ id: `i${i}`, rot: 0, q: 1, ...it })) })
  const grouped = mk([
    { type: 'rack', product: 'women', x: 0, y: 0 }, { type: 'rack', product: 'women', x: 2, y: 0 }, { type: 'display', product: 'women', x: 4, y: 0 },
    { type: 'rack', product: 'men', x: 0, y: 6 }, { type: 'rack', product: 'men', x: 2, y: 6 }, { type: 'display', product: 'men', x: 4, y: 6 },
  ])
  const scattered = mk([
    { type: 'rack', product: 'women', x: 0, y: 0 }, { type: 'rack', product: 'men', x: 2, y: 0 }, { type: 'display', product: 'men', x: 10, y: 3 },
    { type: 'rack', product: 'women', x: 6, y: 8 }, { type: 'rack', product: 'men', x: 11, y: 8 }, { type: 'display', product: 'women', x: 12, y: 0 },
  ])
  const g = merchandise(grouped), sc = merchandise(scattered)
  assert.ok(g.score > 0.9, `grouped ${g.score}`)
  assert.ok(sc.score < 0.4, `scattered ${sc.score}`)
  assert.ok(g.links.some(l => l.kind === 'complement') && g.links.some(l => l.kind === 'group'))
})

test('quality is a trade-off: premium raises F and A but costs budget', () => {
  const offer = cafeOffer()
  const base = referenceCafe(offer)
  const lux = structuredClone(base)
  lux.levels[0].items.forEach(it => { it.q = 2 })
  lux.levels[0].rooms.forEach(r => { r.floorQ = 2; r.wallQ = 2 })
  const cheap = structuredClone(base)
  cheap.levels[0].items.forEach(it => { it.q = 0 })
  cheap.levels[0].rooms.forEach(r => { r.floorQ = 0; r.wallQ = 0 })
  const [a, b, c] = [base, lux, cheap].map(p => evaluate(p, offer))
  assert.ok(b.functionality > a.functionality && b.aesthetics > a.aesthetics)
  assert.ok(b.cost.total > a.cost.total && b.budget < a.budget)
  assert.ok(c.functionality < a.functionality && c.aesthetics < a.aesthetics && c.budget >= a.budget)
})

test('ceiling lights hang over furniture but not over each other; no lights = dark', () => {
  const offer = cafeOffer()
  let p = referenceCafe(offer)
  const pend = p.levels[0].items.find(i => i.type === 'pendant')
  assert.ok(!canPlaceItem(p, 0, { type: 'downlight', x: pend.x, y: pend.y, rot: 0 }).ok)
  assert.ok(canPlaceItem(p, 0, { type: 'downlight', x: 6, y: 3, rot: 0 }).ok, 'over a table')
  p.levels[0].items = p.levels[0].items.filter(i => !['pendant', 'downlight', 'track', 'panel'].includes(i.type))
  const r = evaluate(p, offer)
  assert.ok(!r.checklist.find(c => c.label === 'Ceiling lighting').ok)
})

test('architect backgrounds: art +aesthetics, business cheaper, engineering forgives, pure a bit of all', async () => {
  const { BACKGROUNDS } = await import('../src/game/architects.js')
  const offer = cafeOffer()
  const p = referenceCafe(offer)
  const holey = structuredClone(p)
  holey.levels[0].items = holey.levels[0].items.filter(i => i.type !== 'oven' && i.type !== 'espresso')
  const base = evaluate(holey, offer, [])
  const art = evaluate(holey, offer, ['bg:art'])
  const biz = evaluate(holey, offer, ['bg:business'])
  const eng = evaluate(holey, offer, ['bg:engineering'])
  const pure = evaluate(holey, offer, ['bg:architect'])
  assert.ok(art.aesthetics >= Math.min(100, base.aesthetics + 5))
  assert.ok(biz.cost.total < base.cost.total * 0.91)
  assert.ok(eng.requirements > base.requirements)
  assert.ok(pure.requirements > base.requirements && pure.cost.total < base.cost.total && pure.requirements < eng.requirements)
  assert.equal(Object.keys(BACKGROUNDS).length, 4)
  const c = newCareer(newMeta(), { name: 'P', profile: { background: 'art', country: 'ES', age: 31 }, seed: 1 })
  assert.ok(c.profile.country === 'ES')
})
