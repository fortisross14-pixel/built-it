// Slice a generated art grid into the game's image files (JPEG, 256 px squares).
// Usage:
//   node scripts/slice-art.cjs art-source/projects-grid.png            (preset: projects)
//   node scripts/slice-art.cjs art-source/packs-grid.png packs
//   node scripts/slice-art.cjs art-source/architects-grid.png architects
// Uses the Playwright Chromium already available in dev environments (no image libraries needed).
const fs = require('fs')
const path = require('path')

const PRESETS = {
  projects: {
    cols: 6, rows: 4, dir: 'projects',
    names: ['boutique', 'fastFood', 'cornerShop', 'cafe', 'fastFashion', 'bakery',
      'bistro', 'supermarket', 'clinic', 'gym', 'library', 'fashionChain',
      'apartments', 'school', 'fineDining', 'museum', 'luxury', 'sportsHall',
      'foodHall', 'tower', 'mall', 'grandMuseum', 'arena', 'airport'],
  },
  packs: {
    cols: 5, rows: 4, dir: 'packs', inset: 0.92,
    names: ['earth', 'moody', 'natural', 'stone', 'masonry', 'contemporary', 'glazing', 'ambient', 'statement', 'ceilings',
      'entrances', 'botanical', 'urban', 'gallery', 'daylight', 'intern', 'contractor', 'mentor', 'renders'],
  },
  // Portrait cells (busts): take a square around the face (top part of each cell).
  architects: {
    cols: 6, rows: 2, dir: 'architects', face: { size: 1, top: 0 },
    names: Array.from({ length: 12 }, (_, i) => `a${String(i + 1).padStart(2, '0')}`),
  },
}

;(async () => {
  const file = process.argv[2]
  const preset = PRESETS[process.argv[3] || 'projects']
  if (!file || !preset) { console.error('usage: node scripts/slice-art.cjs <grid.png> [projects|packs|architects]'); process.exit(1) }
  const { chromium } = require('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const data = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64')
  const tiles = await page.evaluate(async ({ data, cols, rows, face, inset }) => {
    const img = new Image(); img.src = data; await img.decode()
    const tw = img.width / cols, th = img.height / rows, out = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256
      let sx, sy, s
      if (face) { s = tw * face.size; sx = c * tw + (tw - s) / 2; sy = r * th + th * face.top }
      else { s = Math.min(tw, th) * (inset || 0.985); sx = c * tw + (tw - s) / 2; sy = r * th + (th - s) / 2 }
      cv.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, 256, 256)
      out.push(cv.toDataURL('image/jpeg', 0.88).split(',')[1])
    }
    return out
  }, { data, cols: preset.cols, rows: preset.rows, face: preset.face || null, inset: preset.inset || null })
  const dir = path.join(__dirname, '..', 'public', 'art', preset.dir)
  fs.mkdirSync(dir, { recursive: true })
  preset.names.forEach((n, i) => fs.writeFileSync(path.join(dir, `${n}.jpg`), Buffer.from(tiles[i], 'base64')))
  console.log(`wrote ${preset.names.length} tiles to ${dir}`)
  // Keep the offline art list for the service worker in sync.
  const artRoot = path.join(__dirname, '..', 'public', 'art')
  const list = fs.readdirSync(artRoot).filter(d => fs.statSync(path.join(artRoot, d)).isDirectory())
    .flatMap(d => fs.readdirSync(path.join(artRoot, d)).filter(f => f.endsWith('.jpg')).map(f => `art/${d}/${f}`)).sort()
  fs.writeFileSync(path.join(artRoot, 'manifest.json'), JSON.stringify(list))
  await browser.close()
})()
