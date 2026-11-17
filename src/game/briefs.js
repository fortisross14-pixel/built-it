import { BASE_COST, FAMILIES, ITEMS, PRODUCTS } from './catalog.js'

// Commission archetypes on a 1–10 difficulty ladder. Several industries climb their own
// ladder (neighbourhood boutique → chain flagship → luxury maison), but the hardest shop is
// still far simpler than an airport.
// rooms: program (min m² per room, how many). items: required pieces; `family` accepts any
// variant (e.g. any clothes rack), `in` = the room type it must stand in.
export const BRIEFS = {
  // ---------------------------------------------------------------- level 1: the three basics
  boutique: {
    industry: 'fashion', level: 1, name: 'Neighbourhood Boutique',
    blurb: 'A friendly corner shop for clothes: racks for everyone, a fitting room and a till.',
    lot: { w: 16, h: 12 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'sales', min: 30 }, { type: 'fitting', min: 3, count: 2 }, { type: 'storage', min: 5 }, { type: 'wc', min: 3 }],
    items: [{ type: 'rack', count: 4 }, { type: 'rack', product: 'women' }, { type: 'rack', product: 'men' }, { type: 'checkout' }, { type: 'mirror', in: 'fitting' }, { type: 'shelving', in: 'storage' }, { type: 'toilet' }],
    adj: [['sales', 'fitting'], ['sales', 'storage']],
    styles: ['minimal', 'playful', 'warm', 'industrial'],
    clients: ['Thread Theory', 'Second Skin', 'Loom & Co.', 'Hem Street'],
  },
  fastFood: {
    industry: 'food', level: 1, name: 'Fast-food Counter',
    blurb: 'Burgers, fries and a queue that never stops. Speed is everything.',
    lot: { w: 16, h: 12 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'seating', min: 24 }, { type: 'kitchen', min: 12 }, { type: 'storage', min: 4 }, { type: 'wc', min: 3 }],
    items: [{ type: 'counter', in: 'seating' }, { type: 'fryer' }, { type: 'stove' }, { type: 'drinkStation' }, { family: 'tableFam', count: 3, in: 'seating' }, { type: 'sink', in: 'kitchen' }, { type: 'toilet' }],
    adj: [['seating', 'kitchen'], ['kitchen', 'storage']],
    styles: ['playful', 'industrial', 'minimal', 'warm'],
    clients: ['Big Bun', 'Crunch Shack', 'Flip Burgers', 'Fry Society'],
  },
  cornerShop: {
    industry: 'grocery', level: 1, name: 'Corner Grocery',
    blurb: 'Fresh produce, milk, snacks and a friendly till. Every neighbourhood needs one.',
    lot: { w: 16, h: 14 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'market', min: 40 }, { type: 'storage', min: 8 }, { type: 'wc', min: 3 }],
    items: [{ type: 'chiller', product: 'produce' }, { type: 'chiller', product: 'dairy' }, { type: 'aisle', product: 'produce' }, { type: 'aisle', product: 'snacks' }, { type: 'aisle', product: 'condiments' }, { type: 'checkout' }, { type: 'shelving', in: 'storage' }, { type: 'toilet' }],
    adj: [['market', 'storage']],
    styles: ['warm', 'eco', 'playful', 'heritage'],
    clients: ['Mama Rosa Market', 'The Green Grocer', 'Corner Fresh', 'Ali\'s Store'],
  },
  // ---------------------------------------------------------------- level 2
  cafe: {
    industry: 'food', level: 2, name: 'Corner Café',
    blurb: 'A small café that survives the morning rush and still feels like a place to linger.',
    lot: { w: 18, h: 14 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'seating', min: 28 }, { type: 'service', min: 8 }, { type: 'kitchen', min: 8 }, { type: 'wc', min: 3 }],
    items: [{ type: 'counter' }, { type: 'espresso' }, { family: 'tableFam', count: 4, in: 'seating' }, { type: 'oven' }, { type: 'sink', in: 'kitchen' }, { type: 'toilet' }],
    adj: [['seating', 'service'], ['service', 'kitchen']],
    styles: ['warm', 'minimal', 'playful', 'industrial'],
    clients: ['Ochre & Oat', 'Morning Ritual', 'Café Lindqvist', 'The Daily Grind'],
  },
  fastFashion: {
    industry: 'fashion', level: 2, name: 'Fast-fashion Store',
    blurb: 'High volume, quick turnover: wide aisles, lots of racks, a fitting-room bank and fast tills.',
    lot: { w: 20, h: 14 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'sales', min: 70 }, { type: 'fitting', min: 3, count: 3 }, { type: 'storage', min: 10 }, { type: 'wc', min: 3 }],
    items: [{ type: 'rack', count: 8 }, { type: 'rack', product: 'women', count: 2 }, { type: 'rack', product: 'men', count: 2 }, { type: 'rack', product: 'kids' }, { type: 'checkout', count: 2 }, { type: 'mirror', count: 2 }, { type: 'display' }],
    adj: [['sales', 'fitting'], ['sales', 'storage']],
    styles: ['playful', 'minimal', 'industrial', 'corporate'],
    clients: ['Zippa', 'NowNow', 'Hype Lane', 'Trend Republic'],
  },
  bakery: {
    industry: 'food', level: 2, name: 'Neighbourhood Bakery',
    blurb: 'Bread at 6 am, pastries all day. The bakers need a real kitchen; the street needs a shop window.',
    lot: { w: 16, h: 14 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'sales', min: 16 }, { type: 'kitchen', min: 18 }, { type: 'storage', min: 4 }, { type: 'wc', min: 3 }],
    items: [{ type: 'display', count: 2 }, { type: 'counter' }, { type: 'oven', count: 2 }, { type: 'sink', in: 'kitchen' }, { type: 'shelving', in: 'storage' }, { type: 'toilet' }],
    adj: [['sales', 'kitchen'], ['kitchen', 'storage']],
    styles: ['warm', 'heritage', 'playful', 'eco'],
    clients: ['Crumb & Co.', 'Panadería Sol', 'Rye Society', 'Flour Hour'],
  },
  // ---------------------------------------------------------------- level 3
  bistro: {
    industry: 'food', level: 3, name: 'Bistro Restaurant',
    blurb: 'Sixty covers, a serious kitchen and a dining room people book weeks ahead.',
    lot: { w: 22, h: 16 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'seating', min: 55 }, { type: 'service', min: 8 }, { type: 'kitchen', min: 22 }, { type: 'storage', min: 6 }, { type: 'wc', min: 3, count: 2 }],
    items: [{ family: 'tableFam', count: 8, in: 'seating' }, { type: 'counter' }, { type: 'stove', count: 2 }, { type: 'oven' }, { type: 'fridge' }, { type: 'sink', count: 2, in: 'kitchen' }, { type: 'toilet', count: 2 }],
    adj: [['seating', 'service'], ['service', 'kitchen'], ['kitchen', 'storage']],
    styles: ['warm', 'luxe', 'heritage', 'industrial'],
    clients: ['Chez Margaux', 'Osteria Fumo', 'Salt & Ember', 'The Long Table'],
  },
  supermarket: {
    industry: 'grocery', level: 3, name: 'Neighbourhood Supermarket',
    blurb: 'A proper weekly shop: produce, meat, dairy, long aisles, a cold room and a bank of tills.',
    lot: { w: 26, h: 18 }, levels: { min: 1, max: 1 },
    rooms: [{ type: 'market', min: 160 }, { type: 'coldroom', min: 12 }, { type: 'storage', min: 20 }, { type: 'office', min: 8 }, { type: 'wc', min: 3, count: 2 }],
    items: [{ type: 'chiller', product: 'produce', count: 2 }, { type: 'chiller', product: 'meat', count: 2 }, { type: 'chiller', product: 'dairy', count: 2 }, { type: 'chiller', product: 'frozen', count: 2 }, { type: 'aisle', product: 'produce', count: 3 }, { type: 'aisle', product: 'snacks', count: 3 }, { type: 'aisle', product: 'condiments', count: 3 }, { type: 'checkout', count: 3 }, { type: 'fridge', in: 'coldroom' }, { type: 'toilet', count: 2 }],
    adj: [['market', 'coldroom'], ['market', 'storage']],
    styles: ['eco', 'minimal', 'warm', 'corporate'],
    clients: ['FreshWay', 'Basket & Co.', 'Daily Harvest', 'Mercato Verde'],
  },
  clinic: {
    industry: 'health', level: 3, name: 'Dental Clinic',
    blurb: 'Calm waiting, efficient treatment rooms and staff who never cross the waiting room with instruments.',
    lot: { w: 20, h: 16 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'waiting', min: 18 }, { type: 'exam', min: 10, count: 3 }, { type: 'office', min: 8 }, { type: 'storage', min: 4 }, { type: 'wc', min: 3 }],
    items: [{ type: 'reception', in: 'waiting' }, { type: 'sofa', count: 2 }, { type: 'examBed', count: 3 }, { type: 'sink', count: 3, in: 'exam' }, { type: 'desk', in: 'office' }, { type: 'toilet' }],
    adj: [['waiting', 'exam'], ['exam', 'storage']],
    styles: ['minimal', 'civic', 'eco', 'corporate'],
    clients: ['Bright Smile Dental', 'Dr. Okafor & Partners', 'Pearl Clinic', 'Molar City'],
  },
  gym: {
    industry: 'sports', level: 3, name: 'Boutique Gym',
    blurb: 'A neighbourhood gym: cardio, free weights, changing rooms people are not embarrassed by.',
    lot: { w: 22, h: 16 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'gym', min: 90 }, { type: 'changing', min: 12, count: 2 }, { type: 'lobby', min: 10 }, { type: 'office', min: 6 }],
    items: [{ type: 'reception', in: 'lobby' }, { type: 'treadmill', count: 2 }, { type: 'weights', count: 3 }, { type: 'lockers', count: 2, in: 'changing' }, { type: 'shower', count: 4 }, { type: 'toilet', count: 2 }],
    adj: [['lobby', 'gym'], ['gym', 'changing']],
    styles: ['industrial', 'minimal', 'playful', 'corporate'],
    clients: ['Iron & Oak', 'PulseLab', 'Kinetic Club', 'Rep House'],
  },
  library: {
    industry: 'civic', level: 3, name: 'Branch Library',
    blurb: 'A neighbourhood living room: quiet reading, open stacks and space for kids after school.',
    lot: { w: 24, h: 18 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'lobby', min: 12 }, { type: 'reading', min: 40 }, { type: 'stacks', min: 36 }, { type: 'office', min: 8 }, { type: 'wc', min: 3, count: 2 }],
    items: [{ type: 'reception', in: 'lobby' }, { type: 'shelving', count: 8, in: 'stacks' }, { type: 'table', count: 4, in: 'reading' }, { type: 'sofa', count: 2 }, { type: 'desk', in: 'office' }, { type: 'toilet', count: 2 }],
    adj: [['lobby', 'reading'], ['lobby', 'stacks'], ['reading', 'stacks']],
    styles: ['civic', 'warm', 'eco', 'minimal'],
    clients: ['Eastside Libraries', 'City Library Board', 'Friends of Mill Street', 'Northgate Trust'],
  },
  // ---------------------------------------------------------------- level 4
  fashionChain: {
    industry: 'fashion', level: 4, name: 'International Chain Flagship',
    blurb: 'Two floors of a global brand: departments for women, men and kids, a lift and a fitting-room suite.',
    lot: { w: 24, h: 18 }, levels: { min: 2, max: 2 },
    rooms: [{ type: 'sales', min: 110, count: 2 }, { type: 'fitting', min: 3, count: 4 }, { type: 'storage', min: 16 }, { type: 'office', min: 8 }, { type: 'wc', min: 3, count: 2 }],
    items: [{ type: 'rack', count: 14 }, { type: 'rack', product: 'women', count: 4 }, { type: 'rack', product: 'men', count: 4 }, { type: 'rack', product: 'kids', count: 3 }, { type: 'checkout', count: 3 }, { type: 'display', count: 3 }, { type: 'mirror', count: 4 }, { type: 'elevator' }, { type: 'stairs' }],
    adj: [['sales', 'fitting'], ['sales', 'storage']],
    styles: ['corporate', 'minimal', 'playful', 'luxe'],
    clients: ['Nordvik', 'Maison Global', 'Urban Thread Int.', 'KAIZEN Apparel'],
    needsLift: true,
  },
  // ---------------------------------------------------------------- level 5
  apartments: {
    industry: 'housing', level: 5, name: 'Apartment Block',
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
    industry: 'civic', level: 5, name: 'Primary School',
    blurb: 'Four bright classrooms, a hall for assemblies and a front door parents can find in the rain.',
    lot: { w: 30, h: 22 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'lobby', min: 14 }, { type: 'classroom', min: 30, count: 4 }, { type: 'hall', min: 60 }, { type: 'office', min: 10 }, { type: 'wc', min: 6, count: 2 }],
    items: [{ type: 'reception', in: 'lobby' }, { type: 'deskRow', count: 8 }, { type: 'stage', in: 'hall' }, { type: 'toilet', count: 4 }, { type: 'lockers', count: 2 }],
    adj: [['lobby', 'hall'], ['lobby', 'office']],
    styles: ['playful', 'civic', 'eco', 'warm'],
    clients: ['Riverside School District', 'Oakhill Primary', 'St. Brigid\'s Parish', 'Learning Commons Trust'],
    needsLift: true,
  },
  fineDining: {
    industry: 'food', level: 5, name: 'Fine-dining Restaurant',
    blurb: 'Tasting menus, a sommelier and a kitchen brigade of twelve. Every detail is reviewed.',
    lot: { w: 24, h: 18 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'lobby', min: 10 }, { type: 'seating', min: 60 }, { type: 'lounge', min: 16 }, { type: 'kitchen', min: 34 }, { type: 'coldroom', min: 6 }, { type: 'storage', min: 8 }, { type: 'wc', min: 4, count: 2 }],
    items: [{ family: 'tableFam', count: 10, in: 'seating' }, { type: 'counter', in: 'lounge' }, { type: 'stove', count: 3 }, { type: 'oven', count: 2 }, { type: 'sink', count: 3, in: 'kitchen' }, { type: 'fridge', count: 2 }, { type: 'toilet', count: 2 }],
    adj: [['lobby', 'lounge'], ['lounge', 'seating'], ['seating', 'kitchen'], ['kitchen', 'coldroom']],
    styles: ['luxe', 'minimal', 'heritage', 'warm'],
    clients: ['Maison Aurèle', 'Kōen', 'Ember & Vine', 'Restaurant Saga'],
  },
  // ---------------------------------------------------------------- level 6
  museum: {
    industry: 'civic', level: 6, name: 'Art Museum',
    blurb: 'A sequence of galleries that rewards wandering, around an atrium that welcomes everyone.',
    lot: { w: 30, h: 22 }, levels: { min: 1, max: 3 },
    rooms: [{ type: 'atrium', min: 45 }, { type: 'gallery', min: 45, count: 3 }, { type: 'seating', min: 22 }, { type: 'storage', min: 14 }, { type: 'office', min: 8 }, { type: 'wc', min: 4, count: 2 }],
    items: [{ type: 'reception', in: 'atrium' }, { type: 'artwork', count: 9, in: 'gallery' }, { family: 'tableFam', count: 3, in: 'seating' }, { type: 'counter' }, { type: 'toilet', count: 2 }],
    adj: [['atrium', 'gallery'], ['atrium', 'seating'], ['gallery', 'storage']],
    styles: ['civic', 'minimal', 'luxe', 'heritage'],
    clients: ['Halvorsen Foundation', 'City Arts Council', 'The Weller Collection', 'Museo del Río'],
    needsLift: true,
  },
  luxury: {
    industry: 'fashion', level: 6, name: 'Luxury Maison',
    blurb: 'A couture house: a hushed shop floor, private salons, an atelier upstairs. Nothing is ordinary.',
    lot: { w: 22, h: 16 }, levels: { min: 2, max: 3 },
    rooms: [{ type: 'lobby', min: 14 }, { type: 'sales', min: 70, count: 2 }, { type: 'lounge', min: 16 }, { type: 'fitting', min: 6, count: 3 }, { type: 'office', min: 14 }, { type: 'storage', min: 10 }, { type: 'wc', min: 4 }],
    items: [{ type: 'rack', count: 6 }, { type: 'rack', product: 'women', count: 3 }, { type: 'rack', product: 'men', count: 2 }, { type: 'display', count: 4 }, { type: 'sofa', count: 3 }, { type: 'mirror', count: 3 }, { type: 'checkout' }, { type: 'elevator' }, { type: 'stairs' }],
    adj: [['lobby', 'sales'], ['sales', 'fitting'], ['sales', 'lounge']],
    styles: ['luxe', 'heritage', 'minimal'],
    clients: ['Maison Vey', 'Atelier Noir', 'Casa Orsini', 'House of Ilse'],
    needsLift: true,
  },
  sportsHall: {
    industry: 'sports', level: 6, name: 'Community Sports Hall',
    blurb: 'A full court with seating, a fitness floor and changing rooms for whole teams.',
    lot: { w: 34, h: 24 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'lobby', min: 20 }, { type: 'court', min: 300 }, { type: 'gym', min: 60 }, { type: 'changing', min: 20, count: 2 }, { type: 'storage', min: 16 }, { type: 'office', min: 8 }, { type: 'wc', min: 4, count: 2 }],
    items: [{ type: 'reception', in: 'lobby' }, { type: 'courtLines' }, { type: 'bleachers', count: 2 }, { type: 'treadmill', count: 2 }, { type: 'weights', count: 2 }, { type: 'lockers', count: 4 }, { type: 'shower', count: 6 }, { type: 'toilet', count: 4 }],
    adj: [['lobby', 'court'], ['court', 'changing'], ['court', 'storage']],
    styles: ['civic', 'industrial', 'playful', 'eco'],
    clients: ['Westside Leisure Trust', 'City Sport', 'Harbour Athletic', 'Parkside Community Club'],
    needsLift: true,
  },
  // ---------------------------------------------------------------- level 7
  foodHall: {
    industry: 'grocery', level: 7, name: 'Gourmet Food Hall',
    blurb: 'A destination market on two floors: fresh counters, chilled halls, a café upstairs and deliveries that never cross the shoppers.',
    lot: { w: 32, h: 24 }, levels: { min: 2, max: 2 },
    rooms: [{ type: 'market', min: 200, count: 2 }, { type: 'seating', min: 50 }, { type: 'kitchen', min: 20 }, { type: 'coldroom', min: 20 }, { type: 'storage', min: 30 }, { type: 'office', min: 10 }, { type: 'wc', min: 4, count: 3 }],
    items: [{ type: 'chiller', product: 'produce', count: 3 }, { type: 'chiller', product: 'meat', count: 3 }, { type: 'chiller', product: 'dairy', count: 3 }, { type: 'chiller', product: 'frozen', count: 3 }, { type: 'aisle', count: 10 }, { type: 'checkout', count: 4 }, { type: 'counter', count: 2 }, { family: 'tableFam', count: 8, in: 'seating' }, { type: 'oven' }, { type: 'elevator' }, { type: 'stairs' }, { type: 'toilet', count: 3 }],
    adj: [['market', 'coldroom'], ['market', 'storage'], ['seating', 'kitchen']],
    styles: ['warm', 'heritage', 'luxe', 'eco'],
    clients: ['Mercato Centrale', 'Halle Gourmande', 'The Pantry Hall', 'Borough Provisions'],
    needsLift: true,
  },
  // ---------------------------------------------------------------- level 8
  tower: {
    industry: 'office', level: 8, name: 'Office Tower',
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
    industry: 'retail', level: 8, name: 'Shopping Centre',
    blurb: 'Eight shops, a food court and an atrium that makes people forget their phones for a minute.',
    lot: { w: 40, h: 30 }, levels: { min: 1, max: 2 },
    rooms: [{ type: 'atrium', min: 110 }, { type: 'shop', min: 36, count: 8 }, { type: 'foodcourt', min: 90 }, { type: 'storage', min: 20 }, { type: 'wc', min: 8, count: 2 }],
    items: [{ type: 'counter', count: 11 }, { type: 'rack', count: 8, in: 'shop' }, { family: 'tableFam', count: 10, in: 'foodcourt' }, { type: 'toilet', count: 6 }, { type: 'elevator' }, { type: 'plant', count: 6 }],
    adj: [['atrium', 'shop'], ['atrium', 'foodcourt']],
    styles: ['playful', 'luxe', 'corporate', 'minimal'],
    clients: ['Westfield Arc', 'Galleria Nova', 'Harbourside Retail', 'The Exchange'],
    needsLift: true,
  },
  // ---------------------------------------------------------------- level 9
  grandMuseum: {
    industry: 'civic', level: 9, name: 'National Museum',
    blurb: 'A national collection, a grand hall, and a building for the stamps.',
    lot: { w: 40, h: 30 }, levels: { min: 2, max: 4 },
    rooms: [{ type: 'atrium', min: 140 }, { type: 'gallery', min: 70, count: 6 }, { type: 'hall', min: 80 }, { type: 'seating', min: 40 }, { type: 'storage', min: 30 }, { type: 'office', min: 12, count: 2 }, { type: 'wc', min: 6, count: 3 }],
    items: [{ type: 'reception', in: 'atrium' }, { type: 'artwork', count: 24, in: 'gallery' }, { type: 'stage', in: 'hall' }, { family: 'tableFam', count: 6, in: 'seating' }, { type: 'counter' }, { type: 'elevator' }, { type: 'stairs' }, { type: 'toilet', count: 6 }],
    adj: [['atrium', 'gallery'], ['atrium', 'hall'], ['atrium', 'seating'], ['gallery', 'storage']],
    styles: ['civic', 'heritage', 'luxe', 'minimal'],
    clients: ['Ministry of Culture', 'National Heritage Board', 'The Crown Collection', 'Republic Arts Trust'],
    needsLift: true,
  },
  arena: {
    industry: 'sports', level: 9, name: 'City Arena',
    blurb: 'A competition court ringed by stands, team suites, hospitality and crowds that leave smiling.',
    lot: { w: 40, h: 30 }, levels: { min: 2, max: 3 },
    rooms: [{ type: 'atrium', min: 80 }, { type: 'court', min: 420 }, { type: 'changing', min: 30, count: 2 }, { type: 'foodcourt', min: 60 }, { type: 'lounge', min: 40 }, { type: 'storage', min: 30 }, { type: 'wc', min: 8, count: 4 }],
    items: [{ type: 'courtLines' }, { type: 'bleachers', count: 8 }, { type: 'lockers', count: 6 }, { type: 'shower', count: 10 }, { type: 'counter', count: 4 }, { family: 'tableFam', count: 8, in: 'foodcourt' }, { type: 'toilet', count: 10 }, { type: 'elevator' }, { type: 'stairs' }],
    adj: [['atrium', 'court'], ['court', 'changing'], ['atrium', 'foodcourt'], ['atrium', 'lounge']],
    styles: ['corporate', 'civic', 'industrial', 'playful'],
    clients: ['Metro Sports Authority', 'Titans Basketball', 'Arena Partners', 'Global Events Co.'],
    needsLift: true,
  },
  // ---------------------------------------------------------------- level 10
  airport: {
    industry: 'transport', level: 10, name: 'Regional Airport Terminal',
    blurb: 'Kerb to gate: check-in, security, baggage, departure lounges and a lounge worth arriving early for.',
    lot: { w: 40, h: 30 }, levels: { min: 2, max: 3 },
    rooms: [{ type: 'checkin', min: 160 }, { type: 'security', min: 40 }, { type: 'gate', min: 90, count: 3 }, { type: 'baggage', min: 80 }, { type: 'foodcourt', min: 60 }, { type: 'lounge', min: 40 }, { type: 'office', min: 20 }, { type: 'wc', min: 8, count: 4 }],
    items: [{ type: 'checkinDesk', count: 4 }, { type: 'scanner', count: 3 }, { type: 'gateSeats', count: 12 }, { type: 'belt', count: 2 }, { type: 'counter', count: 3 }, { family: 'tableFam', count: 8, in: 'foodcourt' }, { type: 'sofa', count: 4, in: 'lounge' }, { type: 'toilet', count: 10 }, { type: 'elevator', count: 2 }, { type: 'stairs' }],
    adj: [['checkin', 'security'], ['security', 'gate'], ['checkin', 'baggage'], ['gate', 'foodcourt'], ['gate', 'lounge']],
    styles: ['corporate', 'minimal', 'civic', 'luxe'],
    clients: ['Regional Airports Authority', 'SkyGate Holdings', 'Northern Air Partners', 'Aeroporti Uniti'],
    needsLift: true,
  },
}

