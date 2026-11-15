// Builds a low-poly Three.js model of a project: slabs, walls with openings,
// roofs, furniture and a little bit of street context.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { CEILINGS, DOORS, ITEMS, LEVEL_HEIGHT, MATERIALS, PAINTS, itemSize, productDef } from '../game/catalog.js'
import { cellOwners, ck, roomCells, roomRuns, wallEdges } from '../engine/plan.js'

const WALL_T = 0.2
const WALL_H = LEVEL_HEIGHT - 0.2
const matCache = new Map()
export function mat(color, opts = {}) {
  const k = color + JSON.stringify(opts)
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92, metalness: 0, ...opts }))
  return matCache.get(k)
}

class Bucket {
  constructor() { this.map = new Map() }
  add(material, geo) { if (!this.map.has(material)) this.map.set(material, []); this.map.get(material).push(geo) }
  box(material, cx, cy, cz, sx, sy, sz) {
    const g = new THREE.BoxGeometry(sx, sy, sz); g.translate(cx, cy, cz); this.add(material, g)
  }
  flush(group, { shadow = true } = {}) {
    for (const [m, geos] of this.map) {
      if (!geos.length) continue
      const merged = mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g), false)
      geos.forEach(g => g.dispose())
      const mesh = new THREE.Mesh(merged, m)
      mesh.castShadow = shadow; mesh.receiveShadow = true
      group.add(mesh)
    }
    this.map.clear()
  }
}

function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 }

function tree(b, x, z, y0, scale = 1, tint = '#7f9f6a') {
  b.box(mat('#7a5a3e'), x, y0 + 0.6 * scale, z, 0.18 * scale, 1.2 * scale, 0.18 * scale)
  const g = new THREE.IcosahedronGeometry(0.85 * scale, 0)
  g.translate(x, y0 + 1.75 * scale, z)
  b.add(mat(tint), g)
}

// Low-poly furniture. (x, z) = footprint origin, (w, d) = footprint size in metres.
const QUALITY_LOOK = [
  { wood: '#cbc3b4', fabric: '#9aa0a4', steel: '#b4b8ba', white: '#e6e4de' },
  { wood: '#b58a60', fabric: '#6f8a9a', steel: '#a9b0b4', white: '#f2f1ec' },
  { wood: '#6e4a31', fabric: '#8e3b4f', steel: '#c9a55a', white: '#fbfaf6' },
]
const glow = () => mat('#fff6df', { emissive: '#ffd894', emissiveIntensity: 0.9 })

