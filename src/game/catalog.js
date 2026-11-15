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
  counter:     { label: 'Counter',         w: 3, h: 1, cost: 2500, rooms: ['service', 'sales', 'seating', 'foodcourt', 'shop', 'market', 'lounge'], group: F },
  reception:   { label: 'Reception desk',  w: 3, h: 1, cost: 2200, rooms: ['lobby', 'waiting', 'atrium', 'reading', 'gym', 'checkin'], group: F },
  table:       { label: 'Table for 4',     w: 2, h: 2, cost: 900,  rooms: ['seating', 'foodcourt', 'meeting', 'reading', 'unit', 'classroom', 'lounge'], group: F, seats: 4 },
  bigTable:    { label: 'Long table',      w: 4, h: 2, cost: 2200, rooms: ['meeting', 'reading', 'seating', 'foodcourt'], group: F, seats: 8 },
  sofa:        { label: 'Sofa',            w: 2, h: 1, cost: 1200, rooms: ['seating', 'waiting', 'lobby', 'unit', 'atrium', 'reading', 'lounge', 'gate', 'sales'], group: F },
  bed:         { label: 'Bed',             w: 2, h: 2, cost: 1100, rooms: ['unit'], group: F },
  desk:        { label: 'Desk',            w: 2, h: 1, cost: 700,  rooms: ['office', 'openOffice', 'classroom', 'reading', 'exam'], group: F },
  deskRow:     { label: 'Student desks',   w: 3, h: 1, cost: 1200, rooms: ['classroom'], group: F },
  shelving:    { label: 'Shelving',        w: 2, h: 1, cost: 700,  rooms: ['storage', 'stacks', 'sales', 'kitchen', 'classroom', 'office', 'coldroom'], group: F },
  display:     { label: 'Display case',    w: 2, h: 1, cost: 1600, rooms: ['sales', 'gallery', 'shop', 'service', 'atrium', 'market'], group: F },
  artwork:     { label: 'Exhibit plinth',  w: 1, h: 1, cost: 1500, rooms: ['gallery', 'atrium', 'lobby'], group: F },
  stage:       { label: 'Stage',           w: 4, h: 2, cost: 3000, rooms: ['hall'], group: F },
  lockers:     { label: 'Lockers',         w: 2, h: 1, cost: 900,  rooms: ['corridor', 'classroom', 'hall', 'lobby', 'changing', 'gym'], group: F },
  espresso:    { label: 'Espresso bar',    w: 1, h: 1, cost: 3000, rooms: ['service', 'kitchen', 'seating', 'lounge'], group: E },
  oven:        { label: 'Oven',            w: 2, h: 1, cost: 4000, rooms: ['kitchen'], group: E },
  stove:       { label: 'Range',           w: 2, h: 1, cost: 3500, rooms: ['kitchen'], group: E },
  fridge:      { label: 'Fridge',          w: 1, h: 1, cost: 1500, rooms: ['kitchen', 'service', 'storage', 'unit', 'coldroom'], group: E },
  sink:        { label: 'Sink',            w: 1, h: 1, cost: 600,  rooms: ['kitchen', 'wc', 'service', 'unit', 'exam', 'changing'], group: E },
  toilet:      { label: 'Toilet',          w: 1, h: 1, cost: 900,  rooms: ['wc', 'unit', 'changing'], group: E },
  shower:      { label: 'Shower',          w: 1, h: 1, cost: 1200, rooms: ['wc', 'unit', 'changing'], group: E },
  kitchenette: { label: 'Kitchenette',     w: 2, h: 1, cost: 2500, rooms: ['unit', 'office'], group: E },
  examBed:     { label: 'Exam chair',      w: 1, h: 2, cost: 2000, rooms: ['exam'], group: E },
  stairs:      { label: 'Stairs',          w: 2, h: 3, cost: 9000, rooms: null, group: V, vertical: true, walkable: true },
  elevator:    { label: 'Elevator',        w: 2, h: 2, cost: 25000, rooms: null, group: V, vertical: true, walkable: true, lift: true },

  // --- fashion
  rackWomen:   { label: "Women's rack",    w: 2, h: 1, cost: 800,  rooms: ['sales', 'shop'], group: F, ind: ['fashion', 'retail'], family: 'rack' },
  rackMen:     { label: "Men's rack",      w: 2, h: 1, cost: 800,  rooms: ['sales', 'shop'], group: F, ind: ['fashion', 'retail'], family: 'rack' },
  rackKids:    { label: "Kids' rack",      w: 2, h: 1, cost: 700,  rooms: ['sales', 'shop'], group: F, ind: ['fashion', 'retail'], family: 'rack' },
  mirror:      { label: 'Full mirror',     w: 1, h: 1, cost: 400,  rooms: ['fitting', 'sales', 'changing'], group: F, ind: ['fashion'] },
  miniDisplay: { label: 'Boutique display',w: 1, h: 1, cost: 1400, rooms: ['sales', 'shop'], group: F, ind: ['fashion', 'retail'], unlock: 'B', boost: { f: 3 } },
  mannequin:   { label: 'Mannequin trio',  w: 1, h: 1, cost: 1200, rooms: ['sales', 'shop'], group: D, ind: ['fashion', 'retail'], unlock: 'B', layer: 'decor', boost: { a: 3 }, decor: 1 },
  shoeWall:    { label: 'Shoe wall',       w: 3, h: 1, cost: 3200, rooms: ['sales', 'shop'], group: F, ind: ['fashion'], unlock: 'A', boost: { f: 3, a: 2 } },
  jewelCase:   { label: 'Jewellery case',  w: 1, h: 1, cost: 4500, rooms: ['sales', 'shop'], group: F, ind: ['fashion'], unlock: 'A', boost: { a: 4 } },
  spotTrack:   { label: 'Gallery spots',   w: 3, h: 1, cost: 1400, rooms: null, group: L, ind: ['fashion', 'retail', 'civic'], unlock: 'A', layer: 'decor', ceiling: true, overlay: true, walkable: true, light: 15, ambience: 0.8 },
  vipSalon:    { label: 'VIP salon',       w: 3, h: 3, cost: 9000, rooms: ['sales', 'fitting', 'lounge'], group: F, ind: ['fashion'], unlock: 'S', boost: { f: 2, a: 7 } },
  runway:      { label: 'Runway',          w: 2, h: 5, cost: 7000, rooms: ['sales', 'atrium'], group: F, ind: ['fashion'], unlock: 'S', walkable: true, boost: { a: 8 } },

  // --- food & drink
  fryer:       { label: 'Fryer station',   w: 2, h: 1, cost: 3200, rooms: ['kitchen'], group: E, ind: ['food'] },
  drinkStation:{ label: 'Drinks station',  w: 2, h: 1, cost: 1800, rooms: ['seating', 'service', 'foodcourt'], group: E, ind: ['food'] },
  booth:       { label: 'Booth seating',   w: 3, h: 2, cost: 2400, rooms: ['seating', 'foodcourt'], group: F, ind: ['food'], unlock: 'B', seats: 6, family: 'tableFam', boost: { f: 2 } },
  pizzaOven:   { label: 'Wood-fired oven', w: 2, h: 2, cost: 7000, rooms: ['kitchen', 'service', 'seating'], group: E, ind: ['food'], unlock: 'A', boost: { f: 2, a: 3 } },
  wineWall:    { label: 'Wine wall',       w: 3, h: 1, cost: 5200, rooms: ['seating', 'service', 'lounge'], group: F, ind: ['food'], unlock: 'A', boost: { a: 4 } },
  chefTable:   { label: "Chef's table",    w: 4, h: 2, cost: 9500, rooms: ['kitchen', 'seating'], group: F, ind: ['food'], unlock: 'S', seats: 8, boost: { f: 3, a: 6 } },

  // --- grocery
  fridgeProduce: { label: 'Fresh produce chiller', w: 3, h: 1, cost: 3800, rooms: ['market', 'sales'], group: E, ind: ['grocery'], family: 'chiller' },
  fridgeMeat:    { label: 'Meat chiller',          w: 3, h: 1, cost: 4200, rooms: ['market', 'sales'], group: E, ind: ['grocery'], family: 'chiller' },
  fridgeDairy:   { label: 'Dairy chiller',         w: 3, h: 1, cost: 3900, rooms: ['market', 'sales'], group: E, ind: ['grocery'], family: 'chiller' },
  shelfProduce:  { label: 'Produce crates',        w: 2, h: 1, cost: 900,  rooms: ['market', 'sales'], group: F, ind: ['grocery'], family: 'aisle' },
  shelfSnacks:   { label: 'Candy & chips aisle',   w: 3, h: 1, cost: 1100, rooms: ['market', 'sales'], group: F, ind: ['grocery'], family: 'aisle' },
  shelfCondiments:{ label: 'Condiments aisle',     w: 3, h: 1, cost: 1100, rooms: ['market', 'sales'], group: F, ind: ['grocery'], family: 'aisle' },
  checkout:      { label: 'Checkout',              w: 2, h: 1, cost: 2600, rooms: ['market', 'sales', 'shop'], group: E, ind: ['grocery', 'retail', 'fashion'] },
  drinksFridge:  { label: 'Drinks fridge',         w: 2, h: 1, cost: 3000, rooms: ['market', 'sales'], group: E, ind: ['grocery'], unlock: 'B', family: 'chiller', boost: { f: 3 } },
  bakeryCorner:  { label: 'In-store bakery',       w: 3, h: 2, cost: 8000, rooms: ['market'], group: E, ind: ['grocery'], unlock: 'A', boost: { f: 2, a: 3 } },
  gourmetDeli:   { label: 'Gourmet deli',          w: 3, h: 2, cost: 9000, rooms: ['market'], group: E, ind: ['grocery'], unlock: 'A', boost: { a: 4 } },
  juiceBar:      { label: 'Fresh juice bar',       w: 3, h: 1, cost: 6000, rooms: ['market', 'foodcourt'], group: E, ind: ['grocery', 'food'], unlock: 'S', boost: { f: 2, a: 5 } },

  // --- sport
  treadmill:   { label: 'Treadmill row',   w: 3, h: 2, cost: 9000, rooms: ['gym'], group: E, ind: ['sports'] },
  weights:     { label: 'Weights rack',    w: 2, h: 1, cost: 3000, rooms: ['gym'], group: E, ind: ['sports'] },
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
  plant:       { label: 'Potted plant',    w: 1, h: 1, cost: 150,  rooms: null, group: D, layer: 'decor', decor: 1 },
  tree:        { label: 'Street tree',     w: 1, h: 1, cost: 600,  site: true, group: S, layer: 'decor', decor: 1.5 },
  bench:       { label: 'Bench',           w: 2, h: 1, cost: 400,  site: true, group: S, layer: 'decor', decor: 0.6 },
  planter:     { label: 'Planter',         w: 2, h: 1, cost: 300,  site: true, group: S, layer: 'decor', decor: 0.8, pack: 'urban' },
  bikeRack:    { label: 'Bike rack',       w: 2, h: 1, cost: 300,  site: true, group: S, layer: 'decor', decor: 0.3, pack: 'urban' },
  pool:        { label: 'Reflecting pool', w: 3, h: 2, cost: 8000, site: true, group: S, layer: 'decor', decor: 3, pack: 'urban', boost: { a: 5 } },
  oakTree:     { label: 'Heritage oak',    w: 2, h: 2, cost: 3000, site: true, group: S, layer: 'decor', decor: 4, pack: 'botanical', boost: { a: 3 } },
  palm:        { label: 'Indoor palm',     w: 1, h: 1, cost: 700,  rooms: null, group: D, layer: 'decor', decor: 2, pack: 'botanical' },
  greenWall:   { label: 'Green wall',      w: 3, h: 1, cost: 3500, rooms: null, group: D, layer: 'decor', decor: 3, pack: 'botanical', boost: { a: 4 } },
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
  sportFloor:  { label: 'Sprung sport floor', kind: 'floor', cost: 140, color: '#c9a46b', tags: ['civic', 'playful'], ind: ['sports'], unlock: 'B' },
}