// Client twists make the same building type play differently from run to run.
export const TWISTS = {
  tight:    { name: 'Tight budget',      text: 'Budget is 15% lower and the Budget rating counts double.', budget: 0.85, weights: { budget: 2 }, fee: 1.2 },
  flagship: { name: 'Flagship project',  text: 'Generous budget, but the client judges looks twice as hard.', budget: 1.3, weights: { aesthetics: 2 }, fee: 1.1 },
  daylight: { name: 'Light-obsessed',    text: 'Every lived-in room must have daylight. Daylight counts double.', daylightWeight: 2, fee: 1.1 },
  heritage: { name: 'Heritage district', text: 'Facade must be brick, timber or travertine.', facades: ['brick', 'timberClad', 'travertine'], fee: 1.25 },
  green:    { name: 'Green mandate',     text: 'Plant at least 6 trees, plants or green walls.', greenery: 6, fee: 1.15 },
  efficient:{ name: 'Efficiency nerd',   text: 'Client measures walking distances. Functionality counts double.', weights: { functionality: 2 }, fee: 1.1 },
}

// Grades: F fails, C passes, B / A / S pass and unlock items for that industry.
export const GRADES = [
  { id: 'S', min: 90, label: 'Masterpiece', climb: 2, fee: 1.6 },
  { id: 'A', min: 80, label: 'Excellent',   climb: 1, fee: 1.3 },
  { id: 'B', min: 68, label: 'Good work',   climb: 1, fee: 1.1 },
  { id: 'C', min: 55, label: 'Passable',    climb: -1, fee: 0.8 },
  { id: 'F', min: 0,  label: 'Failed',      climb: 0, fee: 0 },
]
export const GRADE_RANK = { F: 0, C: 1, B: 2, A: 3, S: 4 }
export function gradeFor(score) { return GRADES.find(g => score >= g.min) }