function furniture(b, type, x, z, w, d, y0, quality = 1, product = null) {
  const pd = productDef({ type, product })
  const cx = x + w / 2, cz = z + d / 2
  const look = QUALITY_LOOK[quality] || QUALITY_LOOK[1]
  const wood = mat(look.wood), dark = mat('#4b4f52'), white = mat(look.white), steel = mat(look.steel), fabric = mat(look.fabric)
  const ceil = y0 + WALL_H
  switch (type) {
    case 'downlight': b.box(dark, cx, ceil - 0.03, cz, 0.3, 0.06, 0.3); b.box(glow(), cx, ceil - 0.07, cz, 0.2, 0.02, 0.2); break
    case 'pendant': {
      b.box(dark, cx, ceil - 0.45, cz, 0.02, 0.9, 0.02)
      const g = new THREE.ConeGeometry(0.28, 0.3, 8, 1, true); g.translate(cx, ceil - 1.0, cz); b.add(quality === 2 ? mat('#c9a55a') : dark, g)
      b.box(glow(), cx, ceil - 1.12, cz, 0.14, 0.08, 0.14); break
    }
    case 'track': {
      const along = w >= d
      b.box(dark, cx, ceil - 0.04, cz, along ? w - 0.2 : 0.06, 0.05, along ? 0.06 : d - 0.2)
      for (const u of [0.2, 0.5, 0.8]) { const px = along ? x + u * w : cx, pz = along ? cz : z + u * d; b.box(dark, px, ceil - 0.18, pz, 0.12, 0.2, 0.12); b.box(glow(), px, ceil - 0.29, pz, 0.08, 0.02, 0.08) }
      break
    }
    case 'panel': b.box(steel, cx, ceil - 0.03, cz, w - 0.6, 0.05, d - 0.6); b.box(glow(), cx, ceil - 0.06, cz, w - 0.7, 0.02, d - 0.7); break
    case 'chandelier': {
      b.box(dark, cx, ceil - 0.35, cz, 0.03, 0.7, 0.03)
      const ring = new THREE.TorusGeometry(0.55, 0.04, 4, 12); ring.rotateX(Math.PI / 2); ring.translate(cx, ceil - 0.8, cz); b.add(mat('#c9a55a'), ring)
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.box(glow(), cx + Math.cos(a) * 0.55, ceil - 0.7, cz + Math.sin(a) * 0.55, 0.07, 0.14, 0.07) }
      break
    }
    case 'table': case 'bigTable': {
      b.box(wood, cx, y0 + 0.74, cz, w - 0.7, 0.06, d - 0.7)
      b.box(dark, cx, y0 + 0.37, cz, 0.12, 0.72, 0.12)
      const chairs = type === 'table' ? [[0.25, 0.5], [0.75, 0.5]] : [[0.2, 0.5], [0.4, 0.5], [0.6, 0.5], [0.8, 0.5]]
      for (const [u] of chairs) for (const side of [0.18, d - 0.18]) b.box(fabric, x + u * w, y0 + 0.23, z + side, 0.38, 0.46, 0.32)
      break
    }
    case 'counter': case 'reception':
      b.box(type === 'counter' ? wood : white, cx, y0 + 0.55, cz, w - 0.08, 1.1, d - 0.25)
      b.box(dark, cx, y0 + 1.12, cz, w, 0.05, d - 0.15); break
    case 'oven': case 'stove': case 'fridge': case 'kitchenette':
      b.box(steel, cx, y0 + (type === 'fridge' ? 1 : 0.45), cz, w - 0.08, type === 'fridge' ? 2 : 0.9, d - 0.15)
      if (type === 'stove') b.box(dark, cx, y0 + 0.92, cz, w - 0.3, 0.04, d - 0.4)
      break
    case 'espresso':
      b.box(wood, cx, y0 + 0.5, cz, w - 0.1, 1, d - 0.1); b.box(mat('#c0392b'), cx, y0 + 1.15, cz, 0.5, 0.3, 0.4); break
    case 'sink':
      b.box(white, cx, y0 + 0.45, cz, w - 0.3, 0.9, d - 0.4); break
    case 'toilet':
      b.box(white, cx, y0 + 0.2, cz, 0.42, 0.4, 0.6); b.box(white, cx, y0 + 0.5, z + 0.18, 0.5, 0.6, 0.18); break
    case 'shower':
      b.box(mat('#cfe3ea', { transparent: true, opacity: 0.5 }), cx, y0 + 1, cz, w - 0.1, 2, d - 0.1); break
    case 'sofa':
      b.box(fabric, cx, y0 + 0.22, cz, w - 0.1, 0.44, d - 0.2); b.box(fabric, cx, y0 + 0.55, z + 0.15, w - 0.1, 0.5, 0.2); break
    case 'bed':
      b.box(white, cx, y0 + 0.28, cz, w - 0.2, 0.5, d - 0.15); b.box(fabric, cx, y0 + 0.55, z + d * 0.62, w - 0.2, 0.08, d * 0.7); break
    case 'desk': case 'deskRow':
      b.box(white, cx, y0 + 0.74, cz, w - 0.15, 0.05, d - 0.35)
      for (let i = 0; i < Math.round(w); i++) b.box(fabric, x + i + 0.5, y0 + 0.25, z + d - 0.15, 0.4, 0.5, 0.3)
      break
    case 'examBed':
      b.box(mat('#78a6b8'), cx, y0 + 0.55, cz, w - 0.3, 0.2, d - 0.3); b.box(steel, cx, y0 + 0.25, cz, 0.2, 0.5, 0.2); break
    case 'shelving': case 'lockers':
      b.box(type === 'shelving' ? wood : mat('#6c8e86'), cx, y0 + 1, cz, w - 0.1, 2, d - 0.55); break
    case 'rack': {
      const pal = pd?.goods || ['#c96f53', '#e2c290', '#4f6d7a', '#9a8fb8', '#e8e3da']
      const along = w >= d, L = Math.max(w, d), hang = product === 'kids' ? 0.65 : 0.85
      if (along) b.box(steel, cx, y0 + 1.5, cz, w - 0.2, 0.05, 0.05); else b.box(steel, cx, y0 + 1.5, cz, 0.05, 0.05, d - 0.2)
      for (let i = 0; i < 6; i++) {
        const t = 0.2 + i * (L - 0.4) / 5
        if (along) b.box(mat(pal[i % 5]), x + t, y0 + 1.45 - hang / 2, cz, 0.12, hang, 0.5)
        else b.box(mat(pal[i % 5]), cx, y0 + 1.45 - hang / 2, z + t, 0.5, hang, 0.12)
      }
      break
    }
    case 'display':
      b.box(white, cx, y0 + 0.45, cz, w - 0.15, 0.9, d - 0.3)
      if (pd) for (let i = 0; i < 3; i++) { const along = w >= d; b.box(mat(pd.goods[i % pd.goods.length]), along ? x + 0.4 + i * (w - 0.8) / 2 : cx, y0 + 0.98, along ? cz : z + 0.4 + i * (d - 0.8) / 2, 0.25, 0.14, 0.25) }
      b.box(mat('#cfe3ea', { transparent: true, opacity: 0.45 }), cx, y0 + 1.1, cz, w - 0.15, 0.4, d - 0.3); break
    case 'artwork':
      b.box(white, cx, y0 + 0.5, cz, 0.55, 1, 0.55)
      { const g = new THREE.IcosahedronGeometry(0.28, 0); g.translate(cx, y0 + 1.3, cz); b.add(mat('#d1874f'), g) }
      break
    case 'stage':
      b.box(wood, cx, y0 + 0.3, cz, w, 0.6, d); break
    case 'plant': {
      b.box(mat('#c4a17c'), cx, y0 + 0.2, cz, 0.4, 0.4, 0.4)
      const g = new THREE.IcosahedronGeometry(0.38, 0); g.translate(cx, y0 + 0.75, cz); b.add(mat('#6f9c62'), g); break
    }
    case 'stairs': case 'featureStair': {
      const steps = 12, run = Math.max(w, d), alongX = w > d
      const m = type === 'featureStair' ? mat('#e8dccb') : mat('#c9c6bd')
      for (let i = 0; i < steps; i++) {
        const t = (i + 0.5) / steps
        const hgt = (i + 1) * LEVEL_HEIGHT / steps
        if (alongX) b.box(m, x + t * run, y0 + hgt / 2, cz, run / steps + 0.01, hgt, d - 0.2)
        else b.box(m, cx, y0 + hgt / 2, z + t * run, w - 0.2, hgt, run / steps + 0.01)
      }
      break
    }
    case 'elevator':
      b.box(mat('#8d969c'), cx, y0 + WALL_H / 2, cz, w - 0.2, WALL_H, d - 0.2); break
    case 'tree': tree(b, cx, cz, y0, 1); break
    case 'oakTree': tree(b, cx, cz, y0, 1.9, '#62864f'); break
    case 'bench': b.box(wood, cx, y0 + 0.4, cz, w - 0.2, 0.08, 0.5); b.box(dark, cx, y0 + 0.2, cz, w - 0.6, 0.4, 0.1); break
    case 'planter': {
      b.box(mat('#a29a8c'), cx, y0 + 0.3, cz, w - 0.1, 0.6, d - 0.1)
      for (const u of [0.3, 0.7]) { const g = new THREE.IcosahedronGeometry(0.35, 0); g.translate(x + u * w, y0 + 0.8, cz); b.add(mat('#7fa36b'), g) }
      break
    }
    case 'bikeRack': for (let i = 0; i < 3; i++) b.box(steel, x + 0.4 + i * 0.6, y0 + 0.4, cz, 0.06, 0.8, 0.7); break
    case 'pool': b.box(mat('#bdb8ac'), cx, y0 + 0.1, cz, w, 0.2, d); b.box(mat('#6fa8c4', { roughness: 0.2 }), cx, y0 + 0.16, cz, w - 0.4, 0.14, d - 0.4); break
    case 'sculpture': {
      b.box(mat('#d9d4c8'), cx, y0 + 0.25, cz, 0.7, 0.5, 0.7)
      const g = new THREE.TorusKnotGeometry(0.3, 0.1, 24, 4); g.translate(cx, y0 + 1.05, cz); b.add(mat('#c9733e'), g); break
    }
    case 'fireplace': b.box(mat('#8a8279'), cx, y0 + 0.6, cz, w - 0.1, 1.2, d - 0.3); b.box(mat('#f08a3c'), cx, y0 + 0.4, cz + 0.12, 0.7, 0.35, 0.3); break
    case 'greenWall': b.box(mat('#5f8f55'), cx, y0 + 1.3, cz, w - 0.05, 2.6, 0.25); break
    case 'neonSign': b.box(mat('#ff4fa3', { emissive: '#ff2f8f', emissiveIntensity: 0.8 }), cx, y0 + 2.4, cz, w - 0.4, 0.3, 0.08); break
    case 'skylight': break // shown as a glazed opening in the roof
    // --- grocery
    case 'chiller': {
      const goods = pd?.goods || ['#cccccc', '#aaaaaa', '#888888', '#dddddd']
      b.box(mat('#e8ecee'), cx, y0 + 0.95, cz, w - 0.1, 1.9, d - 0.1)
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) {
        const along = w >= d, L = Math.max(w, d), t = 0.3 + i * (L - 0.6) / 3
        const px = along ? x + t : cx, pz = along ? cz : z + t
        b.box(mat(goods[(i + r) % 4]), px, y0 + 0.45 + r * 0.5, pz, along ? 0.45 : 0.35, 0.22, along ? 0.35 : 0.45)
      }
      b.box(mat('#bfe3f2', { transparent: true, opacity: 0.35 }), cx, y0 + 0.95, cz, w - 0.06, 1.86, d - 0.06)
      break
    }
    case 'aisle': {
      const goods = pd?.goods || ['#cccccc', '#aaaaaa', '#888888', '#dddddd']
      const tall = pd?.low ? 0.8 : 1.6
      b.box(wood, cx, y0 + tall / 2, cz, w - 0.1, tall, d - 0.2)
      const along = w >= d, L = Math.max(w, d)
      for (let r = 0; r < (pd?.low ? 1 : 3); r++) for (let i = 0; i < Math.round(L * 2); i++) {
        const t = 0.25 + i * 0.5, px = along ? x + t : cx, pz = along ? cz : z + t
        b.box(mat(goods[(i + r) % 4]), px, y0 + 0.5 + r * 0.5 + (tall < 1 ? 0.35 : 0), pz, along ? 0.3 : d - 0.15, 0.22, along ? d - 0.15 : 0.3)
      }
      break
    }
    case 'checkout': b.box(white, cx, y0 + 0.45, cz, w - 0.1, 0.9, d - 0.3); b.box(dark, cx, y0 + 0.92, cz, w - 0.6, 0.05, d - 0.5); b.box(dark, x + 0.3, y0 + 1.15, cz, 0.2, 0.35, 0.05); break
    case 'bakeryCorner': case 'gourmetDeli': case 'juiceBar':
      b.box(type === 'juiceBar' ? mat('#f2a33c') : wood, cx, y0 + 0.5, cz, w - 0.1, 1, d - 0.3)
      b.box(mat('#cfe3ea', { transparent: true, opacity: 0.45 }), cx, y0 + 1.2, cz, w - 0.2, 0.4, d - 0.5)
      for (let i = 0; i < 4; i++) b.box(mat(['#d7a15a', '#c9473c', '#e0c48a', '#9ccf6a'][i]), x + 0.4 + i * (w - 0.8) / 3, y0 + 1.07, cz, 0.3, 0.14, 0.3)
      if (type !== 'juiceBar') b.box(mat('#f1efe8'), cx, y0 + 2.4, cz - d / 2 + 0.2, w - 0.4, 0.4, 0.05)
      break
    // --- fashion
    case 'mirror': b.box(mat('#d6e6ee', { roughness: 0.1 }), cx, y0 + 1.0, cz, Math.min(w, 0.8), 1.8, 0.06); break
    case 'miniDisplay': case 'jewelCase':
      b.box(white, cx, y0 + 0.5, cz, 0.7, 1, 0.7)
      b.box(mat('#cfe3ea', { transparent: true, opacity: 0.4 }), cx, y0 + 1.2, cz, 0.7, 0.4, 0.7)
      b.box(mat(type === 'jewelCase' ? '#e0c060' : (pd?.goods?.[0] || '#c96f53')), cx, y0 + 1.08, cz, 0.25, 0.15, 0.25)
      break
    case 'mannequin':
      for (const o of [-0.25, 0, 0.25]) { b.box(mat('#e9e3d8'), cx + o, y0 + 0.9, cz + Math.abs(o) * 0.4, 0.22, 1.0, 0.16); b.box(mat('#e9e3d8'), cx + o, y0 + 1.55, cz + Math.abs(o) * 0.4, 0.14, 0.18, 0.14); b.box(mat((pd?.goods || ['#9c4e63', '#3f566e', '#f2c14e'])[Math.round(o * 4 + 1)]), cx + o, y0 + 1.1, cz + Math.abs(o) * 0.4, 0.26, 0.5, 0.2) }
      break
    case 'shoeWall':
      b.box(wood, cx, y0 + 1.1, cz, w - 0.05, 2.2, d - 0.6)
      for (let r = 0; r < 5; r++) for (let i = 0; i < 6; i++) b.box(mat(['#2e2e2e', '#b8432f', '#e8e0cf', '#3f566e'][(i + r) % 4]), x + 0.3 + i * (w - 0.6) / 5, y0 + 0.3 + r * 0.42, cz + 0.15, 0.25, 0.1, 0.18)
      break
    case 'vipSalon':
      b.box(mat('#7a3b4b'), cx, y0 + 0.02, cz, w - 0.3, 0.04, d - 0.3)
      b.box(fabric, cx - 0.6, y0 + 0.25, cz, 0.8, 0.5, 1.6); b.box(fabric, cx + 0.8, y0 + 0.25, cz, 0.7, 0.5, 0.7)
      b.box(mat('#c9a55a'), cx, y0 + 0.4, cz - 0.8, 0.6, 0.06, 0.6)
      break
    case 'runway': b.box(white, cx, y0 + 0.18, cz, w - 0.1, 0.36, d - 0.1); b.box(mat('#c9a55a'), cx, y0 + 0.37, cz, w - 0.5, 0.02, d - 0.4); break
    // --- food
    case 'fryer': b.box(steel, cx, y0 + 0.45, cz, w - 0.1, 0.9, d - 0.2); b.box(mat('#e0b040'), cx, y0 + 0.91, cz, w - 0.5, 0.03, d - 0.5); break
    case 'drinkStation': b.box(mat('#e2513b'), cx, y0 + 0.75, cz, w - 0.1, 1.5, d - 0.3); b.box(dark, cx, y0 + 0.9, cz + d / 2 - 0.15, w - 0.4, 0.3, 0.05); break
    case 'booth': b.box(mat('#9c3b2f'), cx, y0 + 0.3, z + 0.3, w - 0.1, 0.6, 0.5); b.box(mat('#9c3b2f'), cx, y0 + 0.3, z + d - 0.3, w - 0.1, 0.6, 0.5); b.box(wood, cx, y0 + 0.74, cz, w - 0.6, 0.06, d - 1.3); break
    case 'pizzaOven': { const g = new THREE.SphereGeometry(Math.min(w, d) * 0.45, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2); g.translate(cx, y0 + 0.9, cz); b.add(mat('#b55a3c'), g); b.box(mat('#8a8279'), cx, y0 + 0.45, cz, w - 0.1, 0.9, d - 0.1); break }
    case 'wineWall': for (let r = 0; r < 6; r++) b.box(mat(r % 2 ? '#5a1f2a' : look.wood), cx, y0 + 0.2 + r * 0.38, cz, w - 0.1, 0.3, d - 0.5); break
    case 'chefTable': b.box(mat('#2f3539'), cx, y0 + 0.9, cz, w - 0.2, 0.08, d - 0.6); for (let i = 0; i < 4; i++) b.box(fabric, x + 0.5 + i * (w - 1) / 3, y0 + 0.4, z + d - 0.2, 0.35, 0.8, 0.35); break
    // --- sport & transport
    case 'treadmill': case 'spinStudio': for (let i = 0; i < 3; i++) { b.box(dark, x + 0.5 + i * (w - 1) / 2, y0 + 0.2, cz, 0.6, 0.3, d - 0.3); b.box(steel, x + 0.5 + i * (w - 1) / 2, y0 + 0.9, z + 0.3, 0.5, 1.1, 0.08) } break
    case 'weights': b.box(dark, cx, y0 + 0.6, cz, w - 0.1, 1.2, d - 0.4); for (let i = 0; i < 4; i++) b.box(steel, x + 0.3 + i * (w - 0.6) / 3, y0 + 0.9, cz + 0.2, 0.25, 0.25, 0.25); break
    case 'courtLines': b.box(mat('#f4f1e6'), cx, y0 + 0.01, z + 0.05, w, 0.01, 0.08); b.box(mat('#f4f1e6'), cx, y0 + 0.01, z + d - 0.05, w, 0.01, 0.08); b.box(mat('#f4f1e6'), x + 0.05, y0 + 0.01, cz, 0.08, 0.01, d); b.box(mat('#f4f1e6'), x + w - 0.05, y0 + 0.01, cz, 0.08, 0.01, d); b.box(mat('#f4f1e6'), cx, y0 + 0.01, cz, 0.08, 0.01, d); break
    case 'bleachers': for (let r = 0; r < 4; r++) b.box(r % 2 ? mat('#3f7bbf') : steel, cx, y0 + 0.2 + r * 0.4, z + d - 0.25 - r * 0.45, w - 0.1, 0.4 + r * 0.8 - r * 0.4, 0.45); break
    case 'scoreboard': b.box(dark, cx, y0 + WALL_H - 0.6, cz, w - 0.4, 0.9, 0.5); b.box(mat('#ffb34a', { emissive: '#ff9a1f', emissiveIntensity: 0.7 }), cx, y0 + WALL_H - 0.6, cz + 0.26, w - 0.7, 0.6, 0.02); break
    case 'checkinDesk': for (let i = 0; i < 4; i++) { b.box(white, x + 0.5 + i, y0 + 0.5, cz, 0.85, 1, d - 0.2); b.box(dark, x + 0.5 + i, y0 + 1.4, cz - 0.3, 0.6, 0.35, 0.05) } break
    case 'scanner': b.box(steel, cx, y0 + 0.45, cz, w - 0.2, 0.9, d - 0.2); b.box(dark, cx, y0 + 1.1, cz, w - 0.1, 1.2, 0.5); break
    case 'gateSeats': for (let i = 0; i < 4; i++) { b.box(mat('#3f566e'), x + 0.5 + i, y0 + 0.25, cz, 0.85, 0.5, d - 0.3) } break
    case 'belt': b.box(dark, cx, y0 + 0.35, cz, w - 0.1, 0.7, d - 0.3); b.box(steel, cx, y0 + 0.72, cz, w - 0.5, 0.04, d - 0.7); break
    case 'departures': b.box(dark, cx, y0 + WALL_H - 0.6, cz, w - 0.3, 0.8, 0.12); b.box(mat('#ffd34a', { emissive: '#ffbf1f', emissiveIntensity: 0.6 }), cx, y0 + WALL_H - 0.6, cz + 0.07, w - 0.5, 0.6, 0.02); break
    case 'loungeBar': b.box(mat('#2f3539'), cx, y0 + 0.55, cz, w - 0.1, 1.1, d - 0.3); b.box(mat('#c9a55a'), cx, y0 + 1.12, cz, w, 0.04, d - 0.2); break
    case 'phoneBooth': b.box(mat('#6c8e86'), cx, y0 + 1.1, cz, w - 0.1, 2.2, d - 0.1); b.box(mat('#cfe3ea', { transparent: true, opacity: 0.4 }), cx, y0 + 1.1, cz + d / 2 - 0.04, w - 0.3, 1.8, 0.03); break
    case 'readingNook': b.box(fabric, cx, y0 + 0.25, cz, w - 0.3, 0.5, d - 0.3); b.box(wood, cx, y0 + 1, z + 0.15, w - 0.1, 2, 0.25); break
    case 'palm': { b.box(mat('#c4a17c'), cx, y0 + 0.25, cz, 0.5, 0.5, 0.5); b.box(mat('#7a5a3e'), cx, y0 + 0.9, cz, 0.1, 1, 0.1); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; b.box(mat('#5f9a52'), cx + Math.cos(a) * 0.35, y0 + 1.45, cz + Math.sin(a) * 0.35, 0.6, 0.05, 0.18) } break }
    case 'rug': b.box(mat('#b5694e'), cx, y0 + 0.015, cz, w - 0.3, 0.03, d - 0.3); b.box(mat('#e8d6b8'), cx, y0 + 0.02, cz, w - 0.9, 0.03, d - 0.9); break
    case 'spotTrack': case 'linear': {
      const along = w >= d
      b.box(dark, cx, ceil - (type === 'linear' ? 0.6 : 0.04), cz, along ? w - 0.2 : 0.08, 0.06, along ? 0.08 : d - 0.2)
      if (type === 'linear') { b.box(dark, x + 0.3, ceil - 0.3, cz, 0.02, 0.6, 0.02); b.box(dark, x + w - 0.3, ceil - 0.3, cz, 0.02, 0.6, 0.02); b.box(glow(), cx, ceil - 0.64, cz, along ? w - 0.3 : 0.05, 0.02, along ? 0.05 : d - 0.3) }
      else for (let i = 0; i < 4; i++) { const t = 0.3 + i * (Math.max(w, d) - 0.6) / 3; const px = along ? x + t : cx, pz = along ? cz : z + t; b.box(dark, px, ceil - 0.2, pz, 0.12, 0.22, 0.12); b.box(glow(), px, ceil - 0.32, pz, 0.08, 0.02, 0.08) }
      break
    }
    default: b.box(white, cx, y0 + 0.4, cz, w - 0.15, 0.8, d - 0.15)
  }
}

