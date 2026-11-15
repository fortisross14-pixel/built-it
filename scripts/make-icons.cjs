// Render the PWA icons from the BUILT diamond mark. Usage: node scripts/make-icons.cjs
const fs = require('fs'), path = require('path')
;(async () => {
  const { chromium } = require('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const svg = (size, pad, rounded) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="${rounded ? 22 : 0}" fill="#efefec"/>
    <g transform="translate(50 ${50 - pad * 0.15}) rotate(45)" fill="none" stroke="#131415">
      <rect x="${-30 + pad}" y="${-30 + pad}" width="${60 - pad * 2}" height="${60 - pad * 2}" stroke-width="3.2"/>
      <rect x="${-19 + pad * 0.6}" y="${-19 + pad * 0.6}" width="${38 - pad * 1.2}" height="${38 - pad * 1.2}" stroke-width="3.2"/>
      <rect x="-7" y="-7" width="14" height="14" fill="#131415" stroke="none"/>
    </g>
  </svg>`
  const out = path.join(__dirname, '..', 'public', 'icons')
  fs.mkdirSync(out, { recursive: true })
  // pad grows the safe zone for maskable icons (Android crops them to a circle or squircle).
  const jobs = [['icon-192.png', 192, 0, false], ['icon-512.png', 512, 0, false], ['maskable-512.png', 512, 8, false], ['apple-touch-icon.png', 180, 3, false]]
  for (const [name, size, pad] of jobs) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(`<body style="margin:0">${svg(size, pad, false)}</body>`)
    await page.screenshot({ path: path.join(out, name), omitBackground: false })
  }
  fs.writeFileSync(path.join(out, 'favicon.svg'), svg(64, 0, true))
  console.log('icons written to', out)
  await browser.close()
})()
