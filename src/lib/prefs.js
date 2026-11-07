import { load, save } from './storage.js'

const PREFS_KEY = 'flicker.prefs.v1'
const CONSENT_KEY = 'flicker.consent.v1'

/** Always returns a well-formed { source, minutes, lastMode, audioOn } even if storage is empty or tampered with. */
export function readPrefs() {
  const raw = load(PREFS_KEY, null)
  const p = raw && typeof raw === 'object' ? raw : {}
  return {
    source: p.source === 'torch' ? 'torch' : 'screen',
    minutes: p.minutes && typeof p.minutes === 'object' ? p.minutes : {},
    lastMode: typeof p.lastMode === 'string' ? p.lastMode : null,
    audioOn: p.audioOn !== false,
  }
}

export const writePrefs = (prefs) => save(PREFS_KEY, prefs)
export const hasConsent = () => String(load(CONSENT_KEY, '')) === '1'
export const saveConsent = () => save(CONSENT_KEY, '1')
