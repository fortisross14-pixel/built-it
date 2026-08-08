import { edgeKey, inBounds, isWalkableTile, key, tileKey } from './grid.js'

function objectBlocks() {
  // POC service objects expose a navigable interaction point on their own tile.
  // Larger/full-game footprints will route agents to explicit access nodes instead.
  return false
}

export function buildNav(project, brief) {
  const blocked = new Set()
  const stairs = new Map()

  project.floors.forEach((floor, fi) => {
    floor.objects.forEach((o) => {
      if (objectBlocks(o)) blocked.add(key(o.x, o.y, fi))
      if (o.type === 'stairs') stairs.set(key(o.x, o.y, fi), o)
    })
  })

  const passable = (x, y, f) => {
    if (!inBounds(x, y, brief.size.cols, brief.size.rows)) return false
    const type = project.floors[f]?.tiles?.[tileKey(x, y)]
    return isWalkableTile(type) && !blocked.has(key(x, y, f))
  }

  const neighbors = (node) => {
    const out = []
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
    for (const [dx, dy] of dirs) {
      const nx = node.x + dx
      const ny = node.y + dy
      if (!passable(nx, ny, node.floor)) continue
      const wall = edgeKey(node.x, node.y, nx, ny)
      if (project.floors[node.floor]?.walls?.[wall]) continue
      out.push({ x: nx, y: ny, floor: node.floor })
    }
    const here = key(node.x, node.y, node.floor)
    if (stairs.has(here)) {
      const otherFloor = node.floor === 0 ? 1 : 0
      if (stairs.has(key(node.x, node.y, otherFloor)) && passable(node.x, node.y, otherFloor)) {
        out.push({ x: node.x, y: node.y, floor: otherFloor })
      }
    }
    return out
  }

  return { passable, neighbors }
}

export function findPath(project, brief, start, goal) {
  if (!start || !goal) return null
  const nav = buildNav(project, brief)
  if (!nav.passable(start.x, start.y, start.floor) || !nav.passable(goal.x, goal.y, goal.floor)) return null

  const startK = key(start.x, start.y, start.floor)
  const goalK = key(goal.x, goal.y, goal.floor)
  const queue = [start]
  const came = new Map([[startK, null]])

  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi]
    const ck = key(cur.x, cur.y, cur.floor)
    if (ck === goalK) break
    for (const n of nav.neighbors(cur)) {
      const nk = key(n.x, n.y, n.floor)
      if (came.has(nk)) continue
      came.set(nk, cur)
      queue.push(n)
    }
  }

  if (!came.has(goalK)) return null
  const path = []
  let cur = goal
  while (cur) {
    path.push(cur)
    cur = came.get(key(cur.x, cur.y, cur.floor))
  }
  return path.reverse()
}
