import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { settings } from './fx.js'
import { LEVEL_HEIGHT } from '../game/catalog.js'
import { buildModel, disposeGroup, frameCamera, setupLights, toModelLook } from './scene.js'

// Interactive low-poly 3D view. Drag to orbit, pinch to zoom, two fingers to pan.
// With onTap, a quick tap picks a point on the floor of `pickLevel` and reports the cell.
export default function View3D({
  project, cutLevel = null, autoRotate = false, interactive = true, className = '', zoom = 1,
  night = false, pickLevel = null, onTap, onHover, highlights = [], pulse = null, focusLevel = null, showCeilings = false, look = 'color',
}) {
  const host = useRef(null)
  const state = useRef(null)
  const cbs = useRef({})
  cbs.current = { onTap, onHover, pickLevel }

  useEffect(() => {
    const el = host.current
    // Device-appropriate quality (build-mobile-threejs-games skill).
    const lowEnd = (navigator.hardwareConcurrency || 4) <= 4 || matchMedia('(pointer: coarse)').matches
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowEnd ? 1.5 : 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1.05
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 800)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.maxPolarAngle = Math.PI * 0.47
    controls.minDistance = 4
    controls.maxDistance = 220
    controls.enabled = interactive
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 0.6
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
    const overlay = new THREE.Group()
    const s = { renderer, scene, camera, controls, model: null, framedFor: null, userMoved: false, overlay, lowEnd, dirty: 2, focusY: null, pulses: [] }
    s.invalidate = () => { s.dirty = Math.max(s.dirty, 2) }
    state.current = s
    controls.addEventListener('start', () => { s.userMoved = true })
    controls.addEventListener('change', s.invalidate)

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (s.project && !s.userMoved) s.controls.target.copy(frameCamera(camera, s.project, 0.7, s.zoom))
      s.invalidate()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // Picking: ray against the floor plane of the active level.
    const ray = new THREE.Raycaster()
    const pick = (e) => {
      const li = cbs.current.pickLevel
      if (li === null || li === undefined) return null
      const r = renderer.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(li * LEVEL_HEIGHT + 0.2))
      const hit = new THREE.Vector3()
      if (!ray.ray.intersectPlane(plane, hit)) return null
      return { wx: hit.x, wy: hit.z, x: Math.floor(hit.x), y: Math.floor(hit.z) }
    }
    let down = null
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), n: (down?.n || 0) + 1 } }
    const onUp = (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 450 && e.isPrimary) {
        const p = pick(e)
        if (p) cbs.current.onTap?.(p)
      }
      down = null
    }
    const onMove = (e) => { if (e.pointerType === 'mouse' && !down) cbs.current.onHover?.(pick(e)) }
    const onLeave = () => cbs.current.onHover?.(null)
    const dom = renderer.domElement
    dom.addEventListener('pointerdown', onDown)
    dom.addEventListener('pointerup', onUp)
    dom.addEventListener('pointermove', onMove)
    dom.addEventListener('pointerleave', onLeave)

    // Render on demand: only when the camera, scene or an animation changed. Stop entirely when
    // the tab is hidden or the canvas is offscreen (optimize-web-animations skill).
    let raf = 0, last = performance.now(), visible = true
    const loop = (now) => {
      raf = 0
      if (!visible || document.hidden) return
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const moved = controls.update(dt)
      if (s.focusY !== null) {
        const dy = s.focusY - controls.target.y
        if (Math.abs(dy) > 0.005) {
          const step = dy * (1 - Math.exp(-8 * dt))
          controls.target.y += step; camera.position.y += step
          s.invalidate()
        } else s.focusY = null
      }
      if (s.pulses.length) {
        for (const p of [...s.pulses]) {
          p.t += dt / 0.5
          const k = Math.min(1, p.t), e = 1 - Math.pow(1 - k, 3)
          p.mesh.scale.set(1 + e * 0.6, 1, 1 + e * 0.6)
          p.mesh.material.opacity = 0.7 * (1 - k)
          if (k >= 1) { overlay.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); s.pulses.splice(s.pulses.indexOf(p), 1) }
        }
        s.invalidate()
      }
      if (moved || controls.autoRotate || s.dirty > 0) {
        renderer.render(scene, camera)
        s.dirty = Math.max(0, s.dirty - 1)
      }
      raf = requestAnimationFrame(loop)
    }
    const wake = () => { if (!raf && visible && !document.hidden) { last = performance.now(); s.invalidate(); raf = requestAnimationFrame(loop) } }
    s.wake = wake
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; wake() }, { threshold: 0.01 })
    io.observe(el)
    document.addEventListener('visibilitychange', wake)
    wake()
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('visibilitychange', wake)
      ro.disconnect(); controls.dispose(); envTex.dispose(); pmrem.dispose()
      dom.removeEventListener('pointerdown', onDown); dom.removeEventListener('pointerup', onUp)
      dom.removeEventListener('pointermove', onMove); dom.removeEventListener('pointerleave', onLeave)
      if (s.model) disposeGroup(s.model)
      disposeGroup(overlay, true)
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove()
      state.current = null
    }
  }, [])

  useEffect(() => {
    const s = state.current
    if (!s) return
    s.controls.autoRotate = autoRotate && !settings.reduceMotion
    s.controls.enabled = interactive
    s.wake()
  }, [autoRotate, interactive])

  useEffect(() => {
    const s = state.current
    if (!s) return
    if (s.model) disposeGroup(s.model)
    s.scene.clear()
    setupLights(s.scene, project, night, cutLevel, s.lowEnd ? 1024 : 2048)
    s.scene.environmentIntensity = night ? 0.06 : 0.16
    s.model = buildModel(project, { cutLevel, showCeilings })
    if (look === 'model') toModelLook(s.model)
    s.scene.add(s.model, s.overlay)
    s.project = project; s.zoom = zoom
    const key = `${project.lot.w}x${project.lot.h}:${project.levels.length}`
    if (s.framedFor !== key) {
      const target = frameCamera(s.camera, project, 0.7, zoom)
      s.controls.target.copy(target)
      s.framedFor = key
    }
    s.invalidate(); s.wake()
  }, [project, cutLevel, night, showCeilings, look])

  // Glide the orbit target to the active level instead of snapping (camera-systems skill).
  useEffect(() => {
    const s = state.current
    if (!s || focusLevel === null) return
    s.focusY = focusLevel * LEVEL_HEIGHT + 1
    if (settings.reduceMotion) { const dy = s.focusY - s.controls.target.y; s.controls.target.y += dy; s.camera.position.y += dy; s.focusY = null }
    s.invalidate(); s.wake()
  }, [focusLevel])

  // A short expanding ring where something was just placed (game-feel: medium tier, no shake).
  useEffect(() => {
    const s = state.current
    if (!s || !pulse || settings.reduceMotion) return
    const geo = new THREE.RingGeometry(0.45, 0.6, 24)
    geo.rotateX(-Math.PI / 2)
    const m = new THREE.MeshBasicMaterial({ color: '#7cc4ff', transparent: true, opacity: 0.7, depthTest: false, side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(geo, m)
    mesh.renderOrder = 12
    mesh.position.set(pulse.x, pulse.li * LEVEL_HEIGHT + (pulse.ceiling ? LEVEL_HEIGHT - 0.3 : 0.26), pulse.y)
    const sz = Math.max(pulse.w || 1, pulse.h || 1)
    mesh.scale.set(sz, 1, sz)
    s.overlay.add(mesh)
    s.pulses.push({ mesh, t: 0 })
    s.wake()
  }, [pulse])

  // Selection / hover highlights: translucent boxes on the floor (or ceiling).
  useEffect(() => {
    const s = state.current
    if (!s) return
    for (const c of [...s.overlay.children]) {
      if (s.pulses.some(p => p.mesh === c)) continue
      s.overlay.remove(c); c.geometry?.dispose(); c.material?.dispose()
    }
    for (const h of highlights) {
      const y = h.li * LEVEL_HEIGHT + (h.ceiling ? LEVEL_HEIGHT - 0.25 : 0.24)
      const geo = new THREE.BoxGeometry(h.w, h.ceiling ? 0.06 : 0.04, h.h)
      const m = new THREE.MeshBasicMaterial({ color: h.bad ? '#f0605a' : '#3ea6ff', transparent: true, opacity: h.soft ? 0.22 : 0.45, depthTest: false })
      const mesh = new THREE.Mesh(geo, m)
      mesh.renderOrder = 10
      mesh.position.set(h.x + h.w / 2, y, h.y + h.h / 2)
      s.overlay.add(mesh)
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: h.bad ? '#f0605a' : '#3ea6ff', depthTest: false }))
      edges.position.copy(mesh.position); edges.renderOrder = 11
      s.overlay.add(edges)
    }
    s.invalidate(); s.wake()
  }, [highlights])

  return <div ref={host} className={`view3d ${night ? 'night' : ''} look-${look} ${className}`} />
}
