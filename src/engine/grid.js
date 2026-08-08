export const key = (x, y, floor = 0) => `${floor}:${x}:${y}`
export const tileKey = (x, y) => `${x}:${y}`

export function parseTileKey(k) {
  const [x, y] = k.split(':').map(Number)
  return { x, y }
}

export function inBounds(x, y, cols, rows) {
  return x >= 0 && y >= 0 && x < cols && y < rows
}

export function edgeKey(x1, y1, x2, y2) {
  const a = `${x1},${y1}`
  const b = `${x2},${y2}`
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function isWalkableTile(type) {
  return ['interior', 'patio', 'path'].includes(type)
}

export function cloneProject(project) {
  return JSON.parse(JSON.stringify(project))
}
