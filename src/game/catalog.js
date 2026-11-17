// Static game data: room types, placeable items, materials, finishes and style tags.
// 1 grid cell = 1 m. Every level is 3.2 m floor-to-floor.
//
// Availability of anything placeable:
//   base            always available
//   ind + unlock    permanent unlock: grade B / A / S on a project of that industry (all architects)
//   pack            bought with cash from the supplier catalogue (this architect only)

export const LEVEL_HEIGHT = 3.2

export const STYLES = {
  warm: 'Warm', minimal: 'Minimal', industrial: 'Industrial', civic: 'Civic',
  luxe: 'Luxe', eco: 'Eco', playful: 'Playful', corporate: 'Corporate', heritage: 'Heritage',
}

export const INDUSTRIES = {
  fashion:   { label: 'Fashion retail', icon: 'shirt' },
  food:      { label: 'Food & drink',   icon: 'coffee' },
  grocery:   { label: 'Grocery',        icon: 'bag' },
  health:    { label: 'Healthcare',     icon: 'cross' },
  civic:     { label: 'Civic & culture', icon: 'landmark' },
  housing:   { label: 'Housing',        icon: 'building' },
  office:    { label: 'Workplace',      icon: 'tower' },
  retail:    { label: 'Shopping',       icon: 'bag' },
  sports:    { label: 'Sport',          icon: 'trophy' },
  transport: { label: 'Transport',      icon: 'plane' },
}

// public: visitors use it. habitable: people stay there, so daylight matters.
// wet: needs a water-safe floor. basic: offered in every project's room list.
export const ROOMS = {
  lobby:      { label: 'Lobby',          color: '#dce7f0', public: true, basic: true },
  corridor:   { label: 'Corridor',       color: '#ececea', circulation: true, basic: true },
  storage:    { label: 'Storage',        color: '#e2e1da', basic: true },
  wc:         { label: 'WC',             color: '#d3ebea', wet: true, basic: true },
  office:     { label: 'Office',         color: '#dfe6da', habitable: true, basic: true },
  seating:    { label: 'Dining',         color: '#f3e5d2', public: true, habitable: true },
  service:    { label: 'Service bar',    color: '#eadff0', public: true },
  kitchen:    { label: 'Kitchen',        color: '#f2d9d2', wet: true },
  sales:      { label: 'Sales floor',    color: '#f4ecd0', public: true, habitable: true },
  fitting:    { label: 'Fitting room',   color: '#efe0e6', public: true },
  market:     { label: 'Market hall',    color: '#eef0d6', public: true, habitable: true },
  coldroom:   { label: 'Cold room',      color: '#dbe7f2', wet: true },
  waiting:    { label: 'Waiting',        color: '#dde9e3', public: true, habitable: true },
  exam:       { label: 'Exam room',      color: '#d9e4ef', habitable: true, wet: true },
  reading:    { label: 'Reading room',   color: '#efe6d6', public: true, habitable: true },
  stacks:     { label: 'Stacks',         color: '#e8e0cf', public: true },
  classroom:  { label: 'Classroom',      color: '#e6ecd5', habitable: true },
  hall:       { label: 'Assembly hall',  color: '#ece0d2', public: true, habitable: true },
  gallery:    { label: 'Gallery',        color: '#f1efe9', public: true, habitable: true },
  unit:       { label: 'Apartment',      color: '#f0e4da', habitable: true },
  openOffice: { label: 'Open office',    color: '#e1e8ee', habitable: true },
  meeting:    { label: 'Meeting room',   color: '#e8e1ee', habitable: true },
  shop:       { label: 'Shop unit',      color: '#f3e8d6', public: true, habitable: true },
  foodcourt:  { label: 'Food court',     color: '#f3dfcf', public: true, habitable: true },
  atrium:     { label: 'Atrium',         color: '#e4ecf1', public: true, habitable: true },
  gym:        { label: 'Training floor', color: '#e3ebd9', public: true, habitable: true },
  court:      { label: 'Sports court',   color: '#d8e6d3', public: true, habitable: true },
  changing:   { label: 'Changing room',  color: '#d6e6ea', wet: true, public: true },
  checkin:    { label: 'Check-in hall',  color: '#e2e8f0', public: true, habitable: true },
  security:   { label: 'Security',       color: '#ece3d9', public: true },
  gate:       { label: 'Gate lounge',    color: '#e6eef4', public: true, habitable: true },
  baggage:    { label: 'Baggage hall',   color: '#e7e4df', public: true },
  lounge:     { label: 'VIP lounge',     color: '#efe2d8', public: true, habitable: true },
}

const F = 'Furniture', E = 'Equipment', V = 'Vertical', D = 'Decor', S = 'Site', L = 'Lighting'

