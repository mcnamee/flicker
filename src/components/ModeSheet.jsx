import { useId, useRef, useState } from 'react'
import { CloseIcon } from './Icons.jsx'
import { useModal } from '../hooks/useModal.js'
import { load } from '../lib/storage.js'
import { accentFor } from '../lib/modeStyle.js'
import { formatHz } from '../lib/format.js'

const SOURCES = [
  { id: 'screen', label: 'Screen', hint: 'Flickers your whole screen. Works on any phone. Hold it close with your eyes closed.' },
  { id: 'torch', label: 'Torch', hint: 'Pulses the phone torch. Needs camera permission and is not supported on every phone.' },
]

function closest(values, target) {
  return values.reduce((best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best), values[0])
}

function initialChoices(mode, timers) {
  const stored = load('prefs', null)
  const prefs = stored && typeof stored === 'object' ? stored : {}
  const savedMinutes = prefs.minutes?.[mode.id]
  const wanted = Number.isFinite(savedMinutes) ? savedMinutes : mode.defaultMinutes
  return {
    source: prefs.source === 'torch' ? 'torch' : 'screen',
    minutes: timers.includes(wanted) ? wanted : closest(timers, wanted),
    audioOn: typeof prefs.audioOn === 'boolean' ? prefs.audioOn : true,
  }
}

const chip = (on, accent) => ({
  className: `min-h-11 min-w-14 rounded-full border px-4 text-sm font-semibold tabular-nums transition motion-reduce:transition-none ${
    on ? 'text-night-950' : 'border-night-600 text-mist hover:text-white'
  }`,
  style: on ? { backgroundColor: accent, borderColor: accent } : undefined,
})

export default function ModeSheet({ mode, timers, onClose, onStart }) {
  const ref = useRef(null)
  const titleId = useId()
  const [choices, setChoices] = useState(() => initialChoices(mode, timers))
  const accent = accentFor(mode.id)
  const binaural = mode.audio?.beatType === 'binaural'
  const sourceHint = SOURCES.find((s) => s.id === choices.source).hint
  const set = (patch) => setChoices((c) => ({ ...c, ...patch }))

  useModal(ref, onClose)

  return (
    <div className="fixed inset-0 z-40">
      <div aria-hidden="true" onClick={onClose} className="animate-fade absolute inset-0 bg-black/70" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-sheet absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border-t border-night-600 bg-night-800 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div aria-hidden="true" className="mx-auto mb-2 h-1 w-10 rounded-full bg-night-600" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-2xl font-extrabold text-white">{mode.name}</h2>
            <p className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
              {formatHz(mode.flicker.startHz)} to {formatHz(mode.flicker.targetHz)} Hz
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-mist hover:bg-night-700 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="mt-3 text-[15px] leading-relaxed text-mist">{mode.description}</p>

        <section className="mt-6" aria-labelledby={`${titleId}-src`}>
          <h3 id={`${titleId}-src`} className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Light source</h3>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-night-900 p-1">
            {SOURCES.map((s) => {
              const on = choices.source === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ source: s.id })}
                  className={`min-h-11 rounded-xl text-sm font-semibold transition motion-reduce:transition-none ${
                    on ? 'bg-night-600 text-white' : 'text-mist hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-sm text-mist/80">{sourceHint}</p>
        </section>

        <section className="mt-6" aria-labelledby={`${titleId}-time`}>
          <h3 id={`${titleId}-time`} className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Timer</h3>
          <div className="flex flex-wrap gap-2">
            {timers.map((m) => {
              const on = choices.minutes === m
              const { className, style } = chip(on, accent)
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${m} minutes`}
                  onClick={() => set({ minutes: m })}
                  className={className}
                  style={style}
                >
                  {m} min
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex min-h-11 items-center justify-between gap-4">
            <div>
              <p id={`${titleId}-snd`} className="font-semibold text-white">Sound</p>
              {binaural && <p className="text-sm text-mist/80">Use headphones</p>}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={choices.audioOn}
              aria-labelledby={`${titleId}-snd`}
              onClick={() => set({ audioOn: !choices.audioOn })}
              className="grid h-11 w-16 shrink-0 place-items-center"
            >
              <span
                aria-hidden="true"
                className={`relative h-8 w-14 rounded-full transition motion-reduce:transition-none ${choices.audioOn ? '' : 'bg-night-600'}`}
                style={choices.audioOn ? { backgroundColor: accent } : undefined}
              >
                <span
                  className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all motion-reduce:transition-none ${
                    choices.audioOn ? 'left-7' : 'left-1'
                  }`}
                />
              </span>
            </button>
          </div>
        </section>

        <button
          type="button"
          data-autofocus
          onClick={() => onStart(mode, choices)}
          className="mt-7 h-14 w-full rounded-2xl text-lg font-extrabold text-night-950 transition active:scale-[0.99] motion-reduce:transition-none"
          style={{ backgroundColor: accent }}
        >
          Start
        </button>
      </div>
    </div>
  )
}