// Interior wall paints, per room.
export const PAINTS = {
  chalk:      { label: 'Chalk white', color: '#f1efe8', tags: ['minimal', 'civic'], base: true },
  cream:      { label: 'Warm cream',  color: '#eee2c8', tags: ['warm', 'heritage'], base: true },
  stone:      { label: 'Stone grey',  color: '#c9c7bf', tags: ['minimal', 'corporate'], base: true },
  sage:       { label: 'Sage',        color: '#b5c3a5', tags: ['eco', 'warm'], pack: 'earth' },
  terracotta: { label: 'Terracotta',  color: '#c8775a', tags: ['warm', 'heritage'], pack: 'earth' },
  ochre:      { label: 'Ochre',       color: '#d9a94e', tags: ['playful', 'heritage'], pack: 'earth' },
  blush:      { label: 'Blush',       color: '#e8bfb6', tags: ['playful', 'luxe'], pack: 'moody' },
  navy:       { label: 'Deep navy',   color: '#34465e', tags: ['corporate', 'luxe'], pack: 'moody' },
  charcoal:   { label: 'Charcoal',    color: '#4a4c4d', tags: ['industrial', 'luxe'], pack: 'moody' },
}

// Ceiling finishes, per room. Shown in 3D when the Ceiling tool is active.
export const CEILINGS = {
  plain:    { label: 'Plain plaster',    color: '#f3f2ee', cost: 25,  tags: [], base: true },
  acoustic: { label: 'Acoustic tiles',   color: '#e3e4e0', cost: 45,  tags: ['corporate', 'civic'], base: true, boost: { f: 0.5 } },
  slats:    { label: 'Timber slats',     color: '#c49a6c', cost: 120, tags: ['warm', 'eco'], pack: 'ceilings' },
  coffered: { label: 'Coffered plaster', color: '#efe6d6', cost: 160, tags: ['heritage', 'luxe', 'civic'], pack: 'ceilings' },
  exposed:  { label: 'Exposed services', color: '#5b6166', cost: 30,  tags: ['industrial'], pack: 'ceilings' },
}

// Entrance doors (all street doors use the project's entrance style).
export const DOORS = {
  standard: { label: 'Standard door',      color: '#2f3539', cost: 0,    tags: [], base: true },
  glazed:   { label: 'Glazed double door', color: '#8fb6c9', cost: 2500, tags: ['minimal', 'corporate'], pack: 'entrances', boost: { a: 2 } },
  pivot:    { label: 'Timber pivot door',  color: '#8a5f3c', cost: 4200, tags: ['warm', 'luxe'], pack: 'entrances', boost: { a: 3 } },
  revolving:{ label: 'Revolving door',     color: '#b9c3c8', cost: 9000, tags: ['corporate', 'luxe'], pack: 'entrances', boost: { f: 2, a: 2 } },
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