export function buildModel(project, { cutLevel = null, context = true, showCeilings = false } = {}) {
  const group = new THREE.Group()
  const { lot } = project
  const b = new Bucket()
  const facadeMat = MATERIALS[project.facade] || MATERIALS.stucco
  const glazed = !!facadeMat.glazed
  const facade = mat(facadeMat.color)
  const paintOf = (room) => {
    const c = new THREE.Color((PAINTS[room?.wall] || PAINTS.chalk).color)
    if ((room?.wallQ ?? 1) === 0) c.lerp(new THREE.Color('#a9a69e'), 0.22)
    return mat('#' + c.getHexString(), (room?.wallQ ?? 1) === 2 ? { roughness: 0.55 } : {})
  }
  const glass = mat('#9cc7da', { transparent: true, opacity: 0.55, roughness: 0.15 })
  const frame = mat('#3b4248')
  const top = cutLevel === null ? project.levels.length - 1 : cutLevel
  const owners = project.levels.map(cellOwners)

  // --- site
  b.box(mat('#d7dccd'), lot.w / 2, -0.06, lot.h / 2, lot.w, 0.12, lot.h)
  if (context) {
    b.box(mat('#bcc4b0'), lot.w / 2, -0.15, lot.h / 2 + 4, lot.w + 60, 0.1, lot.h + 60)
    b.box(mat('#c9c8c0'), lot.w / 2, -0.04, lot.h + 1.25, lot.w + 60, 0.16, 2.5)
    b.box(mat('#5f656b'), lot.w / 2, -0.09, lot.h + 6, lot.w + 60, 0.1, 7)
    for (let x = -28; x < lot.w + 28; x += 4) b.box(mat('#e9e4d0'), x, -0.03, lot.h + 6, 2, 0.02, 0.15)
    b.box(mat('#c9c8c0'), lot.w / 2, -0.04, lot.h + 10.75, lot.w + 60, 0.16, 2.5)
    const r = seeded(lot.w * 31 + lot.h)
    // neighbouring blocks
    for (const side of [-1, 1]) {
      let z = 0
      while (z < lot.h) {
        const d = 6 + Math.floor(r() * 6), w = 7 + Math.floor(r() * 5), hgt = 3.4 + Math.floor(r() * 2) * 3.2
        const x = side < 0 ? -5 - w / 2 : lot.w + 5 + w / 2
        b.box(mat(['#d8d4cb', '#cfcac0', '#c8ccc9', '#ddd6ca'][Math.floor(r() * 4)]), x, hgt / 2, z + d / 2, w, hgt, d)
        z += d + 1
      }
    }
    for (let x = -20; x < lot.w + 20; x += 5 + Math.floor(r() * 3)) tree(b, x, lot.h + 11.2, 0, 0.9 + r() * 0.4)
  }

  const isRoom = (li, x, y) => li >= 0 && li < project.levels.length && owners[li].has(ck(x, y))

  for (let li = 0; li <= top && li < project.levels.length; li++) {
    const level = project.levels[li]
    const y0 = li * LEVEL_HEIGHT
    const cutTop = cutLevel !== null && li === top
    const wallH = cutTop ? 1.25 : WALL_H
    // slabs
    for (const r of level.rooms) {
      const fm = mat((MATERIALS[r.floor] || MATERIALS.vinyl).color)
      for (const q of roomRuns(r)) b.box(fm, q.x + q.w / 2, y0 + 0.1, q.y + q.h / 2, q.w, 0.2, q.h)
    }
    // walls
    const doors = new Set(level.doors), windows = new Set(level.windows)
    const byId = new Map(level.rooms.map(r => [r.id, r]))
    for (const e of wallEdges(level).values()) {
      const cx = (e.x1 + e.x2) / 2, cz = (e.y1 + e.y2) / 2
      const base = y0 + 0.2
      // Each wall is two half-thickness skins: room A's paint on its side, room B's paint (or the facade) on the other.
      const half = WALL_T / 2
      const sideA = paintOf(byId.get(e.a)), sideB = e.exterior ? facade : paintOf(byId.get(e.b))
      const seg = (from, to) => {
        if (to <= from) return
        for (const [mm, sgn] of [[sideA, -1], [sideB, 1]]) {
          const ox = e.nx * sgn * half / 2, oz = e.ny * sgn * half / 2
          b.box(mm, cx + ox, base + (from + to) / 2, cz + oz, e.horiz ? 1 + WALL_T * 0.02 : half, to - from, e.horiz ? half : 1 + WALL_T * 0.02)
        }
      }
      if (doors.has(e.key)) {
        if (wallH > 2.2) seg(2.2, wallH)
        if (e.exterior) {
          const st = project.door || 'standard'
          const dm = st === 'glazed' || st === 'revolving' ? glass : mat((DOORS[st] || DOORS.standard).color)
          if (st === 'revolving') {
            const g = new THREE.CylinderGeometry(0.48, 0.48, 2.3, 10); g.translate(cx, base + 1.15, cz); b.add(glass, g)
            b.box(frame, cx, base + 2.33, cz, 1, 0.06, 1)
          } else {
            b.box(dm, cx, base + 1.1, cz, e.horiz ? 0.9 : 0.05, 2.2, e.horiz ? 0.05 : 0.9)
            if (st !== 'standard') b.box(frame, cx, base + 1.1, cz, e.horiz ? 0.04 : 0.08, 2.2, e.horiz ? 0.08 : 0.04)
          }
        }
      } else if (e.exterior && glazed) {
        seg(0, Math.min(0.15, wallH)); seg(Math.min(wallH, 2.85), wallH)
        if (wallH > 0.15) b.box(glass, cx, base + (0.15 + Math.min(wallH, 2.85)) / 2, cz, e.horiz ? 1 : 0.06, Math.min(wallH, 2.85) - 0.15, e.horiz ? 0.06 : 1)
        b.box(frame, e.x1, base + wallH / 2, e.y1, 0.07, wallH, 0.07)
      } else if (windows.has(e.key)) {
        seg(0, Math.min(0.9, wallH)); seg(Math.min(wallH, 2.3), wallH)
        if (wallH > 0.9) {
          const gh = Math.min(wallH, 2.3) - 0.9
          b.box(glass, cx, base + 0.9 + gh / 2, cz, e.horiz ? 0.92 : 0.05, gh, e.horiz ? 0.05 : 0.92)
          b.box(frame, cx, base + 0.9 + gh / 2, cz, e.horiz ? 0.05 : 0.08, gh, e.horiz ? 0.08 : 0.05)
        }
      } else seg(0, wallH)
      // parapet / roof edge on top of exterior walls with nothing above
      if (e.exterior && !cutTop) {
        const c = { x: e.x1 - (e.nx > 0 ? 1 : 0), y: e.y1 - (e.ny > 0 ? 1 : 0) }
        if (!isRoom(li + 1, c.x, c.y)) b.box(facade, cx, y0 + LEVEL_HEIGHT + 0.25, cz, e.horiz ? 1.02 : WALL_T + 0.02, 0.5, e.horiz ? WALL_T + 0.02 : 1.02)
      }
    }
    // roofs over cells with nothing above
    if (!cutTop || li < top) {
      const sky = new Set()
      for (const it of level.items) if (it.type === 'skylight') {
        const s = itemSize(it); for (let yy = it.y; yy < it.y + s.h; yy++) for (let xx = it.x; xx < it.x + s.w; xx++) sky.add(ck(xx, yy))
      }
      for (const r of level.rooms) for (const k of roomCells(r)) {
        const [x, y] = k.split(':').map(Number)
        if (isRoom(li + 1, x, y)) continue
        b.box(sky.has(ck(x, y)) ? glass : mat('#b7b9b4'), x + 0.5, y0 + LEVEL_HEIGHT + 0.1, y + 0.5, 1.001, 0.2, 1.001)
      }
    }
    // ceilings (only while editing them): a translucent soffit in the finish colour
    if (showCeilings && li === top) {
      for (const room of level.rooms) for (const r of roomRuns(room).map(q => ({ ...q, ceiling: room.ceiling }))) {
        const c = CEILINGS[r.ceiling || 'plain'] || CEILINGS.plain
        const cm = mat(c.color, { transparent: true, opacity: 0.42, depthWrite: false })
        b.box(cm, r.x + r.w / 2, y0 + 0.2 + WALL_H - 0.03, r.y + r.h / 2, r.w - 0.02, 0.05, r.h - 0.02)
        const lines = mat(r.ceiling === 'slats' ? '#8a6440' : r.ceiling === 'exposed' ? '#9aa3a8' : '#d9d2c2')
        if (r.ceiling === 'slats') for (let x = r.x + 0.25; x < r.x + r.w; x += 0.5) b.box(lines, x, y0 + 0.2 + WALL_H - 0.08, r.y + r.h / 2, 0.12, 0.08, r.h - 0.1)
        if (r.ceiling === 'coffered') {
          for (let x = r.x + 1; x < r.x + r.w; x += 1) b.box(lines, x, y0 + 0.2 + WALL_H - 0.1, r.y + r.h / 2, 0.08, 0.1, r.h - 0.1)
          for (let y = r.y + 1; y < r.y + r.h; y += 1) b.box(lines, r.x + r.w / 2, y0 + 0.2 + WALL_H - 0.1, y, r.w - 0.1, 0.1, 0.08)
        }
        if (r.ceiling === 'exposed') for (let y = r.y + 0.8; y < r.y + r.h; y += 1.6) { const g = new THREE.CylinderGeometry(0.12, 0.12, r.w - 0.2, 6); g.rotateZ(Math.PI / 2); g.translate(r.x + r.w / 2, y0 + 0.2 + WALL_H - 0.3, y); b.add(lines, g) }
      }
    }
    // furniture
    for (const it of level.items) {
      const s = itemSize(it)
      furniture(b, it.type, it.x, it.y, s.w, s.h, y0 + (ITEMS[it.type].site ? 0 : 0.2), it.q ?? 1, it.product)
    }
  }
  b.flush(group)
  return group
}