// Placeable items. rooms: null = any room. site: outside rooms, ground level.
// family: interchangeable variants a brief can ask for as a group ("4 clothes racks").
// boost: bonus points to Functionality (f) / Aesthetics (a) the first time one is used.
export const ITEMS = {
  // --- generic furniture & equipment (base)
  counter:     { label: 'Counter',         w: 3, h: 1, cost: 2500, rooms: ['service', 'sales', 'seating', 'foodcourt', 'shop', 'market', 'lounge'], group: F, outdoor: true },
  reception:   { label: 'Reception desk',  w: 3, h: 1, cost: 2200, rooms: ['lobby', 'waiting', 'atrium', 'reading', 'gym', 'checkin'], group: F },
  table:       { label: 'Table for 4',     w: 2, h: 2, cost: 900,  rooms: ['seating', 'foodcourt', 'meeting', 'reading', 'unit', 'classroom', 'lounge'], group: F, seats: 4, outdoor: true },
  bigTable:    { label: 'Long table',      w: 4, h: 2, cost: 2200, rooms: ['meeting', 'reading', 'seating', 'foodcourt'], group: F, seats: 8, outdoor: true },
  sofa:        { label: 'Sofa',            w: 2, h: 1, cost: 1200, rooms: ['seating', 'waiting', 'lobby', 'unit', 'atrium', 'reading', 'lounge', 'gate', 'sales'], group: F },
  bed:         { label: 'Bed',             w: 2, h: 2, cost: 1100, rooms: ['unit'], group: F },
  desk:        { label: 'Desk',            w: 2, h: 1, cost: 700,  rooms: ['office', 'openOffice', 'classroom', 'reading', 'exam'], group: F },
  deskRow:     { label: 'Student desks',   w: 3, h: 1, cost: 1200, rooms: ['classroom'], group: F },
  shelving:    { label: 'Shelving',        w: 2, h: 1, cost: 700,  rooms: ['storage', 'stacks', 'sales', 'kitchen', 'classroom', 'office', 'coldroom'], group: F, tall: true },
  display:     { label: 'Display case',    w: 2, h: 1, cost: 1600, rooms: ['sales', 'gallery', 'shop', 'service', 'atrium', 'market'], group: F, products: 'display', outdoor: true },
  artwork:     { label: 'Exhibit plinth',  w: 1, h: 1, cost: 1500, rooms: ['gallery', 'atrium', 'lobby'], group: F },
  stage:       { label: 'Stage',           w: 4, h: 2, cost: 3000, rooms: ['hall'], group: F },
  lockers:     { label: 'Lockers',         w: 2, h: 1, cost: 900,  rooms: ['corridor', 'classroom', 'hall', 'lobby', 'changing', 'gym'], group: F, tall: true },
  espresso:    { label: 'Espresso bar',    w: 1, h: 1, cost: 3000, rooms: ['service', 'kitchen', 'seating', 'lounge'], group: E },
  oven:        { label: 'Oven',            w: 2, h: 1, cost: 4000, rooms: ['kitchen'], group: E },
  stove:       { label: 'Range',           w: 2, h: 1, cost: 3500, rooms: ['kitchen'], group: E },
  fridge:      { label: 'Fridge',          w: 1, h: 1, cost: 1500, rooms: ['kitchen', 'service', 'storage', 'unit', 'coldroom'], group: E, tall: true },
  sink:        { label: 'Sink',            w: 1, h: 1, cost: 600,  rooms: ['kitchen', 'wc', 'service', 'unit', 'exam', 'changing'], group: E },
  toilet:      { label: 'Toilet',          w: 1, h: 1, cost: 900,  rooms: ['wc', 'unit', 'changing'], group: E },
  shower:      { label: 'Shower',          w: 1, h: 1, cost: 1200, rooms: ['wc', 'unit', 'changing'], group: E },
  kitchenette: { label: 'Kitchenette',     w: 2, h: 1, cost: 2500, rooms: ['unit', 'office'], group: E, tall: true },
  examBed:     { label: 'Exam chair',      w: 1, h: 2, cost: 2000, rooms: ['exam'], group: E },
  stairs:      { label: 'Stairs',          w: 2, h: 3, cost: 9000, rooms: null, group: V, vertical: true, walkable: true },
  elevator:    { label: 'Elevator',        w: 2, h: 2, cost: 25000, rooms: null, group: V, vertical: true, walkable: true, lift: true },

  // --- fashion
  rack:        { label: 'Clothes rack',    w: 2, h: 1, cost: 800,  rooms: ['sales', 'shop'], group: F, ind: ['fashion', 'retail'], family: 'rack', products: 'apparel', outdoor: true },
  mirror:      { label: 'Full mirror',     w: 1, h: 1, cost: 400,  rooms: ['fitting', 'sales', 'changing'], group: F, ind: ['fashion'] },
  miniDisplay: { label: 'Boutique display',w: 1, h: 1, cost: 1400, rooms: ['sales', 'shop'], group: F, ind: ['fashion', 'retail'], unlock: 'B', boost: { f: 3 }, products: 'display' },
  mannequin:   { label: 'Mannequin trio',  w: 1, h: 1, cost: 1200, rooms: ['sales', 'shop'], group: D, ind: ['fashion', 'retail'], unlock: 'B', layer: 'decor', boost: { a: 3, products: 'apparel' }, decor: 1 },
  shoeWall:    { label: 'Shoe wall',       w: 3, h: 1, cost: 3200, rooms: ['sales', 'shop'], group: F, ind: ['fashion'], unlock: 'A', boost: { f: 3, a: 2 }, tall: true },
  jewelCase:   { label: 'Jewellery case',  w: 1, h: 1, cost: 4500, rooms: ['sales', 'shop'], group: F, ind: ['fashion'], unlock: 'A', boost: { a: 4 } },
  spotTrack:   { label: 'Gallery spots',   w: 3, h: 1, cost: 1400, rooms: null, group: L, ind: ['fashion', 'retail', 'civic'], unlock: 'A', layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 15, ambience: 0.8 },
  vipSalon:    { label: 'VIP salon',       w: 3, h: 3, cost: 9000, rooms: ['sales', 'fitting', 'lounge'], group: F, ind: ['fashion'], unlock: 'S', boost: { f: 2, a: 7 } },
  runway:      { label: 'Runway',          w: 2, h: 5, cost: 7000, rooms: ['sales', 'atrium'], group: F, ind: ['fashion'], unlock: 'S', walkable: true, boost: { a: 8 } },

  // --- food & drink
  fryer:       { label: 'Fryer station',   w: 2, h: 1, cost: 3200, rooms: ['kitchen'], group: E, ind: ['food'] },
  grill:       { label: 'Outdoor grill',   w: 2, h: 1, cost: 2800, rooms: ['kitchen', 'service'], group: E, ind: ['food'], outdoor: true },
  drinkStation:{ label: 'Drinks station',  w: 2, h: 1, cost: 1800, rooms: ['seating', 'service', 'foodcourt'], group: E, ind: ['food'], outdoor: true },
  booth:       { label: 'Booth seating',   w: 3, h: 2, cost: 2400, rooms: ['seating', 'foodcourt'], group: F, ind: ['food'], unlock: 'B', seats: 6, family: 'tableFam', boost: { f: 2 } },
  pizzaOven:   { label: 'Wood-fired oven', w: 2, h: 2, cost: 7000, rooms: ['kitchen', 'service', 'seating'], group: E, ind: ['food'], unlock: 'A', boost: { f: 2, a: 3 } },
  wineWall:    { label: 'Wine wall',       w: 3, h: 1, cost: 5200, rooms: ['seating', 'service', 'lounge'], group: F, ind: ['food'], unlock: 'A', boost: { a: 4 }, tall: true },
  chefTable:   { label: "Chef's table",    w: 4, h: 2, cost: 9500, rooms: ['kitchen', 'seating'], group: F, ind: ['food'], unlock: 'S', seats: 8, boost: { f: 3, a: 6 } },

  // --- grocery
  chiller:       { label: 'Chiller',          w: 3, h: 1, cost: 3900, rooms: ['market', 'sales'], group: E, ind: ['grocery'], family: 'chiller', products: 'chilled', tall: true },
  aisle:         { label: 'Aisle shelving',   w: 3, h: 1, cost: 1100, rooms: ['market', 'sales'], group: F, ind: ['grocery'], family: 'aisle', products: 'dry', outdoor: true, tall: true },
  checkout:      { label: 'Checkout',              w: 2, h: 1, cost: 2600, rooms: ['market', 'sales', 'shop'], group: E, ind: ['grocery', 'retail', 'fashion'] },
  bakeryCorner:  { label: 'In-store bakery',       w: 3, h: 2, cost: 8000, rooms: ['market'], group: E, ind: ['grocery'], unlock: 'A', boost: { f: 2, a: 3 } },
  gourmetDeli:   { label: 'Gourmet deli',          w: 3, h: 2, cost: 9000, rooms: ['market'], group: E, ind: ['grocery'], unlock: 'A', boost: { a: 4 } },
  juiceBar:      { label: 'Fresh juice bar',       w: 3, h: 1, cost: 6000, rooms: ['market', 'foodcourt'], group: E, ind: ['grocery', 'food'], unlock: 'S', boost: { f: 2, a: 5 } },

  // --- sport
  treadmill:   { label: 'Treadmill row',   w: 3, h: 2, cost: 9000, rooms: ['gym'], group: E, ind: ['sports'] },
  weights:     { label: 'Weights rack',    w: 2, h: 1, cost: 3000, rooms: ['gym'], group: E, ind: ['sports'], tall: true },
  courtLines:  { label: 'Court markings',  w: 6, h: 4, cost: 6000, rooms: ['court', 'hall'], group: E, ind: ['sports'], walkable: true, overlay: true },
  bleachers:   { label: 'Bleachers',       w: 4, h: 2, cost: 5500, rooms: ['court', 'hall'], group: F, ind: ['sports'], seats: 24 },
  spinStudio:  { label: 'Spin bikes',      w: 3, h: 2, cost: 8000, rooms: ['gym'], group: E, ind: ['sports'], unlock: 'B', boost: { f: 3 } },
  scoreboard:  { label: 'Scoreboard',      w: 3, h: 1, cost: 12000, rooms: ['court'], group: E, ind: ['sports'], unlock: 'S', walkable: true, overlay: true, ceiling: true, boost: { f: 2, a: 6 } },

  // --- transport
  checkinDesk: { label: 'Check-in desks',  w: 4, h: 1, cost: 8000, rooms: ['checkin'], group: E, ind: ['transport'] },
  scanner:     { label: 'Security lane',   w: 1, h: 3, cost: 15000, rooms: ['security'], group: E, ind: ['transport'] },
  gateSeats:   { label: 'Gate seating',    w: 4, h: 1, cost: 2400, rooms: ['gate', 'waiting'], group: F, ind: ['transport'], seats: 8 },
  belt:        { label: 'Baggage belt',    w: 5, h: 2, cost: 20000, rooms: ['baggage'], group: E, ind: ['transport'] },
  departures:  { label: 'Departures board',w: 3, h: 1, cost: 6000, rooms: ['checkin', 'gate', 'atrium'], group: E, ind: ['transport'], unlock: 'A', walkable: true, overlay: true, ceiling: true, boost: { f: 4 } },
  loungeBar:   { label: 'Lounge bar',      w: 3, h: 1, cost: 9000, rooms: ['lounge'], group: F, ind: ['transport', 'food'], unlock: 'S', boost: { a: 6 } },

  // --- workplace & civic unlocks
  phoneBooth:  { label: 'Phone booth',     w: 1, h: 1, cost: 4200, rooms: ['openOffice'], group: F, ind: ['office'], unlock: 'B', boost: { f: 3 } },
  readingNook: { label: 'Reading nook',    w: 2, h: 2, cost: 3000, rooms: ['reading', 'stacks', 'classroom'], group: F, ind: ['civic'], unlock: 'B', boost: { f: 1, a: 3 } },

  // --- decor & site (decorate layer)
  plant:       { label: 'Potted plant',    w: 1, h: 1, cost: 150,  rooms: null, group: D, layer: 'decor', decor: 1, outdoor: true },
  tree:        { label: 'Street tree',     w: 1, h: 1, cost: 600,  site: true, group: S, layer: 'decor', decor: 1.5 },
  bench:       { label: 'Bench',           w: 2, h: 1, cost: 400,  site: true, group: S, layer: 'decor', decor: 0.6 },
  planter:     { label: 'Planter',         w: 2, h: 1, cost: 300,  site: true, group: S, layer: 'decor', decor: 0.8, pack: 'urban' },
  bikeRack:    { label: 'Bike rack',       w: 2, h: 1, cost: 300,  site: true, group: S, layer: 'decor', decor: 0.3, pack: 'urban' },
  pool:        { label: 'Reflecting pool', w: 3, h: 2, cost: 8000, site: true, group: S, layer: 'decor', decor: 3, pack: 'urban', boost: { a: 5 } },
  oakTree:     { label: 'Heritage oak',    w: 2, h: 2, cost: 3000, site: true, group: S, layer: 'decor', decor: 4, pack: 'botanical', boost: { a: 3 } },
  palm:        { label: 'Indoor palm',     w: 1, h: 1, cost: 700,  rooms: null, group: D, layer: 'decor', decor: 2, pack: 'botanical' },
  greenWall:   { label: 'Green wall',      w: 3, h: 1, cost: 3500, rooms: null, group: D, layer: 'decor', decor: 3, pack: 'botanical', boost: { a: 4 }, tall: true },
  sculpture:   { label: 'Sculpture',       w: 1, h: 1, cost: 5000, rooms: ['atrium', 'lobby', 'gallery', 'seating', 'sales'], site: 'both', group: D, layer: 'decor', decor: 2, pack: 'gallery', boost: { a: 4 } },
  neonSign:    { label: 'Neon sign',       w: 2, h: 1, cost: 2500, rooms: null, group: D, layer: 'decor', walkable: true, overlay: true, pack: 'gallery', boost: { a: 3 } },
  rug:         { label: 'Designer rug',    w: 3, h: 2, cost: 1800, rooms: null, group: D, layer: 'decor', walkable: true, overlay: true, floorOverlay: true, pack: 'gallery', boost: { a: 2 } },
  fireplace:   { label: 'Fireplace',       w: 2, h: 1, cost: 6000, rooms: ['seating', 'lobby', 'unit', 'reading', 'waiting', 'lounge'], group: D, layer: 'decor', pack: 'gallery', boost: { a: 5 } },
  skylight:    { label: 'Skylight',        w: 2, h: 2, cost: 4000, rooms: null, group: D, layer: 'decor', overlay: true, walkable: true, pack: 'daylight', boost: { a: 3 } },
  featureStair:{ label: 'Feature stair',   w: 3, h: 3, cost: 22000, rooms: null, group: V, vertical: true, walkable: true, pack: 'daylight', boost: { a: 7 } },

  // --- ceiling lighting (decorate layer). light = m² lit well; ambience = mood.
  downlight:   { label: 'Downlight',       w: 1, h: 1, cost: 180,  rooms: null, group: L, layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 6, ambience: 0.2 },
  panel:       { label: 'LED panel',       w: 2, h: 2, cost: 520,  rooms: null, group: L, layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 18, ambience: 0 },
  pendant:     { label: 'Pendant',         w: 1, h: 1, cost: 450,  rooms: null, group: L, layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 7, ambience: 0.7, pack: 'ambient' },
  track:       { label: 'Track light',     w: 2, h: 1, cost: 650,  rooms: null, group: L, layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 13, ambience: 0.4, pack: 'ambient' },
  chandelier:  { label: 'Chandelier',      w: 2, h: 2, cost: 3800, rooms: null, group: L, layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 16, ambience: 1, pack: 'statement', boost: { a: 2 } },
  paperLantern:{ label: 'Paper lantern',   w: 1, h: 1, cost: 220,  rooms: null, group: L, layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 6, ambience: 0.9, sig: 'base' },
  linear:      { label: 'Linear pendant',  w: 4, h: 1, cost: 1600, rooms: null, group: L, layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 20, ambience: 0.8, pack: 'statement' },
}

