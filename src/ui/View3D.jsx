import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildModel, disposeGroup, frameCamera, setupLights } from './scene.js'

// Interactive low-poly 3D view. Orbit with one finger, pinch to zoom, two fingers to pan.
export default function View3D({ project, cutLevel = null, autoRotate = false, interactive = true, className = '', zoom = 1 }) {
  const host = useRef(null)
  const state = useRef(null)

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
    controls.minDistance = 6
    controls.maxDistance = 220
    controls.enabled = interactive
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 0.6
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (state.current?.project && !state.current.userMoved) {
        const t = frameCamera(camera, state.current.project, 0.7, state.current.zoom)
        controls.target.copy(t)
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    let raf
    const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop) }
    loop()
    state.current = { renderer, scene, camera, controls, model: null, framedFor: null, userMoved: false }
    controls.addEventListener('start', () => { if (state.current) state.current.userMoved = true })
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose()
      if (state.current.model) disposeGroup(state.current.model)
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
    if (s.model) { s.scene.remove(s.model); disposeGroup(s.model) }
    s.scene.clear()
    setupLights(s.scene, project)
    s.model = buildModel(project, { cutLevel })
    s.scene.add(s.model)
    s.project = project; s.zoom = zoom
    const key = `${project.lot.w}x${project.lot.h}:${project.levels.length}`
    if (s.framedFor !== key) {
      const target = frameCamera(s.camera, project, 0.7, zoom)
      s.controls.target.copy(target)
      s.framedFor = key
    }
  }, [project, cutLevel])

  return <div ref={host} className={`view3d ${className}`} />
}
