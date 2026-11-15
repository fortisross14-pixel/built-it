// Architect profiles. Background is the only one with gameplay effects.
// The specialists get one strong bonus. The pure architect gets 25% of every bonus, across all four ratings.
export const BACKGROUNDS = {
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
