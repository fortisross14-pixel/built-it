import test from 'node:test'
import assert from 'node:assert/strict'
import { addRoom, canPlaceItem, duplicateLevel, newProject, placeItem, removeRoom, toggleOpening, wallEdges, verticalLinks, addLevel } from '../src/engine/plan.js'
import { evaluate } from '../src/engine/score.js'
import { acceptOffer, archiveCareer, claimReward, completeCommission, generateOffers, newCareer, newMeta, repGain, tierFor } from '../src/engine/career.js'
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

test('career: offers respect tiers and include a locked teaser', () => {
  const meta = newMeta()
  const c = newCareer(meta, { name: 'Test', kit: [], seed: 5 })
  const open = c.offers.filter(o => !o.locked)
  assert.equal(open.length, 3)
  assert.ok(open.every(o => o.tier === 1))
  assert.ok(c.offers.some(o => o.locked && o.tier === 2))
  assert.equal(tierFor(25), 2)
  assert.equal(generateOffers({ ...c, kit: ['network'] }).filter(o => !o.locked).length, 4)
})

test('career: completing, rewards, strikes and archiving', () => {
  let meta = newMeta()
  let c = newCareer(meta, { name: 'Test', kit: [], seed: 9 })
  const offer = c.offers[0]
  c = acceptOffer(c, offer.id, {})
  const good = { overall: 88, functionality: 90, requirements: 90, aesthetics: 84, stars: 4, cost: { total: 1 } }
  let res = completeCommission(meta, c, good, null)
  c = res.career
  assert.ok(c.rep > 0)
  assert.equal(c.reward.choices.length, 3)
  ;({ meta, career: c } = claimReward(meta, c, c.reward.choices[0]))
  assert.equal(meta.collection.length, 4)
  const bad = { overall: 30, functionality: 30, requirements: 30, aesthetics: 30, stars: 1, cost: { total: 1 } }
  for (let i = 0; i < 3; i++) {
    c = acceptOffer(c, c.offers[0].id, {})
    c = completeCommission(meta, c, bad, null).career
    assert.equal(c.reward.choices.length, 0)
    c = claimReward(meta, c, null).career
  }
  assert.equal(c.status, 'fired')
  meta = archiveCareer(meta, c)
  assert.equal(meta.legacy.length, 1)
  assert.equal(meta.careers, 1)
  assert.ok(repGain(30, offer, []) < 0)
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
