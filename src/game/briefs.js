import { BASE_COST, ITEMS } from './catalog.js'

// Commission archetypes. Tiers unlock with reputation.
// rooms: program (min area per room in m², how many rooms).
// items: required furniture/equipment (optional `in` = room type it must sit in).
// adj: room types that should be connected by a door.
export const TIERS = [
  { tier: 1, name: 'Small commissions', rep: 0 },
  { tier: 2, name: 'Neighbourhood buildings', rep: 20 },
  { tier: 3, name: 'Civic & residential', rep: 55 },
  { tier: 4, name: 'Landmarks', rep: 110 },
]

export const BRIEFS = {
  cafe: {
    tier: 1, name: 'Corner Café', icon: 'coffee',
    blurb: 'A small café that survives the morning rush and still feels like a place to linger.',
    lot: { w: 18, h: 14 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'seating', min: 28 }, { type: 'service', min: 8 }, { type: 'kitchen', min: 8 }, { type: 'wc', min: 3 }],
    items: [{ type: 'counter' }, { type: 'espresso' }, { type: 'table', count: 4, in: 'seating' }, { type: 'oven' }, { type: 'sink', in: 'kitchen' }, { type: 'toilet' }],
    adj: [['seating', 'service'], ['service', 'kitchen']],
    styles: ['warm', 'minimal', 'playful', 'industrial'],
    clients: ['Ochre & Oat', 'Morning Ritual', 'Café Lindqvist', 'The Daily Grind'],
  },
  bakery: {
    tier: 1, name: 'Neighbourhood Bakery', icon: 'bread',
    blurb: 'Bread at 6 am, pastries all day. The bakers need a real kitchen; the street needs a shop window.',
    lot: { w: 16, h: 14 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'sales', min: 16 }, { type: 'kitchen', min: 18 }, { type: 'storage', min: 4 }, { type: 'wc', min: 3 }],
    items: [{ type: 'display', count: 2 }, { type: 'counter' }, { type: 'oven', count: 2 }, { type: 'sink', in: 'kitchen' }, { type: 'shelving', in: 'storage' }, { type: 'toilet' }],
    adj: [['sales', 'kitchen'], ['kitchen', 'storage']],
    styles: ['warm', 'heritage', 'playful', 'eco'],
    clients: ['Crumb & Co.', 'Panadería Sol', 'Rye Society', 'Flour Hour'],
  },
  boutique: {
    tier: 1, name: 'Fashion Boutique', icon: 'shirt',
    blurb: 'A bright, uncluttered shop floor with fitting rooms close at hand.',
    lot: { w: 16, h: 12 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'sales', min: 32 }, { type: 'fitting', min: 3, count: 2 }, { type: 'storage', min: 6 }, { type: 'wc', min: 3 }],
    items: [{ type: 'rack', count: 4 }, { type: 'counter' }, { type: 'display' }, { type: 'shelving', in: 'storage' }, { type: 'toilet' }],
    adj: [['sales', 'fitting'], ['sales', 'storage']],
    styles: ['minimal', 'luxe', 'industrial', 'playful'],
    clients: ['Maison Vey', 'Thread Theory', 'Atelier Nord', 'Second Skin'],
  },
  bistro: {
    tier: 2, name: 'Bistro Restaurant', icon: 'utensils',
    blurb: 'Sixty covers, a serious kitchen and a dining room people book weeks ahead.',
    lot: { w: 22, h: 16 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'seating', min: 55 }, { type: 'service', min: 8 }, { type: 'kitchen', min: 22 }, { type: 'storage', min: 6 }, { type: 'wc', min: 3, count: 2 }],
    items: [{ type: 'table', count: 8, in: 'seating' }, { type: 'counter' }, { type: 'stove', count: 2 }, { type: 'oven' }, { type: 'fridge' }, { type: 'sink', count: 2, in: 'kitchen' }, { type: 'toilet', count: 2 }],
    adj: [['seating', 'service'], ['service', 'kitchen'], ['kitchen', 'storage']],
    styles: ['warm', 'luxe', 'heritage', 'industrial'],
    clients: ['Chez Margaux', 'Osteria Fumo', 'Salt & Ember', 'The Long Table'],
  },
  clinic: {
    tier: 2, name: 'Dental Clinic', icon: 'cross',
    blurb: 'Calm waiting, efficient treatment rooms and staff who never cross the waiting room with instruments.',
    lot: { w: 20, h: 16 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'waiting', min: 18 }, { type: 'exam', min: 10, count: 3 }, { type: 'office', min: 8 }, { type: 'storage', min: 4 }, { type: 'wc', min: 3 }],
    items: [{ type: 'reception', in: 'waiting' }, { type: 'sofa', count: 2 }, { type: 'examBed', count: 3 }, { type: 'sink', count: 3, in: 'exam' }, { type: 'desk', in: 'office' }, { type: 'toilet' }],
    adj: [['waiting', 'exam'], ['exam', 'storage']],
    styles: ['minimal', 'civic', 'eco', 'corporate'],
    clients: ['Bright Smile Dental', 'Dr. Okafor & Partners', 'Pearl Clinic', 'Molar City'],
  },
  library: {
    tier: 2, name: 'Branch Library', icon: 'book',
    blurb: 'A neighbourhood living room: quiet reading, open stacks and space for kids after school.',
    lot: { w: 24, h: 18 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'lobby', min: 12 }, { type: 'reading', min: 40 }, { type: 'stacks', min: 36 }, { type: 'office', min: 8 }, { type: 'wc', min: 3, count: 2 }],
    items: [{ type: 'reception', in: 'lobby' }, { type: 'shelving', count: 8, in: 'stacks' }, { type: 'table', count: 4, in: 'reading' }, { type: 'sofa', count: 2 }, { type: 'desk', in: 'office' }, { type: 'toilet', count: 2 }],
    adj: [['lobby', 'reading'], ['lobby', 'stacks'], ['reading', 'stacks']],
    styles: ['civic', 'warm', 'eco', 'minimal'],
    clients: ['Eastside Libraries', 'City Library Board', 'Friends of Mill Street', 'Northgate Trust'],
  },
  apartments: {
    tier: 3, name: 'Apartment Block', icon: 'building',
    blurb: 'Six homes over three or more floors, with a lift, a proper entrance and daylight in every flat.',
    lot: { w: 22, h: 16 }, levels: { min: 3, max: 5 },
    rooms: [{ type: 'lobby', min: 12 }, { type: 'unit', min: 34, count: 6 }],
    items: [{ type: 'elevator' }, { type: 'stairs' }, { type: 'bed', count: 6 }, { type: 'kitchenette', count: 6 }, { type: 'shower', count: 6 }, { type: 'toilet', count: 6, in: 'unit' }],
    adj: [],
    styles: ['warm', 'minimal', 'eco', 'heritage'],
    clients: ['Kestrel Housing Co-op', 'Linden Living', 'Harbour Homes', 'Viale Residences'],
    needsLift: true,
  },
  school: {
    tier: 3, name: 'Primary School', icon: 'school',
    blurb: 'Four bright classrooms, a hall for assemblies and a front door parents can find in the rain.',
    lot: { w: 30, h: 22 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'lobby', min: 14 }, { type: 'classroom', min: 30, count: 4 }, { type: 'hall', min: 60 }, { type: 'office', min: 10 }, { type: 'wc', min: 6, count: 2 }],
    items: [{ type: 'reception', in: 'lobby' }, { type: 'deskRow', count: 8 }, { type: 'stage', in: 'hall' }, { type: 'toilet', count: 4 }, { type: 'lockers', count: 2 }],
    adj: [['lobby', 'hall'], ['lobby', 'office']],
    styles: ['playful', 'civic', 'eco', 'warm'],
    clients: ['Riverside School District', 'Oakhill Primary', 'St. Brigid\'s Parish', 'Learning Commons Trust'],
    needsLift: true,
  },
  museum: {
    tier: 3, name: 'Art Museum', icon: 'frame',
    blurb: 'A sequence of galleries that rewards wandering, around an atrium that welcomes everyone.',
    lot: { w: 30, h: 22 }, levels: { min: 1, max: 3 },
    rooms: [{ type: 'atrium', min: 45 }, { type: 'gallery', min: 45, count: 3 }, { type: 'seating', min: 22 }, { type: 'storage', min: 14 }, { type: 'office', min: 8 }, { type: 'wc', min: 4, count: 2 }],
    items: [{ type: 'reception', in: 'atrium' }, { type: 'artwork', count: 9, in: 'gallery' }, { type: 'table', count: 3, in: 'seating' }, { type: 'counter' }, { type: 'toilet', count: 2 }],
    adj: [['atrium', 'gallery'], ['atrium', 'seating'], ['gallery', 'storage']],
    styles: ['civic', 'minimal', 'luxe', 'heritage'],
    clients: ['Halvorsen Foundation', 'City Arts Council', 'The Weller Collection', 'Museo del Río'],
    needsLift: true,
  },
  tower: {
    tier: 4, name: 'Office Tower', icon: 'tower',
    blurb: 'Five-plus floors of flexible workspace stacked around an efficient core. The skyline is watching.',
    lot: { w: 24, h: 20 }, levels: { min: 5, max: 8 },
    rooms: [{ type: 'lobby', min: 30 }, { type: 'openOffice', min: 110, count: 4 }, { type: 'meeting', min: 12, count: 4 }, { type: 'wc', min: 5, count: 4 }],
    items: [{ type: 'elevator' }, { type: 'stairs' }, { type: 'reception', in: 'lobby' }, { type: 'desk', count: 32 }, { type: 'bigTable', count: 4, in: 'meeting' }, { type: 'toilet', count: 8 }],
    adj: [['lobby', 'meeting']],
    styles: ['corporate', 'minimal', 'luxe', 'industrial'],
    clients: ['Meridian Capital', 'Vantage Group', 'Holloway & Pike', 'Nimbus Systems'],
    needsLift: true,
  },
  mall: {
    tier: 4, name: 'Shopping Centre', icon: 'bag',
    blurb: 'Eight shops, a food court and an atrium that makes people forget their phones for a minute.',
    lot: { w: 40, h: 30 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'atrium', min: 110 }, { type: 'shop', min: 36, count: 8 }, { type: 'foodcourt', min: 90 }, { type: 'storage', min: 20 }, { type: 'wc', min: 8, count: 2 }],
    items: [{ type: 'counter', count: 11 }, { type: 'rack', count: 8, in: 'shop' }, { type: 'table', count: 10, in: 'foodcourt' }, { type: 'toilet', count: 6 }, { type: 'elevator' }, { type: 'plant', count: 6 }],
    adj: [['atrium', 'shop'], ['atrium', 'foodcourt']],
    styles: ['playful', 'luxe', 'corporate', 'minimal'],
    clients: ['Westfield Arc', 'Galleria Nova', 'Harbourside Retail', 'The Exchange'],
    needsLift: true,
  },
  grandMuseum: {
    tier: 4, name: 'National Museum', icon: 'landmark',
    blurb: 'The commission of a lifetime: a national collection, a grand hall, and a building for the stamps.',
    lot: { w: 40, h: 30 }, levels: { min: 2, max: 4 },
    rooms: [{ type: 'atrium', min: 140 }, { type: 'gallery', min: 70, count: 6 }, { type: 'hall', min: 80 }, { type: 'seating', min: 40 }, { type: 'storage', min: 30 }, { type: 'office', min: 12, count: 2 }, { type: 'wc', min: 6, count: 3 }],
    items: [{ type: 'reception', in: 'atrium' }, { type: 'artwork', count: 24, in: 'gallery' }, { type: 'stage', in: 'hall' }, { type: 'table', count: 6, in: 'seating' }, { type: 'counter' }, { type: 'elevator' }, { type: 'stairs' }, { type: 'toilet', count: 6 }],
    adj: [['atrium', 'gallery'], ['atrium', 'hall'], ['atrium', 'seating'], ['gallery', 'storage']],
    styles: ['civic', 'heritage', 'luxe', 'minimal'],
    clients: ['Ministry of Culture', 'National Heritage Board', 'The Crown Collection', 'Republic Arts Trust'],
    needsLift: true,
  },
}