// White massing-model look (presentation model): every material becomes a near-white matte,
// keeping a little of its value so forms still read. Glass stays faintly translucent.
const modelCache = new Map()
export function toModelLook(group) {
  group.traverse(o => {
    if (!o.isMesh) return
    const m = o.material
    if (!modelCache.has(m)) {
      const c = m.color.clone()
      const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
      const v = 0.6 + l * 0.36
      modelCache.set(m, new THREE.MeshStandardMaterial({
        color: new THREE.Color(v, v, v * 0.995), roughness: 0.95, flatShading: true,
        transparent: m.transparent, opacity: m.transparent ? Math.min(0.5, m.opacity) : 1,
      }))
    }
    o.material = modelCache.get(m)
  })
}

export function disposeGroup(group, materials = false) {
  group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (materials && o.material) o.material.dispose() })
}

export function setupLights(scene, project, night = false, cutLevel = null, shadowSize = 2048) {
  scene.add(new THREE.HemisphereLight(night ? '#5a6b8c' : '#f4f7fb', night ? '#2a2620' : '#b2aa95', night ? 0.5 : 1.15))
  const sun = new THREE.DirectionalLight(night ? '#9fb4d8' : '#fff4e2', night ? 0.35 : 2.2)
  if (night) {
    // Real point lights for the brightest fixtures (capped for performance).
    const top = cutLevel ?? project.levels.length - 1
    const fixtures = project.levels.flatMap((l, li) => li > top ? [] : l.items.filter(it => ITEMS[it.type].ceiling).map(it => ({ it, li })))
      .sort((a, b) => ITEMS[b.it.type].light - ITEMS[a.it.type].light).slice(0, 14)
    for (const { it, li } of fixtures) {
      const s = itemSize(it)
      const pl = new THREE.PointLight('#ffd49a', 5 + ITEMS[it.type].light * 0.4, 9, 1.4)
      pl.position.set(it.x + s.w / 2, li * LEVEL_HEIGHT + 2.4, it.y + s.h / 2)
      scene.add(pl)
    }
  }
  const span = Math.max(project.lot.w, project.lot.h) + 20
  sun.position.set(project.lot.w / 2 - span * 0.6, span * 1.1, project.lot.h / 2 + span * 0.35)
  sun.target.position.set(project.lot.w / 2, 0, project.lot.h / 2)
  sun.castShadow = true
  sun.shadow.mapSize.set(shadowSize, shadowSize)
  sun.shadow.radius = 3
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: span * 4 })
  sun.shadow.bias = -0.0008
  scene.add(sun, sun.target)
}

export function frameCamera(camera, project, angle = 0.7, zoom = 1) {
  zoom *= Math.max(1, Math.pow(1.25 / (camera.aspect || 1.5), 0.7))
  const { w, h } = project.lot
  const H = project.levels.length * LEVEL_HEIGHT
  const r = (Math.max(w, h) * 1.15 + H * 0.7 + 6) * zoom
  const target = new THREE.Vector3(w / 2, Math.min(H, 12) * 0.35, h / 2)
  camera.position.set(target.x - Math.sin(angle) * r, target.y + r * 0.72, target.z + Math.cos(angle) * r)
  camera.lookAt(target)
  return target
}

// Renders a one-off JPEG thumbnail for the portfolio.
export function snapshot(project, width = 480, height = 300) {
  try {
    const canvas = document.createElement('canvas')
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(width, height, false)
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 0.92
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#e6ebee')
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.3
    setupLights(scene, project)
    const model = buildModel(project)
    scene.add(model)
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.5, 600)
    frameCamera(camera, project, 0.75)
    renderer.render(scene, camera)
    const url = canvas.toDataURL('image/jpeg', 0.78)
    disposeGroup(model); scene.environment.dispose(); pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss()
    return url
  } catch { return null }
}