// Materials. Facade $/m of exterior wall per level, floor $/m².
export const MATERIALS = {
  stucco:      { label: 'White stucco',     kind: 'facade', cost: 260, color: '#ece9e1', tags: ['minimal'], base: true },
  block:       { label: 'Painted block',    kind: 'facade', cost: 210, color: '#b9bcb7', tags: ['industrial'], base: true },
  brick:       { label: 'Red brick',        kind: 'facade', cost: 420, color: '#a85b45', tags: ['warm', 'heritage'], pack: 'masonry' },
  travertine:  { label: 'Travertine',       kind: 'facade', cost: 760, color: '#dccdb0', tags: ['civic', 'luxe', 'heritage'], pack: 'masonry' },
  timberClad:  { label: 'Timber cladding',  kind: 'facade', cost: 380, color: '#b98a5c', tags: ['warm', 'eco'], pack: 'contemporary' },
  zinc:        { label: 'Zinc panels',      kind: 'facade', cost: 540, color: '#7d8790', tags: ['corporate', 'industrial'], pack: 'contemporary' },
  corten:      { label: 'Corten steel',     kind: 'facade', cost: 620, color: '#8e4a2c', tags: ['industrial', 'luxe'], pack: 'contemporary' },
  glass:       { label: 'Curtain wall',     kind: 'facade', cost: 900, color: '#8fb6c9', tags: ['corporate', 'minimal'], glazed: true, pack: 'glazing' },
  vinyl:       { label: 'Vinyl',            kind: 'floor', cost: 40,  color: '#d9d6cc', tags: [], base: true, wetSafe: true },
  ceramic:     { label: 'Ceramic tile',     kind: 'floor', cost: 70,  color: '#e6e4dd', tags: ['minimal'], base: true, wetSafe: true },
  carpet:      { label: 'Carpet',           kind: 'floor', cost: 55,  color: '#9ea6a8', tags: ['corporate'], base: true },
  oak:         { label: 'Oak boards',       kind: 'floor', cost: 120, color: '#c79f72', tags: ['warm', 'minimal'], pack: 'natural' },
  bamboo:      { label: 'Bamboo',           kind: 'floor', cost: 100, color: '#d1b57d', tags: ['eco', 'warm'], pack: 'natural' },
  polished:    { label: 'Polished concrete',kind: 'floor', cost: 90,  color: '#b4b4ae', tags: ['industrial', 'minimal'], wetSafe: true, pack: 'natural' },
  terrazzo:    { label: 'Terrazzo',         kind: 'floor', cost: 160, color: '#e9e2d4', tags: ['civic', 'playful'], wetSafe: true, pack: 'stone' },
  marble:      { label: 'Marble',           kind: 'floor', cost: 300, color: '#f1efea', tags: ['luxe', 'civic'], wetSafe: true, pack: 'stone' },
  greenTile:   { label: 'Glazed green tile',kind: 'floor', cost: 110, color: '#7fa28c', tags: ['playful', 'warm'], wetSafe: true, pack: 'stone' },
  parquet:     { label: 'Oak parquet',        kind: 'floor', cost: 180, color: '#b98d5e', tags: ['civic', 'heritage', 'warm'], sig: 'pure-civic' },
  herringbone: { label: 'Herringbone oak',    kind: 'floor', cost: 170, color: '#c49a6c', tags: ['warm', 'heritage'], sig: 'pure-housing' },
  nero:        { label: 'Nero marble',        kind: 'floor', cost: 320, color: '#34363a', tags: ['luxe', 'minimal'], wetSafe: true, sig: 'art-fashion' },
  encaustic:   { label: 'Encaustic tile',     kind: 'floor', cost: 150, color: '#c9b49a', tags: ['playful', 'heritage', 'warm'], wetSafe: true, sig: 'art-food' },
  rubberFloor: { label: 'Rubber sports floor',kind: 'floor', cost: 110, color: '#5c6a73', tags: ['industrial', 'civic'], wetSafe: true, sig: 'eng-sports' },
  linoleum:    { label: 'Medical linoleum',   kind: 'floor', cost: 90,  color: '#c7d6d2', tags: ['minimal', 'corporate', 'eco'], wetSafe: true, sig: 'eng-health' },
  resin:       { label: 'Poured resin',       kind: 'floor', cost: 120, color: '#d9d6cf', tags: ['minimal', 'industrial'], wetSafe: true, sig: 'biz-grocery' },
  lvt:         { label: 'Luxury vinyl plank', kind: 'floor', cost: 85,  color: '#a98a68', tags: ['warm', 'corporate'], wetSafe: true, sig: 'biz-hosp' },
  sportFloor:  { label: 'Sprung sport floor', kind: 'floor', cost: 140, color: '#c9a46b', tags: ['civic', 'playful'], ind: ['sports'], unlock: 'B' },
}

