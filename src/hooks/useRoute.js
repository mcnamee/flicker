import { useCallback, useEffect, useState } from 'react'

/** '#/' | '#/mode/:id' | '#/info' */
function parse(hash) {
  const m = /^#\/mode\/([^/?#]+)/.exec(hash)
  if (m) {
    try {
      return { name: 'mode', id: decodeURIComponent(m[1]) }
    } catch {
      return { name: 'home' }
    }
  }
  if (hash === '#/info') return { name: 'info' }
  return { name: 'home' }
}

const HOME = '#/'

export function useRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash))

  // Normalise a bare URL to '#/' so the address always shows where we are.
  useEffect(() => {
    if (window.location.hash === '') {
      try {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + HOME)
      } catch { /* read-only location, nothing to do */ }
    }
  }, [])

  useEffect(() => {
    const sync = () => setRoute(parse(window.location.hash))
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const navigate = useCallback((hash) => {
    try {
      window.history.pushState({ flicker: true }, '', hash)
    } catch {
      window.location.hash = hash
    }
    setRoute(parse(hash))
    window.scrollTo(0, 0)
  }, [])

  // Back control: step back through our own history, or go home on a deep link.
  const back = useCallback(() => {
    if (window.history.state?.flicker) {
      window.history.back()
      return
    }
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + HOME)
    } catch {
      window.location.hash = HOME
    }
    setRoute({ name: 'home' })
    window.scrollTo(0, 0)
  }, [])

  return { route, navigate, back }
}
