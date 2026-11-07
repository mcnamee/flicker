// Synthesised session audio (Web Audio only, no files).
// Binaural: two sines, L = carrier - beat/2, R = carrier + beat/2.
// Isochronic: one sine at the carrier, gated on/off at the beat rate with ~5 ms edges.
// Noise: generated pink or brown noise loop, about 12 dB under the tones.

const TONE_LEVEL = 0.25
const NOISE_LEVEL = TONE_LEVEL / 4 // about -12 dB
const EDGE = 0.005 // isochronic gate edge, seconds
const LOOKAHEAD = 0.15 // isochronic scheduling window, seconds

function noiseBuffer(ctx, colour, seconds = 8) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    if (colour === 'brown') {
      let last = 0
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
        d[i] = last * 3.5
      }
    } else {
      // Paul Kellet's pink noise filter
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.969 * b2 + w * 0.153852
        b3 = 0.8665 * b3 + w * 0.3104856
        b4 = 0.55 * b4 + w * 0.5329522
        b5 = -0.7616 * b5 - w * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
        b6 = w * 0.115926
      }
    }
    // Crossfade the loop point so it doesn't click.
    const xf = Math.floor(ctx.sampleRate * 0.05)
    for (let i = 0; i < xf; i++) {
      const g = i / xf
      d[i] = d[i] * g + d[len - xf + i] * (1 - g)
    }
  }
  return buf
}

/**
 * Build and start the audio graph. Call synchronously inside a user gesture (iOS).
 * recipe: { beatType: 'binaural'|'isochronic', carrierHz, noise: 'pink'|'brown'|'none' }
 * beat: { startHz, targetHz, rampSec } - beat glides linearly in lockstep with the light.
 * fadeInSec: master fade-in.
 */
export function createAudio(recipe, beat, fadeInSec = 10) {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback' } catch { /* iOS 17+ only */ }

  const ctx = new AC()
  const t0 = ctx.currentTime
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, t0)
  master.gain.linearRampToValueAtTime(1, t0 + fadeInSec)
  master.connect(ctx.destination)

  const beatAt = (sec) => {
    if (!beat.rampSec || sec >= beat.rampSec) return beat.targetHz
    return beat.startHz + (beat.targetHz - beat.startHz) * (sec / beat.rampSec)
  }

  const sources = []
  let gateTimer = 0

  if (recipe.beatType === 'binaural') {
    const merger = ctx.createChannelMerger(2)
    const tone = ctx.createGain()
    tone.gain.value = TONE_LEVEL
    merger.connect(tone).connect(master)
    const c = recipe.carrierHz
    ;[-1, 1].forEach((side, ch) => {
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(c + (side * beat.startHz) / 2, t0)
      if (beat.rampSec > 0) osc.frequency.linearRampToValueAtTime(c + (side * beat.targetHz) / 2, t0 + beat.rampSec)
      osc.connect(merger, 0, ch)
      sources.push(osc)
    })
  } else {
    const osc = ctx.createOscillator()
    osc.frequency.value = recipe.carrierHz
    const gate = ctx.createGain()
    gate.gain.setValueAtTime(0, t0)
    const tone = ctx.createGain()
    tone.gain.value = TONE_LEVEL
    osc.connect(gate).connect(tone).connect(master)
    sources.push(osc)

    // Lookahead scheduler: phase-accumulate the (ramping) beat and schedule each gate edge.
    let phase = 0
    let cursor = t0
    const step = 0.002
    let open = false
    const schedule = () => {
      const horizon = ctx.currentTime + LOOKAHEAD
      while (cursor < horizon) {
        phase = (phase + beatAt(cursor - t0) * step) % 1
        const want = phase < 0.5
        if (want !== open) {
          open = want
          gate.gain.setValueAtTime(open ? 0 : 1, cursor)
          gate.gain.linearRampToValueAtTime(open ? 1 : 0, cursor + EDGE)
        }
        cursor += step
      }
    }
    schedule()
    gateTimer = setInterval(schedule, 40)
  }

  if (recipe.noise === 'pink' || recipe.noise === 'brown') {
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx, recipe.noise)
    src.loop = true
    const ng = ctx.createGain()
    ng.gain.value = NOISE_LEVEL
    src.connect(ng).connect(master)
    src.noiseColour = recipe.noise
    sources.push(src)
  }

  sources.forEach((n) => n.start(t0))
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})

  let closed = false
  const fadeTo = (v, sec) => {
    const t = ctx.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(v, t + sec)
  }
  return {
    ctx,
    fadeOut(sec) { if (!closed) fadeTo(0, sec) },
    close() {
      if (closed) return
      closed = true
      clearInterval(gateTimer)
      sources.forEach((n) => { try { n.stop() } catch { /* already stopped */ } })
      ctx.close().catch(() => {})
    },
  }
}
