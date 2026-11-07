import { useCallback, useEffect, useState } from 'react'

const INFO_HASH = '#/info'
const readView = () => (window.location.hash === INFO_HASH ? 'info' : 'home')

/** 'home' | 'info', kept in sync with location.hash so the back button works. */
export function useHashView() {
  const [view, setView] = useState(readView)

  useEffect(() => {
    const sync = () => setView(readView())
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const openInfo = useCallback(() => {
    try {
      window.history.pushState({ flickerInfo: true }, '', INFO_HASH)
    } catch {
      window.location.hash = INFO_HASH
    }
    setView('info')
  }, [])

  const goHome = useCallback(() => {
    if (window.history.state?.flickerInfo) {
      window.history.back()
    } else {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      } catch {
        window.location.hash = ''
      }
      setView('home')
    }
  }, [])

  return { view, openInfo, goHome }
}
