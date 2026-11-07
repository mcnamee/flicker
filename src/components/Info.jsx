import { useId, useState } from 'react'
import { BackIcon, ExternalIcon } from './Icons.jsx'

const TABS = [
  { id: 'why', label: 'Why' },
  { id: 'how', label: 'How' },
]

function Why({ why }) {
  return (
    <div className="space-y-6">
      <p className="text-[15px] leading-relaxed text-mist">{why.intro}</p>
      <ul className="space-y-4">
        {why.points.map((p) => (
          <li key={p.title} className="rounded-2xl border border-night-700 bg-night-800/70 p-4">
            <h3 className="font-semibold text-white">{p.title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-mist">{p.body}</p>
          </li>
        ))}
      </ul>
      {why.references?.length > 0 && (
        <section aria-label="References">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">References</h3>
          <ol className="space-y-1">
            {why.references.map((r, i) => (
              <li key={r.url} className="flex gap-2 text-sm">
                <span className="w-5 shrink-0 pt-3 tabular-nums text-mist/70">{i + 1}.</span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 items-center gap-1.5 py-2 text-glow underline-offset-2 hover:underline"
                >
                  <span>{r.label}</span>
                  <ExternalIcon className="size-4 shrink-0" />
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

function How({ how }) {
  return (
    <div className="space-y-6">
      {how.sections.map((s) => (
        <section key={s.title}>
          <h3 className="mb-2 font-semibold text-white">{s.title}</h3>
          <ol className="space-y-2">
            {s.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-[15px] leading-relaxed text-mist">
                <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-night-700 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

export default function Info({ content, onBack }) {
  const [tab, setTab] = useState('why')
  const uid = useId()

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to sessions"
          className="-ml-2 grid size-11 place-items-center rounded-full text-mist hover:bg-night-800 hover:text-white"
        >
          <BackIcon />
        </button>
        <h1 className="text-lg font-semibold text-white">About Flicker</h1>
      </header>

      <div role="tablist" aria-label="Information" className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-night-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`${uid}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${uid}-panel`}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-xl text-sm font-semibold transition motion-reduce:transition-none ${
              tab === t.id ? 'bg-night-600 text-white' : 'text-mist hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className="mt-6">
        {tab === 'why' ? <Why why={content.why} /> : <How how={content.how} />}
      </div>

      <aside className="mt-10 rounded-2xl border border-glow/30 bg-glow/5 p-4 text-sm leading-relaxed text-mist">
        <h2 className="mb-1 font-semibold text-glow">Safety</h2>
        Flickering light can trigger seizures. Do not use Flicker if you have epilepsy or a history of seizures, or if light
        triggers your migraines. It is not a medical treatment, and it should never be used while driving. Stop if you feel unwell.
      </aside>
    </div>
  )
}
