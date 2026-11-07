import { createAudio } from './audio.js'

export const MIN_HZ = 2
export const MAX_HZ = 12
export const TORCH_MAX_HZ = 10
const FADE = 10 // seconds: fade in at the start, fade out at the end
const STOP_AUDIO_FADE = 1.5
const ON_RGB = [0xff, 0xf1, 0xdc] // warm white, never red
const OFF = '#000000'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))

/**
 * Resolve the light plan for a mode/source/duration:
 * clamp to 2-12 Hz (10 Hz max on torch) and cap the ramp at 40% of the session.
 */
export function planFlicker(flicker, source, durationSec) {
  const max = source === 'torch' ? TORCH_MAX_HZ : MAX_HZ
  const startHz = clamp(Number(flicker.startHz) || 10, MIN_HZ, max)
  const targetHz = clamp(Number(flicker.targetHz) || 10, MIN_HZ, max)
  const rampSec = Math.max(0, Math.min(Number(flicker.rampSec) || 0, 0.4 * durationSec))
  return { startHz, targetHz, rampSec }
}

/** Linear glide from startHz to targetHz over rampSec, then hold. */
export function hzAt(plan, t) {
  if (!plan.rampSec || t >= plan.rampSec) return plan.targetHz
  return plan.startHz + (plan.targetHz - plan.startHz) * (Math.max(0, t) / plan.rampSec)
}

export function phaseAt(plan, t, durationSec) {
  if (t >= durationSec - FADE) return 'fade-out'
  if (t < FADE) return 'fade-in'
  if (plan.rampSec && t < plan.rampSec && plan.startHz !== plan.targetHz) return 'ramp'
  return 'hold'
}

/**
 * Start a session. MUST be called synchronously from a user gesture (tap) so iOS
 * allows audio and camera.
 *
 * opts: { mode, source: 'screen'|'torch', minutes, overlay, audioOn,
 *         onTick({elapsedSec, remainingSec, hz, phase}), onEnd(), onError(message), onStop(reason) }
 * returns { stop() }
 *
 * The engine owns these attributes on the overlay element:
 * data-mode, data-source, data-target-hz, data-current-hz, data-phase, data-audio.
 */
export function startSession(opts) {
  const { mode, source, minutes, overlay, audioOn = true, onTick, onEnd, onError, onStop } = opts
  const durationSec = Math.max(1, minutes * 60)
  const plan = planFlicker(mode.flicker, source, durationSec)
  const s = { running: true, t0: performance.now(), raf: 0, tick: 0, audio: null, stream: null, track: null, video: null, wake: null }
  const elapsed = () => (performance.now() - s.t0) / 1000
  const ds = overlay?.dataset ?? {}

  ds.mode = mode.id
  ds.source = source
  ds.targetHz = String(plan.targetHz)
  ds.currentHz = plan.startHz.toFixed(1)
  ds.phase = 'fade-in'
  ds.audio = 'stopped'
  if (overlay) overlay.style.backgroundColor = OFF

  // Audio first and synchronously, so iOS ties it to the tap. Beat follows the light.
  if (audioOn) {
    try {
      s.audio = createAudio(mode.audio, plan, FADE)
      if (s.audio) ds.audio = 'running'
    } catch { s.audio = null }
  }

  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then(
      (w) => { if (s.running) s.wake = w; else w.release().catch(() => {}) },
      () => {},
    )
  }

  const onHidden = () => { if (document.hidden) stop('hidden') }
  document.addEventListener('visibilitychange', onHidden)

  function stop(reason) {
    if (!s.running) return
    s.running = false
    cancelAnimationFrame(s.raf)
    clearInterval(s.tick)
    document.removeEventListener('visibilitychange', onHidden)
    if (overlay) overlay.style.backgroundColor = OFF // light stops on this frame
    if (s.track) {
      try { s.track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {}) } catch { /* ignore */ }
    }
    s.stream?.getTracks().forEach((t) => t.stop())
    if (s.video) { s.video.srcObject = null; s.video.remove() }
    s.stream = s.track = s.video = null
    s.wake?.release().catch(() => {})
    s.wake = null

    const a = s.audio
    s.audio = null
    const fade = reason === 'complete' ? 0.05 : STOP_AUDIO_FADE
    if (a) {
      a.fadeOut(fade)
      setTimeout(() => { a.close(); ds.audio = 'stopped' }, fade * 1000 + 50)
    } else {
      ds.audio = 'stopped'
    }
    if (reason === 'hidden') onStop?.('hidden')
  }

  // Timer, progress and fade-out.
  let fading = false
  const update = () => {
    if (!s.running) return
    const t = elapsed()
    const hz = hzAt(plan, t)
    const phase = phaseAt(plan, t, durationSec)
    ds.currentHz = hz.toFixed(1)
    ds.phase = phase
    onTick?.({ elapsedSec: t, remainingSec: Math.max(0, durationSec - t), hz, phase })
    if (phase === 'fade-out' && !fading && s.audio) { fading = true; s.audio.fadeOut(Math.max(0.1, durationSec - t)) }
    if (t >= durationSec) { stop('complete'); onEnd?.() }
  }
  s.tick = setInterval(update, 200)

  const fail = (msg) => { stop('error'); onError?.(msg) }

  if (source === 'torch') runTorch(s, plan, elapsed, durationSec, fail)
  else runScreen(s, plan, overlay, elapsed, durationSec)

  return { stop: () => stop('user') }
}

