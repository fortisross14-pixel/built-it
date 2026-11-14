// Static game data: room types, placeable items, materials and style tags.
// 1 grid cell = 1 m. Every level is 3.2 m floor-to-floor.

export const LEVEL_HEIGHT = 3.2

export const STYLES = {
  warm: 'Warm', minimal: 'Minimal', industrial: 'Industrial', civic: 'Civic',
  luxe: 'Luxe', eco: 'Eco', playful: 'Playful', corporate: 'Corporate', heritage: 'Heritage',
}

// public: visitors use it. habitable: people stay there, so daylight matters.
// wet: needs a water-safe floor.
export const ROOMS = {
  lobby:      { label: 'Lobby',        color: '#dce7f0', public: true },
  seating:    { label: 'Dining',       color: '#f3e5d2', public: true, habitable: true },
  service:    { label: 'Service bar',  color: '#eadff0', public: true },
  kitchen:    { label: 'Kitchen',      color: '#f2d9d2', wet: true },
  storage:    { label: 'Storage',      color: '#e2e1da' },
  wc:         { label: 'WC',           color: '#d3ebea', wet: true },
  sales:      { label: 'Sales floor',  color: '#f4ecd0', public: true, habitable: true },
  fitting:    { label: 'Fitting room', color: '#efe0e6', public: true },
  office:     { label: 'Office',       color: '#dfe6da', habitable: true },
  waiting:    { label: 'Waiting',      color: '#dde9e3', public: true, habitable: true },
  exam:       { label: 'Exam room',    color: '#d9e4ef', habitable: true, wet: true },
  reading:    { label: 'Reading room', color: '#efe6d6', public: true, habitable: true },
  stacks:     { label: 'Stacks',       color: '#e8e0cf', public: true },
  classroom:  { label: 'Classroom',    color: '#e6ecd5', habitable: true },
  hall:       { label: 'Assembly hall',color: '#ece0d2', public: true, habitable: true },
  corridor:   { label: 'Corridor',     color: '#ececea', circulation: true },
  gallery:    { label: 'Gallery',      color: '#f1efe9', public: true, habitable: true },
  unit:       { label: 'Apartment',    color: '#f0e4da', habitable: true },
  openOffice: { label: 'Open office',  color: '#e1e8ee', habitable: true },
  meeting:    { label: 'Meeting room', color: '#e8e1ee', habitable: true },
  shop:       { label: 'Shop unit',    color: '#f3e8d6', public: true, habitable: true },
  foodcourt:  { label: 'Food court',   color: '#f3dfcf', public: true, habitable: true },
  atrium:     { label: 'Atrium',       color: '#e4ecf1', public: true, habitable: true },
}

