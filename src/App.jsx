import { useState } from 'react'
import content from './content.json'
import Home from './components/Home.jsx'
import ModeSheet from './components/ModeSheet.jsx'
import ConsentModal from './components/ConsentModal.jsx'
import Player from './components/Player.jsx'
import Info from './components/Info.jsx'
import { useHashView } from './hooks/useHashView.js'
import { useSession } from './hooks/useSession.js'
import { load, save } from './lib/storage.js'

export default function App() {
  const { view, openInfo, goHome } = useHashView()
  const session = useSession()
  const [sheetId, setSheetId] = useState(null)
  const [pending, setPending] = useState(null) // { mode, choices } awaiting consent
  const [lastMode, setLastMode] = useState(() => load('lastMode', null))

  const sheetMode = content.modes.find((m) => m.id === sheetId)

  // Called synchronously from a tap, so the session can start audio and camera on iOS.
  function begin(mode, choices) {
    setSheetId(null)
    setPending(null)
    session.launch({ mode, ...choices })
  }

  function handleStart(mode, choices) {
    const stored = load('prefs', null)
    const prefs = stored && typeof stored === 'object' ? stored : {}
    save('prefs', {
      source: choices.source,
      audioOn: choices.audioOn,
      minutes: { ...prefs.minutes, [mode.id]: choices.minutes },
    })
    save('lastMode', mode.id)
    setLastMode(mode.id)
    if (load('consent', false) === true) begin(mode, choices)
    else setPending({ mode, choices })
  }

  function handleConsent() {
    save('consent', true)
    begin(pending.mode, pending.choices)
  }

  return (
    <>
      <div inert={session.run !== null}>
        {view === 'info' ? (
          <Info content={content} onBack={goHome} />
        ) : (
          <Home modes={content.modes} lastMode={lastMode} onOpenMode={setSheetId} onOpenInfo={openInfo} />
        )}
        {view === 'home' && sheetMode && (
          <ModeSheet
            key={sheetMode.id}
            mode={sheetMode}
            timers={content.timers}
            onClose={() => setSheetId(null)}
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
          onSwitchToScreen={() => session.launch({ ...session.run, source: 'screen' })}
        />
      )}
    </>
  )
}
