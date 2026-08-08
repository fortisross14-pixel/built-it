import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
const cssSource = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

test('site SVG has explicit pixel dimensions as well as a viewBox', () => {
  assert.match(appSource, /className="site-svg" width=\{width\} height=\{height\}/)
  assert.match(appSource, /style=\{\{width, height\}\}/)
})

test('canvas sizing does not depend on a circular max-width percentage', () => {
  assert.match(cssSource, /\.site-svg\{[^}]*width:100%;height:100%;max-width:none;max-height:none/)
  assert.match(cssSource, /\.canvas-wrap\{[^}]*display:block;min-width:0;min-height:0/)
})
