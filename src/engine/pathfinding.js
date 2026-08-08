import { edgeKey, inBounds, isWalkableTile, key, tileKey } from './grid.js'
import { OBJECTS } from '../game/catalog.js'

export function buildNav(project, brief) {
  const blocked = new Set()
  const stairs = new Map()

  project.floors.forEach((floor, fi) => {
    floor.objects.forEach((o) => {
      const def=OBJECTS[o.type]||{w:1,h:1}
      if (!def.walkable) {
        for(let oy=0;oy<(def.h||1);oy++) for(let ox=0;ox<(def.w||1);ox++) {
          // The anchor cell is the interaction/access node; the rest of the footprint occupies real space.
          if(ox===0&&oy===0) continue
          blocked.add(key(o.x+ox,o.y+oy,fi))
        }
      }
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
      const nx = node.x + dx, ny = node.y + dy
      if (!passable(nx, ny, node.floor)) continue
      const wall = edgeKey(node.x, node.y, nx, ny)
      if (project.floors[node.floor]?.walls?.[wall]) continue
      out.push({ x:nx, y:ny, floor:node.floor })
    }
    const here = key(node.x, node.y, node.floor)
    if (stairs.has(here)) {
      const otherFloor = node.floor === 0 ? 1 : 0
      if (stairs.has(key(node.x,node.y,otherFloor)) && passable(node.x,node.y,otherFloor)) out.push({x:node.x,y:node.y,floor:otherFloor})
    }
    return out
  }
  return { passable, neighbors }
}

export function findPath(project, brief, start, goal) {
  if (!start || !goal) return null
  const nav = buildNav(project, brief)
  if (!nav.passable(start.x,start.y,start.floor) || !nav.passable(goal.x,goal.y,goal.floor)) return null
  const startK=key(start.x,start.y,start.floor),goalK=key(goal.x,goal.y,goal.floor),queue=[start],came=new Map([[startK,null]])
  for(let qi=0;qi<queue.length;qi++){
    const cur=queue[qi],ck=key(cur.x,cur.y,cur.floor);if(ck===goalK)break
    for(const n of nav.neighbors(cur)){const nk=key(n.x,n.y,n.floor);if(came.has(nk))continue;came.set(nk,cur);queue.push(n)}
  }
  if(!came.has(goalK))return null
  const path=[];let cur=goal;while(cur){path.push(cur);cur=came.get(key(cur.x,cur.y,cur.floor))}return path.reverse()
}