// Interior wall paints, per room.
export const PAINTS = {
  chalk:      { label: 'Chalk white', color: '#f1efe8', tags: ['minimal', 'civic'], base: true },
  cream:      { label: 'Warm cream',  color: '#efd9ab', tags: ['warm', 'heritage'], base: true },
  stone:      { label: 'Stone grey',  color: '#b9b6ab', tags: ['minimal', 'corporate'], base: true },
  sage:       { label: 'Sage',        color: '#8fab78', tags: ['eco', 'warm'], pack: 'earth' },
  terracotta: { label: 'Terracotta',  color: '#c45e3c', tags: ['warm', 'heritage'], pack: 'earth' },
  ochre:      { label: 'Ochre',       color: '#dd9d2c', tags: ['playful', 'heritage'], pack: 'earth' },
  blush:      { label: 'Blush',       color: '#e8a092', tags: ['playful', 'luxe'], pack: 'moody' },
  navy:       { label: 'Deep navy',   color: '#2c4466', tags: ['corporate', 'luxe'], pack: 'moody' },
  charcoal:   { label: 'Charcoal',    color: '#3a3c3e', tags: ['industrial', 'luxe'], pack: 'moody' },
  emerald:    { label: 'Emerald',     color: '#2f7d5b', tags: ['luxe', 'playful'], pack: 'bold' },
  cobalt:     { label: 'Cobalt blue', color: '#2f56a3', tags: ['playful', 'corporate'], pack: 'bold' },
  sunflower:  { label: 'Sunflower',   color: '#f2c230', tags: ['playful', 'warm'], pack: 'bold' },
  tomato:     { label: 'Tomato red',  color: '#d9442f', tags: ['playful', 'warm'], pack: 'bold' },
  lilac:      { label: 'Lilac',       color: '#b39ad6', tags: ['playful', 'minimal'], pack: 'bold' },
  teal:       { label: 'Teal',        color: '#2a8a8d', tags: ['eco', 'minimal'], pack: 'bold' },
  forest:     { label: 'Forest green',color: '#3d5c38', tags: ['eco', 'heritage'], pack: 'bold' },
  // founders kit + signature finishes (sig = profile id that owns it)
  paper:        { label: 'Paper wallpaper',   color: '#efe6d2', tags: ['warm', 'playful'], sig: 'base' },
  limePlaster:  { label: 'Lime plaster',      color: '#e7e1d4', tags: ['civic', 'heritage', 'minimal'], sig: 'pure-civic' },
  clayPlaster:  { label: 'Clay plaster',      color: '#d6b896', tags: ['warm', 'eco'], sig: 'pure-housing' },
  venetian:     { label: 'Venetian plaster',  color: '#e9ddd2', tags: ['luxe', 'minimal'], sig: 'art-fashion' },
  zellige:      { label: 'Zellige tiles',     color: '#5f8f7e', tags: ['playful', 'warm', 'luxe'], sig: 'art-food' },
  acousticWood: { label: 'Acoustic timber',   color: '#b88e62', tags: ['warm', 'civic'], sig: 'eng-sports' },
  hygienic:     { label: 'Hygienic panels',   color: '#eef3f2', tags: ['minimal', 'corporate'], sig: 'eng-health' },
  brandWall:    { label: 'Brand graphic wall',color: '#e2b04a', tags: ['playful', 'corporate'], sig: 'biz-grocery' },
  fabricPanel:  { label: 'Fabric panels',     color: '#9b7f86', tags: ['luxe', 'warm'], sig: 'biz-hosp' },
}

