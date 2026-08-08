import test from 'node:test'
import assert from 'node:assert/strict'
import { BRIEFS } from '../src/game/catalog.js'
import { findPath } from '../src/engine/pathfinding.js'
import { runSimulation, seededRandom } from '../src/engine/sim.js'

function coffeeProject(registerX = 3) {
  const tiles = {}
  for (let y=2;y<=10;y++) for (let x=2;x<=14;x++) tiles[`${x}:${y}`] = 'interior'
  return {
    floors: [
      { tiles, walls:{}, objects:[
        {id:'e',type:'entrance',x:2,y:6},
        {id:'r',type:'register',x:registerX,y:6},
        {id:'p',type:'pickup',x:8,y:5},
        {id:'k',type:'prep',x:9,y:5},
        {id:'t1',type:'table',x:11,y:4},
        {id:'t2',type:'table',x:12,y:8},
        {id:'wc',type:'toilet',x:13,y:9},
        {id:'w',type:'trash',x:10,y:9},
        {id:'win',type:'window',x:12,y:2}
      ]},
      { tiles:{}, walls:{}, objects:[] }
    ]
  }
}

test('seeded random is deterministic', () => {
  const a = seededRandom(77), b = seededRandom(77)
  assert.deepEqual([a(),a(),a()], [b(),b(),b()])
})

test('pathfinding finds interior route', () => {
  const p = coffeeProject(5)
  const path = findPath(p, BRIEFS.coffee, {x:2,y:6,floor:0}, {x:7,y:6,floor:0})
  assert.ok(path)
  assert.ok(path.length >= 6)
})

test('same design + seed yields same metrics', () => {
  const p = coffeeProject(5)
  const a = runSimulation(p, BRIEFS.coffee, 123)
  const b = runSimulation(p, BRIEFS.coffee, 123)
  assert.deepEqual(a.metrics, b.metrics)
})

test('register beside entrance produces at least as much entrance pressure as deeper register', () => {
  const near = runSimulation(coffeeProject(3), BRIEFS.coffee, 42)
  const deep = runSimulation(coffeeProject(7), BRIEFS.coffee, 42)
  const nearWarn = near.findings.some(f => f.title === 'Entrance pressure')
  const deepWarn = deep.findings.some(f => f.title === 'Entrance pressure')
  assert.ok(nearWarn || !deepWarn)
})

test('stairs connect two floors', () => {
  const p = coffeeProject(5)
  p.floors[1].tiles['5:6'] = 'interior'
  p.floors[0].objects.push({id:'s0',type:'stairs',x:5,y:6})
  p.floors[1].objects.push({id:'s1',type:'stairs',x:5,y:6})
  const path = findPath(p, BRIEFS.coffee, {x:4,y:6,floor:0}, {x:5,y:6,floor:1})
  assert.ok(path)
  assert.equal(path.at(-1).floor, 1)
})

test('drive-through simulation measures lane capacity and returns a vehicle route', () => {
  const tiles = {}
  for (let y=4;y<=10;y++) for (let x=7;x<=15;x++) tiles[`${x}:${y}`] = 'interior'
  for (let x=2;x<=20;x++) tiles[`${x}:2`] = 'drive'
  for (let y=2;y<=12;y++) tiles[`20:${y}`] = 'drive'
  for (let x=8;x<=20;x++) tiles[`${x}:12`] = 'drive'
  const p={floors:[{tiles,walls:{},objects:[
    {type:'entrance',x:7,y:8},{type:'register',x:9,y:7},{type:'pickup',x:11,y:7},{type:'prep',x:12,y:7},
    {type:'table',x:9,y:5},{type:'toilet',x:14,y:9},{type:'driveOrder',x:17,y:2},{type:'drivePickup',x:15,y:4}
  ]},{tiles:{},walls:{},objects:[]}]}
  const r=runSimulation(p,BRIEFS.drive,42)
  assert.ok(r.vehicleRoute.length >= 8)
  assert.ok(r.metrics.vehicleWait > 0)
})
