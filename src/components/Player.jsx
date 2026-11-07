import { useEffect, useState } from 'react'
import { formatClock, formatHz } from '../lib/format.js'
import { planFlicker } from '../engine/session.js'

const HINT_MS = 3000

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

// The engine owns this element's data-* attributes and background colour, so React
// never sets them (no style or data props here besides the stable testid).
export default function Player({ run, tick, overlayRef, onTapStop, onEnd }) {
  const { mode, source, minutes } = run
  const torch = source === 'torch'

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onEnd()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onEnd])

  const total = minutes * 60
  const remaining = tick ? tick.remainingSec : total
  const hz = tick ? tick.hz : planFlicker(mode.flicker, torch ? 'torch' : 'screen', total).startHz

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${mode.name} session`}
      data-testid="session"
      onPointerDown={onTapStop}
      className="fixed inset-0 z-50 touch-none select-none overflow-hidden bg-black text-white"
    >
      {!torch && <Hint />}


      {torch && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-center text-mist/70">
          <p className="text-sm font-semibold uppercase tracking-widest">{mode.name}</p>
          <p className="text-6xl font-semibold tabular-nums text-white/60" role="timer" aria-label="Time remaining">
            {formatClock(remaining)}
          </p>
          <p className="text-sm tabular-nums">{formatHz(Number(hz.toFixed(1)))} Hz</p>
          <p className="mt-4 max-w-xs text-sm">Keep your eyes closed, with the back of the phone facing them. Never look into the torch.</p>
          <p className="text-sm font-semibold text-white/70">Tap anywhere to stop</p>
          <button
            type="button"
            onClick={onEnd}
            className="mt-6 min-h-12 rounded-2xl border border-white/20 px-10 font-semibold text-white/70 hover:text-white"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  )
}