// Ceiling finishes, per room. Shown in 3D when the Ceiling tool is active.
export const CEILINGS = {
  plain:    { label: 'Plain plaster',    color: '#f3f2ee', cost: 25,  tags: [], base: true },
  acoustic: { label: 'Acoustic tiles',   color: '#e3e4e0', cost: 45,  tags: ['corporate', 'civic'], base: true, boost: { f: 0.5 } },
  slats:    { label: 'Timber slats',     color: '#c49a6c', cost: 120, tags: ['warm', 'eco'], pack: 'ceilings' },
  coffered: { label: 'Coffered plaster', color: '#efe6d6', cost: 160, tags: ['heritage', 'luxe', 'civic'], pack: 'ceilings' },
  exposed:  { label: 'Exposed services', color: '#5b6166', cost: 30,  tags: ['industrial'], pack: 'ceilings' },
  skyCeiling:  { label: 'Painted sky',     color: '#9fc6e8', cost: 40, tags: ['playful', 'minimal'], pack: 'bold' },
  clayCeiling: { label: 'Clay red ceiling', color: '#c27a58', cost: 40, tags: ['warm', 'heritage'], pack: 'bold' },
  blackCeiling:{ label: 'Black ceiling',    color: '#2b2d30', cost: 40, tags: ['luxe', 'industrial'], pack: 'bold' },
  galleryCoffers: { label: 'Gallery coffers',   color: '#f4f1ea', cost: 190, tags: ['civic', 'luxe'], sig: 'pure-civic', boost: { a: 1 } },
  timberBeams:    { label: 'Timber beams',      color: '#a67c52', cost: 140, tags: ['warm', 'heritage'], sig: 'pure-housing' },
  barrelVault:    { label: 'Barrel vault',      color: '#efe7dc', cost: 220, tags: ['luxe', 'heritage'], sig: 'art-fashion', boost: { a: 1 } },
  rattan:         { label: 'Rattan canopy',     color: '#c9a46a', cost: 130, tags: ['warm', 'playful', 'eco'], sig: 'art-food' },
  spaceFrame:     { label: 'Steel space frame', color: '#9aa3a8', cost: 160, tags: ['industrial', 'civic'], sig: 'eng-sports' },
  chilledBeams:   { label: 'Chilled beams',     color: '#e5e9ea', cost: 150, tags: ['corporate', 'minimal'], sig: 'eng-health', boost: { f: 0.5 } },
  openGrid:       { label: 'Open grid',         color: '#7b8185', cost: 60,  tags: ['industrial', 'corporate'], sig: 'biz-grocery' },
  coveLit:        { label: 'Cove-lit plaster',  color: '#f3ece0', cost: 170, tags: ['luxe', 'warm'], sig: 'biz-hosp' },
}

