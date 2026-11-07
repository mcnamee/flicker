// Synthesised session audio: binaural or isochronic beat over a carrier, plus a noise bed.
// Everything is generated with Web Audio, no files.

const FADE_IN = 4
const FADE_OUT = 4

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
    // Short crossfade so the loop point doesn't click.
    const xf = Math.floor(ctx.sampleRate * 0.05)
    for (let i = 0; i < xf; i++) {
      const g = i / xf
      d[i] = d[i] * g + d[len - xf + i] * (1 - g)
    }
  }
  return buf
}

/**
 * Create (synchronously, inside a user gesture) the audio graph for a recipe.
 * recipe: { beatType: 'binaural'|'isochronic', beatHz, carrierHz, noise: 'pink'|'brown'|'none' }
 * ramp: { startHz, rampSec } - the beat glides from startHz to beatHz alongside the light.
 */
export function createAudio(recipe, ramp, volume = 0.8) {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  // iOS 17+: play through the silent switch.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback' } catch { /* ignore */ }

  const ctx = new AC()
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(volume, now + FADE_IN)
  master.connect(ctx.destination)

  const nodes = []
  const startBeat = ramp?.startHz ?? recipe.beatHz
  const rampSec = ramp?.rampSec ?? 0
  const glide = (param, from, to) => {
    param.setValueAtTime(from, now)
    if (rampSec > 0 && from !== to) param.linearRampToValueAtTime(to, now + rampSec)
    else param.setValueAtTime(to, now)
  }

  if (recipe.beatType === 'binaural') {
    const merger = ctx.createChannelMerger(2)
    const toneGain = ctx.createGain()
    toneGain.gain.value = 0.22
    merger.connect(toneGain).connect(master)
    const c = recipe.carrierHz
    const left = ctx.createOscillator()
    const right = ctx.createOscillator()
    glide(left.frequency, c - startBeat / 2, c - recipe.beatHz / 2)
    glide(right.frequency, c + startBeat / 2, c + recipe.beatHz / 2)
    left.connect(merger, 0, 0)
    right.connect(merger, 0, 1)
    nodes.push(left, right)
  } else {
    // Isochronic: carrier amplitude-modulated by a sine LFO at the beat rate.
    const carrier = ctx.createOscillator()
    carrier.frequency.value = recipe.carrierHz
    const am = ctx.createGain()
    am.gain.value = 0.5
    const lfo = ctx.createOscillator()
    glide(lfo.frequency, startBeat, recipe.beatHz)
    const depth = ctx.createGain()
    depth.gain.value = 0.5
    lfo.connect(depth).connect(am.gain)
    const toneGain = ctx.createGain()
    toneGain.gain.value = 0.2
    carrier.connect(am).connect(toneGain).connect(master)
    nodes.push(carrier, lfo)
  }

  if (recipe.noise && recipe.noise !== 'none') {
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx, recipe.noise)
    src.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = recipe.noise === 'brown' ? 900 : 4000
    const ng = ctx.createGain()
    ng.gain.value = recipe.noise === 'brown' ? 0.35 : 0.18
    src.connect(lp).connect(ng).connect(master)
    nodes.push(src)
  }

  nodes.forEach((n) => n.start(now))
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})

  let closed = false
  return {
    ctx,
    setVolume(v) {
      if (closed) return
      const t = ctx.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(master.gain.value, t)
      master.gain.linearRampToValueAtTime(v, t + 0.2)
    },
    fadeOut(sec = FADE_OUT) {
      if (closed) return
      const t = ctx.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(master.gain.value, t)
      master.gain.linearRampToValueAtTime(0, t + sec)
    },
    close() {
      if (closed) return
      closed = true
      nodes.forEach((n) => { try { n.stop() } catch { /* already stopped */ } })
      ctx.close().catch(() => {})
    },
  }
}
