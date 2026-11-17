import { addRoom, newProject, placeItem, setOpening } from '../engine/plan.js'
import { makeOffer, rng } from '../engine/career.js'

export function cafeOffer(overrides = {}) {
  return { ...makeOffer('cafe', rng(1), 0), twist: null, styles: ['warm', 'minimal'], ...overrides }
}

function must(res) { if (res.error) throw new Error(res.error); return res.project }

// A sensible reference café: the title-screen showpiece and the scoring calibration fixture.
export function referenceCafe(offer = cafeOffer()) {
  let p = newProject(offer)
  p.facade = 'brick'
  const room = (x, y, w, h, type, floor) => { p = must(addRoom(p, 0, { x, y, w, h }, type, floor)) }
  room(2, 2, 8, 6, 'seating', 'oak')
  room(10, 2, 4, 3, 'service', 'oak')
  room(10, 5, 4, 3, 'kitchen', 'ceramic')
  room(14, 2, 2, 3, 'wc', 'ceramic')
  const door = (k) => { p = must(setOpening(p, 0, k, 'door')) }
  const win = (k) => { p = must(setOpening(p, 0, k, 'window')) }
  door('h:5:8'); door('v:10:3'); door('h:13:5'); door('v:14:3')
  ;['h:3:2', 'h:5:2', 'h:7:2', 'v:2:4', 'v:2:6', 'h:11:2', 'h:3:8', 'h:8:8'].forEach(win)
  const item = (type, x, y, rot = 0) => { p = must(placeItem(p, 0, { type, x, y, rot })) }
  item('counter', 10, 4); item('espresso', 13, 2)
  item('table', 3, 3); item('table', 6, 3); item('table', 3, 6); item('table', 6, 6)
  item('oven', 10, 7); item('sink', 13, 7); item('toilet', 15, 4)
  item('tree', 1, 10); item('tree', 4, 10); item('bench', 6, 10); item('plant', 9, 2)
  // Decorate layer: paint and ceiling lights
  p.levels[0].rooms.forEach(r => { r.wall = r.type === 'seating' ? 'terracotta' : 'chalk' })
  item('pendant', 4, 4); item('pendant', 7, 4); item('pendant', 4, 7); item('pendant', 7, 7)
  item('downlight', 3, 2); item('downlight', 8, 2); item('downlight', 5, 5)
  item('track', 11, 2); item('panel', 11, 5); item('downlight', 14, 3)
  return p
}

// Balance fixtures. A founder with only the starter catalogue, and an expert café
// (hospitality specialist, unlocked booths, signature finishes, premium where it counts).
export function founderCafe(offer = cafeOffer()) {
  const p = referenceCafe(offer)
  p.facade = 'stucco'
  p.levels[0].rooms.forEach(r => { r.floor = ['seating', 'service'].includes(r.type) ? 'carpet' : 'ceramic'; r.wall = r.type === 'seating' ? 'cream' : 'chalk' })
  p.levels[0].items = p.levels[0].items.map(it => ['pendant', 'track'].includes(it.type) ? { ...it, type: 'downlight' } : it)
  return p
}
export function expertCafe(offer = cafeOffer()) {
  let p = referenceCafe(offer)
  const take = (type, x, y) => { p.levels[0].items = p.levels[0].items.filter(i => !(i.type === type && i.x === x && i.y === y)) }
  const item = (type, x, y, extra = {}) => { p = placeItem(p, 0, { type, x, y, ...extra }).project }
  p.door = 'glazed'; p.roof = 'terracottaRoof'
  p.levels[0].rooms.forEach(r => { if (r.type === 'seating') Object.assign(r, { floor: 'encaustic', wall: 'zellige', ceiling: 'rattan', floorQ: 2 }) })
  take('table', 3, 6); take('table', 6, 6)
  item('booth', 2, 6, { q: 2 }); item('booth', 6, 6, { q: 2 })
  p.levels[0].items.forEach(it => { if (['table', 'counter'].includes(it.type)) it.q = 2 })
  item('table', 11, 10); item('table', 14, 10); item('sofa', 8, 3, { rot: 1 })
  return p
}
