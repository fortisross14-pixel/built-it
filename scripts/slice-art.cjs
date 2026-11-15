// Slice a 6×4 project-art grid into public/art/projects/<id>.png (256×256 each).
// Usage: node scripts/slice-art.cjs art-source/projects-grid.png
// Uses the Playwright Chromium already available in dev environments (no image libraries needed).
const fs = require('fs')
const path = require('path')
const ORDER = ['boutique', 'fastFood', 'cornerShop', 'cafe', 'fastFashion', 'bakery',
  'bistro', 'supermarket', 'clinic', 'gym', 'library', 'fashionChain',
  'apartments', 'school', 'fineDining', 'museum', 'luxury', 'sportsHall',
  'foodHall', 'tower', 'mall', 'grandMuseum', 'arena', 'airport']
;(async () => {
  const file = process.argv[2]
  if (!file) { console.error('usage: node scripts/slice-art.cjs <grid.png> [cols] [rows]'); process.exit(1) }
  const cols = +(process.argv[3] || 6), rows = +(process.argv[4] || 4)
  const { chromium } = require('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const data = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64')
  const tiles = await page.evaluate(async ({ data, cols, rows }) => {
    const img = new Image(); img.src = data; await img.decode()
    const tw = img.width / cols, th = img.height / rows, out = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256
      const s = Math.min(tw, th)
      cv.getContext('2d').drawImage(img, c * tw + (tw - s) / 2, r * th + (th - s) / 2, s, s, 0, 0, 256, 256)
      out.push(cv.toDataURL('image/jpeg', 0.88).split(',')[1])
    }
    return out
  }, { data, cols, rows })
  const dir = path.join(__dirname, '..', 'public', 'art', 'projects')
  fs.mkdirSync(dir, { recursive: true })
  tiles.slice(0, ORDER.length).forEach((b64, i) => fs.writeFileSync(path.join(dir, `${ORDER[i]}.jpg`), Buffer.from(b64, 'base64')))
  console.log(`wrote ${Math.min(tiles.length, ORDER.length)} tiles to ${dir}`)
  await browser.close()
})()
