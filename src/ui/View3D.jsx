import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LEVEL_HEIGHT } from '../game/catalog.js'
import { buildModel, disposeGroup, frameCamera, setupLights } from './scene.js'

// Interactive low-poly 3D view. Drag to orbit, pinch to zoom, two fingers to pan.
// With onTap, a quick tap picks a point on the floor of `pickLevel` and reports the cell.
export default function View3D({
  project, cutLevel = null, autoRotate = false, interactive = true, className = '', zoom = 1,
  night = false, pickLevel = null, onTap, onHover, highlights = [],
}) {
  const host = useRef(null)
  const state = useRef(null)
  const cbs = useRef({})
  cbs.current = { onTap, onHover, pickLevel }

  useEffect(() => {
    const el = host.current
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
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
    const s = { renderer, scene, camera, controls, model: null, framedFor: null, userMoved: false, overlay }
    state.current = s
    controls.addEventListener('start', () => { s.userMoved = true })

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (s.project && !s.userMoved) s.controls.target.copy(frameCamera(camera, s.project, 0.7, s.zoom))
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

    let raf
    const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop) }
    loop()
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose()
      dom.removeEventListener('pointerdown', onDown); dom.removeEventListener('pointerup', onUp)
      dom.removeEventListener('pointermove', onMove); dom.removeEventListener('pointerleave', onLeave)
      if (s.model) disposeGroup(s.model)
      disposeGroup(overlay)
      renderer.dispose(); renderer.domElement.remove()
      state.current = null
    }
  }, [])

  useEffect(() => {
    const s = state.current
    if (!s) return
    s.controls.autoRotate = autoRotate
    s.controls.enabled = interactive
  }, [autoRotate, interactive])

  useEffect(() => {
    const s = state.current
    if (!s) return
    if (s.model) disposeGroup(s.model)
    s.scene.clear()
    setupLights(s.scene, project, night, cutLevel)
    s.model = buildModel(project, { cutLevel })
    s.scene.add(s.model, s.overlay)
    s.project = project; s.zoom = zoom
    const key = `${project.lot.w}x${project.lot.h}:${project.levels.length}`
    if (s.framedFor !== key) {
      const target = frameCamera(s.camera, project, 0.7, zoom)
      s.controls.target.copy(target)
      s.framedFor = key
    }
  }, [project, cutLevel, night])

  // Selection / hover highlights: translucent boxes on the floor (or ceiling).
  useEffect(() => {
    const s = state.current
    if (!s) return
    disposeGroup(s.overlay)
    s.overlay.clear()
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
  }, [highlights])

  return <div ref={host} className={`view3d ${night ? 'night' : ''} ${className}`} />
}