export function reqLabel(req) {
  if (req.family) return FAMILIES[req.family]
  const p = req.product && PRODUCTS[ITEMS[req.type].products]?.[req.product]
  return p ? `${ITEMS[req.type].label}: ${p.label}` : ITEMS[req.type].label
}

export function briefArea(brief) {
  return brief.rooms.reduce((s, r) => s + r.min * (r.count || 1), 0)
}

const familyCost = (fam) => Object.values(ITEMS).find(i => i.family === fam && !i.unlock)?.cost || 900

// Budget is derived from the program so it stays sane as content changes.
export function estimateBudget(brief) {
  const area = briefArea(brief) * 1.22
  const levels = brief.levels.min
  const footprint = area / levels
  const perimeter = 4 * Math.sqrt(footprint) * 1.2
  let shell = 0
  for (let l = 0; l < levels; l++) shell += footprint * BASE_COST.perM2 * (1 + l * BASE_COST.levelPremium)
  const facade = perimeter * levels * 380
  const finishes = area * 110 + area * 4 * 3 * 12 + area * 40
  const lighting = area / 9 * 450
  // Family requirements and specific requirements overlap; count the larger of each family.
  const items = brief.items.reduce((s, it) => s + (it.family ? familyCost(it.family) : ITEMS[it.type].cost) * (it.count || 1), 0) * 0.85
  const vertical = levels > 1 ? (ITEMS.stairs.cost + (brief.needsLift ? ITEMS.elevator.cost : 0)) * levels : 0
  const openings = Math.ceil(perimeter * levels / 3) * BASE_COST.window + brief.rooms.length * 2 * BASE_COST.door
  return Math.round((shell + facade + finishes + lighting + items + vertical + openings) * 1.22 / 1000) * 1000
}

