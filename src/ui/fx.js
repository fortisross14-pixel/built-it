// Feedback layer ("juice"): tiny synthesized sounds, haptics and motion settings.
// Every event goes through feedback(event) so the game stays proportional (game-feel skill: tiers).
// Settings persist per device; reduced motion follows the OS unless the player overrides it.

const KEY = 'built-settings-v1'
const listeners = new Set()

function load() {
  let s = {}
  try { s = JSON.parse(localStorage.getItem(KEY)) || {} } catch { /* default settings */ }
  const osReduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return { sound: true, haptics: true, reduceMotion: osReduce, theme: 'studio', ...s }
}
export let settings = load()

export function setSetting(k, v) {
  settings = { ...settings, [k]: v }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* private mode */ }
  applyMotionClass()
  listeners.forEach(fn => fn(settings))
}
export function onSettings(fn) { listeners.add(fn); return () => listeners.delete(fn) }
export function applyMotionClass() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('reduce-motion', !!settings.reduceMotion)
  document.documentElement.dataset.theme = settings.theme || 'studio'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = { studio: '#121519', blueprint: '#0b2341', atelier: '#efe8dc' }[settings.theme] || '#121519'
}

// ---------------------------------------------------------------- audio
let ctx = null
let master = null
function audio() {
  if (!settings.sound || typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.22
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// One short voice: an oscillator through an envelope, optional pitch glide.
function voice({ type = 'sine', f0 = 440, f1 = null, dur = 0.08, gain = 0.6, delay = 0, attack = 0.004 }) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function noise({ dur = 0.06, gain = 0.3, delay = 0, freq = 1800 }) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9
  const g = a.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(master)
  src.start(t)
}

// ---------------------------------------------------------------- haptics
function buzz(pattern) {
  if (!settings.haptics || typeof navigator === 'undefined' || !navigator.vibrate) return
  try { navigator.vibrate(pattern) } catch { /* unsupported */ }
}

// ---------------------------------------------------------------- events
// Tiers: small = UI ticks, medium = building actions, large = review moments.
const EVENTS = {
  tap:      () => { voice({ type: 'triangle', f0: 1400, dur: 0.03, gain: 0.18 }) },
  select:   () => { voice({ type: 'triangle', f0: 900, f1: 1200, dur: 0.05, gain: 0.25 }); buzz(5) },
  tool:     () => { voice({ type: 'triangle', f0: 700, f1: 950, dur: 0.05, gain: 0.22 }); buzz(4) },
  place:    () => { noise({ dur: 0.05, gain: 0.35, freq: 2400 }); voice({ type: 'sine', f0: 260, f1: 180, dur: 0.09, gain: 0.5 }); buzz(10) },
  room:     () => { noise({ dur: 0.08, gain: 0.3, freq: 900 }); voice({ type: 'sine', f0: 180, f1: 120, dur: 0.14, gain: 0.6 }); buzz([12, 30, 8]) },
  opening:  () => { voice({ type: 'square', f0: 520, f1: 760, dur: 0.05, gain: 0.12 }); buzz(6) },
  paint:    () => { noise({ dur: 0.14, gain: 0.22, freq: 3800 }); buzz(8) },
  remove:   () => { voice({ type: 'triangle', f0: 600, f1: 240, dur: 0.1, gain: 0.3 }); buzz(8) },
  error:    () => { voice({ type: 'square', f0: 180, dur: 0.07, gain: 0.16 }); voice({ type: 'square', f0: 150, dur: 0.09, gain: 0.16, delay: 0.08 }); buzz([18, 40, 18]) },
  undo:     () => { voice({ type: 'triangle', f0: 800, f1: 500, dur: 0.06, gain: 0.2 }); buzz(5) },
  stamp:    () => { noise({ dur: 0.12, gain: 0.6, freq: 500 }); voice({ type: 'sine', f0: 110, f1: 60, dur: 0.22, gain: 0.9 }); buzz([30, 20, 50]) },
  tick:     () => { voice({ type: 'triangle', f0: 1800, dur: 0.018, gain: 0.08 }) },
  star:     (i = 0) => { voice({ type: 'sine', f0: 660 * Math.pow(1.122, i * 2), dur: 0.16, gain: 0.35 }); buzz(12) },
  card:     () => { noise({ dur: 0.1, gain: 0.25, freq: 5000 }); voice({ type: 'sine', f0: 880, f1: 1320, dur: 0.14, gain: 0.3 }); buzz(10) },
  fanfare:  () => { [523, 659, 784, 1047].forEach((f, i) => voice({ type: 'triangle', f0: f, dur: 0.25, gain: 0.32, delay: i * 0.09 })); buzz([20, 60, 20, 60, 40]) },
  fail:     () => { [392, 330, 262].forEach((f, i) => voice({ type: 'sawtooth', f0: f, dur: 0.22, gain: 0.12, delay: i * 0.14 })); buzz([60, 80, 120]) },
}

export function feedback(event, arg) {
  try { EVENTS[event]?.(arg) } catch { /* audio may be blocked until a gesture */ }
}

applyMotionClass()