// Window joinery (every window in the project). cost = multiplier on the window price.
export const WINDOWS = {
  standard: { label: 'Standard window', color: '#3b4248', cost: 1,   tags: [], base: true },
  timber:   { label: 'Timber sash',     color: '#8a5f3c', cost: 1.4, tags: ['warm', 'heritage', 'eco'], pack: 'windows', boost: { a: 1 } },
  steel:    { label: 'Steel crittall',  color: '#24292d', cost: 1.7, tags: ['industrial', 'heritage', 'luxe'], pack: 'windows', boost: { a: 2 } },
  picture:  { label: 'Floor-to-ceiling',color: '#c9cdd0', cost: 2.4, tags: ['minimal', 'luxe', 'corporate'], pack: 'windows', tall: true, boost: { a: 3 } },
}

// Entrance doors (all street doors use the project's entrance style).
export const DOORS = {
  standard: { label: 'Standard door',      color: '#2f3539', cost: 0,    tags: [], base: true },
  glazed:   { label: 'Glazed double door', color: '#8fb6c9', cost: 2500, tags: ['minimal', 'corporate'], pack: 'entrances', boost: { a: 2 } },
  pivot:    { label: 'Timber pivot door',  color: '#8a5f3c', cost: 4200, tags: ['warm', 'luxe'], pack: 'entrances', boost: { a: 3 } },
  revolving:{ label: 'Revolving door',     color: '#b9c3c8', cost: 9000, tags: ['corporate', 'luxe'], pack: 'entrances', boost: { f: 2, a: 2 } },
}

