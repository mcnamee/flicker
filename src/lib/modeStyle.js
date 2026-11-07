// Subtle per-mode accent colours, keyed by mode id. Unknown ids use the fallback.
const ACCENTS = {
  sleep: '#8f8cf0',
  relax: '#5fcdb8',
  dream: '#c78bf2',
  explore: '#c78bf2',
  meditate: '#6fb3f2',
  focus: '#f2b33d',
}
const FALLBACK = '#9db4ff'

export const accentFor = (id) => ACCENTS[id] ?? FALLBACK
