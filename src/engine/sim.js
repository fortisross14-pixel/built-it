import { findPath } from './pathfinding.js'
import { key, tileKey } from './grid.js'

export function seededRandom(seed = 1) {
  let s = seed >>> 0
  return () => {
    s += 0x6D2B79F5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function allObjects(project, type) {
  const out = []
  project.floors.forEach((floor, fi) => {
    floor.objects.forEach((o) => {
      if (!type || o.type === type) out.push({ ...o, floor: fi })
    })
  })
  return out
}

function nearestByPath(project, brief, from, candidates) {
  let best = null
  for (const candidate of candidates) {
    const path = findPath(project, brief, from, candidate)
    if (path && (!best || path.length < best.path.length)) best = { target: candidate, path }
  }
  return best
}

function addPath(heat, path, amount = 1) {
  path?.forEach((p) => {
    const k = key(p.x, p.y, p.floor)
    heat[k] = (heat[k] || 0) + amount
  })
}

function average(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function countTileType(project, type) {
  return project.floors.reduce((sum, floor) => sum + Object.values(floor.tiles).filter((t) => t === type).length, 0)
}

function driveLanePath(project) {
  const floor = project.floors[0] || {tiles:{},objects:[]}
  const drive = Object.entries(floor.tiles).filter(([,t]) => t === 'drive').map(([k]) => {
    const [x,y]=k.split(':').map(Number); return {x,y,floor:0}
  })
  if (!drive.length) return []
  const set = new Set(drive.map(p=>`${p.x}:${p.y}`))
  const neighbors = (p) => [[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy,floor:0})).filter(n=>set.has(`${n.x}:${n.y}`))
  const bfs = (a,b) => {
    if(!a||!b)return []
    const q=[a], came=new Map([[`${a.x}:${a.y}`,null]])
    for(let i=0;i<q.length;i++){
      const cur=q[i], ck=`${cur.x}:${cur.y}`
      if(ck===`${b.x}:${b.y}`)break
      for(const n of neighbors(cur)){
        const nk=`${n.x}:${n.y}`; if(came.has(nk))continue
        came.set(nk,cur); q.push(n)
      }
    }
    const bk=`${b.x}:${b.y}`; if(!came.has(bk))return []
    const out=[]; let cur=b
    while(cur){out.push(cur);cur=came.get(`${cur.x}:${cur.y}`)}
    return out.reverse()
  }
  const nearestDrive = (obj) => obj ? drive.reduce((best,p)=>{
    const d=Math.abs(p.x-obj.x)+Math.abs(p.y-obj.y); return !best||d<best.d?{p,d}:best
  },null)?.p : null
  const xs=drive.map(p=>p.x), ys=drive.map(p=>p.y); const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
  const border = drive.filter(p => p.x===minX || p.y===minY || p.x===maxX || p.y===maxY)
  const order = nearestDrive(floor.objects.find(o=>o.type==='driveOrder')) || drive[0]
  const pickup = nearestDrive(floor.objects.find(o=>o.type==='drivePickup')) || order
  const start = (border.length?border:drive).reduce((best,p)=>{
    const d=Math.abs(p.x-order.x)+Math.abs(p.y-order.y); return !best||d>best.d?{p,d}:best
  },null).p
  const end = (border.length?border:drive).reduce((best,p)=>{
    const d=Math.abs(p.x-pickup.x)+Math.abs(p.y-pickup.y); return !best||d>best.d?{p,d}:best
  },null).p
  const a=bfs(start,order), b=bfs(order,pickup), c=bfs(pickup,end)
  return [...a,...b.slice(1),...c.slice(1)]
}

function countCrossings(project) {
  const floor = project.floors[0]
  let crossings = 0
  for (const [k, type] of Object.entries(floor.tiles)) {
    if (type !== 'path') continue
    const [x, y] = k.split(':').map(Number)
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      if (floor.tiles[tileKey(x+dx,y+dy)] === 'drive') crossings++
    }
  }
  return Math.ceil(crossings / 2)
}

export function validateProject(project, brief) {
  const present = new Set(allObjects(project).map((o) => o.type))
  const missing = brief.required.filter((r) => !present.has(r))
  const hasFloor = project.floors.some((f) => Object.values(f.tiles).some((t) => ['interior','patio','path'].includes(t)))
  if (!hasFloor) missing.unshift('buildable floor')
  if (brief.id === 'drive' && countTileType(project, 'drive') < 32) missing.push('32+ drive-lane cells')
  return { missing, ready: missing.length === 0 }
}

export function runSimulation(project, brief, seed = 42, weather = 'clear') {
  const rand = seededRandom(seed)
  const validation = validateProject(project, brief)
  const entrances = allObjects(project, 'entrance')
  const registers = allObjects(project, 'register')
  const pickups = allObjects(project, 'pickup')
  const preps = allObjects(project, 'prep')
  const tables = allObjects(project, 'table')
  const toilets = allObjects(project, 'toilet')
  const windows = allObjects(project, 'window')
  const driveOrders = allObjects(project, 'driveOrder')
  const drivePickups = allObjects(project, 'drivePickup')

  const circulation = {}
  const congestion = {}
  const daylight = {}
  const utilization = {}
  const animatedRoutes = []
  const routeLengths = []
  let failedRoutes = 0
  let dineIn = 0
  let seated = 0
  let served = 0

  const arrivals = brief.arrivals
  const walkInArrivals = brief.id === 'drive' ? Math.round(arrivals * 0.46) : arrivals

  for (let i = 0; i < walkInArrivals; i++) {
    const entrance = entrances[Math.floor(rand() * Math.max(1, entrances.length))]
    if (!entrance) { failedRoutes++; continue }
    const itinerary = [entrance]
    let cur = entrance
    const reg = nearestByPath(project, brief, cur, registers)
    if (!reg) { failedRoutes++; continue }
    itinerary.push(...reg.path.slice(1)); cur = reg.target
    const pickup = nearestByPath(project, brief, cur, pickups)
    if (!pickup) { failedRoutes++; continue }
    itinerary.push(...pickup.path.slice(1)); cur = pickup.target

    const wantsSeat = brief.id === 'coffee' ? rand() > 0.44 : rand() > 0.60
    if (wantsSeat) {
      dineIn++
      const table = nearestByPath(project, brief, cur, tables)
      if (table) {
        seated++
        itinerary.push(...table.path.slice(1)); cur = table.target
        utilization[key(table.target.x, table.target.y, table.target.floor)] = (utilization[key(table.target.x, table.target.y, table.target.floor)] || 0) + 1
      }
    }
    if (toilets.length && rand() < 0.16) {
      const toilet = nearestByPath(project, brief, cur, toilets)
      if (toilet) { itinerary.push(...toilet.path.slice(1)); cur = toilet.target }
    }
    const exit = nearestByPath(project, brief, cur, entrances)
    if (!exit) { failedRoutes++; continue }
    itinerary.push(...exit.path.slice(1))
    addPath(circulation, itinerary, 1)
    routeLengths.push(itinerary.length)
    served++
    if (animatedRoutes.length < 80) animatedRoutes.push({ route: itinerary, offset: rand() * 18, speed: 0.8 + rand() * 0.5 })
  }

  // Staff workflow: kitchen -> register -> pickup. This intentionally magnifies poor adjacency.
  const staffTrips = []
  for (const prep of preps) {
    for (const service of [...registers, ...pickups]) {
      const p = findPath(project, brief, prep, service)
      if (p) {
        staffTrips.push(p.length)
        addPath(circulation, p, 18)
      }
    }
  }

  // Queue pressure is spatially placed on the register/pickup tiles and nearby shared routes.
  const registerLoad = Math.max(1, walkInArrivals / Math.max(1, registers.length))
  registers.forEach((r) => {
    const k = key(r.x, r.y, r.floor)
    congestion[k] = registerLoad
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nk = key(r.x+dx, r.y+dy, r.floor)
      congestion[nk] = (congestion[nk] || 0) + registerLoad * 0.55
    }
  })
  pickups.forEach((r) => {
    const k = key(r.x, r.y, r.floor)
    congestion[k] = (congestion[k] || 0) + walkInArrivals / Math.max(1, pickups.length) * 0.5
  })

  // Simple daylight field: windows contribute by Manhattan distance on same floor.
  project.floors.forEach((floor, fi) => {
    Object.entries(floor.tiles).forEach(([tk, type]) => {
      if (!['interior','patio'].includes(type)) return
      const [x,y] = tk.split(':').map(Number)
      let value = type === 'patio' ? 1 : 0.08
      for (const w of windows.filter((w) => w.floor === fi)) {
        const d = Math.abs(w.x-x)+Math.abs(w.y-y)
        value += Math.max(0, 1 - d/8) * 0.5
      }
      daylight[key(x,y,fi)] = Math.min(1, value)
    })
  })

  // Drive-through site flow. Lane length and pedestrian adjacency are the meaningful variables.
  const driveTiles = countTileType(project, 'drive')
  const crossings = countCrossings(project)
  const vehicleArrivals = brief.id === 'drive' ? arrivals - walkInArrivals : 0
  let vehicleServed = 0
  let vehicleOverflow = 0
  let vehicleWait = 0
  if (brief.id === 'drive' && driveOrders.length && drivePickups.length) {
    const stackingCapacity = Math.max(1, Math.floor(driveTiles / 12))
    vehicleOverflow = Math.max(0, vehicleArrivals - stackingCapacity * 8)
    vehicleServed = Math.max(0, vehicleArrivals - Math.ceil(vehicleOverflow * 0.65))
    vehicleWait = 3.2 + Math.max(0, 8 - stackingCapacity) * 0.34 + crossings * 0.28
    served += vehicleServed
  }

  const entranceCongestion = entrances.reduce((sum, e) => sum + (congestion[key(e.x,e.y,e.floor)] || 0), 0)
  const cellMeters = brief.cellMeters || 1
  const avgRoute = average(routeLengths) * cellMeters
  const staffDistance = average(staffTrips) * cellMeters
  const seats = tables.length * 4
  const seatUtil = seats ? Math.min(1, seated / Math.max(1, seats * 3)) : 0
  const throughput = Math.round((served / Math.max(1, arrivals)) * 100)
  const avgWait = Math.max(0.8, 2.4 + registerLoad / 38 + entranceCongestion / 90 + staffDistance / 30)
  const areaCells = project.floors.reduce((sum, floor) => sum + Object.values(floor.tiles).filter((t) => ['interior','patio'].includes(t)).length, 0)
  const area = areaCells * cellMeters * cellMeters
  const buildCost = Math.round(area * 3900 + allObjects(project).length * 1800 + countTileType(project,'drive') * cellMeters * cellMeters * 575)
  const windowRatio = windows.length / Math.max(1, area / 12)
  const daylightScore = Math.round(Math.min(100, 42 + windowRatio * 34 + countTileType(project,'patio') * 1.5))
  const routeDirectness = Math.max(0, Math.round(100 - Math.max(0, avgRoute - 16) * 2.1))

  const findings = []
  if (!validation.ready) findings.push({ severity: 'critical', title: 'Brief incomplete', text: `Missing: ${validation.missing.join(', ')}.` })
  if (entranceCongestion > 35) findings.push({ severity: 'warning', title: 'Entrance pressure', text: 'The ordering queue overlaps the arrival zone. Move the register deeper into the plan or create more approach space.' })
  else findings.push({ severity: 'good', title: 'Clear arrival', text: 'Customers can enter without immediately colliding with the main queue.' })
  if (staffDistance > 14) findings.push({ severity: 'warning', title: 'Long staff loop', text: `Prep-to-service travel averages ${staffDistance.toFixed(1)} m. Bringing prep, register and pickup closer should improve service.` })
  else if (staffTrips.length) findings.push({ severity: 'good', title: 'Compact service core', text: `Prep-to-service travel averages ${staffDistance.toFixed(1)} m.` })
  if (dineIn > 0 && seated / dineIn < 0.82) findings.push({ severity: 'warning', title: 'Seat pressure', text: `${Math.round((1-seated/Math.max(1,dineIn))*100)}% of dine-in demand could not reach or secure a table.` })
  else if (tables.length) findings.push({ severity: 'good', title: 'Seating works', text: 'The seating supply and routes absorb the current demand profile.' })
  if (daylightScore < 58) findings.push({ severity: 'info', title: 'Dim interior', text: 'Few seats benefit from windows or outdoor exposure. Add glazing or pull seating toward the perimeter.' })
  else findings.push({ severity: 'good', title: 'Daylight character', text: 'Windows and outdoor space give the project a strong daylight profile.' })
  if (brief.id === 'drive') {
    if (vehicleOverflow > 0) findings.push({ severity: 'warning', title: 'Drive-through overflow', text: `${vehicleOverflow} peak vehicles exceed comfortable stacking. Extend the lane before the order point.` })
    else findings.push({ severity: 'good', title: 'Vehicle stacking', text: 'The drive lane can absorb the modeled dinner peak without spilling back.' })
    if (crossings > 2) findings.push({ severity: 'warning', title: 'Pedestrian / vehicle conflict', text: `${crossings} path-to-lane adjacency points create a slower and less comfortable site flow.` })
  }
  if (failedRoutes) findings.push({ severity: 'critical', title: 'Broken routes', text: `${failedRoutes} customer itineraries failed because a required destination could not be reached.` })

  return {
    id: `${Date.now()}-${seed}`,
    seed,
    weather,
    validation,
    metrics: {
      arrivals,
      served,
      throughput,
      avgWait: Number(avgWait.toFixed(1)),
      avgRoute: Number(avgRoute.toFixed(1)),
      staffDistance: Number(staffDistance.toFixed(1)),
      seats,
      seatUtil: Math.round(seatUtil * 100),
      daylight: daylightScore,
      routeDirectness,
      buildCost,
      failedRoutes,
      vehicleServed,
      vehicleOverflow,
      vehicleWait: Number(vehicleWait.toFixed(1)),
      crossings,
    },
    heatmaps: { circulation, congestion, daylight, utilization },
    findings,
    animatedRoutes,
    vehicleRoute: driveLanePath(project),
  }
}
