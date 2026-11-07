import { useEffect, useState } from 'react'
import { formatClock, formatHz } from '../lib/format.js'

const HINT_MS = 3000

// Remounted per run (via key) so the fade timer restarts after Switch to Screen.
function Hint() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setVisible(false), HINT_MS)
    return () => clearTimeout(id)
  }, [])
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-x-0 top-[38%] text-center text-white mix-blend-difference transition-opacity duration-1000 motion-reduce:transition-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <p className="text-3xl font-semibold">Close your eyes</p>
      <p className="mt-2 text-sm opacity-80">Tap anywhere to stop</p>
    </div>
  )
}

function Centre({ children }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-center">
      {children}
    </div>
  )
}

const quietButton =
  'min-h-12 rounded-2xl border border-white/20 px-7 font-semibold text-white/80 hover:text-white'

export default function Player({ run, tick, overlayRef, onTapStop, onEnd, onSwitchToScreen }) {
  const { mode, source, minutes, phase } = run
  const running = phase === 'running'

  useEffect(() => {
    if (!running) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onEnd()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [running, onEnd])

  const total = minutes * 60
  const remaining = tick ? tick.remainingSec : total
  const hz = tick ? tick.hz : mode.flicker.startHz
  const progress = tick ? Math.min(1, tick.elapsedSec / total) : 0

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${mode.name} session`}
      onPointerDown={running ? onTapStop : undefined}
      className="fixed inset-0 z-50 select-none overflow-hidden bg-black text-white"
      style={{ touchAction: 'none' }}
    >
      {running && <Hint key={run.id} />}

      {running && source === 'screen' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full origin-left bg-white opacity-30 mix-blend-difference"
          style={{ transform: `scaleX(${progress})` }}
        />
      )}

      {running && source === 'torch' && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-center text-mist/70 top-[55%]">
          <p className="text-sm font-semibold uppercase tracking-widest">{mode.name}</p>
          <p className="text-5xl font-semibold tabular-nums text-white/60" role="timer" aria-label="Time remaining">
            {formatClock(remaining)}
          </p>
          <p className="text-sm tabular-nums">{formatHz(Number(hz.toFixed(1)))} Hz</p>
          <p className="max-w-xs text-sm">Place the phone torch-up near your face, then close your eyes.</p>
          <button
            type="button"
            onClick={onEnd}
            className="mt-auto min-h-12 rounded-2xl border border-white/20 px-10 font-semibold text-white/70 hover:text-white"
          >
            Stop
          </button>
        </div>
      )}

      {phase === 'error' && (
        <Centre>
          <h2 className="text-xl font-semibold">Couldn’t start the torch</h2>
          <p role="alert" className="max-w-xs text-mist">{run.error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {source === 'torch' && (
              <button type="button" onClick={onSwitchToScreen} className="min-h-12 rounded-2xl bg-glow px-7 font-extrabold text-night-950">
                Switch to Screen
              </button>
            )}
            <button type="button" onClick={onEnd} className={quietButton}>Back</button>
          </div>
        </Centre>
      )}

      {phase === 'done' && (
        <Centre>
          <h2 className="text-2xl font-semibold text-white/90">Session complete</h2>
          <p className="text-mist">{minutes} {minutes === 1 ? 'minute' : 'minutes'} of {mode.name.toLowerCase()}</p>
          <button type="button" data-autofocus onClick={onEnd} className={`${quietButton} mt-3`}>Done</button>
        </Centre>
      )}
    </div>
  )
}
