// Supplier catalogue: packs bought with cash earned from fees. They unlock for the current
// architect only. Permanent unlocks come from grades (see unlocks in career.js).
import { CEILINGS, DOORS, INDUSTRIES, ITEMS, MATERIALS, PAINTS, ROOFS, WINDOWS } from './catalog.js'
import { profileById } from './architects.js'

export const PACKS = {
  earth:       { name: 'Earth tones',          kind: 'Paint',     price: 2500, text: 'Sage, terracotta and ochre wall paints.' },
  bold:        { name: 'Bold colour',          kind: 'Paint',     price: 3000, text: 'Emerald, cobalt, sunflower, tomato, lilac, teal and forest walls, plus sky, clay and black ceilings.' },
  moody:       { name: 'Moody palette',        kind: 'Paint',     price: 3500, text: 'Blush, deep navy and charcoal.' },
  natural:     { name: 'Natural floors',       kind: 'Floors',    price: 3500, text: 'Oak, bamboo and polished concrete.' },
  stone:       { name: 'Stone & terrazzo',     kind: 'Floors',    price: 6000, text: 'Terrazzo, marble and glazed tile.' },
  masonry:     { name: 'Masonry facades',      kind: 'Facade',    price: 4000, text: 'Red brick and travertine.' },
  contemporary:{ name: 'Contemporary cladding',kind: 'Facade',    price: 5500, text: 'Timber, zinc and corten steel.' },
  glazing:     { name: 'Curtain wall',         kind: 'Facade',    price: 8000, text: 'Full glazing: every perimeter room is daylit.' },
  ambient:     { name: 'Ambient lighting',     kind: 'Lighting',  price: 2500, text: 'Pendants and track lights.' },
  statement:   { name: 'Statement lighting',   kind: 'Lighting',  price: 6000, text: 'Chandeliers and linear pendants.' },
  ceilings:    { name: 'Ceiling finishes',     kind: 'Ceiling',   price: 4000, text: 'Timber slats, coffered plaster, exposed services.' },
  windows:     { name: 'Window joinery',       kind: 'Windows',   price: 4000, text: 'Timber sash, steel crittall and floor-to-ceiling windows.' },
  entrances:   { name: 'Entrance doors',       kind: 'Doors',     price: 4500, text: 'Glazed, timber pivot and revolving entrances.' },
  botanical:   { name: 'Botanical',            kind: 'Decor',     price: 3000, text: 'Indoor palms, green walls, a heritage oak.' },
  urban:       { name: 'Urban landscape',      kind: 'Decor',     price: 3000, text: 'Planters, bike racks and a reflecting pool.' },
  gallery:     { name: 'Gallery pieces',       kind: 'Decor',     price: 5000, text: 'Sculpture, neon, designer rugs, fireplaces.' },
  daylight:    { name: 'Daylight',             kind: 'Decor',     price: 5500, text: 'Skylights and a sculptural feature stair.' },
  intern:      { name: 'Eager intern',         kind: 'Studio',    price: 3000, text: 'Shows a live score estimate while you design.', perk: true },
  contractor:  { name: 'Trusted contractor',   kind: 'Studio',    price: 7000, text: 'All construction costs −12%.', perk: true },
  mentor:      { name: 'Old mentor',           kind: 'Studio',    price: 6000, text: '+5 Functionality on every review.', perk: true },
  renders:     { name: 'Render studio',        kind: 'Studio',    price: 6000, text: '+5 Aesthetics on every review.', perk: true },
}

// What a pack contains, for the shop listing.
export function packContents(id) {
  const out = []
  for (const [k, v] of Object.entries(ITEMS)) if (v.pack === id) out.push(v.label)
  for (const src of [MATERIALS, PAINTS, CEILINGS, DOORS, WINDOWS, ROOFS]) for (const v of Object.values(src)) if (v.pack === id) out.push(v.label)
  return out
}

// One function decides whether anything placeable or applicable can be used.
// ctx = { unlocked: Set of permanent unlock ids, packs: Set of owned pack ids }
export function available(def, id, ctx) {
  if (!def) return false
  if (def.sig) return !!ctx.sig?.has(def.sig)
  if (def.pack) return ctx.packs.has(def.pack)
  if (def.unlock) return ctx.unlocked.has(id)
  return true
}

export function lockReason(def) {
  if (def?.sig) return def.sig === 'base' ? "Part of the founders' kit: only the two founder architects have it." : `Signature finish of the ${profileById(def.sig)?.title || 'specialist'} profile.`
  if (def?.pack) return `Buy the “${PACKS[def.pack].name}” pack in the supplier catalogue.`
  if (def?.unlock) return `Score ${def.unlock} or better on a ${(def.ind || []).map(i => INDUSTRIES[i]?.label.toLowerCase() || i).join(' / ')} project to unlock it for every architect.`
  return ''
}

export function makeCtx(meta, career) {
  const prof = profileById(career?.profile?.profileId)
  const sig = new Set()
  if (prof) sig.add(prof.base ? 'base' : prof.id)
  return { unlocked: new Set(meta?.unlocked || []), packs: new Set(career?.packs || []), sig }
}
