import test from 'node:test'
import assert from 'node:assert/strict'

// A fake localStorage with an optional size limit, like a phone's ~5 MB quota.
function fakeStorage(limit = Infinity, { lying = false } = {}) {
  const m = new Map()
  return {
    m,
    getItem: (k) => m.has(k) ? m.get(k) : null,
    setItem: (k, v) => {
      const size = [...m].reduce((s, [kk, vv]) => s + (kk === k ? 0 : vv.length), 0) + String(v).length
      if (size > limit) { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e }
      if (!lying) m.set(k, String(v))
    },
    removeItem: (k) => m.delete(k),
  }
}
const S = await import('../src/save.js')
const { newMeta, newCareer, acceptOffer } = await import('../src/engine/career.js')
const { newProject, addRoom } = await import('../src/engine/plan.js')

function game() {
  const meta = newMeta()
  let career = newCareer(meta, { name: 'T', profile: { profileId: 'base-w', background: 'base' }, seed: 2 })
  const o = career.offers[0]
  career = acceptOffer(career, o.id, addRoom(newProject(o), 0, { x: 1, y: 1, w: 6, h: 5 }, 'sales').project)
  return { meta, career }
}

test('save: round trip with stamps; a stale copy cannot overwrite newer progress', () => {
  globalThis.localStorage = fakeStorage()
  const g = game()
  const w1 = S.writeSave(g, { savedAt: 0, rev: 0 })
  assert.ok(w1.ok)
  const back = S.readStored().save
  assert.equal(back.career.id, g.career.id)
  assert.equal(back.rev, 1)
  // copy A writes again (rev 2); copy B still holds stamp rev 1 and tries to write old data
  const w2 = S.writeSave({ ...g, career: { ...g.career, cash: 999 } }, w1.stamp)
  assert.ok(w2.ok)
  const stale = S.writeSave({ ...g, career: { ...g.career, cash: 1 } }, w1.stamp)
  assert.ok(!stale.ok && stale.conflict, 'the stale write is refused')
  assert.equal(stale.conflict.career.cash, 999, 'and the newer save is handed back to load')
  assert.equal(S.readStored().save.career.cash, 999, 'storage still has the newer progress')
})

test('save: when storage is full, old pictures are shed and saving continues', () => {
  const g = game()
  // a long history with heavy thumbnails
  const thumb = 'data:image/jpeg;base64,' + 'x'.repeat(60000)
  g.meta.legacy = Array.from({ length: 30 }, (_, i) => ({ id: 'c' + i, name: 'Old', works: Array.from({ length: 10 }, () => ({ thumb })), best: null }))
  const full = JSON.stringify(g).length
  globalThis.localStorage = fakeStorage(Math.round(full * 0.3))
  const r = S.writeSave(g, { savedAt: 0, rev: 0 })
  assert.ok(r.ok, r.error)
  assert.ok(r.shed, 'reports that it had to shed data')
  const back = S.readStored().save
  assert.equal(back.career.current.project.levels[0].rooms.length, 1, 'the design in progress is intact')
})

test('save: total failure is reported (never silent); the design in progress survives on its own', () => {
  const g = game()
  g.meta.legacy = [{ id: 'x', works: [], best: null, blob: 'y'.repeat(200000) }]
  const projectSize = JSON.stringify(g.career.current.project).length
  globalThis.localStorage = fakeStorage(projectSize + 2000)
  const r = S.writeSave(g, { savedAt: 0, rev: 0 })
  assert.ok(!r.ok && /full/i.test(r.error), r.error)
  assert.ok(r.projectOk, 'the separate copy of the current design was written')
  // after a reload, an older full save + the newer design copy combine
  const fs = fakeStorage()
  fs.setItem(S.KEY, JSON.stringify({ ...g, savedAt: 10, rev: 1, career: { ...g.career, current: { ...g.career.current, project: newProject(g.career.current.offer) } } }))
  fs.setItem(S.PROJECT_KEY, JSON.stringify({ careerId: g.career.id, offerId: g.career.current.offer.id, savedAt: 20, project: g.career.current.project }))
  globalThis.localStorage = fs
  assert.equal(S.readStored().save.career.current.project.levels[0].rooms.length, 1, 'the newer design copy wins on load')
})

test('save: a write that does not stick is detected', () => {
  globalThis.localStorage = fakeStorage(Infinity, { lying: true })
  const r = S.writeSave(game(), { savedAt: 0, rev: 0 })
  assert.ok(!r.ok && /fail/i.test(r.error))
})

test('save: no storage at all is reported', () => {
  globalThis.localStorage = undefined
  assert.ok(!S.writeSave(game(), { savedAt: 0, rev: 0 }).ok)
  assert.ok(S.readStored().error)
})

test('save: backups round-trip and reject other files', async () => {
  const g = game()
  const text = await S.exportSave(g).text()
  assert.equal(S.parseImport(text).career.id, g.career.id)
  assert.throws(() => S.parseImport('{"hello":1}'), /not a Built it! save/)
})