// ---------------------------------------------------------------- key layout checks
// Measured as real walking distance (metres, through doors and stairs) from `from` to `to`.
// from/to: 'entrance' | 'room:<type>' (any room of that type) | 'rooms:<type>' (each room) |
//          'items:<a>,<b>' (each matching item). mode: avg over targets or the nearest one.
// Close ≤ close m scores fully, ≤ mid m scores 60%, beyond that 25%; not connected scores 0.
const CHECKS = {
  food: [
    { id: 'tables', label: 'Tables to the kitchen', from: 'room:kitchen', to: 'items:table,bigTable,booth,chefTable', mode: 'avg', close: 6, mid: 12, why: 'Waiters walk this route for every plate.' },
    { id: 'counter', label: 'Counter next to the kitchen', from: 'room:kitchen', to: 'items:counter', mode: 'min', close: 2, mid: 6, why: 'Food passes from the kitchen to the counter all day.' },
    { id: 'door', label: 'Entrance to the counter', from: 'entrance', to: 'items:counter', mode: 'min', close: 6, mid: 12, w: 0.6, why: 'Customers should find the counter straight away.' },
  ],
  fashion: [
    { id: 'fitting', label: 'Fitting rooms by the racks', from: 'room:fitting', to: 'items:rack', mode: 'avg', close: 6, mid: 12, why: 'Shoppers carry clothes to the fitting rooms.' },
    { id: 'tills', label: 'Tills near the entrance', from: 'entrance', to: 'items:checkout', mode: 'min', close: 5, mid: 10, why: 'Every customer passes the till on the way out.' },
    { id: 'stock', label: 'Stockroom to the shop floor', from: 'room:storage', to: 'items:rack', mode: 'avg', close: 8, mid: 16, w: 0.6, why: 'Staff restock the racks from the back.' },
  ],
  grocery: [
    { id: 'tills', label: 'Tills by the entrance', from: 'entrance', to: 'items:checkout', mode: 'min', close: 5, mid: 10, why: 'Shoppers finish at the tills and leave.' },
    { id: 'stock', label: 'Stockroom to the shelves', from: 'room:storage', to: 'items:aisle,chiller', mode: 'avg', close: 8, mid: 16, why: 'Shelves are refilled from the stockroom every day.' },
    { id: 'cold', label: 'Cold room to the chillers', from: 'room:coldroom', to: 'items:chiller', mode: 'avg', close: 6, mid: 12, why: 'Chilled stock must not travel far.' },
  ],
  health: [
    { id: 'reception', label: 'Reception at the door', from: 'entrance', to: 'items:reception', mode: 'min', close: 4, mid: 8, why: 'Patients check in first.' },
    { id: 'exam', label: 'Treatment rooms from waiting', from: 'room:waiting', to: 'rooms:exam', mode: 'avg', close: 5, mid: 10, why: 'Patients are called in from the waiting room.' },
    { id: 'store', label: 'Supplies to the treatment rooms', from: 'room:storage', to: 'rooms:exam', mode: 'avg', close: 6, mid: 12, w: 0.6, why: 'Staff fetch instruments between patients.' },
  ],
  civic: [
    { id: 'reception', label: 'Reception at the door', from: 'entrance', to: 'items:reception', mode: 'min', close: 5, mid: 10, why: 'Visitors are welcomed and oriented here.' },
    { id: 'reading', label: 'Reading room by the stacks', from: 'room:stacks', to: 'room:reading', mode: 'min', close: 2, mid: 6, why: 'Readers take books to the tables.' },
    { id: 'galleries', label: 'Galleries from the atrium', from: 'room:atrium', to: 'rooms:gallery', mode: 'avg', close: 8, mid: 16, why: 'Every visit starts in the atrium.' },
    { id: 'classes', label: 'Classrooms to the toilets', from: 'room:wc', to: 'rooms:classroom', mode: 'avg', close: 10, mid: 20, why: 'Small children need toilets nearby.' },
  ],
  housing: [
    { id: 'lift', label: 'Lift near the entrance', from: 'entrance', to: 'items:elevator', mode: 'min', close: 5, mid: 10, why: 'Residents carry shopping to the lift.' },
    { id: 'units', label: 'Apartments from the lift', from: 'items:elevator', to: 'rooms:unit', mode: 'avg', close: 10, mid: 20, why: 'Long corridors feel like a hotel, not a home.' },
  ],
  office: [
    { id: 'lift', label: 'Lift near the entrance', from: 'entrance', to: 'items:elevator', mode: 'min', close: 6, mid: 12, why: 'Everyone arrives through the lobby.' },
    { id: 'wc', label: 'Toilets from the desks', from: 'room:wc', to: 'items:desk', mode: 'avg', close: 12, mid: 24, why: 'Staff walk there several times a day.' },
  ],
  retail: [
    { id: 'shops', label: 'Shops from the atrium', from: 'room:atrium', to: 'rooms:shop', mode: 'avg', close: 8, mid: 16, why: 'The atrium should show off every shop.' },
    { id: 'food', label: 'Food court by the atrium', from: 'room:atrium', to: 'room:foodcourt', mode: 'min', close: 2, mid: 8, why: 'Food keeps shoppers in the centre.' },
  ],
  sports: [
    { id: 'reception', label: 'Reception at the door', from: 'entrance', to: 'items:reception', mode: 'min', close: 5, mid: 10, why: 'Members check in at the door.' },
    { id: 'changing', label: 'Changing rooms to the court', from: 'room:changing', to: 'room:court', mode: 'min', close: 3, mid: 10, why: 'Teams walk out in their kit.' },
    { id: 'gym', label: 'Changing rooms to the gym', from: 'room:changing', to: 'room:gym', mode: 'min', close: 3, mid: 10, why: 'Members change before training.' },
  ],
  transport: [
    { id: 'security', label: 'Check-in to security', from: 'room:checkin', to: 'room:security', mode: 'min', close: 4, mid: 12, why: 'Passengers flow straight from check-in to security.' },
    { id: 'gates', label: 'Security to the gates', from: 'room:security', to: 'rooms:gate', mode: 'avg', close: 15, mid: 35, why: 'Long walks make people miss flights.' },
    { id: 'bags', label: 'Check-in to the baggage hall', from: 'room:checkin', to: 'room:baggage', mode: 'min', close: 3, mid: 10, why: 'Bags travel on belts behind the desks.' },
  ],
}
// Per-brief weights (what matters most for that building).
const CHECK_WEIGHTS = {
  fastFood: { counter: 2, tables: 0.4, door: 1 },
  cafe: { counter: 1.2, tables: 0.8 },
  bistro: { tables: 1.6 }, fineDining: { tables: 1.8, counter: 0.5 },
  bakery: { counter: 1.5 },
}

