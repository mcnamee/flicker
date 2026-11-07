import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { startSession } from '../engine/session.js'

const START_GUARD_MS = 600

/**
 * Owns the running session and the player state.
 * `launch` must be called synchronously from a tap handler (iOS audio + camera).
 */
export function useSession() {
  const overlayRef = useRef(null)
  const handleRef = useRef(null)
  const startedAt = useRef(0)
  const counter = useRef(0)
  const [run, setRun] = useState(null) // { id, mode, source, minutes, audioOn, phase, error }
  const [tick, setTick] = useState(null)
  const active = run !== null

  const end = useCallback(() => {
    handleRef.current?.stop()
    handleRef.current = null
    setRun(null)
    setTick(null)
  }, [])

  const launch = useCallback((cfg) => {
    handleRef.current?.stop()
    handleRef.current = null
    startedAt.current = performance.now()
    counter.current += 1
    // Render the overlay now so the element exists for the engine, still inside the tap.
    flushSync(() => {
      setRun({ ...cfg, id: counter.current, phase: 'running', error: null })
      setTick(null)
    })
    handleRef.current = startSession({
      mode: cfg.mode,
      source: cfg.source,
      minutes: cfg.minutes,
      audioOn: cfg.audioOn,
      overlay: overlayRef.current,
      onTick: setTick,
      onEnd: () => setRun((r) => (r ? { ...r, phase: 'done' } : r)),
      onError: (error) => setRun((r) => (r ? { ...r, phase: 'error', error } : r)),
    })
  }, [])

  // Ignore the tail of the tap that started the session.
  const tapStop = useCallback(() => {
    if (performance.now() - startedAt.current < START_GUARD_MS) return
    end()
  }, [end])

  // The engine stops itself when the page is hidden; return home too.
  useEffect(() => {
    if (!active) return undefined
    const onHidden = () => {
      if (document.hidden) end()
    }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [active, end])

  // Release everything if the app unmounts mid-session.
  useEffect(() => () => handleRef.current?.stop(), [])

  return { run, tick, overlayRef, launch, end, tapStop }
}