// Client twists make the same building type play differently from run to run.
export const TWISTS = {
  tight:    { name: 'Tight budget',      text: 'Budget is 15% lower than usual.', budget: 0.85, rep: 1.2 },
  flagship: { name: 'Flagship project',  text: 'Generous budget, but the client judges looks twice as hard.', budget: 1.3, weights: { aesthetics: 2 }, rep: 1.1 },
  daylight: { name: 'Light-obsessed',    text: 'Every lived-in room must have daylight. Daylight counts double.', daylightWeight: 2, rep: 1.1 },
  heritage: { name: 'Heritage district', text: 'Facade must be brick, timber or travertine.', facades: ['brick', 'timberClad', 'travertine'], rep: 1.25 },
  green:    { name: 'Green mandate',     text: 'Plant at least 6 trees, plants or green walls.', greenery: 6, rep: 1.15 },
  efficient:{ name: 'Efficiency nerd',   text: 'Client measures walking distances. Functionality counts double.', weights: { functionality: 2 }, rep: 1.1 },
}

export function briefArea(brief) {
  return brief.rooms.reduce((s, r) => s + r.min * (r.count || 1), 0)
}

// Budget is derived from the program so it stays sane as content changes.
export function estimateBudget(brief) {
  const area = briefArea(brief) * 1.22
  const levels = brief.levels.min
  const footprint = area / levels
  const perimeter = 4 * Math.sqrt(footprint) * 1.2
  let shell = 0
  for (let l = 0; l < levels; l++) shell += footprint * BASE_COST.perM2 * (1 + l * BASE_COST.levelPremium)
  const facade = perimeter * levels * 380
  const finishes = area * 110
  const items = brief.items.reduce((s, it) => s + ITEMS[it.type].cost * (it.count || 1), 0)
  const vertical = levels > 1 ? (ITEMS.stairs.cost + (brief.needsLift ? ITEMS.elevator.cost : 0)) * levels : 0
  const openings = Math.ceil(perimeter * levels / 3) * BASE_COST.window + brief.rooms.length * 2 * BASE_COST.door
  return Math.round((shell + facade + finishes + items + vertical + openings) * 1.22 / 1000) * 1000
}