// Placeable items. rooms: null = any room. site: placed outside rooms on the ground level.
// vertical: connects to an overlapping vertical item on the next level.
export const ITEMS = {
  counter:     { label: 'Counter',        w: 3, h: 1, cost: 2500, rooms: ['service', 'sales', 'seating', 'foodcourt', 'shop'], group: 'Furniture' },
  reception:   { label: 'Reception desk', w: 3, h: 1, cost: 2200, rooms: ['lobby', 'waiting', 'atrium', 'reading'], group: 'Furniture' },
  espresso:    { label: 'Espresso bar',   w: 1, h: 1, cost: 3000, rooms: ['service', 'kitchen', 'seating'], group: 'Equipment' },
  oven:        { label: 'Oven',           w: 2, h: 1, cost: 4000, rooms: ['kitchen'], group: 'Equipment' },
  stove:       { label: 'Range',          w: 2, h: 1, cost: 3500, rooms: ['kitchen'], group: 'Equipment' },
  fridge:      { label: 'Fridge',         w: 1, h: 1, cost: 1500, rooms: ['kitchen', 'service', 'storage', 'unit'], group: 'Equipment' },
  sink:        { label: 'Sink',           w: 1, h: 1, cost: 600,  rooms: ['kitchen', 'wc', 'service', 'unit', 'exam'], group: 'Equipment' },
  toilet:      { label: 'Toilet',         w: 1, h: 1, cost: 900,  rooms: ['wc', 'unit'], group: 'Equipment' },
  shower:      { label: 'Shower',         w: 1, h: 1, cost: 1200, rooms: ['wc', 'unit'], group: 'Equipment' },
  kitchenette: { label: 'Kitchenette',    w: 2, h: 1, cost: 2500, rooms: ['unit', 'office'], group: 'Equipment' },
  table:       { label: 'Table for 4',    w: 2, h: 2, cost: 900,  rooms: ['seating', 'foodcourt', 'meeting', 'reading', 'unit', 'classroom'], group: 'Furniture', seats: 4 },
  bigTable:    { label: 'Long table',     w: 4, h: 2, cost: 2200, rooms: ['meeting', 'reading', 'seating', 'foodcourt'], group: 'Furniture', seats: 8 },
  sofa:        { label: 'Sofa',           w: 2, h: 1, cost: 1200, rooms: ['seating', 'waiting', 'lobby', 'unit', 'atrium', 'reading'], group: 'Furniture' },
  bed:         { label: 'Bed',            w: 2, h: 2, cost: 1100, rooms: ['unit'], group: 'Furniture' },
  desk:        { label: 'Desk',           w: 2, h: 1, cost: 700,  rooms: ['office', 'openOffice', 'classroom', 'reading', 'exam'], group: 'Furniture' },
  deskRow:     { label: 'Student desks',  w: 3, h: 1, cost: 1200, rooms: ['classroom'], group: 'Furniture' },
  examBed:     { label: 'Exam chair',     w: 1, h: 2, cost: 2000, rooms: ['exam'], group: 'Equipment' },
  shelving:    { label: 'Shelving',       w: 2, h: 1, cost: 700,  rooms: ['storage', 'stacks', 'sales', 'kitchen', 'classroom', 'office'], group: 'Furniture' },
  rack:        { label: 'Clothes rack',   w: 2, h: 1, cost: 800,  rooms: ['sales', 'shop'], group: 'Furniture' },
  display:     { label: 'Display case',   w: 2, h: 1, cost: 1600, rooms: ['sales', 'gallery', 'shop', 'service', 'atrium'], group: 'Furniture' },
  artwork:     { label: 'Exhibit plinth', w: 1, h: 1, cost: 1500, rooms: ['gallery', 'atrium', 'lobby'], group: 'Furniture' },
  stage:       { label: 'Stage',          w: 4, h: 2, cost: 3000, rooms: ['hall'], group: 'Furniture' },
  lockers:     { label: 'Lockers',        w: 2, h: 1, cost: 900,  rooms: ['corridor', 'classroom', 'hall', 'lobby'], group: 'Furniture' },
  plant:       { label: 'Plant',          w: 1, h: 1, cost: 150,  rooms: null, group: 'Decor', decor: 1, layer: 'decor' },
  stairs:      { label: 'Stairs',         w: 2, h: 3, cost: 9000, rooms: null, group: 'Vertical', vertical: true, walkable: true },
  elevator:    { label: 'Elevator',       w: 2, h: 2, cost: 25000, rooms: null, group: 'Vertical', vertical: true, walkable: true, lift: true },
  tree:        { label: 'Street tree',    w: 1, h: 1, cost: 600,  site: true, group: 'Site', decor: 1.5, layer: 'decor' },
  bench:       { label: 'Bench',          w: 2, h: 1, cost: 400,  site: true, group: 'Site', decor: 0.6, layer: 'decor' },
  planter:     { label: 'Planter',        w: 2, h: 1, cost: 300,  site: true, group: 'Site', decor: 0.8, layer: 'decor' },
  bikeRack:    { label: 'Bike rack',      w: 2, h: 1, cost: 300,  site: true, group: 'Site', decor: 0.3, layer: 'decor' },
  // Ceiling lighting (decorate layer). light = m² of floor it lights well; ambience = aesthetic flair.
  downlight:   { label: 'Downlight',      w: 1, h: 1, cost: 180,  rooms: null, group: 'Lighting', layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 6, ambience: 0.2 },
  pendant:     { label: 'Pendant',        w: 1, h: 1, cost: 450,  rooms: null, group: 'Lighting', layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 7, ambience: 0.7 },
  track:       { label: 'Track light',    w: 2, h: 1, cost: 650,  rooms: null, group: 'Lighting', layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 13, ambience: 0.4 },
  panel:       { label: 'LED panel',      w: 2, h: 2, cost: 520,  rooms: null, group: 'Lighting', layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 18, ambience: 0 },
  chandelier:  { label: 'Chandelier',     w: 2, h: 2, cost: 3800, rooms: null, group: 'Lighting', layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 16, ambience: 1 },
  // Card-only special items
  skylight:    { label: 'Skylight',       w: 2, h: 2, cost: 4000, rooms: null, group: 'Special', card: 'skylight', overlay: true, walkable: true, special: 6 },
  greenWall:   { label: 'Green wall',     w: 3, h: 1, cost: 3500, rooms: null, group: 'Special', card: 'greenWall', decor: 3, special: 5, layer: 'decor' },
  featureStair:{ label: 'Feature stair',  w: 3, h: 3, cost: 22000, rooms: null, group: 'Special', card: 'featureStair', vertical: true, walkable: true, special: 8 },
  sculpture:   { label: 'Sculpture',      w: 1, h: 1, cost: 5000, rooms: ['atrium', 'lobby', 'gallery', 'seating'], site: 'both', group: 'Special', card: 'sculpture', decor: 2, special: 5, layer: 'decor' },
  fireplace:   { label: 'Fireplace',      w: 2, h: 1, cost: 6000, rooms: ['seating', 'lobby', 'unit', 'reading', 'waiting'], group: 'Special', card: 'fireplace', special: 6 },
  pool:        { label: 'Reflecting pool',w: 3, h: 2, cost: 8000, site: true, group: 'Special', card: 'pool', decor: 3, special: 7, layer: 'decor' },
  oakTree:     { label: 'Heritage oak',   w: 2, h: 2, cost: 3000, site: true, group: 'Special', card: 'oakTree', decor: 4, special: 5, layer: 'decor' },
  neonSign:    { label: 'Neon sign',      w: 2, h: 1, cost: 2500, rooms: null, group: 'Special', card: 'neonSign', walkable: true, overlay: true, special: 4, layer: 'decor' },
}

