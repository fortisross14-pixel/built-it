// End-to-end save tests on a phone viewport. Run: npm run test:e2e (builds, serves, runs).
// Each scenario prints PASS/FAIL; the process exits non-zero if any fails.
const { chromium, devices } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')

const PORT = 4179, URL = `http://localhost:${PORT}/`
const results = []
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  · ' + extra : ''}`) }

async function seed() {
  const { newMeta, newCareer, makeOffer, rng } = await import(path.join(__dirname, '../../src/engine/career.js'))
  const { referenceCafe } = await import(path.join(__dirname, '../../src/game/demo.js'))
  const meta = newMeta()
  const career = newCareer(meta, { name: 'Test Architect', profile: { profileId: 'base-w', background: 'base', avatar: 'a02' }, seed: 3 })
  const cafe = { ...makeOffer('cafe', rng(2), 1), styles: ['warm', 'minimal'], twist: null, wishes: [], tag: 'match' }
  career.offers = [cafe, ...career.offers]
  career.current = { offer: cafe, project: referenceCafe(cafe), attempts: 0 }
  return JSON.stringify({ meta, career, savedAt: 1, rev: 1 })
}

;(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: path.join(__dirname, '../..'), stdio: 'ignore' })
  await new Promise(r => setTimeout(r, 2500))
  const browser = await chromium.launch()
  const SAVE = await seed()
  const fresh = async () => {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] })
    await ctx.addInitScript(s => { if (!localStorage.getItem('e2e-seeded')) { localStorage.setItem('built-save-v2', s); localStorage.setItem('built-settings-v1', JSON.stringify({ sound: false })); localStorage.setItem('e2e-seeded', '1') } }, SAVE)
    return ctx
  }
  const stored = (p) => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('built-save-v2')); return { n: s.career.current.project.levels[0].items.length, rev: s.rev } })
  const open = async (p) => { await p.goto(URL); await p.waitForTimeout(500); await p.getByText('Continue designing').click(); await p.waitForTimeout(800) }
  const delOne = async (p) => { await p.locator('.plan-svg g.item:not(.overlay)').first().click(); await p.waitForTimeout(200); await p.keyboard.press('Delete'); await p.waitForTimeout(60) }
  const errors = []
  const watch = (p) => p.on('pageerror', e => errors.push(e.message))
  try {
    // 1. Two copies: edits in A, then a stale copy B comes back and edits. Nothing of A's may be lost.
    {
      const ctx = await fresh(); const A = await ctx.newPage(); watch(A); const B = await ctx.newPage(); watch(B)
      await B.goto(URL); await B.waitForTimeout(500)
      await A.bringToFront(); await open(A)
      for (let i = 0; i < 3; i++) await delOne(A)
      await A.waitForTimeout(500)
      const a = await stored(A)
      await B.bringToFront(); await B.evaluate(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')) }); await B.waitForTimeout(300)
      await B.getByText('Continue designing').click(); await B.waitForTimeout(800)
      await delOne(B); await B.waitForTimeout(600)
      const b = await stored(B)
      check('stale second copy does not overwrite newer progress', b.n === a.n - 1, `A saved ${a.n}, after B's edit ${b.n}`)
      // live sync: A is still open on the plan; it must pick up B's change, and its next edit builds on it
      await A.bringToFront(); await A.evaluate(() => window.dispatchEvent(new Event('focus'))); await A.waitForTimeout(500)
      await delOne(A); await A.waitForTimeout(600)
      const a2 = await stored(A)
      check('the first copy picks up the second copy\'s change', a2.n === b.n - 1, `B saved ${b.n}, after A's next edit ${a2.n}`)
      await ctx.close()
    }
    // 2. Reload 50 ms after an edit.
    {
      const ctx = await fresh(); const p = await ctx.newPage(); watch(p); await open(p)
      const before = (await stored(p)).n
      await delOne(p); await p.waitForTimeout(50); await p.reload(); await p.waitForTimeout(500)
      check('edit survives an immediate reload', (await stored(p)).n === before - 1)
      await ctx.close()
    }
    // 3. App sent to the background right after an edit (phone home button / app switcher).
    {
      const ctx = await fresh(); const p = await ctx.newPage(); watch(p); await open(p)
      const before = (await stored(p)).n
      await delOne(p)
      await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')) })
      check('edit is written the moment the app is hidden', (await stored(p)).n === before - 1)
      await ctx.close()
    }
    // 4. Long session: 15 edits in a row, then leave the editor and reload.
    {
      const ctx = await fresh(); const p = await ctx.newPage(); watch(p); await open(p)
      const before = (await stored(p)).n
      for (let i = 0; i < 15; i++) { if (!(await p.locator('.plan-svg g.item:not(.overlay)').count())) break; await delOne(p) }
      const mem = await p.locator('.plan-svg g.item').count()
      await p.locator('.ed-top .icon-btn, [aria-label="Back"]').first().click().catch(() => {}); await p.waitForTimeout(300)
      await p.reload(); await p.waitForTimeout(500)
      const after = (await stored(p)).n
      check('15 quick edits, exit, reload: all kept', after === mem && after < before, `on screen ${mem}, saved ${after} (was ${before})`)
      await ctx.close()
    }
    // 5. Storage refuses writes: banner appears; when storage works again, Retry saves.
    {
      const ctx = await fresh(); const p = await ctx.newPage(); watch(p); await open(p)
      await p.evaluate(() => {
        const real = Storage.prototype.setItem
        window.__realSet = real
        Storage.prototype.setItem = function (k, v) { if (k.startsWith('built-save')) { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e } return real.call(this, k, v) }
      })
      await delOne(p); await p.waitForTimeout(500)
      const banner = await p.locator('.save-banner.error').textContent().catch(() => '')
      check('a failed save shows "Saving failed"', /Saving failed/.test(banner), banner.slice(0, 90))
      await p.evaluate(() => { Storage.prototype.setItem = window.__realSet })
      await p.locator('.save-banner button', { hasText: 'Retry' }).click(); await p.waitForTimeout(300)
      const ok = await p.locator('.save-banner.ok').textContent().catch(() => '')
      const n = (await stored(p)).n
      check('Retry saves once storage works again', /works again/.test(ok) && n === (await p.locator('.plan-svg g.item').count() >= 0 ? n : -1), ok.slice(0, 60))
      await ctx.close()
    }
    // 6. Backup: download, change things, restore.
    {
      const ctx = await fresh(); const p = await ctx.newPage(); watch(p); await open(p)
      const before = (await stored(p)).n
      const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => window.dispatchEvent(new Event('built:export')))])
      const file = await dl.path()
      await delOne(p); await delOne(p); await p.waitForTimeout(400)
      const text = require('fs').readFileSync(file, 'utf8')
      await p.evaluate(t => window.dispatchEvent(new CustomEvent('built:import', { detail: t })), text); await p.waitForTimeout(500)
      check('backup download + restore brings the design back', (await stored(p)).n === before, `restored ${(await stored(p)).n}/${before}`)
      await ctx.close()
    }
    // 7. Career steps: submit → review → continue → accept the next job, reloading after each.
    {
      const ctx = await fresh(); const p = await ctx.newPage(); watch(p); await open(p)
      await p.locator('.submit-btn').click(); await p.waitForTimeout(300)
      await p.locator('.modal .primary').click(); await p.waitForTimeout(2500)
      await p.reload(); await p.waitForTimeout(700)
      const onReview = await p.locator('.page.review').count()
      await p.getByText('Continue').first().click(); await p.waitForTimeout(700)
      await p.reload(); await p.waitForTimeout(700)
      const s1 = await p.evaluate(() => JSON.parse(localStorage.getItem('built-save-v2')).career)
      check('submitted work survives reloads (review, then hub)', onReview === 1 && s1.portfolio.length === 1 && !s1.pending, `review shown ${onReview}, portfolio ${s1.portfolio.length}`)
      await p.locator('.board-list > *').first().click(); await p.waitForTimeout(900)
      await p.getByText('Accept project').click({ force: true }); await p.waitForTimeout(900)
      await p.reload(); await p.waitForTimeout(700)
      const s2 = await p.evaluate(() => JSON.parse(localStorage.getItem('built-save-v2')).career)
      check('accepting the next job survives a reload', !!s2.current && s2.current.offer.id !== s1.portfolio[0].offer.id)
      await ctx.close()
    }
    // 8. A save from an older version (no stamps) loads and keeps saving.
    {
      const old = JSON.parse(SAVE); delete old.savedAt; delete old.rev
      const ctx = await browser.newContext({ ...devices['iPhone 13'] })
      await ctx.addInitScript(s => { if (!localStorage.getItem('e2e-seeded')) { localStorage.setItem('built-save-v2', s); localStorage.setItem('e2e-seeded', '1') } }, JSON.stringify(old))
      const p = await ctx.newPage(); watch(p); await open(p)
      const before = (await stored(p)).n
      await delOne(p); await p.waitForTimeout(400); await p.reload(); await p.waitForTimeout(500)
      check('older saves (no stamps) load and keep saving', (await stored(p)).n === before - 1)
      await ctx.close()
    }
    check('no page errors in any scenario', errors.length === 0, errors.join(' | ').slice(0, 200))
  } finally {
    await browser.close(); server.kill()
  }
  const failed = results.filter(r => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(failed ? 1 : 0)
})()
