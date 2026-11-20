// BUILT service worker: the game works offline after the first visit.
// - The page itself: network first (so updates arrive), falling back to the cached copy.
// - Hashed JS/CSS bundles, art, icons and fonts: cache first (they never change in place).
const VERSION = 'built-v12'
const CORE = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png']

self.addEventListener('install', (e) => {
  // Core shell plus every piece of art, so the game looks right offline from the first install.
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE)
    try { const art = await (await fetch('./art/manifest.json')).json(); await c.addAll(art.map(a => './' + a)) } catch { /* art caches lazily instead */ }
  }).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)
  if (!sameOrigin && !isFont) return

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./', copy)); return res
    }).catch(() => caches.match('./')))
    return
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)) }
    return res
  })))
})
