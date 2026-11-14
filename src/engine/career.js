// Career (one run) and meta progression (persists across architects).
import { BRIEFS, TIERS, TWISTS, estimateBudget } from '../game/briefs.js'
import { CARDS, RARITY_WEIGHT, STARTER_CARDS } from '../game/cards.js'
import { STYLES } from '../game/catalog.js'

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
  { rep: 20, title: 'Project Architect' },
  { rep: 55, title: 'Associate' },
  { rep: 110, title: 'Principal' },
  { rep: 180, title: 'Starchitect' },
]
export function rankFor(rep) { return [...RANKS].reverse().find(r => rep >= r.rep) }
export function tierFor(rep) { return [...TIERS].reverse().find(t => rep >= t.rep).tier }

const FIRST = ['Ada', 'Bruno', 'Carmen', 'Dmitri', 'Elif', 'Farah', 'Gustav', 'Hana', 'Iker', 'Juno', 'Kofi', 'Lucía', 'Mateo', 'Nadia', 'Oskar', 'Priya', 'Quinn', 'Rafa', 'Sana', 'Tomás', 'Uma', 'Viggo', 'Wren', 'Ximena', 'Yusuf', 'Zoe']
const LAST = ['Aalto', 'Barragán', 'Calder', 'Duarte', 'Eames', 'Fehn', 'Gray', 'Herzog', 'Ito', 'Jensen', 'Kahn', 'Lund', 'Moreno', 'Nouvel', 'Ortega', 'Piano', 'Quist', 'Rossi', 'Siza', 'Tange', 'Utzon', 'Vega', 'Wright', 'Yamada', 'Zumthor']
export function randomArchitect(seed = Date.now()) {
  const r = rng(seed)
  return `${pick(r, FIRST)} ${pick(r, LAST)}`
}

export function newMeta() {
  return { collection: [...STARTER_CARDS], legacy: [], careers: 0, version: 1 }
}

export function newCareer(meta, { name, kit, seed = Date.now() }) {
  const career = {
    id: `c${seed.toString(36)}`, name, seed, kit: [...kit],
    rep: 0, strikes: 0,
    maxStrikes: 3 + (kit.includes('silver') ? 1 : 0),
    maxCommissions: kit.includes('longCareer') ? 12 : 10,
    portfolio: [], offers: [], current: null, reward: null, status: 'active',
    startedAt: Date.now(), number: meta.careers + 1,
  }
  career.offers = generateOffers(career)
  return career
}

export function makeOffer(briefId, r, index) {
  const brief = BRIEFS[briefId]
  const styles = shuffle(r, brief.styles).slice(0, 2)
  const twistRoll = r()
  const twistKeys = Object.keys(TWISTS)
  const twist = twistRoll < 0.55 ? pick(r, twistKeys) : null
  const base = estimateBudget(brief)
  const budget = Math.round(base * (twist ? TWISTS[twist].budget || 1 : 1) * (0.95 + r() * 0.12) / 1000) * 1000
  return {
    id: `o${index}-${briefId}-${Math.floor(r() * 1e6).toString(36)}`,
    briefId, client: pick(r, brief.clients), styles, twist, budget,
    lot: { ...brief.lot }, tier: brief.tier,
  }
}

export function generateOffers(career) {
  const r = rng(career.seed + career.portfolio.length * 7919 + 13)
  const unlocked = tierFor(career.rep)
  const n = career.kit.includes('network') ? 4 : 3
  const done = new Set(career.portfolio.map(p => p.briefId))
  const pool = (tier) => Object.keys(BRIEFS).filter(id => BRIEFS[id].tier === tier)
  const offers = []
  const used = new Set()
  const take = (tier, repeat = false) => {
    const fresh = shuffle(r, pool(tier)).filter(id => !used.has(id))
    const id = fresh.find(id => !done.has(id)) || fresh[0] || (repeat ? pick(r, pool(tier)) : null)
    if (!id) return
    used.add(id)
    offers.push(makeOffer(id, r, career.portfolio.length))
  }
  // Highest unlocked tier first, then a safer lower-tier job, then fill.
  take(unlocked)
  if (unlocked > 1) take(unlocked - 1)
  while (offers.length < n) {
    const before = offers.length
    take(Math.max(1, unlocked - Math.floor(r() * 2)))
    if (offers.length === before) take(unlocked, true)
    if (offers.length === before) break
  }
  // A teaser for the next tier: visible but locked.
  const next = TIERS.find(t => t.tier === unlocked + 1)
  const teaser = next ? { ...makeOffer(pick(r, pool(next.tier)), r, career.portfolio.length), locked: true, needRep: next.rep } : null
  return teaser ? [...offers, teaser] : offers
}

export function acceptOffer(career, offerId, project) {
  const offer = career.offers.find(o => o.id === offerId)
  if (!offer || offer.locked) return career
  return { ...career, current: { offer, project, startedAt: Date.now() } }
}

