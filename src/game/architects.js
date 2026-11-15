// Architect profiles. Background is the only one with gameplay effects.
// The specialists get one strong bonus. The pure architect gets 25% of every bonus, across all four ratings.
export const BACKGROUNDS = {
  base: { label: 'Studio founder', icon: 'building', text: 'No rating bonus, but a founders kit: paper wallpaper and paper lanterns.' },
  architect: {
    label: 'Pure architect', icon: 'building',
    text: 'A little better at everything: +1.5 Functionality, +1.5 Aesthetics, −7.5% requirement penalties, −2.5% construction cost.',
    func: 1.5, aes: 1.5, reqForgive: 0.075, cost: 0.025,
  },
  art: {
    label: 'Architect + art', icon: 'brush',
    text: 'Trained eye: +6 Aesthetics on every review.',
    aes: 6,
  },
  engineering: {
    label: 'Architect + engineering', icon: 'layers',
    text: 'Finds a way: missed requirements cost 30% fewer points.',
    reqForgive: 0.3,
  },
  business: {
    label: 'Architect + business', icon: 'coin',
    text: 'Knows suppliers: construction and materials cost 10% less.',
    cost: 0.1,
  },
}

export const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say']

export const COUNTRIES = [
  ['AR', 'Argentina'], ['AU', 'Australia'], ['BR', 'Brazil'], ['CA', 'Canada'], ['CL', 'Chile'], ['CN', 'China'],
  ['CO', 'Colombia'], ['DK', 'Denmark'], ['EG', 'Egypt'], ['FI', 'Finland'], ['FR', 'France'], ['DE', 'Germany'],
  ['GH', 'Ghana'], ['GR', 'Greece'], ['IN', 'India'], ['ID', 'Indonesia'], ['IE', 'Ireland'], ['IT', 'Italy'],
  ['JP', 'Japan'], ['KE', 'Kenya'], ['KR', 'South Korea'], ['MX', 'Mexico'], ['MA', 'Morocco'], ['NL', 'Netherlands'],
  ['NG', 'Nigeria'], ['NO', 'Norway'], ['PE', 'Peru'], ['PH', 'Philippines'], ['PL', 'Poland'], ['PT', 'Portugal'],
  ['SA', 'Saudi Arabia'], ['SG', 'Singapore'], ['ZA', 'South Africa'], ['ES', 'Spain'], ['SE', 'Sweden'], ['CH', 'Switzerland'],
  ['TR', 'Türkiye'], ['AE', 'United Arab Emirates'], ['GB', 'United Kingdom'], ['US', 'United States'], ['UY', 'Uruguay'], ['VN', 'Vietnam'],
]
export const flag = (code) => code ? String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)) : ''
export const countryName = (code) => COUNTRIES.find(c => c[0] === code)?.[1] || ''

export function bgOf(kit = []) {
  const id = kit.find(k => k.startsWith('bg:'))?.slice(3)
  return BACKGROUNDS[id] || null
}

// Portraits: white plaster busts in public/art/architects/a01..a12.jpg
export const AVATARS = Array.from({ length: 12 }, (_, i) => `a${String(i + 1).padStart(2, '0')}`)

// Ten playable profiles. The two founders are open from the start. Completing a career
// (5+ passed commissions) with a founder unlocks the four specialists listed under unlockBy.
// Specialists: background bonus + expertise (+5 Functionality and +10% fees in those industries)
// + signature wall, floor, ceiling and roof finishes only they can use.
export const EXPERTISE = { func: 5, fee: 0.1 }
export const PROFILES = [
  { id: 'base-w', name: 'Ana Ribeiro', avatar: 'a02', gender: 'Woman', country: 'PT', age: 29, background: 'base', title: 'Studio founder', expertise: [], base: true },
  { id: 'base-m', name: 'Tomás Ortega', avatar: 'a01', gender: 'Man', country: 'ES', age: 31, background: 'base', title: 'Studio founder', expertise: [], base: true },
  { id: 'pure-civic', name: 'Ingrid Halvorsen', avatar: 'a04', gender: 'Woman', country: 'NO', age: 44, background: 'architect', title: 'Civic architect', expertise: ['civic'], unlockBy: 'base-w',
    sig: { wall: 'limePlaster', floor: 'parquet', ceiling: 'galleryCoffers', roof: 'greenRoof' } },
  { id: 'pure-housing', name: 'Kenji Mori', avatar: 'a07', gender: 'Man', country: 'JP', age: 47, background: 'architect', title: 'Housing architect', expertise: ['housing'], unlockBy: 'base-m',
    sig: { wall: 'clayPlaster', floor: 'herringbone', ceiling: 'timberBeams', roof: 'pitchedTiles' } },
  { id: 'art-fashion', name: 'Chiara Valli', avatar: 'a06', gender: 'Woman', country: 'IT', age: 38, background: 'art', title: 'Retail designer', expertise: ['fashion', 'retail'], unlockBy: 'base-w',
    sig: { wall: 'venetian', floor: 'nero', ceiling: 'barrelVault', roof: 'copper' } },
  { id: 'art-food', name: 'Youssef Benali', avatar: 'a03', gender: 'Man', country: 'MA', age: 36, background: 'art', title: 'Hospitality designer', expertise: ['food'], unlockBy: 'base-m',
    sig: { wall: 'zellige', floor: 'encaustic', ceiling: 'rattan', roof: 'terracottaRoof' } },
  { id: 'eng-sports', name: 'Marcus Webb', avatar: 'a05', gender: 'Man', country: 'GB', age: 42, background: 'engineering', title: 'Venue engineer', expertise: ['sports', 'transport'], unlockBy: 'base-w',
    sig: { wall: 'acousticWood', floor: 'rubberFloor', ceiling: 'spaceFrame', roof: 'sawtooth' } },
  { id: 'eng-health', name: 'Priya Raman', avatar: 'a10', gender: 'Woman', country: 'IN', age: 40, background: 'engineering', title: 'Healthcare engineer', expertise: ['health', 'office'], unlockBy: 'base-m',
    sig: { wall: 'hygienic', floor: 'linoleum', ceiling: 'chilledBeams', roof: 'solar' } },
  { id: 'biz-grocery', name: 'Daniel Okafor', avatar: 'a11', gender: 'Man', country: 'NG', age: 45, background: 'business', title: 'Retail developer', expertise: ['grocery', 'retail'], unlockBy: 'base-w',
    sig: { wall: 'brandWall', floor: 'resin', ceiling: 'openGrid', roof: 'membraneLogo' } },
  { id: 'biz-hosp', name: 'Sofia Lindqvist', avatar: 'a12', gender: 'Woman', country: 'SE', age: 39, background: 'business', title: 'Hospitality developer', expertise: ['food', 'housing'], unlockBy: 'base-m',
    sig: { wall: 'fabricPanel', floor: 'lvt', ceiling: 'coveLit', roof: 'roofTerrace' } },
]
export const profileById = (id) => PROFILES.find(p => p.id === id)
export const BASE_PROFILES = PROFILES.filter(p => p.base).map(p => p.id)
export function profileUnlocked(meta, prof) {
  if (!prof) return false
  if (prof.base) return true
  return (meta?.profilesUnlocked || []).includes(prof.id)
}
// The profile id stored on a career (older saves have none: treat them as a founder).
export const careerProfile = (career) => profileById(career?.profile?.profileId) || null