// ---------- Screen: rAF phase accumulator so the ramp never jumps phase ----------
function runScreen(s, plan, overlay, elapsed, durationSec) {
  let cycle = 0
  let last = performance.now()
  let lit = null
  let lastLevel = -1
  const frame = (now) => {
    if (!s.running) return
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    const t = elapsed()
    cycle = (cycle + hzAt(plan, t) * dt) % 1
    const on = cycle < 0.5
    // Intensity: 0 -> 1 over the first 10 s, 1 -> 0 over the last 10 s.
    const level = clamp(Math.min(t / FADE, (durationSec - t) / FADE), 0, 1)
    const q = Math.round(level * 100) / 100
    if (on !== lit || (on && q !== lastLevel)) {
      overlay.style.backgroundColor = on
        ? `rgb(${ON_RGB.map((c) => Math.round(c * q)).join(',')})`
        : OFF
      lit = on
      lastLevel = q
    }
    s.raf = requestAnimationFrame(frame)
  }
  s.raf = requestAnimationFrame(frame)
}

// ---------- Torch: camera light via applyConstraints, scheduled against a running clock ----------
async function runTorch(s, plan, elapsed, durationSec, fail) {
  if (!navigator.mediaDevices?.getUserMedia) {
    fail('Camera access isn’t available in this browser, so the torch can’t be used. Try Screen instead.')
    return
  }
  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
  } catch (err) {
    fail(err?.name === 'NotAllowedError'
      ? 'Camera access was blocked. It’s only used for the torch - allow it in your browser settings, or use Screen instead.'
      : 'Couldn’t open the camera for the torch. Try Screen instead.')
    return
  }
  if (!s.running) { stream.getTracks().forEach((t) => t.stop()); return }
  s.stream = stream
  const track = stream.getVideoTracks()[0]
  s.track = track
  // iOS only drives the torch while the stream is playing in a video element.
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  Object.assign(video.style, { position: 'fixed', width: '1px', height: '1px', opacity: '0.01', pointerEvents: 'none', left: '0', top: '0' })
  document.body.appendChild(video)
  video.srcObject = stream
  s.video = video
  try { await video.play() } catch { /* still works on most devices */ }
  if (!s.running || s.track !== track) return

  const caps = track.getCapabilities ? track.getCapabilities() : {}
  if (!caps.torch) {
    fail('This phone or browser doesn’t let web apps control the torch. Try Screen instead.')
    return
  }

  // The torch can't dim: it stays off for the 10 s fade-in and switches off at the start of the fade-out.
  let on = false
  let cycle = 0
  let last = performance.now()
  while (s.running && s.track === track) {
    const now = performance.now()
    const t = elapsed()
    cycle = (cycle + hzAt(plan, t) * ((now - last) / 1000)) % 1
    last = now
    const active = t >= FADE && t < durationSec - FADE
    if (!active) cycle = 0
    const want = active && cycle < 0.5
    if (want !== on) {
      on = want
      try {
        await track.applyConstraints({ advanced: [{ torch: on }] })
      } catch {
        if (s.running && s.track === track) fail('The torch stopped responding. Try Screen instead.')
        return
      }
      if (!s.running) return
    }
    // Sleep to the next half-cycle edge, bounded so the ramp stays responsive.
    const hz = hzAt(plan, elapsed())
    const toEdge = ((0.5 - (cycle % 0.5)) / hz) * 1000
    await sleep(active ? clamp(toEdge, 1, 50) : 100)
  }
}
