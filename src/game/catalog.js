export const TILE = {
  empty: { label: 'Erase', short: '—' },
  interior: { label: 'Interior', short: 'IN' },
  patio: { label: 'Patio', short: 'PT' },
  path: { label: 'Path', short: 'PA' },
  drive: { label: 'Drive lane', short: 'DR' },
  parking: { label: 'Parking', short: 'PK' },
}

export const OBJECTS = {
  entrance: { label: 'Entrance', icon: '↳', category: 'Architecture', footprint: 1, walkable: true },
  window: { label: 'Window', icon: '▭', category: 'Architecture', footprint: 1, walkable: true },
  stairs: { label: 'Stairs', icon: '≋', category: 'Architecture', footprint: 1, walkable: true },
  register: { label: 'Register', icon: 'R', category: 'Service', footprint: 1 },
  pickup: { label: 'Pickup', icon: 'P', category: 'Service', footprint: 1 },
  prep: { label: 'Prep / kitchen', icon: 'K', category: 'Service', footprint: 1 },
  table: { label: 'Table / 4 seats', icon: 'T', category: 'Furniture', footprint: 1 },
  toilet: { label: 'Accessible toilet', icon: 'WC', category: 'Furniture', footprint: 1 },
  trash: { label: 'Waste', icon: 'W', category: 'Furniture', footprint: 1 },
  plant: { label: 'Plant', icon: '✦', category: 'Site', footprint: 1, walkable: true },
  driveOrder: { label: 'Order board', icon: 'O', category: 'Drive-through', footprint: 1, walkable: true },
  drivePickup: { label: 'Pickup window', icon: 'D', category: 'Drive-through', footprint: 1, walkable: true },
}

export const BRIEFS = {
  coffee: {
    id: 'coffee',
    title: 'Neighborhood Coffee Shop',
    subtitle: 'Design a small café that handles a busy morning without losing its character.',
    lot: '28 m × 22 m corner parcel',
    size: { cols: 18, rows: 14 },
    arrivals: 120,
    scenario: 'Morning rush',
    required: ['entrance', 'register', 'pickup', 'prep', 'table', 'toilet', 'trash'],
    optional: ['window', 'stairs', 'plant'],
    tensions: ['Seats vs circulation', 'Queue vs entrance', 'Kitchen vs pickup distance', 'Patio vs indoor pressure'],
    accent: 'Neighborhood café',
  },
  drive: {
    id: 'drive',
    title: 'Fast-Food Drive-Through',
    subtitle: 'Fit a walk-in restaurant and a functioning vehicle loop onto one roadside site.',
    lot: '42 m × 30 m roadside parcel',
    size: { cols: 24, rows: 16 },
    arrivals: 150,
    scenario: 'Dinner peak',
    required: ['entrance', 'register', 'pickup', 'prep', 'table', 'toilet', 'driveOrder', 'drivePickup'],
    optional: ['window', 'plant'],
    tensions: ['Vehicle stacking', 'Pedestrian crossings', 'Kitchen adjacency', 'Parking access'],
    accent: 'Roadside restaurant',
  },
}

export const DEFAULT_PROJECTS = {
  coffee: {
    floors: [
      {
        tiles: {},
        objects: [],
        walls: {},
      },
      { tiles: {}, objects: [], walls: {} },
    ],
    activeFloor: 0,
  },
  drive: {
    floors: [
      { tiles: {}, objects: [], walls: {} },
      { tiles: {}, objects: [], walls: {} },
    ],
    activeFloor: 0,
  },
}
