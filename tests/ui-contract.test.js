import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
const cssSource = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const catalogSource = await readFile(new URL('../src/game/catalog.js', import.meta.url), 'utf8')

test('site SVG keeps explicit pixel dimensions and non-circular sizing', () => {
  assert.match(appSource, /className="site-svg" width=\{width\} height=\{height\}/)
  assert.match(appSource, /className="site-frame" style=\{\{width,height\}\}/)
  assert.match(cssSource, /\.site-svg\{[^}]*width:100%;height:100%;max-width:none;max-height:none/)
})

test('editor exposes plan section and isometric views', () => {
  assert.match(appSource, /setView\('plan'\)/)
  assert.match(appSource, /setView\('section'\)/)
  assert.match(appSource, /setView\('iso'\)/)
  assert.match(appSource, /function IsometricView/)
})

test('touch-first build drawer and gesture tools are present', () => {
  assert.match(appSource, /function BuildDrawer/)
  assert.match(appSource, /kind:'wall'/)
  assert.match(appSource, /kind:'room'/)
  assert.match(appSource, /kind:'fill'/)
  assert.match(appSource, /kind:'area'/)
  assert.match(cssSource, /touch-action:none/)
})

test('POC uses higher resolution grids and real furniture footprints', () => {
  assert.match(catalogSource, /size:\{cols:36,rows:28\}/)
  assert.match(catalogSource, /size:\{cols:48,rows:32\}/)
  assert.match(catalogSource, /table: \{[^\n]*w:5, h:4/)
})