export function repGain(score, offer, kit) {
  const tierMult = [0, 1, 1.6, 2.4, 3.4][offer.tier]
  const twistMult = offer.twist ? TWISTS[offer.twist].rep : 1
  const base = score >= 50 ? (score - 40) / 5 : (score - 50) / 4
  let g = base * tierMult * (base > 0 ? twistMult : 1)
  if (kit.includes('press') && g > 0) g *= 1.25
  return Math.round(g)
}

export function rewardChoices(meta, career, stars) {
  if (stars < 3) return []
  const r = rng(career.seed + career.portfolio.length * 31 + 7)
  const owned = new Set(meta.collection)
  const pool = Object.keys(CARDS).filter(id => !owned.has(id))
  const weighted = pool.map(id => {
    const rar = CARDS[id].rarity
    const w = RARITY_WEIGHT[rar] * (rar === 'epic' ? (stars >= 5 ? 4 : stars >= 4 ? 2 : 1) : rar === 'rare' ? (stars >= 4 ? 1.6 : 1) : 1)
    return { id, w }
  })
  const out = []
  while (out.length < 3 && weighted.length) {
    const total = weighted.reduce((s, x) => s + x.w, 0)
    let roll = r() * total
    const i = weighted.findIndex(x => (roll -= x.w) <= 0)
    out.push(weighted.splice(i < 0 ? 0 : i, 1)[0].id)
  }
  return out
}

export function completeCommission(meta, career, result, thumb) {
  const { offer, project } = career.current
  const gain = repGain(result.overall, offer, career.kit)
  const strike = result.overall < 50
  const entry = {
    briefId: offer.briefId, client: offer.client, offer,
    scores: { functionality: result.functionality, requirements: result.requirements, aesthetics: result.aesthetics, overall: result.overall },
    stars: result.stars, rep: gain, strike, thumb, project, cost: result.cost.total, date: Date.now(),
  }
  const next = {
    ...career,
    rep: Math.max(0, career.rep + gain),
    strikes: career.strikes + (strike ? 1 : 0),
    portfolio: [...career.portfolio, entry],
    current: null,
  }
  next.reward = { choices: rewardChoices(meta, career, result.stars) }
  if (next.strikes >= next.maxStrikes) next.status = 'fired'
  else if (next.portfolio.length >= next.maxCommissions) next.status = 'retired'
  if (next.status === 'active') next.offers = generateOffers(next)
  return { career: next, entry }
}

export function claimReward(meta, career, cardId) {
  if (!career.reward) return { meta, career }
  const ok = cardId && career.reward.choices.includes(cardId)
  const m = ok ? { ...meta, collection: [...new Set([...meta.collection, cardId])] } : meta
  const kit = ok ? [...new Set([...career.kit, cardId])] : career.kit
  let c = { ...career, kit, reward: null }
  if (ok && cardId === 'silver') c.maxStrikes += 1
  if (ok && cardId === 'longCareer') c.maxCommissions = 12
  if (c.status === 'active' && ok && cardId === 'network') c.offers = generateOffers(c)
  return { meta: m, career: c }
}

export function retireEarly(career) {
  return { ...career, status: 'retired', current: null }
}

export function legacyTitle(career) {
  const n = career.portfolio.length
  const avg = n ? career.portfolio.reduce((s, p) => s + p.scores.overall, 0) / n : 0
  const top = Math.max(0, ...career.portfolio.map(p => p.offer.tier))
  if (career.status === 'fired' && n <= 3) return 'A brief flame'
  if (career.status === 'fired') return 'Gone too soon'
  if (avg >= 85 && top >= 4) return 'Living legend'
  if (top >= 4) return 'Builder of landmarks'
  if (avg >= 75) return 'A respected practice'
  return 'A working architect'
}

export function archiveCareer(meta, career) {
  const n = career.portfolio.length
  const summary = {
    id: career.id, name: career.name, status: career.status,
    rep: career.rep, rank: rankFor(career.rep).title, title: legacyTitle(career),
    commissions: n,
    average: n ? Math.round(career.portfolio.reduce((s, p) => s + p.scores.overall, 0) / n) : 0,
    best: (() => { const b = career.portfolio.reduce((b, p) => !b || p.scores.overall > b.scores.overall ? p : b, null); return b && { briefId: b.briefId, overall: b.scores.overall, project: b.project } })(),
    works: career.portfolio.map(p => ({ briefId: p.briefId, client: p.client, overall: p.scores.overall, stars: p.stars, thumb: p.thumb })),
    endedAt: Date.now(),
  }
  return { ...meta, careers: meta.careers + 1, legacy: [summary, ...meta.legacy].slice(0, 30) }
}

export function styleNames(offer) { return offer.styles.map(s => STYLES[s]) }
