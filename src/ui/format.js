export function money(v = 0, short = false) {
  if (short) {
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
    return `$${Math.round(v / 1000)}k`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}