// Products assigned to a fixture after placing it (a rack gets "Women", a chiller "Frozen").
// dept groups products for merchandising; unlock gates premium product lines like other unlocks.
export const PRODUCTS = {
  apparel: {
    women: { label: 'Women', color: '#e7a9b8', goods: ['#d9849a', '#f0c9a8', '#b46a8f', '#f3e1e6', '#9c4e63'], dept: 'women' },
    men:   { label: 'Men',   color: '#9fb2c6', goods: ['#3f566e', '#7d8b99', '#24313d', '#b8a98f', '#5d6b52'], dept: 'men' },
    kids:  { label: 'Kids',  color: '#f2d27a', goods: ['#f2c14e', '#7cc4e8', '#f28a6b', '#9bd18b', '#c9a5e8'], dept: 'kids' },
  },
  display: {
    general: { label: 'Accessories', color: '#d9d4c8', goods: ['#c96f53', '#e0c060', '#4f6d7a'], dept: null },
    women:   { label: 'Women',       color: '#e7a9b8', goods: ['#d9849a', '#e0c060', '#b46a8f'], dept: 'women' },
    men:     { label: 'Men',         color: '#9fb2c6', goods: ['#3f566e', '#b8a98f', '#24313d'], dept: 'men' },
    kids:    { label: 'Kids',        color: '#f2d27a', goods: ['#f2c14e', '#7cc4e8', '#f28a6b'], dept: 'kids' },
  },
  chilled: {
    produce: { label: 'Fresh produce', color: '#a8d18d', goods: ['#7cb85a', '#e0a33c', '#c9473c', '#9ccf6a'], dept: 'produce' },
    meat:    { label: 'Meat',          color: '#e8a2a0', goods: ['#c0484a', '#e48a83', '#a8323a', '#f0b0a0'], dept: 'meat' },
    dairy:   { label: 'Dairy',         color: '#f3efe2', goods: ['#f4f1e6', '#e9dfb8', '#cfe3f0', '#f7f4ea'], dept: 'dairy' },
    frozen:  { label: 'Frozen',        color: '#bfe0f5', goods: ['#e8f4fb', '#9cc8e8', '#f0f0f0', '#7fb2d9'], dept: 'frozen' },
    drinks:  { label: 'Drinks',        color: '#9cc3e8', goods: ['#3f7bbf', '#e2513b', '#f2c14e', '#5aae6b'], dept: 'drinks', ind: ['grocery'], unlock: 'B' },
  },
  dry: {
    produce:    { label: 'Produce crates',   color: '#d9b27a', goods: ['#c9473c', '#e0a33c', '#8a6b3c', '#9ccf6a'], dept: 'produce', low: true },
    snacks:     { label: 'Candy & chips',    color: '#f2c14e', goods: ['#f2c14e', '#e2513b', '#7c4fb0', '#3f7bbf'], dept: 'snacks' },
    condiments: { label: 'Condiments',       color: '#d98c6a', goods: ['#b8432f', '#f0d27a', '#5b7a3a', '#e8e0cf'], dept: 'pantry' },
    pantry:     { label: 'Pasta & tins',     color: '#e2c98f', goods: ['#e0c48a', '#c9473c', '#3f7bbf', '#8a6b3c'], dept: 'pantry' },
    bakery:     { label: 'Bread & bakery',   color: '#d7a15a', goods: ['#d7a15a', '#b9803e', '#efd3a2', '#a86a2c'], dept: 'bakery', ind: ['grocery'], unlock: 'A' },
  },
}
// Complements: a fixture of `a` in a department sells more near a fixture of `b` in the same one.
export const COMPLEMENTS = [
  ['display', 'rack'], ['miniDisplay', 'rack'], ['mannequin', 'rack'], ['aisle', 'chiller'],
]
export function productsFor(type) { return ITEMS[type]?.products ? PRODUCTS[ITEMS[type].products] : null }
export function productDef(it) { const p = productsFor(it.type); return p ? p[it.product] || Object.values(p)[0] : null }
export function defaultProduct(type) { const p = productsFor(type); return p ? Object.keys(p)[0] : undefined }
export function itemLabel(it) { const pd = productDef(it); return pd ? `${ITEMS[it.type].label} · ${pd.label}` : ITEMS[it.type].label }