// ---------------------------------------------------------------- signature features
// kind has: one of these items · gender: a women's and a men's room of this type ·
// premium: share of these items at Premium quality · finish: average finish quality.
// bonus: optional (adds points, never costs points).
const FEATURES = {
  food: [
    { id: 'booths', kind: 'has', label: 'Booth seating', types: ['booth'], bonus: true, why: 'Diners love a booth.' },
    { id: 'seating', kind: 'premium', label: 'Premium seating', types: ['table', 'bigTable', 'booth'], share: 0.5, why: 'Comfortable chairs keep people for dessert.' },
    { id: 'finish', kind: 'finish', label: 'Premium finishes', min: 0.85, why: 'Diners judge the room before the food.' },
  ],
  fashion: [
    { id: 'fitting', kind: 'gender', room: 'fitting', label: "Women's and men's fitting rooms", why: 'Separate fitting rooms are expected.' },
    { id: 'finish', kind: 'finish', label: 'Premium finishes', min: 0.85, why: 'The shop is part of the brand.' },
  ],
  grocery: [
    { id: 'prepared', kind: 'has', label: 'Prepared food counter', types: ['gourmetDeli', 'bakeryCorner', 'juiceBar'], bonus: true, why: 'Ready meals and fresh bread bring people back daily.' },
    { id: 'finish', kind: 'finish', label: 'Durable, good finishes', min: 0.75, why: 'Floors take a beating from trolleys.' },
  ],
  health: [{ id: 'finish', kind: 'finish', label: 'Hygienic quality finishes', min: 0.8, why: 'Clinics must look and be clean.' }],
  civic: [{ id: 'finish', kind: 'finish', label: 'Civic-quality finishes', min: 0.8, why: 'Public buildings should last decades.' }],
  housing: [{ id: 'finish', kind: 'finish', label: 'Quality finishes in homes', min: 0.8, why: 'Residents notice every surface.' }],
  office: [{ id: 'finish', kind: 'finish', label: 'Premium workplace finishes', min: 0.85, why: 'Tenants pay for quality.' }],
  retail: [{ id: 'finish', kind: 'finish', label: 'Premium finishes', min: 0.85, why: 'The centre competes on atmosphere.' }],
  sports: [
    { id: 'changing', kind: 'gender', room: 'changing', label: "Women's and men's changing rooms", why: 'Teams need separate changing rooms.' },
    { id: 'finish', kind: 'finish', label: 'Hard-wearing finishes', min: 0.75, why: 'Sport is tough on buildings.' },
  ],
  transport: [{ id: 'finish', kind: 'finish', label: 'Premium terminal finishes', min: 0.85, why: 'Terminals are a city\'s front door.' }],
}
const WC_GENDER = { id: 'wc', kind: 'gender', room: 'wc', label: "Women's and men's restrooms", why: 'Separate restrooms are expected in public buildings.' }
// How much each feature matters per brief (0 removes it). Finishes count less in fast food.
const FEATURE_WEIGHTS = {
  fastFood: { finish: 0.3, seating: 0.3 }, cafe: { finish: 0.6, seating: 0.6 }, bakery: { finish: 0.5, seating: 0 },
  bistro: { finish: 1, seating: 1 }, fineDining: { finish: 1.6, seating: 1.6 },
  boutique: { finish: 0.6 }, fastFashion: { finish: 0.3 }, fashionChain: { finish: 0.8 }, luxury: { finish: 1.8, fitting: 1.4 },
  cornerShop: { finish: 0.4 }, supermarket: { finish: 0.6 }, foodHall: { finish: 1.2 },
}

