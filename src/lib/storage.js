// localStorage wrapper. Every access is guarded so the app runs when storage throws.

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    try { return JSON.parse(raw) } catch { return raw }
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch {
    /* private mode or storage blocked - defaults still work */
  }
}
