export const TILE = {
  empty: { label: 'Erase', short: '—' },
  interior: { label: 'Floor', short: 'FL' },
  patio: { label: 'Patio', short: 'PT' },
  path: { label: 'Path', short: 'PA' },
  drive: { label: 'Drive lane', short: 'DR' },
  parking: { label: 'Parking', short: 'PK' },
}

export const OBJECTS = {
  entrance: { label: 'Entrance', icon: '↳', category: 'Architecture', w:2, h:1, walkable:true },
  window: { label: 'Window', icon: '▭', category: 'Architecture', w:2, h:1, walkable:true },
  stairs: { label: 'Stairs', icon: '≋', category: 'Architecture', w:3, h:2, walkable:true },
  register: { label: 'Register', icon: 'R', category: 'Furniture', w:2, h:1 },
  pickup: { label: 'Pickup counter', icon: 'P', category: 'Furniture', w:2, h:1 },
  prep: { label: 'Prep / kitchen', icon: 'K', category: 'Furniture', w:3, h:2 },
  table: { label: '4-seat table', icon: 'T', category: 'Furniture', w:5, h:4, seats:4 },
  toilet: { label: 'Accessible toilet', icon: 'WC', category: 'Furniture', w:2, h:2 },
  trash: { label: 'Waste', icon: 'W', category: 'Furniture', w:1, h:1 },
  plant: { label: 'Plant', icon: '✦', category: 'Decoration', w:1, h:1, walkable:true },
  bench: { label: 'Bench', icon: 'B', category: 'Decoration', w:2, h:1, walkable:true },
  lamp: { label: 'Floor lamp', icon: 'L', category: 'Decoration', w:1, h:1, walkable:true },
  driveOrder: { label: 'Order board', icon: 'O', category: 'Site', w:1, h:2, walkable:true },
  drivePickup: { label: 'Drive pickup', icon: 'D', category: 'Site', w:1, h:2, walkable:true },
}

export const BRIEFS = {
  coffee: {
    id:'coffee', title:'Neighborhood Coffee Shop',
    subtitle:'Design a small café that handles a busy morning without losing its character.',
    lot:'28 m × 22 m corner parcel', size:{cols:36,rows:28}, cellMeters:0.75,
    arrivals:120, scenario:'Morning rush',
    required:['entrance','register','pickup','prep','table','toilet','trash'],
    optional:['window','stairs','plant','bench','lamp'],
    tensions:['Seats vs circulation','Queue vs entrance','Kitchen vs pickup distance','Patio vs indoor pressure'], accent:'Neighborhood café',
  },
  drive: {
    id:'drive', title:'Fast-Food Drive-Through',
    subtitle:'Fit a walk-in restaurant and a functioning vehicle loop onto one roadside site.',
    lot:'42 m × 30 m roadside parcel', size:{cols:48,rows:32}, cellMeters:0.8,
    arrivals:150, scenario:'Dinner peak',
    required:['entrance','register','pickup','prep','table','toilet','driveOrder','drivePickup'],
    optional:['window','plant','bench'],
    tensions:['Vehicle stacking','Pedestrian crossings','Kitchen adjacency','Parking access'], accent:'Roadside restaurant',
  },
}

function floor(){ return {tiles:{},objects:[],walls:{},finishes:{},wallFinishes:{}} }
export const DEFAULT_PROJECTS = {
  coffee:{floors:[floor(),floor()],activeFloor:0},
  drive:{floors:[floor(),floor()],activeFloor:0},
}
