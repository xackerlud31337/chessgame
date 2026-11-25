/** Tiny WebAudio beeps. Created lazily on first use (needs a user gesture). */
let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, durationMs: number, type: OscillatorType, gain = 0.08) {
  const ac = getContext()
  if (!ac) return
  const osc = ac.createOscillator()
  const vol = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  vol.gain.setValueAtTime(gain, ac.currentTime)
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + durationMs / 1000)
  osc.connect(vol).connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + durationMs / 1000)
}

export const sounds = {
  correct() {
    tone(880, 90, 'sine')
  },
  wrong() {
    tone(220, 140, 'square', 0.05)
  },
  finish() {
    tone(660, 120, 'sine')
    setTimeout(() => tone(990, 180, 'sine'), 110)
  },
}

/** Default sound off on touch devices (per spec). */
export function defaultSoundEnabled(): boolean {
  try {
    return !window.matchMedia('(pointer: coarse)').matches
  } catch {
    return true
  }
}
