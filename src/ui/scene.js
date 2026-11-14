// Builds a low-poly Three.js model of a project: slabs, walls with openings,
// roofs, furniture and a little bit of street context.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ITEMS, LEVEL_HEIGHT, MATERIALS, PAINTS, itemSize } from '../game/catalog.js'
import { cellOwners, ck, wallEdges } from '../engine/plan.js'

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

function furniture(b, type, x, z, w, d, y0, quality = 1) {
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
    case 'rack':
      b.box(steel, cx, y0 + 1.5, cz, w - 0.2, 0.05, 0.05)
      for (let i = 0; i < 5; i++) b.box(mat(['#c96f53', '#e2c290', '#4f6d7a', '#9a8fb8', '#e8e3da'][i]), x + 0.25 + i * (w - 0.5) / 4, y0 + 1.05, cz, 0.14, 0.85, 0.5)
      break
    case 'display':
      b.box(white, cx, y0 + 0.45, cz, w - 0.15, 0.9, d - 0.3)
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
    default: b.box(white, cx, y0 + 0.4, cz, w - 0.15, 0.8, d - 0.15)
  }
}

export function buildModel(project, { cutLevel = null, context = true } = {}) {
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
      b.box(fm, r.x + r.w / 2, y0 + 0.1, r.y + r.h / 2, r.w, 0.2, r.h)
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
        if (e.exterior) b.box(frame, cx, base + 1.1, cz, e.horiz ? 0.9 : 0.05, 2.2, e.horiz ? 0.05 : 0.9)
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
      for (const r of level.rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
        if (isRoom(li + 1, x, y)) continue
        b.box(sky.has(ck(x, y)) ? glass : mat('#b7b9b4'), x + 0.5, y0 + LEVEL_HEIGHT + 0.1, y + 0.5, 1.001, 0.2, 1.001)
      }
    }
    // furniture
    for (const it of level.items) {
      const s = itemSize(it)
      furniture(b, it.type, it.x, it.y, s.w, s.h, y0 + (ITEMS[it.type].site ? 0 : 0.2), it.q ?? 1)
    }
  }
  b.flush(group)
  return group
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