// Materials. Base ones are always available; the rest are unlocked by cards.
// cost: facade $/m of exterior wall per level, floor $/m².
export const MATERIALS = {
  // Facades
  stucco:      { label: 'White stucco',    kind: 'facade', cost: 260, color: '#ece9e1', tags: ['minimal'], base: true },
  block:       { label: 'Painted block',   kind: 'facade', cost: 210, color: '#b9bcb7', tags: ['industrial'], base: true },
  brick:       { label: 'Red brick',       kind: 'facade', cost: 420, color: '#a85b45', tags: ['warm', 'heritage'], card: 'brick' },
  timberClad:  { label: 'Timber cladding', kind: 'facade', cost: 380, color: '#b98a5c', tags: ['warm', 'eco'], card: 'timberClad' },
  corten:      { label: 'Corten steel',    kind: 'facade', cost: 620, color: '#8e4a2c', tags: ['industrial', 'luxe'], card: 'corten' },
  glass:       { label: 'Curtain wall',    kind: 'facade', cost: 900, color: '#8fb6c9', tags: ['corporate', 'minimal'], card: 'glass', glazed: true },
  travertine:  { label: 'Travertine',      kind: 'facade', cost: 760, color: '#dccdb0', tags: ['civic', 'luxe', 'heritage'], card: 'travertine' },
  zinc:        { label: 'Zinc panels',     kind: 'facade', cost: 540, color: '#7d8790', tags: ['corporate', 'industrial'], card: 'zinc' },
  // Floors
  vinyl:       { label: 'Vinyl',           kind: 'floor', cost: 40,  color: '#d9d6cc', tags: [], base: true, wetSafe: true },
  ceramic:     { label: 'Ceramic tile',    kind: 'floor', cost: 70,  color: '#e6e4dd', tags: ['minimal'], base: true, wetSafe: true },
  carpet:      { label: 'Carpet',          kind: 'floor', cost: 55,  color: '#9ea6a8', tags: ['corporate'], base: true },
  oak:         { label: 'Oak boards',      kind: 'floor', cost: 120, color: '#c79f72', tags: ['warm', 'minimal'], card: 'oak' },
  terrazzo:    { label: 'Terrazzo',        kind: 'floor', cost: 160, color: '#e9e2d4', tags: ['civic', 'playful'], card: 'terrazzo', wetSafe: true },
  polished:    { label: 'Polished concrete', kind: 'floor', cost: 90, color: '#b4b4ae', tags: ['industrial', 'minimal'], card: 'polished', wetSafe: true },
  marble:      { label: 'Marble',          kind: 'floor', cost: 300, color: '#f1efea', tags: ['luxe', 'civic'], card: 'marble', wetSafe: true },
  greenTile:   { label: 'Glazed green tile', kind: 'floor', cost: 110, color: '#7fa28c', tags: ['playful', 'warm'], card: 'greenTile', wetSafe: true },
  bamboo:      { label: 'Bamboo',          kind: 'floor', cost: 100, color: '#d1b57d', tags: ['eco', 'warm'], card: 'bamboo' },
}