const hasRoom = (b, t) => b.rooms.some(r => r.type === t)
const programHas = (b, spec) => {
  if (spec === 'entrance') return true
  const [k, v] = spec.split(':')
  if (k === 'room' || k === 'rooms') return hasRoom(b, v)
  const types = v.split(',')
  return b.items.some(it => types.includes(it.type)) || (types.includes('table') && b.items.some(it => it.family === 'tableFam'))
}

export function checksFor(briefId) {
  const b = BRIEFS[briefId]
  const w = CHECK_WEIGHTS[briefId] || {}
  return (CHECKS[b.industry] || []).filter(c => programHas(b, c.from) && programHas(b, c.to))
    .map(c => ({ ...c, w: w[c.id] ?? c.w ?? 1 })).filter(c => c.w > 0)
}

export function featuresFor(briefId) {
  const b = BRIEFS[briefId]
  const w = FEATURE_WEIGHTS[briefId] || {}
  const list = [...(FEATURES[b.industry] || [])]
  const wcs = b.rooms.find(r => r.type === 'wc')
  if (wcs && (wcs.count || 1) >= 2) list.push(WC_GENDER)
  return list.filter(f => f.kind !== 'gender' || (b.rooms.find(r => r.type === f.room)?.count || 1) >= 2)
    .map(f => ({ ...f, w: w[f.id] ?? f.w ?? 1 })).filter(f => f.w > 0)
}

