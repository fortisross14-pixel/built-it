// Career (one architect, one run) and meta progression (shared by every architect).
//
// Adaptive ladder: career.level (1–10) is the difficulty of the next commissions. A grade moves
// it from the level of the project just finished: S +2, A +1, B +1, C −1. F fails the project:
// retry the same brief (costs a strike) or abandon the career.
// Permanent unlocks: B / A / S on an industry unlocks that industry's items of that grade or lower.
// Cash: every passed project pays a fee; spend it on supplier packs for this architect only.
import { BRIEFS, GRADES, GRADE_RANK, TWISTS, estimateBudget, gradeFor } from '../game/briefs.js'
import { ITEMS, MATERIALS, STYLES } from '../game/catalog.js'
import { PACKS } from '../game/packs.js'

export function rng(seed) {
  let s = seed >>> 0
  return () => {
    s += 0x6D2B79F5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
function shuffle(r, arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }

export const RANKS = [
  { rep: 0, title: 'Junior Architect' },
  { rep: 15, title: 'Project Architect' },
  { rep: 40, title: 'Associate' },
  { rep: 90, title: 'Principal' },
  { rep: 160, title: 'Starchitect' },
]
export function rankFor(rep) { return [...RANKS].reverse().find(r => rep >= r.rep) }

const FIRST = ['Ada', 'Bruno', 'Carmen', 'Dmitri', 'Elif', 'Farah', 'Gustav', 'Hana', 'Iker', 'Juno', 'Kofi', 'Lucía', 'Mateo', 'Nadia', 'Oskar', 'Priya', 'Quinn', 'Rafa', 'Sana', 'Tomás', 'Uma', 'Viggo', 'Wren', 'Ximena', 'Yusuf', 'Zoe']
const LAST = ['Aalto', 'Barragán', 'Calder', 'Duarte', 'Eames', 'Fehn', 'Gray', 'Herzog', 'Ito', 'Jensen', 'Kahn', 'Lund', 'Moreno', 'Nouvel', 'Ortega', 'Piano', 'Quist', 'Rossi', 'Siza', 'Tange', 'Utzon', 'Vega', 'Wright', 'Yamada', 'Zumthor']
export function randomArchitect(seed = Date.now()) {
  const r = rng(seed)
  return `${pick(r, FIRST)} ${pick(r, LAST)}`
}

export const MAX_LEVEL = 10
export const START_CASH = 3000
export const feeFor = (level) => 2500 + level * 1800

export function newMeta() {
  return { unlocked: [], legacy: [], careers: 0, best: {}, version: 2 }
}

export function newCareer(meta, { name, seed = Date.now() }) {
  const career = {
    id: `c${seed.toString(36)}`, name, seed,
    level: 1, cash: START_CASH, packs: [], rep: 0, strikes: 0, maxStrikes: 3, maxCommissions: 10,
    portfolio: [], offers: [], current: null, pending: null, lastGrade: null, status: 'active',
    startedAt: Date.now(), number: meta.careers + 1,
  }
  career.offers = generateOffers(career)
  return career
}

export function makeOffer(briefId, r, index) {
  const brief = BRIEFS[briefId]
  const styles = shuffle(r, brief.styles).slice(0, 2)
  const twist = index > 0 && r() < 0.5 ? pick(r, Object.keys(TWISTS)) : null
  const base = estimateBudget(brief)
  const budget = Math.round(base * (twist ? TWISTS[twist].budget || 1 : 1) * (0.95 + r() * 0.12) / 1000) * 1000
  return {
    id: `o${index}-${briefId}-${Math.floor(r() * 1e6).toString(36)}`,
    briefId, client: pick(r, brief.clients), styles, twist, budget,
    lot: { ...brief.lot }, level: brief.level, industry: brief.industry,
  }
}

const briefsAt = (level) => Object.keys(BRIEFS).filter(id => BRIEFS[id].level === level)
// Nearest populated level, preferring at-or-below so the ladder never skips ahead silently.
function nearestLevel(level) {
  for (let d = 0; d < MAX_LEVEL; d++) {
    if (level - d >= 1 && briefsAt(level - d).length) return level - d
    if (level + d <= MAX_LEVEL && briefsAt(level + d).length) return level + d
  }
  return 1
}

export function generateOffers(career) {
  const r = rng(career.seed + career.portfolio.length * 7919 + 13)
  const T = career.level
  const done = new Set(career.portfolio.map(p => p.briefId))
  const used = new Set(), industries = new Set()
  const offers = []
  const take = (level, tag) => {
    // Prefer the exact level, then the nearest neighbours, so the board always has three jobs.
    const tries = [nearestLevel(level), level - 1, level + 1, level - 2].filter(l => l >= 1 && l <= MAX_LEVEL)
    const L = tries.find(l => briefsAt(l).some(id => !used.has(id))) ?? tries[0]
    const pool = shuffle(r, briefsAt(L)).filter(id => !used.has(id))
    const id = pool.find(id => !done.has(id) && !industries.has(BRIEFS[id].industry)) || pool.find(id => !done.has(id)) || pool[0]
    if (!id) return false
    used.add(id); industries.add(BRIEFS[id].industry)
    offers.push({ ...makeOffer(id, r, career.portfolio.length), tag })
    return true
  }
  if (career.portfolio.length === 0) {
    // First commission: always one of the three basics.
    for (const id of shuffle(r, briefsAt(1))) { used.add(id); offers.push({ ...makeOffer(id, r, 0), tag: 'basic' }) }
    return offers
  }
  take(T, 'match'); take(T, 'match')
  if (['A', 'S'].includes(career.lastGrade) && T < MAX_LEVEL) take(T + 1, 'stretch')
  else if (T > 1) take(T - 1, 'safe')
  else take(T, 'match')
  // Teaser: what an S would open up.
  const ahead = nearestLevel(Math.min(MAX_LEVEL, T + 2))
  if (ahead > T) {
    const id = shuffle(r, briefsAt(ahead)).find(x => !used.has(x))
    if (id) offers.push({ ...makeOffer(id, r, career.portfolio.length), locked: true, tag: 'teaser' })
  }
  return offers
}

export function acceptOffer(career, offerId, project) {
  const offer = career.offers.find(o => o.id === offerId)
  if (!offer || offer.locked) return career
  return { ...career, current: { offer, project, attempts: 0, startedAt: Date.now() } }
}

// Everything an industry unlocks at a grade (and below).
export function unlocksFor(industry, grade) {
  const rank = GRADE_RANK[grade]
  if (rank < GRADE_RANK.B) return []
  const out = []
  for (const src of [ITEMS, MATERIALS]) {
    for (const [id, def] of Object.entries(src)) {
      if (def.unlock && def.ind?.includes(industry) && GRADE_RANK[def.unlock] <= rank) out.push(id)
    }
  }
  return out
}

export function repGain(score, level) {
  return score < 55 ? 0 : Math.round((score - 40) / 5 * (1 + level * 0.35))
}

export function completeCommission(meta, career, result, thumb) {
  const { offer, project } = career.current
  const grade = gradeFor(result.overall)
  const scores = { functionality: result.functionality, requirements: result.requirements, aesthetics: result.aesthetics, budget: result.budget ?? 0, overall: result.overall }
  if (grade.id === 'F') {
    const strikes = career.strikes + 1
    const next = {
      ...career, strikes,
      current: { ...career.current, project, attempts: (career.current.attempts || 0) + 1 },
      pending: { failed: true, scores, review: null, thumb, briefId: offer.briefId, client: offer.client, offer, grade: 'F', cost: result.cost.total },
      status: strikes >= career.maxStrikes ? 'fired' : career.status,
    }
    return { meta, career: next, entry: next.pending, unlocks: [], fee: 0 }
  }
  const fee = Math.round(feeFor(offer.level) * grade.fee * (offer.twist ? TWISTS[offer.twist].fee || 1 : 1) / 100) * 100
  const rep = repGain(result.overall, offer.level)
  const fresh = unlocksFor(offer.industry, grade.id).filter(id => !meta.unlocked.includes(id))
  const prevBest = meta.best[offer.briefId]
  const m = {
    ...meta,
    unlocked: [...meta.unlocked, ...fresh],
    best: { ...meta.best, [offer.briefId]: !prevBest || GRADE_RANK[grade.id] > GRADE_RANK[prevBest] ? grade.id : prevBest },
  }
  const entry = {
    briefId: offer.briefId, client: offer.client, offer, scores, grade: grade.id,
    stars: result.stars, rep, fee, thumb, project, cost: result.cost.total, date: Date.now(), unlocks: fresh,
    fromLevel: offer.level, toLevel: Math.max(1, Math.min(MAX_LEVEL, offer.level + grade.climb)),
  }
  const next = {
    ...career,
    rep: career.rep + rep, cash: career.cash + fee,
    level: entry.toLevel, lastGrade: grade.id,
    portfolio: [...career.portfolio, entry],
    current: null, pending: { ...entry, failed: false },
  }
  if (next.portfolio.length >= next.maxCommissions) next.status = 'retired'
  else next.offers = generateOffers(next)
  return { meta: m, career: next, entry, unlocks: fresh, fee }
}

// After the review screen.
export function acknowledge(career) { return { ...career, pending: null } }
export function retryCommission(career) { return { ...career, pending: null } }
export function abandonCareer(career) { return { ...career, pending: null, current: null, status: 'abandoned' } }
export function retireEarly(career) { return { ...career, status: 'retired', current: null, pending: null } }

export function buyPack(career, id) {
  const pack = PACKS[id]
  if (!pack || career.packs.includes(id)) return { career, error: 'Already owned.' }
  if (career.cash < pack.price) return { career, error: `You need ${pack.price - career.cash} more.` }
  return { career: { ...career, cash: career.cash - pack.price, packs: [...career.packs, id] } }
}

export function perks(career) { return (career?.packs || []).filter(id => PACKS[id]?.perk) }

export function legacyTitle(career) {
  const n = career.portfolio.length
  const avg = n ? career.portfolio.reduce((s, p) => s + p.scores.overall, 0) / n : 0
  const top = Math.max(0, ...career.portfolio.map(p => p.offer.level))
  if (career.status === 'abandoned') return n ? 'Walked away from the drawing board' : 'Never got started'
  if (career.status === 'fired' && n <= 3) return 'A brief flame'
  if (career.status === 'fired') return 'Gone too soon'
  if (top >= 10) return 'Builder of airports'
  if (avg >= 85 && top >= 8) return 'Living legend'
  if (top >= 8) return 'Builder of landmarks'
  if (avg >= 75) return 'A respected practice'
  return 'A working architect'
}

export function archiveCareer(meta, career) {
  const n = career.portfolio.length
  const summary = {
    id: career.id, name: career.name, status: career.status,
    rep: career.rep, rank: rankFor(career.rep).title, title: legacyTitle(career),
    commissions: n, topLevel: Math.max(0, ...career.portfolio.map(p => p.offer.level)),
    average: n ? Math.round(career.portfolio.reduce((s, p) => s + p.scores.overall, 0) / n) : 0,
    best: (() => { const b = career.portfolio.reduce((b, p) => !b || p.scores.overall > b.scores.overall ? p : b, null); return b && { briefId: b.briefId, overall: b.scores.overall, project: b.project } })(),
    works: career.portfolio.map(p => ({ briefId: p.briefId, client: p.client, overall: p.scores.overall, grade: p.grade, stars: p.stars, thumb: p.thumb })),
    endedAt: Date.now(),
  }
  return { ...meta, careers: meta.careers + 1, legacy: [summary, ...meta.legacy].slice(0, 30) }
}

export function styleNames(offer) { return offer.styles.map(s => STYLES[s]) }
export { GRADES }
