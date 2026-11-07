import { useEffect, useState } from 'react'
import content from './content.json'
import Home from './components/Home.jsx'
import ModeOptions from './components/ModeOptions.jsx'
import ConsentModal from './components/ConsentModal.jsx'
import Player from './components/Player.jsx'
import Info from './components/Info.jsx'
import { useRoute } from './hooks/useRoute.js'
import { useSession } from './hooks/useSession.js'
import { hasConsent, readPrefs, saveConsent, writePrefs } from './lib/prefs.js'

export default function App() {
  const { route, navigate, back } = useRoute()
  const session = useSession()
  const [prefs, setPrefs] = useState(readPrefs)
  const [pending, setPending] = useState(null) // { mode, choices } awaiting consent

  const mode = route.name === 'mode' ? content.modes.find((m) => m.id === route.id) : null
  const view = mode ? 'mode' : route.name === 'info' ? 'info' : 'home'
  const viewKey = mode ? mode.id : view

  // Leaving a view ends any session and clears its notices.
  const { reset } = session
  useEffect(() => {
    reset()
  }, [viewKey, reset])

  // A consent prompt belongs to the view it was opened on.
  if (pending && pending.viewKey !== viewKey) setPending(null)

  // Called synchronously from a tap, so the session can start audio and camera on iOS.
  function begin(m, choices) {
    setPending(null)
    session.launch({ mode: m, ...choices })
  }

  function handleStart(m, choices) {
    const next = {
      source: choices.source,
      minutes: { ...prefs.minutes, [m.id]: choices.minutes },
      lastMode: m.id,
      audioOn: choices.audioOn,
    }
    writePrefs(next)
    setPrefs(next)
    if (hasConsent()) begin(m, choices)
    else setPending({ mode: m, choices, viewKey })
  }

  function handleConsent() {
    saveConsent()
    begin(pending.mode, pending.choices)
  }

  return (
    <>
      <div inert={session.run !== null}>
        {view === 'info' && <Info content={content} onBack={back} />}
        {view === 'home' && <Home modes={content.modes} lastMode={prefs.lastMode} onNavigate={navigate} />}
        {view === 'mode' && (
          <ModeOptions
            key={mode.id}
            mode={mode}
            timers={content.timers}
            prefs={prefs}
            notice={session.notice}
            onDismissNotice={session.clearNotice}
            onBack={back}
            onStart={handleStart}
          />
        )}
        {pending && <ConsentModal onContinue={handleConsent} onCancel={() => setPending(null)} />}
      </div>
      {session.run && (
        <Player
          run={session.run}
          tick={session.tick}
          overlayRef={session.overlayRef}
          onTapStop={session.tapStop}
          onEnd={session.end}
        />
      )}
    </>
  )
}
