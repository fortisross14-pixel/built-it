// Saving. The whole game lives in localStorage under one key, plus a small separate copy of the
// project being designed (so a full storage can never cost you the level in progress).
//
// Guarding against lost progress:
// - Every write is stamped (savedAt + rev). Each running copy of the game (a browser tab, the
//   installed app) remembers the stamp it last read or wrote.
// - Before writing, a copy checks the stamp in storage. If another copy has written since, it does
//   NOT overwrite: it loads the newer save instead (and tells the player).
// - When another copy writes, this one is told (storage event) and loads it; when the app comes back
//   to the front it re-checks storage.
// - Every write is read back to verify it. Failures are reported to the UI, never silent.
// - Storage full: the least important data (old thumbnails, old plans) is shed step by step.
export const KEY = 'built-save-v2'
export const PROJECT_KEY = 'built-save-v2-project'

const store = () => { try { return globalThis.localStorage || null } catch { return null } }

export function stampOf(save) { return { savedAt: save?.savedAt || 0, rev: save?.rev || 0 } }
export const isNewer = (a, b) => (a.savedAt || 0) > (b.savedAt || 0) || ((a.savedAt || 0) === (b.savedAt || 0) && (a.rev || 0) > (b.rev || 0))

export function readStored() {
  const ls = store()
  if (!ls) return { save: null, error: 'Storage is not available (private browsing or blocked by the browser).' }
  try {
    const raw = ls.getItem(KEY)
    if (!raw) return { save: null }
    const save = JSON.parse(raw)
    if (save?.meta?.version !== 2) return { save: null, error: 'The save is from an incompatible version.' }
    return { save: withBackupProject(save) }
  } catch (e) {
    return { save: null, error: `The save could not be read (${e.message}).` }
  }
}

// The separate project copy wins if it is newer and belongs to the same commission.
function withBackupProject(save) {
  try {
    const b = JSON.parse(store()?.getItem(PROJECT_KEY) || 'null')
    const cur = save.career?.current
    if (b && cur && b.careerId === save.career.id && b.offerId === cur.offer.id && (b.savedAt || 0) > (save.savedAt || 0)) {
      return { ...save, career: { ...save.career, current: { ...cur, project: b.project } }, savedAt: b.savedAt, rev: save.rev }
    }
  } catch { /* ignore a broken backup */ }
  return save
}

const SHED = [
  (d) => ({ ...d, meta: { ...d.meta, legacy: d.meta.legacy.map((l, i) => i < 5 ? l : { ...l, works: l.works.map(w => ({ ...w, thumb: null })), best: null }) } }),
  (d) => ({ ...d, meta: { ...d.meta, legacy: d.meta.legacy.map(l => ({ ...l, works: l.works.map(w => ({ ...w, thumb: null })), best: null })) } }),
  (d) => d.career ? { ...d, career: { ...d.career, portfolio: d.career.portfolio.map((p, i, a) => i >= a.length - 3 ? p : { ...p, thumb: null, project: null, review: null }) } } : d,
  (d) => d.career ? { ...d, career: { ...d.career, pending: d.career.pending && { ...d.career.pending, thumb: null }, portfolio: d.career.portfolio.map(p => ({ ...p, thumb: null, project: null, review: p.review && { head: p.review.head } })) } } : d,
  (d) => ({ ...d, meta: { ...d.meta, legacy: d.meta.legacy.slice(0, 8).map(l => ({ ...l, works: [], best: null })) } }),
]

function setVerified(ls, key, json) {
  ls.setItem(key, json)
  if (ls.getItem(key)?.length !== json.length) throw new Error('verification failed')
}

// Writes `save` if nothing newer is in storage. `base` = the stamp this copy last read or wrote.
// Returns { ok, stamp, shed, conflict: newerSave | null, error }
export function writeSave(save, base) {
  const ls = store()
  if (!ls) return { ok: false, error: 'Storage is not available (private browsing or blocked by the browser).' }
  // 1. Someone else wrote since we last looked: don't overwrite their progress.
  try {
    const raw = ls.getItem(KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (isNewer(stampOf(stored), base)) return { ok: false, conflict: withBackupProject(stored) }
    }
  } catch { /* unreadable: overwrite it */ }
  const stamp = { savedAt: Math.max(Date.now(), (base.savedAt || 0) + 1), rev: (base.rev || 0) + 1 }
  let data = { ...save, ...stamp }
  // 2. The project in progress goes first, on its own (small, so it fits even when storage is tight).
  let projectOk = true
  const cur = data.career?.current
  try {
    if (cur) setVerified(ls, PROJECT_KEY, JSON.stringify({ careerId: data.career.id, offerId: cur.offer.id, savedAt: stamp.savedAt, project: cur.project }))
    else ls.removeItem(PROJECT_KEY)
  } catch { projectOk = false }
  // 3. The whole game, shedding old pictures and plans if storage is full.
  let lastErr = null
  for (let step = 0; step <= SHED.length; step++) {
    try {
      setVerified(ls, KEY, JSON.stringify(data))
      return { ok: true, stamp, shed: step > 0 }
    } catch (e) {
      lastErr = e
      if (step < SHED.length) data = SHED[step](data)
    }
  }
  const full = /quota|full|exceed/i.test(String(lastErr?.name) + String(lastErr?.message))
  return {
    ok: false, projectOk,
    error: full
      ? (projectOk ? 'Storage is full. Your current design is safe, but career progress could not be saved.' : 'Storage is full: nothing could be saved.')
      : `Saving failed (${lastErr?.message || 'unknown error'}).`,
  }
}

// Ask the browser not to evict our storage (Chrome / Android honour this; Safari keeps home-screen apps).
export function requestPersistence() {
  try { navigator.storage?.persist?.() } catch { /* not supported */ }
}

// Backup file the player can download and restore.
export function exportSave(save) {
  return new Blob([JSON.stringify({ ...save, exportedAt: Date.now() })], { type: 'application/json' })
}
export function parseImport(text) {
  const save = JSON.parse(text)
  if (save?.meta?.version !== 2) throw new Error('This file is not a Built it! save.')
  return save
}
