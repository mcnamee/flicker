import { createAudio } from './audio.js'

const LIGHT_FADE_IN = 6 // seconds for screen brightness to build up
const END_FADE = 5 // seconds of fade at the end of a timed session

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clamp01 = (x) => Math.min(1, Math.max(0, x))

/** Current flicker frequency: eased glide from startHz to targetHz over rampSec. */
export function hzAt(flicker, t) {
  const { startHz, targetHz, rampSec } = flicker
  if (!rampSec || t >= rampSec) return targetHz
  const p = t / rampSec
  const eased = p * p * (3 - 2 * p) // smoothstep
  return startHz + (targetHz - startHz) * eased
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) return await navigator.wakeLock.request('screen')
  } catch { /* not granted */ }
  return null
}

/**
 * Start a session. MUST be called directly from a user gesture (tap) so audio and
 * camera are allowed to start.
 *
 * opts: { mode, source: 'screen'|'torch', minutes, overlay: HTMLElement, audioOn, onTick, onEnd, onError }
 * returns { stop() }
 */
export function startSession(opts) {
  const { mode, source, minutes, overlay, audioOn = true, onTick, onEnd, onError } = opts
  const durationSec = minutes * 60
  const s = {
    running: true,
    t0: performance.now(),
    raf: 0,
    tick: 0,
    audio: null,
    stream: null,
    track: null,
    video: null,
    wake: null,
    flashes: 0,
  }
  const elapsed = () => (performance.now() - s.t0) / 1000
  // 0..1 light intensity: build up at the start, fade down at the end.
  const envelope = (t) => Math.min(clamp01(t / LIGHT_FADE_IN) * 0.75 + 0.25, clamp01((durationSec - t) / END_FADE))

  // Audio is created synchronously so iOS treats it as part of the tap.
  if (audioOn) {
    s.audio = createAudio(mode.audio, { startHz: mode.flicker.startHz, rampSec: mode.flicker.rampSec })
  }
  requestWakeLock().then((w) => { if (s.running) s.wake = w; else w?.release().catch(() => {}) })

  const onHidden = () => { if (document.hidden) stop('hidden') }
  document.addEventListener('visibilitychange', onHidden)

  function cleanup() {
    cancelAnimationFrame(s.raf)
    clearInterval(s.tick)
    document.removeEventListener('visibilitychange', onHidden)
    if (s.track) {
      try { s.track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {}) } catch { /* ignore */ }
    }
    if (s.stream) s.stream.getTracks().forEach((t) => t.stop())
    if (s.video) { s.video.srcObject = null; s.video.remove() }
    s.stream = s.track = s.video = null
    s.wake?.release().catch(() => {})
    s.wake = null
    if (overlay) overlay.style.backgroundColor = '#000'
  }

  function stop(reason = 'user') {
    if (!s.running) return
    s.running = false
    if (s.audio) {
      const a = s.audio
      s.audio = null
      a.fadeOut(reason === 'complete' ? 0.5 : 0.8)
      setTimeout(() => a.close(), 1000)
    }
    cleanup()
  }

  // Timer + progress.
  s.tick = setInterval(() => {
    if (!s.running) return
    const t = elapsed()
    onTick?.({ elapsedSec: t, remainingSec: Math.max(0, durationSec - t), hz: hzAt(mode.flicker, t), flashes: s.flashes })
    if (t >= durationSec - END_FADE && s.audio && !s.fading) { s.fading = true; s.audio.fadeOut(END_FADE) }
    if (t >= durationSec) { stop('complete'); onEnd?.() }
  }, 250)

  const fail = (msg) => { stop('error'); onError?.(msg) }

  if (source === 'torch') runTorch(s, mode, elapsed, durationSec, fail)
  else runScreen(s, mode, overlay, elapsed, envelope)

  return { stop: () => stop('user') }
}

// ---------- Screen: rAF phase accumulator so the ramp never jumps phase ----------
function runScreen(s, mode, overlay, elapsed, envelope) {
  let phase = 0
  let last = performance.now()
  let lit = null
  let lastLevel = -1
  const frame = (now) => {
    if (!s.running) return
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    const t = elapsed()
    phase = (phase + hzAt(mode.flicker, t) * dt) % 1
    const on = phase < 0.5
    const level = Math.round(255 * envelope(t))
    if (on !== lit || (on && level !== lastLevel)) {
      if (on && !lit) s.flashes++
      overlay.style.backgroundColor = on ? `rgb(${level},${level},${level})` : '#000'
      lit = on
      lastLevel = level
    }
    s.raf = requestAnimationFrame(frame)
  }
  overlay.style.backgroundColor = '#000'
  s.raf = requestAnimationFrame(frame)
}

// ---------- Torch: camera light toggled via applyConstraints, drift-corrected ----------
async function runTorch(s, mode, elapsed, durationSec, fail) {
  if (!navigator.mediaDevices?.getUserMedia) {
    fail('Camera access isn’t available here. Open the app in Safari or Chrome over HTTPS, or use Screen.')
    return
  }
  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
  } catch (err) {
    fail(err?.name === 'NotAllowedError'
      ? 'Camera access was blocked. Allow it for this site in your browser settings (it’s only used for the torch), or use Screen.'
      : 'Couldn’t open the camera. Try Screen instead.')
    return
  }
  if (!s.running) { stream.getTracks().forEach((t) => t.stop()); return }
  s.stream = stream
  const track = stream.getVideoTracks()[0]
  s.track = track
  // iOS only drives the torch while the stream is playing in a video element.
  const video = document.createElement('video')
  video.playsInline = true
  video.muted = true
  video.setAttribute('playsinline', '')
  Object.assign(video.style, { position: 'fixed', width: '1px', height: '1px', opacity: '0.01', pointerEvents: 'none', left: '0', top: '0' })
  document.body.appendChild(video)
  video.srcObject = stream
  s.video = video
  try { await video.play() } catch { /* still works on most devices */ }

  const caps = track.getCapabilities ? track.getCapabilities() : {}
  if (!caps.torch) {
    fail('This phone or browser doesn’t let web apps control the torch. Use Screen instead.')
    return
  }

  let on = false
  let phase = 0
  let last = performance.now()
  while (s.running && s.track === track) {
    const now = performance.now()
    const t = elapsed()
    phase += hzAt(mode.flicker, t) * ((now - last) / 1000)
    last = now
    const want = (phase % 1) < 0.5 && t < durationSec - 0.5
    if (want !== on) {
      on = want
      if (on) s.flashes++
      try {
        await track.applyConstraints({ advanced: [{ torch: on }] })
      } catch {
        if (s.running) fail('The torch stopped responding. Try Screen instead.')
        return
      }
    }
    // Sleep until the next half-cycle edge (bounded so ramps stay responsive).
    const hz = hzAt(mode.flicker, elapsed())
    const toEdge = ((0.5 - ((phase % 1) % 0.5)) / hz) * 1000
    await sleep(Math.max(1, Math.min(toEdge, 50)))
  }
}