// Roof finishes. $/m² of roof; shown in 3D and counted toward style fit.
export const ROOFS = {
  gravel:        { label: 'Gravel flat roof',   color: '#b7b9b4', cost: 30,  tags: [], base: true },
  membrane:      { label: 'White membrane',     color: '#e8e8e4', cost: 40,  tags: ['minimal'], base: true },
  greenRoof:     { label: 'Green roof',         color: '#7f9c6a', cost: 120, tags: ['eco', 'civic'], sig: 'pure-civic', boost: { a: 2 } },
  pitchedTiles:  { label: 'Clay tile parapet',  color: '#b4674c', cost: 110, tags: ['heritage', 'warm'], sig: 'pure-housing' },
  copper:        { label: 'Patinated copper',   color: '#6f9c8c', cost: 220, tags: ['luxe', 'heritage'], sig: 'art-fashion', boost: { a: 2 } },
  terracottaRoof:{ label: 'Terracotta tiles',   color: '#c2734f', cost: 100, tags: ['warm', 'heritage'], sig: 'art-food' },
  sawtooth:      { label: 'Sawtooth skylights', color: '#c9cdd0', cost: 160, tags: ['industrial'], sig: 'eng-sports', boost: { a: 1 } },
  solar:         { label: 'Solar array',        color: '#2f3d55', cost: 180, tags: ['eco', 'corporate'], sig: 'eng-health', boost: { f: 1 } },
  membraneLogo:  { label: 'Branded parapet',    color: '#e4e4df', cost: 60,  tags: ['corporate', 'playful'], sig: 'biz-grocery' },
  roofTerrace:   { label: 'Roof terrace',       color: '#a58462', cost: 150, tags: ['warm', 'luxe'], sig: 'biz-hosp', boost: { a: 2 } },
}

export const BASE_COST = { perM2: 1250, window: 900, door: 650, levelPremium: 0.06, paint: 12 }

// Quality tiers. score feeds Functionality (equipment) and Aesthetics (finishes).
export const QUALITY = [
  { id: 0, label: 'Basic',    short: 'B', cost: 0.55, score: 0.45 },
  { id: 1, label: 'Standard', short: 'S', cost: 1,    score: 0.8 },
  { id: 2, label: 'Premium',  short: 'P', cost: 2.1,  score: 1 },
]
export const q = (v) => QUALITY[v ?? 1] || QUALITY[1]

export const FAMILIES = {
  rack: 'Clothes racks', chiller: 'Chillers', aisle: 'Grocery aisles', tableFam: 'Tables or booths',
}
// Requirements naming a family accept any member; 'table' also counts toward tableFam.
export function familyOf(type) { return type === 'table' ? 'tableFam' : ITEMS[type]?.family || null }

export const isDecorLayer = (type) => ITEMS[type]?.layer === 'decor'
export const itemCost = (it) => Math.round(ITEMS[it.type].cost * q(it.q).cost)

export function materialsOfKind(kind) {
  return Object.entries(MATERIALS).filter(([, m]) => m.kind === kind).map(([id, m]) => ({ id, ...m }))
}

export function itemSize(item) {
  const def = ITEMS[item.type]
  return item.rot % 2 ? { w: def.h, h: def.w } : { w: def.w, h: def.h }
}
