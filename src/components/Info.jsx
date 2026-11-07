import { BackIcon, ExternalIcon } from './Icons.jsx'
import HowArt from './HowArt.jsx'

function Why({ why }) {
  return (
    <section id="why" aria-labelledby="why-title" className="scroll-mt-20">
      <h2 id="why-title" className="text-2xl font-extrabold text-white">Why</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-mist">{why.intro}</p>
      <ul className="mt-5 space-y-3">
        {why.points.map((p) => (
          <li key={p.title} className="rounded-2xl border border-night-700 bg-night-800/70 p-4">
            <h3 className="font-semibold text-white">{p.title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-mist">{p.body}</p>
          </li>
        ))}
      </ul>
      {why.references?.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">References</h3>
          <ol className="space-y-1">
            {why.references.map((r, i) => (
              <li key={r.url} className="flex gap-2 text-sm">
                <span className="w-5 shrink-0 pt-3 tabular-nums text-mist/70">{i + 1}.</span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 items-start gap-1.5 py-2.5 text-glow underline-offset-2 [overflow-wrap:anywhere] hover:underline"
                >
                  <span>{r.label}</span>
                  <ExternalIcon className="mt-0.5 size-4 shrink-0" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function How({ how }) {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20">
      <h2 id="how-title" className="text-2xl font-extrabold text-white">How</h2>
      <div className="mt-4 space-y-6">
        {how.sections.map((s) => (
          <div key={s.title}>
            <h3 className="mb-2 font-semibold text-white">{s.title}</h3>
            <HowArt title={s.title} />
            <ol className="space-y-2">
              {s.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[15px] leading-relaxed text-mist">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-night-700 text-xs font-semibold text-white"
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Info({ content, onBack }) {
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 -mx-5 flex items-center gap-1 bg-night-950/95 px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to sessions"
          className="-ml-2 grid size-11 place-items-center rounded-full text-mist hover:bg-night-800 hover:text-white"
        >
          <BackIcon />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-white">About Flicker</h1>
        <nav aria-label="Jump to" className="flex gap-1">
          {['why', 'how'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => jump(id)}
              className="min-h-11 rounded-full px-4 text-sm font-semibold uppercase tracking-wide text-mist hover:text-white"
            >
              {id}
            </button>
          ))}
        </nav>
      </header>

      <main className="mt-4 space-y-12">
        <Why why={content.why} />
        <How how={content.how} />
      </main>

      <footer className="mt-12 rounded-2xl border border-glow/30 bg-glow/5 p-4 text-sm leading-relaxed text-mist">
        Flicker is not a medical device. Don't use it if you have epilepsy or a history of seizures.
      </footer>
    </div>
  )
}
