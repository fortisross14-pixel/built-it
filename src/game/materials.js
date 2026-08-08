export const FINISH_LIBRARY = {
  wall: {
    Plaster: [
      { id:'plaster-ivory', label:'Ivory', base:'#ece5d6', line:'#d5cab5', texture:'soft' },
      { id:'plaster-sand', label:'Sand', base:'#d7c4a7', line:'#bdab90', texture:'soft' },
      { id:'plaster-charcoal', label:'Charcoal', base:'#555a57', line:'#343936', texture:'soft' },
    ],
    Brick: [
      { id:'brick-red', label:'Red', base:'#9f5e4a', line:'#6d4035', texture:'brick' },
      { id:'brick-pale', label:'Pale', base:'#d8c1a2', line:'#ae967a', texture:'brick' },
      { id:'brick-dark', label:'Dark', base:'#6d6159', line:'#463e39', texture:'brick' },
    ],
    Timber: [
      { id:'timber-oak', label:'Oak', base:'#b88a5d', line:'#795a3c', texture:'boards' },
      { id:'timber-walnut', label:'Walnut', base:'#76513b', line:'#493125', texture:'boards' },
      { id:'timber-painted', label:'Painted', base:'#7a8e87', line:'#566a63', texture:'boards' },
    ],
  },
  interior: {
    Terrazzo: [
      { id:'terrazzo-cream', label:'Cream', base:'#eee7d8', line:'#c9bdab', texture:'speckle' },
      { id:'terrazzo-grey', label:'Grey', base:'#c9cbc5', line:'#a9aaa5', texture:'speckle' },
      { id:'terrazzo-dark', label:'Dark', base:'#737771', line:'#555955', texture:'speckle' },
    ],
    Tile: [
      { id:'tile-white', label:'White', base:'#eeeae0', line:'#d0cbc0', texture:'tile' },
      { id:'tile-sage', label:'Sage', base:'#bfcabe', line:'#9baa9c', texture:'tile' },
      { id:'tile-clay', label:'Clay', base:'#c98c6a', line:'#a66c4c', texture:'tile' },
    ],
    Timber: [
      { id:'floor-oak', label:'Oak', base:'#c49a70', line:'#8d6e51', texture:'boards' },
      { id:'floor-walnut', label:'Walnut', base:'#8b654c', line:'#604634', texture:'boards' },
      { id:'floor-ash', label:'Ash', base:'#d5c6aa', line:'#aa997d', texture:'boards' },
    ],
  },
  patio: {
    Pavers: [
      { id:'pavers-sand', label:'Sand', base:'#cdbc9d', line:'#aa9678', texture:'pavers' },
      { id:'pavers-grey', label:'Grey', base:'#b9bbb5', line:'#969993', texture:'pavers' },
      { id:'pavers-red', label:'Red', base:'#b77e69', line:'#945f4e', texture:'pavers' },
    ],
    Deck: [
      { id:'deck-oak', label:'Oak', base:'#ad8059', line:'#76543a', texture:'boards' },
      { id:'deck-dark', label:'Dark', base:'#6c5949', line:'#45392f', texture:'boards' },
      { id:'deck-grey', label:'Grey', base:'#96958d', line:'#73736d', texture:'boards' },
    ],
  },
  path: {
    Concrete: [
      { id:'concrete-light', label:'Light', base:'#c9c7bd', line:'#aaa89f', texture:'soft' },
      { id:'concrete-warm', label:'Warm', base:'#c9bea9', line:'#a99f8d', texture:'soft' },
      { id:'concrete-dark', label:'Dark', base:'#858984', line:'#666a66', texture:'soft' },
    ],
    Pavers: [
      { id:'path-pavers-grey', label:'Grey', base:'#aaa9a0', line:'#86857e', texture:'pavers' },
      { id:'path-pavers-sand', label:'Sand', base:'#c0af92', line:'#9e8d72', texture:'pavers' },
      { id:'path-pavers-charcoal', label:'Charcoal', base:'#747872', line:'#565b55', texture:'pavers' },
    ],
    Gravel: [
      { id:'gravel-tan', label:'Tan', base:'#b9a98f', line:'#8f806a', texture:'speckle' },
      { id:'gravel-grey', label:'Grey', base:'#a8aaa4', line:'#7d807b', texture:'speckle' },
      { id:'gravel-white', label:'White', base:'#d9d5c8', line:'#b6b1a4', texture:'speckle' },
    ],
  },
  drive: {
    Asphalt: [
      { id:'asphalt-dark', label:'Dark', base:'#565d59', line:'#3f4542', texture:'speckle' },
      { id:'asphalt-soft', label:'Soft', base:'#666c68', line:'#505652', texture:'speckle' },
    ],
    Concrete: [
      { id:'drive-concrete', label:'Concrete', base:'#a7aaa5', line:'#898c87', texture:'tile' },
      { id:'drive-warm', label:'Warm', base:'#aaa294', line:'#898174', texture:'tile' },
    ],
  },
  parking: {
    Asphalt: [
      { id:'parking-asphalt', label:'Asphalt', base:'#777d79', line:'#575d59', texture:'speckle' },
      { id:'parking-light', label:'Light', base:'#969b96', line:'#737873', texture:'speckle' },
    ],
    Pavers: [
      { id:'parking-pavers', label:'Pavers', base:'#a49f92', line:'#7e796f', texture:'pavers' },
      { id:'parking-grass', label:'Grass grid', base:'#8f9d82', line:'#68765f', texture:'grid' },
    ],
  },
}

export const DEFAULT_FINISH = {
  wall:'plaster-ivory', interior:'terrazzo-cream', patio:'pavers-sand', path:'concrete-light', drive:'asphalt-dark', parking:'parking-asphalt'
}

export function allFinishes(surface) {
  return Object.entries(FINISH_LIBRARY[surface] || {}).flatMap(([material, variants]) => variants.map(v => ({...v, material})))
}

export function finishById(surface, id) {
  return allFinishes(surface).find(v => v.id === id) || allFinishes(surface)[0] || {id:'default',label:'Default',material:'Default',base:'#ccc',line:'#999',texture:'soft'}
}