export const BASE_COST = { perM2: 1250, window: 900, door: 650, levelPremium: 0.06, paint: 12 }

// Quality tiers for furniture, decor, lights, floors and paint.
// score feeds Functionality (equipment) and Aesthetics (finishes); cost multiplies the price.
export const QUALITY = [
  { id: 0, label: 'Basic',    short: 'B', cost: 0.55, score: 0.45 },
  { id: 1, label: 'Standard', short: 'S', cost: 1,    score: 0.8 },
  { id: 2, label: 'Premium',  short: 'P', cost: 2.1,  score: 1 },
]
export const q = (v) => QUALITY[v ?? 1] || QUALITY[1]

// Interior wall paints, chosen per room in the 3D layer.
export const PAINTS = {
  chalk:      { label: 'Chalk white', color: '#f1efe8', tags: ['minimal', 'civic'] },
  cream:      { label: 'Warm cream',  color: '#eee2c8', tags: ['warm', 'heritage'] },
  stone:      { label: 'Stone grey',  color: '#c9c7bf', tags: ['minimal', 'corporate'] },
  sage:       { label: 'Sage',        color: '#b5c3a5', tags: ['eco', 'warm'] },
  terracotta: { label: 'Terracotta',  color: '#c8775a', tags: ['warm', 'heritage'] },
  ochre:      { label: 'Ochre',       color: '#d9a94e', tags: ['playful', 'heritage'] },
  blush:      { label: 'Blush',       color: '#e8bfb6', tags: ['playful', 'luxe'] },
  navy:       { label: 'Deep navy',   color: '#34465e', tags: ['corporate', 'luxe'] },
  charcoal:   { label: 'Charcoal',    color: '#4a4c4d', tags: ['industrial', 'luxe'] },
}

export const isDecorLayer = (type) => ITEMS[type]?.layer === 'decor'
export const itemCost = (it) => Math.round(ITEMS[it.type].cost * q(it.q).cost)

export function materialsOfKind(kind) {
  return Object.entries(MATERIALS).filter(([, m]) => m.kind === kind).map(([id, m]) => ({ id, ...m }))
}

export function itemSize(item) {
  const def = ITEMS[item.type]
  return item.rot % 2 ? { w: def.h, h: def.w } : { w: def.w, h: def.h }
}
