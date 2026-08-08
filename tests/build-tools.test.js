import test from 'node:test'
import assert from 'node:assert/strict'
import { applyWallSegment, buildRectWalls, floodEnclosed, rectangleCells, wallSegmentEdges } from '../src/engine/buildTools.js'
import { edgeKey } from '../src/engine/grid.js'

function floor(){return {tiles:{},walls:{},objects:[],finishes:{},wallFinishes:{}}}

test('wall line creates every barrier between start and end in one gesture',()=>{
  const f=floor()
  const end=applyWallSegment(f,{x:2,y:3},{x:8,y:4},12,10,'brick-red')
  assert.deepEqual(end,{x:8,y:3})
  assert.equal(Object.keys(f.walls).length,6)
  assert.ok(Object.values(f.wallFinishes).every(v=>v==='brick-red'))
})

test('rectangular room is recognized as enclosed and can be flood filled',()=>{
  const f=floor()
  buildRectWalls(f,2,2,8,7,12,10,'plaster-ivory')
  const result=floodEnclosed(f,4,4,12,10)
  assert.equal(result.closed,true)
  assert.equal(result.cells.length,6*5)
})

test('open wall loop refuses floor fill',()=>{
  const f=floor()
  applyWallSegment(f,{x:2,y:2},{x:8,y:2},12,10)
  applyWallSegment(f,{x:2,y:2},{x:2,y:7},12,10)
  const result=floodEnclosed(f,4,4,12,10)
  assert.equal(result.closed,false)
})

test('boundary wall can close a room against the site edge',()=>{
  const f=floor()
  buildRectWalls(f,0,0,5,5,12,10)
  const result=floodEnclosed(f,2,2,12,10)
  assert.equal(result.closed,true)
})

test('area drag returns all cells in a rectangle',()=>{
  const cells=rectangleCells({x:3,y:2},{x:6,y:4},10,10)
  assert.equal(cells.length,12)
})
