import { edgeKey, inBounds, tileKey } from './grid.js'

export function ensureFloorMeta(floor) {
  if (!floor.finishes) floor.finishes = {}
  if (!floor.wallFinishes) floor.wallFinishes = {}
  if (!floor.walls) floor.walls = {}
  if (!floor.tiles) floor.tiles = {}
  if (!floor.objects) floor.objects = []
  return floor
}

export function snapOrthogonal(start, end) {
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  return dx >= dy ? {x:end.x, y:start.y} : {x:start.x, y:end.y}
}

export function wallSegmentEdges(start, rawEnd, cols, rows) {
  const end = snapOrthogonal(start, rawEnd)
  const edges = []
  if (start.y === end.y) {
    const y = start.y
    for (let x=Math.min(start.x,end.x); x<Math.max(start.x,end.x); x++) {
      if (x < 0 || x >= cols || y < 0 || y > rows) continue
      edges.push(edgeKey(x, y-1, x, y))
    }
  } else if (start.x === end.x) {
    const x = start.x
    for (let y=Math.min(start.y,end.y); y<Math.max(start.y,end.y); y++) {
      if (y < 0 || y >= rows || x < 0 || x > cols) continue
      edges.push(edgeKey(x-1, y, x, y))
    }
  }
  return {end, edges}
}

export function applyWallSegment(floor, start, end, cols, rows, finish='plaster-ivory') {
  ensureFloorMeta(floor)
  const result = wallSegmentEdges(start,end,cols,rows)
  for (const edge of result.edges) {
    floor.walls[edge] = true
    floor.wallFinishes[edge] = finish
  }
  return result.end
}

export function buildRectWalls(floor, x1, y1, x2, y2, cols, rows, finish='plaster-ivory') {
  ensureFloorMeta(floor)
  applyWallSegment(floor,{x:x1,y:y1},{x:x2,y:y1},cols,rows,finish)
  applyWallSegment(floor,{x:x2,y:y1},{x:x2,y:y2},cols,rows,finish)
  applyWallSegment(floor,{x:x2,y:y2},{x:x1,y:y2},cols,rows,finish)
  applyWallSegment(floor,{x:x1,y:y2},{x:x1,y:y1},cols,rows,finish)
}

export function floodEnclosed(floor, startX, startY, cols, rows) {
  ensureFloorMeta(floor)
  if (!inBounds(startX,startY,cols,rows)) return {closed:false,cells:[]}
  const queue=[[startX,startY]]
  const seen=new Set([tileKey(startX,startY)])
  let closed=true
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]]
  for(let qi=0;qi<queue.length;qi++){
    const [x,y]=queue[qi]
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy
      const barrier=edgeKey(x,y,nx,ny)
      if(floor.walls[barrier]) continue
      if(!inBounds(nx,ny,cols,rows)){ closed=false; continue }
      const nk=tileKey(nx,ny)
      if(seen.has(nk)) continue
      seen.add(nk); queue.push([nx,ny])
    }
  }
  return {closed,cells:queue.map(([x,y])=>({x,y}))}
}

export function rectangleCells(a,b,cols,rows) {
  const x1=Math.max(0,Math.min(a.x,b.x)), x2=Math.min(cols-1,Math.max(a.x,b.x))
  const y1=Math.max(0,Math.min(a.y,b.y)), y2=Math.min(rows-1,Math.max(a.y,b.y))
  const out=[]
  for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)out.push({x,y})
  return out
}