// ---------------------------------------------------------------- excellence
// The last ~18 Functionality points. These are what an expert does on top of a correct layout:
// they mostly need unlocked pieces, premium quality or careful spacing, and rarely fit a tight budget.
// kinds: spacing (gap between pieces) · has · nearDoor (item by the door to a room type) ·
// premium (share at Premium) · specialist (unlocked pieces for this industry) · allClose · outdoor · spacious
export const EXCELLENCE = {
  food: [
    { id: 'spacing', kind: 'spacing', types: ['table', 'bigTable', 'booth'], gap: 1, label: 'Tables comfortably spaced', why: 'Guests and waiters need at least 1 m between tables.' },
    { id: 'pass', kind: 'nearDoor', item: 'counter', room: 'kitchen', dist: 2, label: 'Counter by the kitchen door', why: 'Plates go straight from the pass to the counter.' },
    { id: 'lounge', kind: 'has', types: ['sofa', 'booth'], label: 'Sofas or booths', why: 'Soft seating makes people stay (and order another).' },
    { id: 'premium', kind: 'premium', types: ['table', 'bigTable', 'booth', 'sofa', 'counter'], share: 0.6, label: 'Premium seating and counter', why: 'Wobbly tables and cheap chairs cost repeat visits.' },
    { id: 'outdoor', kind: 'outdoor', types: ['table', 'bigTable'], label: 'Outdoor tables', why: 'A terrace doubles the seats on a sunny day.' },
    { id: 'special', kind: 'specialist', label: 'Specialist pieces', why: 'Unlocked equipment (booths, wood-fired oven…) is what pros use.' },
    { id: 'routes', kind: 'allClose', label: 'Every key route Close', why: 'No route in the brief should be more than a few steps.' },
  ],
  fashion: [
    { id: 'spacing', kind: 'spacing', types: ['rack', 'display', 'miniDisplay', 'shoeWall'], gap: 1, label: 'Clear aisles between fixtures', why: 'Shoppers with bags need 1 m between fixtures.' },
    { id: 'mirror', kind: 'has', types: ['mirror'], in: 'fitting', label: 'Mirrors in the fitting rooms', why: 'No mirror, no sale.' },
    { id: 'lounge', kind: 'has', types: ['sofa'], label: 'A sofa for companions', why: 'Somebody is always waiting for someone.' },
    { id: 'premium', kind: 'premium', types: ['rack', 'display', 'miniDisplay', 'checkout'], share: 0.6, label: 'Premium fixtures', why: 'Cheap rails make the clothes look cheap.' },
    { id: 'special', kind: 'specialist', label: 'Specialist pieces', why: 'Shoe walls, jewellery cases and salons sell more.' },
    { id: 'routes', kind: 'allClose', label: 'Every key route Close', why: 'Fitting rooms and tills should be a few steps away.' },
  ],
  grocery: [
    { id: 'spacing', kind: 'spacing', types: ['aisle', 'chiller'], gap: 2, label: 'Trolley-wide aisles', why: 'Two trolleys need 2 m to pass.' },
    { id: 'premium', kind: 'premium', types: ['chiller', 'checkout'], share: 0.6, label: 'Premium chillers and tills', why: 'Efficient chillers keep produce fresh and bills low.' },
    { id: 'special', kind: 'specialist', label: 'Specialist pieces', why: 'Drinks chillers, bakery and deli bring daily customers.' },
    { id: 'spacious', kind: 'spacious', max: 0.4, label: 'Generous circulation', why: 'Shop floors under 40% furnished feel easy to shop.' },
    { id: 'routes', kind: 'allClose', label: 'Every key route Close', why: 'Stock and tills should be a few steps away.' },
  ],
  default: [
    { id: 'premium', kind: 'premium', types: null, share: 0.6, label: 'Premium furniture and equipment', why: 'Premium pieces last and work better.' },
    { id: 'lounge', kind: 'has', types: ['sofa', 'bench', 'readingNook'], label: 'Places to sit and wait', why: 'People always end up waiting somewhere.' },
    { id: 'special', kind: 'specialist', label: 'Specialist pieces', why: 'Unlocked specialist equipment is what pros use.' },
    { id: 'spacious', kind: 'spacious', max: 0.4, label: 'Generous circulation', why: 'Rooms under 40% furnished work smoothly.' },
    { id: 'routes', kind: 'allClose', label: 'Every key route Close', why: 'No route in the brief should be more than a few steps.' },
  ],
}
export function excellenceFor(briefId) {
  const b = BRIEFS[briefId]
  const list = EXCELLENCE[b?.industry] || EXCELLENCE.default
  // Outdoor tables only count where the brief has a dining room; mirrors only with fitting rooms.
  return list.filter(e => !(e.kind === 'has' && e.in && !b.rooms.some(r => r.type === e.in)))
}

// S needs a great overall score AND no weak rating.
export const S_FLOOR = 85
export function gradeOf(result) {
  const g = gradeFor(result.overall)
  if (g.id !== 'S') return g
  const min = Math.min(result.functionality, result.requirements, result.aesthetics, result.budget ?? 100)
  return min >= S_FLOOR ? g : GRADES.find(x => x.id === 'A')
}
