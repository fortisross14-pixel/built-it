// Collectible cards. They are permanent: what one architect earns, the next one can bring.
// material: unlocks a facade/floor material. item: unlocks a special placeable item.
// perk: a passive studio bonus for the whole career.

export const CARDS = {
  // Materials
  brick:       { kind: 'material', rarity: 'common',    name: 'Red Brick',          ref: 'brick',      text: 'Warm, heritage facade. Clients in old districts love it.' },
  oak:         { kind: 'material', rarity: 'common',    name: 'Oak Boards',         ref: 'oak',        text: 'Warm, minimal floor. Not for wet rooms.' },
  timberClad:  { kind: 'material', rarity: 'common',    name: 'Timber Cladding',    ref: 'timberClad', text: 'Warm and eco facade.' },
  polished:    { kind: 'material', rarity: 'common',    name: 'Polished Concrete',  ref: 'polished',   text: 'Industrial, minimal and water-safe floor.' },
  bamboo:      { kind: 'material', rarity: 'common',    name: 'Bamboo',             ref: 'bamboo',     text: 'Eco floor with a warm tone.' },
  terrazzo:    { kind: 'material', rarity: 'rare',      name: 'Terrazzo',           ref: 'terrazzo',   text: 'Civic and playful. Water-safe.' },
  greenTile:   { kind: 'material', rarity: 'rare',      name: 'Glazed Green Tile',  ref: 'greenTile',  text: 'Playful, warm and water-safe.' },
  zinc:        { kind: 'material', rarity: 'rare',      name: 'Zinc Panels',        ref: 'zinc',       text: 'Corporate, industrial facade.' },
  corten:      { kind: 'material', rarity: 'rare',      name: 'Corten Steel',       ref: 'corten',     text: 'A bold, rusted industrial facade.' },
  travertine:  { kind: 'material', rarity: 'epic',      name: 'Travertine',         ref: 'travertine', text: 'Civic, luxe stone facade.' },
  glass:       { kind: 'material', rarity: 'epic',      name: 'Curtain Wall',       ref: 'glass',      text: 'All-glass facade: every perimeter room counts as daylit.' },
  marble:      { kind: 'material', rarity: 'epic',      name: 'Marble',             ref: 'marble',     text: 'Luxe, civic floor. Expensive.' },
  // Special items
  skylight:    { kind: 'item', rarity: 'common',  name: 'Skylight',        ref: 'skylight',     text: 'Daylights any room it is placed in.' },
  neonSign:    { kind: 'item', rarity: 'common',  name: 'Neon Sign',       ref: 'neonSign',     text: 'Gives a shop or café some personality.' },
  fireplace:   { kind: 'item', rarity: 'rare',    name: 'Fireplace',       ref: 'fireplace',    text: 'A cosy centrepiece for lounges and homes.' },
  greenWall:   { kind: 'item', rarity: 'rare',    name: 'Green Wall',      ref: 'greenWall',    text: 'A living wall. Counts as a lot of greenery.' },
  sculpture:   { kind: 'item', rarity: 'rare',    name: 'Sculpture',       ref: 'sculpture',    text: 'Inside or outside. Critics adore it.' },
  oakTree:     { kind: 'item', rarity: 'rare',    name: 'Heritage Oak',    ref: 'oakTree',      text: 'A mature tree for the site.' },
  pool:        { kind: 'item', rarity: 'epic',    name: 'Reflecting Pool', ref: 'pool',         text: 'A calm water feature for the forecourt.' },
  featureStair:{ kind: 'item', rarity: 'epic',    name: 'Feature Stair',   ref: 'featureStair', text: 'A sculptural stair that connects levels in style.' },
  // Perks
  contractor:  { kind: 'perk', rarity: 'rare',    name: 'Trusted Contractor', text: 'All construction costs −12%.' },
  silver:      { kind: 'perk', rarity: 'rare',    name: 'Silver Tongue',      text: 'Clients forgive one more bad project (+1 strike).' },
  press:       { kind: 'perk', rarity: 'epic',    name: 'Press Darling',      text: '+25% reputation from every project.' },
  network:     { kind: 'perk', rarity: 'common',  name: 'Wide Network',       text: 'See 4 commission offers instead of 3.' },
  intern:      { kind: 'perk', rarity: 'common',  name: 'Eager Intern',       text: 'Shows a live score estimate while you design.' },
  mentor:      { kind: 'perk', rarity: 'rare',    name: 'Old Mentor',         text: '+5 Functionality on every review.' },
  renders:     { kind: 'perk', rarity: 'rare',    name: 'Gorgeous Renders',   text: '+5 Aesthetics on every review.' },
  longCareer:  { kind: 'perk', rarity: 'epic',    name: 'Iron Constitution',  text: 'Your career lasts 12 commissions instead of 10.' },
}

export const STARTER_CARDS = ['brick', 'oak', 'skylight']

export const RARITY_WEIGHT = { common: 6, rare: 3, epic: 1 }

export function kitSlots(legacyCount) {
  return Math.min(8, 4 + Math.floor(legacyCount / 2) * 1 + (legacyCount > 0 ? 1 : 0))
}

export function hasPerk(kit, id) { return kit.includes(id) }
