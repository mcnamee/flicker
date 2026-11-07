import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { startSession } from '../engine/session.js'

const START_GUARD_MS = 600

/**
 * Owns the running session. While `run` is set the player overlay is mounted.
 * When a session ends on its own, `notice` says why ({ kind: 'complete' | 'torch-error', ... }).
 * `launch` must be called synchronously from a tap handler (iOS audio + camera).
 */
export function useSession() {
  const overlayRef = useRef(null)
  const handleRef = useRef(null)
  const startedAt = useRef(0)
  const current = useRef(0) // id of the live session; stale callbacks are ignored
  const [run, setRun] = useState(null) // { mode, source, minutes }
  const [tick, setTick] = useState(null)
  const [notice, setNotice] = useState(null)
  const active = run !== null

  const end = useCallback(() => {
    current.current += 1
    handleRef.current?.stop()
    handleRef.current = null
    setRun(null)
    setTick(null)
  }, [])

  const clearNotice = useCallback(() => setNotice(null), [])

  const reset = useCallback(() => {
    end()
    setNotice(null)
  }, [end])

  const launch = useCallback(
    (cfg) => {
      end()
      const id = current.current
      const live = (fn) => (arg) => {
        if (current.current === id) fn(arg)
      }
      startedAt.current = performance.now()
      // Render the overlay now so the element exists for the engine, still inside the tap.
      flushSync(() => {
        setNotice(null)
        setRun({ mode: cfg.mode, source: cfg.source, minutes: cfg.minutes })
      })
      handleRef.current = startSession({
        mode: cfg.mode,
        source: cfg.source,
        minutes: cfg.minutes,
        audioOn: cfg.audioOn,
        overlay: overlayRef.current,
        onTick: live(setTick),
        onEnd: live(() => {
          end()
          setNotice({ kind: 'complete', modeId: cfg.mode.id, minutes: cfg.minutes, name: cfg.mode.name })
        }),
        onError: live((message) => {
          end()
          setNotice({ kind: 'torch-error', modeId: cfg.mode.id, message })
        }),
        onStop: live((reason) => {
          if (reason === 'hidden') end()
        }),
      })
    },
    [end],
  )

  // Ignore the tail of the tap that started the session.
  const tapStop = useCallback(() => {
    if (performance.now() - startedAt.current < START_GUARD_MS) return
    end()
  }, [end])

  // Belt and braces: the engine stops itself when hidden, but make sure the UI follows.
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

  return { run, tick, notice, overlayRef, launch, end, reset, clearNotice, tapStop }
}
