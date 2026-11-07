import { useId, useState } from 'react'
import { BackIcon } from './Icons.jsx'
import { accentFor } from '../lib/modeStyle.js'
import { formatHz } from '../lib/format.js'
import { planFlicker } from '../engine/session.js'

const SOURCES = [
  { id: 'screen', label: 'Screen', hint: 'Flickers your whole screen. Works on any phone. Hold it close with your eyes closed.' },
  { id: 'torch', label: 'Torch', hint: 'Pulses the phone torch. Needs camera permission and is not supported on every phone.' },
]

function closest(values, target) {
  return values.reduce((best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best), values[0])
}

function initialChoices(mode, timers, prefs) {
  const saved = prefs.minutes[mode.id]
  const wanted = Number.isFinite(saved) ? saved : mode.defaultMinutes
  return {
    source: prefs.source,
    minutes: timers.includes(wanted) ? wanted : closest(timers, wanted),
    audioOn: prefs.audioOn,
  }
}

// A real radio input, visually hidden, with the styled label reacting to its state via `peer`.
function Radio({ name, value, checked, onChange, className, style, children }) {
  return (
    <label className="relative block">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer absolute inset-0 size-full cursor-pointer opacity-0"
      />
      <span
        className={`grid min-h-11 place-items-center border text-sm font-semibold transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-glow motion-reduce:transition-none ${className}`}
        style={style}
      >
        {children}
      </span>
    </label>
  )
}

function Notice({ notice, onUseScreen }) {
  if (notice.kind === 'complete') {
    return (
      <div role="status" className="mb-5 rounded-2xl border border-night-600 bg-night-900 p-4">
        <p className="font-semibold text-white">Session complete</p>
        <p className="text-sm text-mist">
          {notice.name}, {notice.minutes} {notice.minutes === 1 ? 'minute' : 'minutes'}. Take a moment before you get up.
        </p>
      </div>
    )
  }
  return (
    <div role="alert" data-testid="torch-error" className="mb-5 rounded-2xl border border-glow/40 bg-glow/5 p-4">
      <p className="font-semibold text-glow">Couldn’t use the torch</p>
      <p className="mt-1 text-sm text-mist">{notice.message}</p>
      <button
        type="button"
        onClick={onUseScreen}
        className="mt-3 min-h-11 rounded-xl bg-glow px-5 font-extrabold text-night-950"
      >
        Use Screen
      </button>
    </div>
  )
}

export default function ModeOptions({ mode, timers, prefs, notice, onDismissNotice, onBack, onStart }) {
  const uid = useId()
  const [choices, setChoices] = useState(() => initialChoices(mode, timers, prefs))
  const accent = accentFor(mode.id)
  const binaural = mode.audio?.beatType === 'binaural'
  const sourceHint = SOURCES.find((s) => s.id === choices.source).hint
  const plan = planFlicker(mode.flicker, choices.source, choices.minutes * 60)
  const set = (patch) => setChoices((c) => ({ ...c, ...patch }))
  const selected = { backgroundColor: accent, borderColor: accent }

  return (
    <div
      data-testid="options"
      data-mode={mode.id}
      className="mx-auto min-h-dvh w-full max-w-md px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1.25rem)]"
    >
      <header className="flex items-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to sessions"
          data-testid="back"
          className="-ml-2 grid size-11 place-items-center rounded-full text-mist hover:bg-night-800 hover:text-white"
        >
          <BackIcon />
        </button>
      </header>

      <main>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white">{mode.name}</h1>
        <p className="mt-1 text-sm font-semibold tabular-nums" style={{ color: accent }}>
          {plan.startHz === plan.targetHz
            ? `${formatHz(plan.targetHz)} Hz`
            : `${formatHz(plan.startHz)} to ${formatHz(plan.targetHz)} Hz`}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-mist">{mode.description}</p>

        <div className="mt-6">
          {notice && notice.modeId === mode.id && (
            <Notice notice={notice} onUseScreen={() => { set({ source: 'screen' }); onDismissNotice() }} />
          )}
        </div>

        <fieldset className="mt-1">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Light source</legend>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-night-900 p-1">
            {SOURCES.map((s) => (
              <Radio
                key={s.id}
                name="source"
                value={s.id}
                checked={choices.source === s.id}
                onChange={() => set({ source: s.id })}
                className="rounded-xl border-transparent text-mist peer-checked:bg-night-600 peer-checked:text-white"
              >
                {s.label}
              </Radio>
            ))}
          </div>
          <p className="mt-2 text-sm text-mist/80">{sourceHint}</p>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Timer</legend>
          <div className="flex flex-wrap gap-2">
            {timers.map((m) => {
              const on = choices.minutes === m
              return (
                <Radio
                  key={m}
                  name="minutes"
                  value={m}
                  checked={on}
                  onChange={() => set({ minutes: m })}
                  className={`min-w-16 rounded-full px-4 tabular-nums ${on ? 'text-night-950' : 'border-night-600 text-mist'}`}
                  style={on ? selected : undefined}
                >
                  {m} min
                </Radio>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex min-h-11 items-center justify-between gap-4">
          <div>
            <p id={`${uid}-snd`} className="font-semibold text-white">Sound</p>
            {binaural && <p className="text-sm text-mist/80">Use headphones</p>}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={choices.audioOn}
            aria-labelledby={`${uid}-snd`}
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

        <button
          type="button"
          data-testid="start"
          onClick={() => onStart(mode, choices)}
          className="mt-7 h-14 w-full rounded-2xl text-lg font-extrabold text-night-950 transition active:scale-[0.99] motion-reduce:transition-none"
          style={{ backgroundColor: accent }}
        >
          Start
        </button>
      </main>
    </div>
  )
}
