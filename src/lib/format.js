export function formatClock(totalSec) {
  const s = Math.max(0, Math.ceil(totalSec))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export function formatHz(hz) {
  return Number.isInteger(hz) ? String(hz) : hz.toFixed(1)
}

export function greetingFor(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  return 'Good evening'
}
