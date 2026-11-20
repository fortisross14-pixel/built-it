// A second, independent copy of the save in IndexedDB (larger quota, transactional), plus a
// rolling history of earlier versions the player can restore from Settings.
const DB = 'built-it', VERSION = 1
let dbp = null
function db() {
  if (dbp) return dbp
  dbp = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB, VERSION)
      req.onupgradeneeded = () => { const d = req.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); if (!d.objectStoreNames.contains('history')) d.createObjectStore('history', { keyPath: 'savedAt' }) }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    } catch (e) { reject(e) }
  }).catch(e => { dbp = null; throw e })
  return dbp
}
const tx = async (store, mode, fn) => {
  const d = await db()
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode)
    const out = fn(t.objectStore(store))
    t.oncomplete = () => resolve(out?.result ?? out)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

export async function mirrorSave(save) {
  await tx('kv', 'readwrite', s => s.put(save, 'save'))
}
export async function readMirror() {
  return tx('kv', 'readonly', s => s.get('save'))
}
export async function stashUnreadable(raw) {
  await tx('kv', 'readwrite', s => s.put({ raw, at: Date.now() }, `unreadable-${Date.now()}`))
}

// History: one version per minute at most, the newest 20 kept.
let lastHistory = 0
export async function addHistory(save) {
  if (!save?.career && !save?.meta?.legacy?.length) return
  if (save.savedAt - lastHistory < 60000) return
  lastHistory = save.savedAt
  const label = save.career ? `${save.career.name} · level ${save.career.level} · ${save.career.portfolio.length} done${save.career.current ? ' · designing' : ''}` : 'No active career'
  await tx('history', 'readwrite', s => s.put({ savedAt: save.savedAt, label, save }))
  const keys = await tx('history', 'readonly', s => s.getAllKeys())
  if (keys.length > 20) await tx('history', 'readwrite', s => { for (const k of keys.slice(0, keys.length - 20)) s.delete(k) })
}
export async function listHistory() {
  const all = await tx('history', 'readonly', s => s.getAll())
  return all.sort((a, b) => b.savedAt - a.savedAt).map(({ savedAt, label }) => ({ savedAt, label }))
}
export async function getHistory(savedAt) {
  return (await tx('history', 'readonly', s => s.get(savedAt)))?.save || null
}
