import { ChevronIcon, InfoIcon } from './Icons.jsx'
import Logo from './Logo.jsx'
import { accentFor } from '../lib/modeStyle.js'
import { formatHz, greetingFor } from '../lib/format.js'
import { planFlicker } from '../engine/session.js'

function ModeCard({ mode, lastUsed, onOpen }) {
  const accent = accentFor(mode.id)
  const href = `#/mode/${encodeURIComponent(mode.id)}`
  return (
    <li>
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault()
          onOpen(href)
        }}
        data-testid="mode-card"
        data-mode={mode.id}
        aria-current={lastUsed ? 'true' : undefined}
        style={{ '--accent': accent }}
        className="group flex min-h-24 w-full items-center gap-4 rounded-3xl border border-night-700 bg-night-800/80 p-4 text-left transition active:scale-[0.99] active:bg-night-700 hover:border-(--accent)/50 motion-reduce:transition-none"
      >
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}55 0%, ${accent}14 60%, transparent 72%)` }}
        >
          <span className="size-3 rounded-full bg-(--accent) shadow-[0_0_14px_2px_var(--accent)]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-lg font-semibold leading-tight text-white">{mode.name}</span>
            {lastUsed && (
              <span className="rounded-full border border-(--accent)/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-(--accent)">
                Last used
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-mist">{mode.tagline}</span>
          <span className="mt-1.5 block text-xs font-semibold tabular-nums text-(--accent)">
            {formatHz(planFlicker(mode.flicker, 'screen', 3600).targetHz)} Hz
          </span>
        </span>
        <ChevronIcon className="shrink-0 text-night-600 transition group-hover:text-(--accent) motion-reduce:transition-none" />
      </a>
    </li>
  )
}

export default function Home({ modes, lastMode, onNavigate }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <header className="flex items-center justify-between">
        <Logo className="-ml-1 h-10 w-auto" weight={15} />
        <a
          href="#/info"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('#/info')
          }}
          data-testid="info-link"
          aria-label="Why and how Flicker works, and safety information"
          className="-mr-2 grid size-11 place-items-center rounded-full text-mist transition hover:bg-night-800 hover:text-white motion-reduce:transition-none"
        >
          <InfoIcon />
        </a>
      </header>

      <main className="flex-1">
        <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-white">{greetingFor()}</h1>
        <p className="mt-2 text-mist">Choose a session, then close your eyes.</p>

        <ul className="mt-7 space-y-3">
          {modes.map((m) => (
            <ModeCard key={m.id} mode={m} lastUsed={m.id === lastMode} onOpen={onNavigate} />
          ))}
        </ul>
      </main>

      <p className="mt-8 text-center text-xs text-mist/70">Best in a dim, quiet room. Not a medical treatment.</p>
    </div>
  )
}
